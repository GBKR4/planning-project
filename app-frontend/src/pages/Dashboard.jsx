import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useTasks } from '../hooks/useTasks';
import { usePlan } from '../hooks/usePlans';
import { useMe } from '../hooks/useUsers';
import { resendVerification } from '../api/authApi';
import { format } from 'date-fns';
import { DashboardSkeleton } from '../components/common/SkeletonLoader';
import showToast from '../utils/toast';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const Dashboard = () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: planData, isLoading: planLoading } = usePlan(today);
  const { data: user } = useMe();

  const handleResendVerification = async () => {
    try {
      await resendVerification({ email: user?.email });
      showToast.success('Verification email sent! Check your inbox.');
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to send verification email');
    }
  };

  if (tasksLoading || planLoading) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    );
  }

  const todoTasks = tasks?.filter(t => t.status === 'todo') || [];
  const doneTasks = tasks?.filter(t => t.status === 'done') || [];
  const todayBlocks = planData?.blocks || [];
  const upcomingTasks = todoTasks.slice(0, 5);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Email Verification Banner */}
        {user && !user.email_verified && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Email not verified
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Please verify your email address to access all features.{' '}
                    <button
                      onClick={handleResendVerification}
                      className="font-medium underline hover:text-yellow-600"
                    >
                      Resend verification email
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
          <p className="mt-2 text-gray-600">Here's your overview for today</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{tasks?.length || 0}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="mt-2 text-3xl font-bold text-green-600">{doneTasks.length}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="mt-2 text-3xl font-bold text-orange-600">{todoTasks.length}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Plan</p>
                <p className="mt-2 text-3xl font-bold text-indigo-600">{todayBlocks.length}</p>
              </div>
              <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Plan */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Today's Plan</h2>
              <Link to="/planner" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                View All →
              </Link>
            </div>
            {todayBlocks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No plan generated for today</p>
                <Link to="/planner">
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Generate Plan
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {todayBlocks.slice(0, 5).map((block) => (
                  <div
                    key={block.id}
                    className="p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{block.task_title || 'Break'}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(block.start_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {new Date(block.end_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        block.status === 'done' ? 'bg-green-100 text-green-800' :
                        block.status === 'missed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {block.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Upcoming Tasks</h2>
              <Link to="/tasks" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                View All →
              </Link>
            </div>
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No pending tasks</p>
                <Link to="/tasks">
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Add Task
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{task.title}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            task.priority === 5 ? 'bg-red-100 text-red-800' :
                            task.priority === 4 ? 'bg-orange-100 text-orange-800' :
                            task.priority === 3 ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            Priority {task.priority}
                          </span>
                          {task.deadline_at && (
                            <span className="text-xs text-gray-500">
                              Due: {format(new Date(task.deadline_at), 'MMM dd')}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{task.estimated_minutes}m</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link to="/tasks">
              <button className="w-full px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium">
                ➕ Add New Task
              </button>
            </Link>
            <Link to="/busy-blocks">
              <button className="w-full px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors font-medium">
                🚫 Add Busy Block
              </button>
            </Link>
            <Link to="/planner">
              <button className="w-full px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium">
                📅 Generate Plan
              </button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
