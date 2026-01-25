import { useState } from 'react';
import Layout from '../components/layout/Layout';
import { PlannerPageSkeleton } from '../components/common/SkeletonLoader';
import { usePlan, useGeneratePlan, useMarkBlockDone, useMarkBlockMissed } from '../hooks/usePlans';
import { useTasks } from '../hooks/useTasks';
import { format } from 'date-fns';
import { PRIORITY_COLORS } from '../utils/constants';

const Planner = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('18:00');

  const { data: plan, isLoading: planLoading } = usePlan(selectedDate);
  const { data: tasks } = useTasks({ status: 'todo' });
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
    if (window.confirm('Mark this block as missed?')) {
      await markBlockMissed.mutateAsync(blockId);
    }
  };

  const unscheduledTasks = tasks?.filter(
    task => !plan?.blocks?.some(block => block.task_id === task.id)
  ) || [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Planner</h1>
          <p className="mt-2 text-gray-600">Generate and manage your daily task schedule</p>
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
                    .map((block) => (
                      <div
                        key={block.id}
                        className={`bg-white rounded-xl shadow-sm border-l-4 p-5 ${
                          block.status === 'done'
                            ? 'border-green-500 bg-green-50'
                            : block.status === 'missed'
                            ? 'border-red-500 bg-red-50'
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
                          {block.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleMarkDone(block.id)}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
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
                          )}
                        </div>
                      </div>
                    ))}
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
