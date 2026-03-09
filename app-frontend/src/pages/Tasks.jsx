import { useState } from 'react';
import { format } from 'date-fns';
import { MdAdd, MdCheck, MdDeleteOutline, MdEdit, MdSchedule } from 'react-icons/md';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import TaskForm from '../components/tasks/TaskForm';
import { TasksPageSkeleton } from '../components/common/SkeletonLoader';
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useMarkTaskDone,
  useMarkTaskTodo,
} from '../hooks/useTasks';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'Pending' },
  { value: 'done', label: 'Completed' },
];

const getPriorityTone = (priority) => {
  if (priority >= 5) return 'bg-gray-900 text-white';
  if (priority === 4) return 'bg-gray-800 text-white';
  if (priority === 3) return 'bg-gray-700 text-white';
  if (priority === 2) return 'bg-gray-200 text-gray-800';
  return 'bg-gray-100 text-gray-700';
};

const Tasks = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: tasks, isLoading } = useTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const markDone = useMarkTaskDone();
  const markTodo = useMarkTaskTodo();

  const handleCreateTask = async (data) => {
    await createTask.mutateAsync(data);
    setIsModalOpen(false);
  };

  const handleUpdateTask = async (data) => {
    await updateTask.mutateAsync({ taskId: editingTask.id, data });
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = async (taskId) => {
    await deleteTask.mutateAsync(taskId);
  };

  const handleToggleStatus = async (task) => {
    if (task.status === 'todo') {
      await markDone.mutateAsync(task.id);
      return;
    }
    await markTodo.mutateAsync(task.id);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const filteredTasks =
    tasks?.filter((task) => (filterStatus === 'all' ? true : task.status === filterStatus)) || [];

  if (isLoading) {
    return (
      <Layout>
        <TasksPageSkeleton />
      </Layout>
    );
  }

  const totalTasks = tasks?.length || 0;
  const pendingTasks = tasks?.filter((task) => task.status === 'todo').length || 0;
  const completedTasks = tasks?.filter((task) => task.status === 'done').length || 0;

  return (
    <Layout>
      <div className="space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-gray-500">Workspace</p>
              <h1 className="mt-2 text-3xl font-semibold text-gray-900">Tasks</h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-600">
                Keep your task list current, review priorities, and move work forward without the visual noise.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              <MdAdd className="text-lg" />
              New Task
            </button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Total tasks</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{totalTasks}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{pendingTasks}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{completedTasks}</p>
            </div>
          </div>
        </section>

        <section className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                filterStatus === filter.value
                  ? 'bg-gray-900 text-white'
                  : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </section>

        {filteredTasks.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center shadow-sm">
            <p className="text-lg font-medium text-gray-900">No tasks found</p>
            <p className="mt-2 text-sm text-gray-500">
              {filterStatus === 'all'
                ? 'Create your first task to start planning work.'
                : `There are no ${filterStatus} tasks right now.`}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              <MdAdd className="text-lg" />
              Create Task
            </button>
          </section>
        ) : (
          <section className="grid gap-4">
            {filteredTasks.map((task) => (
              <article
                key={task.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
                  task.status === 'done' ? 'border-gray-300' : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 flex-1 gap-4">
                    <button
                      onClick={() => handleToggleStatus(task)}
                      className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        task.status === 'done'
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-300 bg-white text-transparent hover:border-gray-500'
                      }`}
                      title={task.status === 'done' ? 'Mark as pending' : 'Mark as done'}
                    >
                      <MdCheck className="text-base" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2
                          className={`text-lg font-semibold ${
                            task.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-900'
                          }`}
                        >
                          {task.title}
                        </h2>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getPriorityTone(task.priority)}`}>
                          Priority {task.priority}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                          {task.status === 'done' ? 'Completed' : 'Pending'}
                        </span>
                      </div>

                      {task.notes && (
                        <p className="mt-2 text-sm leading-6 text-gray-600">{task.notes}</p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1">
                          <MdSchedule className="text-base" />
                          {task.estimated_minutes} min
                        </span>
                        {task.time_preference && task.time_preference !== 'anytime' && (
                          <span className="rounded-full bg-gray-100 px-3 py-1 capitalize text-gray-600">
                            {task.time_preference}
                          </span>
                        )}
                        {task.deadline_at && (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">
                            Due {format(new Date(task.deadline_at), 'MMM dd, HH:mm')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start">
                    <button
                      onClick={() => {
                        setEditingTask(task);
                        setIsModalOpen(true);
                      }}
                      className="rounded-lg border border-gray-200 p-2.5 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                      title="Edit task"
                    >
                      <MdEdit className="text-lg" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="rounded-lg border border-gray-200 p-2.5 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                      title="Delete task"
                    >
                      <MdDeleteOutline className="text-lg" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={editingTask ? 'Edit Task' : 'Create Task'}
        >
          <TaskForm
            onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
            initialData={editingTask}
            isLoading={createTask.isPending || updateTask.isPending}
          />
        </Modal>
      </div>
    </Layout>
  );
};

export default Tasks;
