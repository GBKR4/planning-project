import { useState } from 'react';
import { format } from 'date-fns';
import { MdCalendarMonth, MdOutlineSchedule } from 'react-icons/md';
import Layout from '../components/layout/Layout';
import { PlannerPageSkeleton } from '../components/common/SkeletonLoader';
import { usePlan, useGeneratePlan, useMarkBlockDone, useMarkBlockMissed } from '../hooks/usePlans';
import { useTasks } from '../hooks/useTasks';
import { useBusyBlocks } from '../hooks/useBusyBlocks';
import { DEFAULT_WORK_END, DEFAULT_WORK_START } from '../utils/constants';
import CalendarView from '../components/planner/CalendarView';

const VIEW_OPTIONS = [
  { value: 'timeline', label: 'Timeline' },
  { value: 'calendar', label: 'Calendar' },
];

const getPriorityTone = (priority) => {
  if (priority >= 5) return 'bg-gray-900 text-white';
  if (priority === 4) return 'bg-gray-800 text-white';
  if (priority === 3) return 'bg-gray-700 text-white';
  if (priority === 2) return 'bg-gray-200 text-gray-800';
  return 'bg-gray-100 text-gray-700';
};

const Planner = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [workStart, setWorkStart] = useState(DEFAULT_WORK_START);
  const [workEnd, setWorkEnd] = useState(DEFAULT_WORK_END);
  const [viewMode, setViewMode] = useState('timeline');

  const { data: plan, isLoading: planLoading } = usePlan(selectedDate);
  const { data: tasks } = useTasks({ status: 'todo' });
  const { data: busyBlocks } = useBusyBlocks(selectedDate);
  const generatePlan = useGeneratePlan();
  const markBlockDone = useMarkBlockDone();
  const markBlockMissed = useMarkBlockMissed();

  const handleGeneratePlan = async () => {
    await generatePlan.mutateAsync({ date: selectedDate, workStart, workEnd });
  };

  const handleMarkMissed = async (blockId) => {
    if (window.confirm('Mark this block as missed? The task will be rescheduled in future plans.')) {
      await markBlockMissed.mutateAsync(blockId);
    }
  };

  const unscheduledTasks = tasks?.filter((task) => !plan?.blocks?.some((block) => block.task_id === task.id)) || [];

  const isBlockPast = (endTime) => new Date(endTime) < new Date();
  const isBlockActive = (startTime, endTime) => {
    const now = new Date();
    return new Date(startTime) <= now && now <= new Date(endTime);
  };

  if (planLoading) {
    return (
      <Layout>
        <PlannerPageSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-gray-500">Scheduling</p>
              <h1 className="mt-2 text-3xl font-semibold text-gray-900">Planner</h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-600">
                Generate a realistic plan, review scheduled work, and track what still needs time.
              </p>
            </div>
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              {VIEW_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setViewMode(option.value)}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    viewMode === option.value ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Generate Plan</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <label className="block text-sm text-gray-600">
              <span className="mb-2 block font-medium text-gray-700">Date</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition-colors focus:border-gray-500"
              />
            </label>
            <label className="block text-sm text-gray-600">
              <span className="mb-2 block font-medium text-gray-700">Work Start</span>
              <input
                type="time"
                value={workStart}
                onChange={(event) => setWorkStart(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition-colors focus:border-gray-500"
              />
            </label>
            <label className="block text-sm text-gray-600">
              <span className="mb-2 block font-medium text-gray-700">Work End</span>
              <input
                type="time"
                value={workEnd}
                onChange={(event) => setWorkEnd(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition-colors focus:border-gray-500"
              />
            </label>
            <div className="flex items-end">
              <button
                onClick={handleGeneratePlan}
                disabled={generatePlan.isPending}
                className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generatePlan.isPending ? 'Generating...' : 'Generate Plan'}
              </button>
            </div>
          </div>
        </section>

        {!plan ? (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center shadow-sm">
            <p className="text-lg font-medium text-gray-900">No plan generated yet</p>
            <p className="mt-2 text-sm text-gray-500">Pick a date and generate a schedule to begin.</p>
          </section>
        ) : (
          <>
            {viewMode === 'calendar' && (
              <CalendarView
                blocks={plan.blocks || []}
                busyBlocks={plan.busyBlocks || busyBlocks || []}
                onSelectEvent={() => {}}
                selectedDate={selectedDate}
                onNavigate={(date) => setSelectedDate(format(date, 'yyyy-MM-dd'))}
              />
            )}

            {viewMode === 'timeline' && (
              <div className="grid gap-6 lg:grid-cols-3">
                <section className="space-y-4 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Schedule for {format(new Date(selectedDate), 'MMMM dd, yyyy')}
                    </h2>
                    <span className="text-sm text-gray-500">{plan.blocks?.length || 0} scheduled block(s)</span>
                  </div>

                  {plan.blocks && plan.blocks.length > 0 ? (
                    <div className="space-y-3">
                      {plan.blocks
                        .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))
                        .map((block) => {
                          const isPast = isBlockPast(block.end_at);
                          const isActive = isBlockActive(block.start_at, block.end_at);
                          const shouldPrompt = block.status === 'scheduled' && isPast;

                          return (
                            <article key={block.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-lg font-semibold text-gray-900">{block.task_title}</h3>
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getPriorityTone(block.priority)}`}>
                                      Priority {block.priority}
                                    </span>
                                    {block.status === 'done' && <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-800">Done</span>}
                                    {block.status === 'missed' && <span className="rounded-full bg-gray-300 px-2.5 py-1 text-xs font-medium text-gray-900">Missed</span>}
                                    {isActive && block.status === 'scheduled' && (
                                      <span className="rounded-full bg-gray-900 px-2.5 py-1 text-xs font-medium text-white">In progress</span>
                                    )}
                                    {shouldPrompt && (
                                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">Needs update</span>
                                    )}
                                  </div>
                                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1">
                                      <MdCalendarMonth className="text-base" />
                                      {format(new Date(block.start_at), 'HH:mm')} - {format(new Date(block.end_at), 'HH:mm')}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1">
                                      <MdOutlineSchedule className="text-base" />
                                      {block.estimated_minutes} min
                                    </span>
                                  </div>
                                </div>

                                {block.status === 'scheduled' && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => markBlockDone.mutateAsync(block.id)}
                                      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                                    >
                                      Done
                                    </button>
                                    <button
                                      onClick={() => handleMarkMissed(block.id)}
                                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                    >
                                      Missed
                                    </button>
                                  </div>
                                )}
                              </div>
                            </article>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
                      <p className="text-gray-700">No blocks scheduled for this date.</p>
                    </div>
                  )}
                </section>

                <aside className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Unscheduled Tasks</h2>
                    <span className="text-sm text-gray-500">{unscheduledTasks.length}</span>
                  </div>

                  {unscheduledTasks.length > 0 ? (
                    <div className="space-y-3">
                      {unscheduledTasks.map((task) => (
                        <article key={task.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900">{task.title}</h3>
                            <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${getPriorityTone(task.priority)}`}>
                              P{task.priority}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                            <span className="rounded-full bg-gray-100 px-2.5 py-1">{task.estimated_minutes} min</span>
                            {task.deadline_at && (
                              <span className="rounded-full bg-gray-100 px-2.5 py-1">
                                Due {format(new Date(task.deadline_at), 'MMM dd')}
                              </span>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                      <p className="text-sm text-gray-500">All tasks are scheduled.</p>
                    </div>
                  )}
                </aside>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Planner;
