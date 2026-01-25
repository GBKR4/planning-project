import { useState } from 'react';
import Layout from '../components/layout/Layout';
import { PlannerPageSkeleton } from '../components/common/SkeletonLoader';
import { usePlan, useGeneratePlan, useMarkBlockDone, useMarkBlockMissed } from '../hooks/usePlans';
import { useTasks } from '../hooks/useTasks';
import { useBusyBlocks } from '../hooks/useBusyBlocks';
import { format } from 'date-fns';
import { PRIORITY_COLORS, DEFAULT_WORK_START, DEFAULT_WORK_END } from '../utils/constants';
import CalendarView from '../components/planner/CalendarView';
import { CalendarIcon, ListBulletIcon } from '@heroicons/react/24/outline';

const Planner = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [workStart, setWorkStart] = useState(DEFAULT_WORK_START);
  const [workEnd, setWorkEnd] = useState(DEFAULT_WORK_END);
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'calendar'

  const { data: plan, isLoading: planLoading } = usePlan(selectedDate);
  const { data: tasks } = useTasks({ status: 'todo' });
  const { data: busyBlocks } = useBusyBlocks(selectedDate);
  const generatePlan = useGeneratePlan();
  const markBlockDone = useMarkBlockDone();
  const markBlockMissed = useMarkBlockMissed();

  const handleGeneratePlan = async () => {
    await generatePlan.mutateAsync({
      date: selectedDate,
      workStart,
      workEnd,
    });
  };

  const handleMarkDone = async (blockId) => {
    await markBlockDone.mutateAsync(blockId);
  };

  const handleMarkMissed = async (blockId) => {
    if (window.confirm('Mark this block as missed? The task will be rescheduled for future plans.')) {
      await markBlockMissed.mutateAsync(blockId);
    }
  };

  const unscheduledTasks = tasks?.filter(
    task => !plan?.blocks?.some(block => block.task_id === task.id)
  ) || [];

  const handleSelectEvent = (event) => {
    if (event.resource.type === 'task') {
      // Show block details or actions
      console.log('Selected block:', event);
    }
  };

  // Helper function to check if block time has passed
  const isBlockPast = (endTime) => {
    return new Date(endTime) < new Date();
  };

  // Helper function to check if block is currently active
  const isBlockActive = (startTime, endTime) => {
    const now = new Date();
    return new Date(startTime) <= now && now <= new Date(endTime);
  };

  const handleNavigate = (date) => {
    setSelectedDate(format(date, 'yyyy-MM-dd'));
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Daily Planner</h1>
            <p className="mt-2 text-gray-600">Generate and manage your daily task schedule</p>
          </div>
          
          {/* View Toggle */}
          {plan && (
            <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'timeline'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ListBulletIcon className="h-5 w-5" />
                <span>Timeline</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CalendarIcon className="h-5 w-5" />
                <span>Calendar</span>
              </button>
            </div>
          )}
        </div>

        {/* Plan Generator */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Work Start
              </label>
              <input
                type="time"
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Work End
              </label>
              <input
                type="time"
                value={workEnd}
                onChange={(e) => setWorkEnd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGeneratePlan}
                disabled={generatePlan.isPending}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {generatePlan.isPending ? 'Generating...' : '🎯 Generate Plan'}
              </button>
            </div>
          </div>
        </div>

        {/* Plan View */}
        {planLoading ? (
          <PlannerPageSkeleton />
        ) : plan ? (
          <>
            {/* Calendar View */}
            {viewMode === 'calendar' && (
              <CalendarView
                blocks={plan.blocks || []}
                busyBlocks={plan.busyBlocks || []}
                onSelectEvent={handleSelectEvent}
                selectedDate={selectedDate}
                onNavigate={handleNavigate}
              />
            )}

            {/* Timeline View */}
            {viewMode === 'timeline' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Scheduled Blocks */}
                <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">
                Schedule for {format(new Date(selectedDate), 'MMMM dd, yyyy')}
              </h2>
              {plan.blocks && plan.blocks.length > 0 ? (
                <div className="space-y-3">
                  {plan.blocks
                    .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))
                    .map((block) => {
                      const isPast = isBlockPast(block.end_at);
                      const isActive = isBlockActive(block.start_at, block.end_at);
                      const shouldPrompt = block.status === 'scheduled' && isPast;
                      
                      return (
                      <div
                        key={block.id}
                        className={`bg-white rounded-xl shadow-sm border-l-4 p-5 transition-all ${
                          block.status === 'done'
                            ? 'border-green-500 bg-green-50'
                            : block.status === 'missed'
                            ? 'border-red-500 bg-red-50'
                            : isActive
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : shouldPrompt
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-indigo-500'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {block.task_title}
                              </h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${PRIORITY_COLORS[block.priority] || 'bg-gray-100 text-gray-800'}`}>
                                P{block.priority}
                              </span>
                              {block.status === 'done' && (
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                  ✓ Done
                                </span>
                              )}
                              {block.status === 'missed' && (
                                <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                  ✗ Missed
                                </span>
                              )}
                              {isActive && block.status === 'scheduled' && (
                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full animate-pulse">
                                  ⏳ In Progress
                                </span>
                              )}
                              {shouldPrompt && (
                                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                  ⚠️ Time Elapsed
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <span>
                                🕐 {format(new Date(block.start_at), 'HH:mm')} - {format(new Date(block.end_at), 'HH:mm')}
                              </span>
                              <span>
                                ⏱️ {block.estimated_minutes}m
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          {block.status === 'scheduled' && (
                            <div className="flex flex-col space-y-2">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleMarkDone(block.id)}
                                  className={`px-3 py-1 text-white text-sm rounded-lg transition-colors ${
                                    shouldPrompt 
                                      ? 'bg-green-600 hover:bg-green-700 ring-2 ring-green-300 animate-pulse' 
                                      : 'bg-green-600 hover:bg-green-700'
                                  }`}
                                >
                                  ✓ Done
                                </button>
                                <button
                                  onClick={() => handleMarkMissed(block.id)}
                                  className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                                >
                                  ✗ Missed
                                </button>
                              </div>
                              {shouldPrompt && (
                                <span className="text-xs text-yellow-700">
                                  Mark status to update
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                  <p className="text-gray-500">No blocks scheduled for this date</p>
                  <p className="text-sm text-gray-400 mt-2">Generate a plan to get started</p>
                </div>
              )}
            </div>

            {/* Unscheduled Tasks */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">
                Unscheduled Tasks ({unscheduledTasks.length})
              </h2>
              {unscheduledTasks.length > 0 ? (
                <div className="space-y-3">
                  {unscheduledTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                    >
                      <div className="flex items-start space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${PRIORITY_COLORS[task.priority] || 'bg-gray-100 text-gray-800'}`}>
                          P{task.priority}
                        </span>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {task.title}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                            <span>⏱️ {task.estimated_minutes}m</span>
                            {task.deadline_at && (
                              <span>
                                📅 {format(new Date(task.deadline_at), 'MMM dd')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                  <p className="text-gray-500 text-sm">All tasks scheduled!</p>
                </div>
              )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg">No plan generated yet</p>
            <p className="text-sm text-gray-400 mt-2">Select a date and generate your plan</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Planner;
