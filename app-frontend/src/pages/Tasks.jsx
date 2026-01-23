import { useState } from 'react';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import TaskForm from '../components/tasks/TaskForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
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
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask.mutateAsync(taskId);
    }
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
        <LoadingSpinner size="lg" className="mt-20" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
            <p className="mt-2 text-gray-600">Manage your tasks and track progress</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            ➕ Add Task
          </button>
        </div>

        {/* Filters */}
        <div className="flex space-x-2">
          {['all', 'todo', 'done'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status === 'todo' ? 'Pending' : 'Completed'}
            </button>
          ))}
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg">No tasks found</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Your First Task
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={task.status === 'done'}
                      onChange={() => handleToggleStatus(task)}
                      className="mt-1 h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                    />
                    
                    {/* Task Details */}
                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold ${task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {task.title}
                      </h3>
                      {task.notes && (
                        <p className="mt-1 text-gray-600 text-sm">{task.notes}</p>
                      )}
                      <div className="flex items-center space-x-3 mt-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          task.priority === 5 ? 'bg-red-100 text-red-800' :
                          task.priority === 4 ? 'bg-orange-100 text-orange-800' :
                          task.priority === 3 ? 'bg-green-100 text-green-800' :
                          task.priority === 2 ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          Priority {task.priority}
                        </span>
                        <span className="text-sm text-gray-500">
                          ⏱️ {task.estimated_minutes} min
                        </span>
                        {task.deadline_at && (
                          <span className="text-sm text-gray-500">
                            📅 Due: {format(new Date(task.deadline_at), 'MMM dd, yyyy HH:mm')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(task)}
                      className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      🗑️
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
