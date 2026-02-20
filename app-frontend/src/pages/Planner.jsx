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
        {/* Header with Rainbow Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 rounded-2xl p-8 shadow-2xl">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center space-x-3 drop-shadow-lg">
                <span className="animate-bounce">📅</span>
                <span>Daily Planner</span>
              </h1>
              <p className="mt-2 text-white text-lg drop-shadow-md">Generate and manage your daily task schedule</p>
            </div>
            
            {/* View Toggle */}
            {plan && (
              <div className="flex space-x-2 bg-white/30 backdrop-blur-md rounded-xl p-1.5 shadow-lg">
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg transition-all duration-300 font-bold ${
                    viewMode === 'timeline'
                      ? 'bg-white text-purple-600 shadow-xl scale-110 border-2 border-white'
                      : 'text-white hover:bg-white/20 backdrop-blur-sm'
                  }`}
                >
                  <ListBulletIcon className="h-5 w-5" />
                  <span>Timeline</span>
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg transition-all duration-300 font-bold ${
                    viewMode === 'calendar'
                      ? 'bg-white text-purple-600 shadow-xl scale-110 border-2 border-white'
                      : 'text-white hover:bg-white/20 backdrop-blur-sm'
                  }`}
                >
                  <CalendarIcon className="h-5 w-5" />
                  <span>Calendar</span>
                </button>
              </div>
            )}
          </div>
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-yellow-300 opacity-20 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-pink-300 opacity-20 blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 right-1/4 h-32 w-32 rounded-full bg-cyan-300 opacity-15 blur-3xl"></div>
        </div>

        {/* Plan Generator with Colorful Design */}
        <div className="bg-gradient-to-br from-white via-purple-50 to-pink-50 rounded-2xl shadow-xl border-2 border-purple-200 p-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6 flex items-center space-x-2">
            <span>🎯</span>
            <span>Generate Plan</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-1">
                <span>📅</span>
                <span>Date</span>
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-purple-400 bg-white shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-1">
                <span>🌅</span>
                <span>Work Start</span>
              </label>
              <input
                type="time"
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-purple-400 bg-white shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-1">
                <span>🌆</span>
                <span>Work End</span>
              </label>
              <input
                type="time"
                value={workEnd}
                onChange={(e) => setWorkEnd(e.target.value)}
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-purple-400 bg-white shadow-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGeneratePlan}
                disabled={generatePlan.isPending}
                className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white rounded-xl hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold shadow-lg hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center space-x-2"
              >
                <span className="text-xl">🎯</span>
                <span>{generatePlan.isPending ? 'Generating...' : 'Generate Plan'}</span>
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
                <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                📅 Schedule for {format(new Date(selectedDate), 'MMMM dd, yyyy')}
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
                        className={`group bg-white rounded-2xl shadow-lg border-l-[6px] p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                          block.status === 'done'
                            ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50'
                            : block.status === 'missed'
                            ? 'border-red-500 bg-gradient-to-r from-red-50 to-pink-50'
                            : isActive
                            ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 ring-4 ring-blue-200'
                            : shouldPrompt
                            ? 'border-yellow-500 bg-gradient-to-r from-yellow-50 to-amber-50'
                            : 'border-indigo-500 hover:border-purple-500'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 flex-wrap">
                              <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                                {block.task_title}
                              </h3>
                              <span className={`px-3 py-1 text-xs font-bold rounded-full ${PRIORITY_COLORS[block.priority] || 'bg-gray-100 text-gray-800'}`}>
                                🎯 P{block.priority}
                              </span>
                              {block.status === 'done' && (
                                <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full shadow-sm">
                                  ✓ Done
                                </span>
                              )}
                              {block.status === 'missed' && (
                                <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-red-400 to-red-500 text-white rounded-full shadow-sm">
                                  ✗ Missed
                                </span>
                              )}
                              {isActive && block.status === 'scheduled' && (
                                <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-blue-400 to-cyan-500 text-white rounded-full animate-pulse shadow-sm">
                                  ⏳ In Progress
                                </span>
                              )}
                              {shouldPrompt && (
                                <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-full shadow-sm">
                                  ⚠️ Time Elapsed
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-6 mt-3 text-sm font-medium text-gray-600">
                              <span className="flex items-center space-x-1.5">
                                <span>🕐</span>
                                <span>{format(new Date(block.start_at), 'HH:mm')} - {format(new Date(block.end_at), 'HH:mm')}</span>
                              </span>
                              <span className="flex items-center space-x-1.5">
                                <span>⏱️</span>
                                <span>{block.estimated_minutes}m</span>
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          {block.status === 'scheduled' && (
                            <div className="flex flex-col space-y-3">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleMarkDone(block.id)}
                                  className={`px-4 py-2 text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg ${
                                    shouldPrompt 
                                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 ring-2 ring-green-300 animate-pulse' 
                                      : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                                  }`}
                                >
                                  ✓ Done
                                </button>
                                <button
                                  onClick={() => handleMarkMissed(block.id)}
                                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
                                >
                                  ✗ Missed
                                </button>
                              </div>
                              {shouldPrompt && (
                                <span className="text-xs font-medium text-yellow-700 text-center">
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
            <div className="space-y-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                📋 Unscheduled Tasks ({unscheduledTasks.length})
              </h2>
              {unscheduledTasks.length > 0 ? (
                <div className="space-y-3">
                  {unscheduledTasks.map((task) => (
                    <div
                      key={task.id}
                      className="group bg-white rounded-xl shadow-md border-l-4 border-purple-400 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-pink-500"
                    >
                      <div className="flex items-start space-x-3">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${PRIORITY_COLORS[task.priority] || 'bg-gray-100 text-gray-800'}`}>
                          🎯 P{task.priority}
                        </span>
                        <div className="flex-1">
                          <h4 className="text-base font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                            {task.title}
                          </h4>
                          <div className="flex items-center space-x-3 mt-2 text-xs font-medium text-gray-500">
                            <span className="flex items-center space-x-1">
                              <span>⏱️</span>
                              <span>{task.estimated_minutes}m</span>
                            </span>
                            {task.deadline_at && (
                              <span className="flex items-center space-x-1">
                                <span>📅</span>
                                <span>{format(new Date(task.deadline_at), 'MMM dd')}</span>
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
