import { useState } from 'react';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import TaskForm from '../components/tasks/TaskForm';
import { TasksPageSkeleton } from '../components/common/SkeletonLoader';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useMarkTaskDone, useMarkTaskTodo } from '../hooks/useTasks';
import { format } from 'date-fns';

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
    } else {
      await markTodo.mutateAsync(task.id);
    }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const filteredTasks = tasks?.filter(task => {
    if (filterStatus === 'all') return true;
    return task.status === filterStatus;
  }) || [];

  if (isLoading) {
    return (
      <Layout>
        <TasksPageSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fadeIn">
        {/* Header with Rainbow Gradient */}
        <div className="bg-gradient-to-r from-pink-500 via-purple-500 via-indigo-500 via-blue-500 to-cyan-500 rounded-2xl shadow-2xl p-8 text-white transform transition-all hover:scale-[1.02] duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3 drop-shadow-lg">
                <span className="text-5xl animate-bounce">✅</span>
                My Tasks
              </h1>
              <p className="mt-3 text-white text-lg drop-shadow-md">
                Organize, prioritize, and conquer your goals
              </p>
              <div className="mt-4 flex items-center gap-6 text-sm">
                <span className="bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg font-semibold">
                  📋 {tasks?.length || 0} Total
                </span>
                <span className="bg-yellow-400/30 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg font-semibold">
                  ⏳ {tasks?.filter(t => t.status === 'todo').length || 0} Pending
                </span>
                <span className="bg-green-400/30 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg font-semibold">
                  ✨ {tasks?.filter(t => t.status === 'done').length || 0} Completed
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 bg-white text-purple-600 rounded-2xl hover:bg-yellow-50 transition-all duration-200 font-bold shadow-2xl hover:shadow-3xl transform hover:scale-110 flex items-center gap-3"
            >
              <span className="text-3xl">➕</span>
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Filters with Colorful Design */}
        <div className="flex space-x-3">
          {[
            { value: 'all', label: 'All Tasks', icon: '📋', gradient: 'from-blue-500 to-cyan-500' },
            { value: 'todo', label: 'Pending', icon: '⏳', gradient: 'from-orange-500 to-yellow-500' },
            { value: 'done', label: 'Completed', icon: '✅', gradient: 'from-green-500 to-emerald-500' }
          ].map(({ value, label, icon, gradient }) => (
            <button
              key={value}
              onClick={() => setFilterStatus(value)}
              className={`px-6 py-3 rounded-2xl font-bold transition-all duration-200 transform hover:scale-110 flex items-center gap-2 shadow-lg ${
                filterStatus === value
                  ? `bg-gradient-to-r ${gradient} text-white shadow-2xl scale-105`
                  : 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 border-2 border-gray-300'
              }`}
            >
              <span className="text-xl">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-50 to-indigo-50 rounded-2xl shadow-lg border-2 border-dashed border-indigo-200 p-16 text-center transform transition-all hover:shadow-xl">
            <div className="text-8xl mb-6">📝</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">No tasks here yet!</h3>
              <p className="text-gray-600 text-lg mb-6 font-semibold">Start your productivity journey by creating your first task</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-10 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 font-black shadow-2xl hover:shadow-3xl transform hover:scale-110 hover:-translate-y-1 inline-flex items-center gap-3"
            >
              <span className="text-3xl">✨</span>
              <span>Create Your First Task</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`bg-gradient-to-r ${
                  task.status === 'done'
                    ? 'from-green-50 to-emerald-50 border-green-200'
                    : task.priority === 5
                    ? 'from-red-50 to-pink-50 border-red-200'
                    : task.priority === 4
                    ? 'from-orange-50 to-amber-50 border-orange-200'
                    : 'from-white to-indigo-50 border-indigo-200'
                } rounded-2xl shadow-md border-2 p-6 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Custom Checkbox */}
                    <label className="relative flex items-center justify-center cursor-pointer group mt-1">
                      <input
                        type="checkbox"
                        checked={task.status === 'done'}
                        onChange={() => handleToggleStatus(task)}
                        className="sr-only"
                      />
                      <div className={`w-7 h-7 rounded-lg border-3 transition-all duration-200 flex items-center justify-center ${
                        task.status === 'done'
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-600 shadow-lg'
                          : 'bg-white border-gray-300 group-hover:border-indigo-400 group-hover:shadow-md'
                      }`}>
                        {task.status === 'done' && (
                          <span className="text-white text-lg font-bold">✓</span>
                        )}
                      </div>
                    </label>
                    
                    {/* Task Details */}
                    <div className="flex-1">
                      <h3 className={`text-xl font-bold mb-2 transition-all ${
                        task.status === 'done' 
                          ? 'text-gray-400 line-through' 
                          : 'text-gray-900'
                      }`}>
                        {task.title}
                      </h3>
                      {task.notes && (
                        <p className={`mb-3 text-sm leading-relaxed ${
                          task.status === 'done' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          💭 {task.notes}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Priority Badge with Enhanced Colors */}
                        <span className={`px-3 py-1.5 text-xs font-bold rounded-xl shadow-md flex items-center gap-1 border-2 transform hover:scale-110 transition-all ${
                          task.priority === 5 ? 'bg-gradient-to-r from-red-500 via-pink-500 to-rose-600 text-white border-red-300 shadow-red-200' :
                          task.priority === 4 ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-600 text-white border-orange-300 shadow-orange-200' :
                          task.priority === 3 ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white border-green-300 shadow-green-200' :
                          task.priority === 2 ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white border-blue-300 shadow-blue-200' :
                          'bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 text-white border-gray-300'
                        }`}>
                          <span>🎯</span>
                          Priority {task.priority}
                        </span>
                        
                        {/* Duration Badge */}
                        <span className="px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-md border-2 border-cyan-300 flex items-center gap-1 hover:scale-110 transition-transform">
                          <span>⏱️</span>
                          {task.estimated_minutes} min
                        </span>
                        
                        {/* Time Preference Badge with Vibrant Colors */}
                        {task.time_preference && task.time_preference !== 'anytime' && (
                          <span className={`px-3 py-1.5 text-xs font-bold rounded-xl shadow-md border-2 flex items-center gap-1 hover:scale-110 transition-transform ${
                            task.time_preference === 'morning'
                              ? 'bg-gradient-to-r from-yellow-400 via-orange-400 to-amber-500 text-white border-yellow-300'
                              : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 text-white border-purple-300'
                          }`}>
                            <span>{task.time_preference === 'morning' ? '🌅' : '🌆'}</span>
                            {task.time_preference === 'morning' ? 'Morning' : 'Evening'}
                          </span>
                        )}
                        
                        {/* Deadline Badge with Pink Gradient */}
                        {task.deadline_at && (
                          <span className="px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-md border-2 border-pink-300 flex items-center gap-1 hover:scale-110 transition-transform">
                            <span>📅</span>
                            {format(new Date(task.deadline_at), 'MMM dd, HH:mm')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(task)}
                      className="p-3 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all duration-200 hover:scale-110 transform shadow-sm hover:shadow-md"
                      title="Edit task"
                    >
                      <span className="text-xl">✏️</span>
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-3 text-red-600 hover:bg-red-100 rounded-xl transition-all duration-200 hover:scale-110 transform shadow-sm hover:shadow-md"
                      title="Delete task"
                    >
                      <span className="text-xl">🗑️</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
      >
        <TaskForm
          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
          initialData={editingTask}
          isLoading={createTask.isPending || updateTask.isPending}
        />
      </Modal>
    </Layout>
  );
};

export default Tasks;
