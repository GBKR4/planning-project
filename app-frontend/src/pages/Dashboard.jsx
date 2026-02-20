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

        {/* Welcome Section with Rainbow Effect */}
        <div className="relative overflow-hidden bg-gradient-to-r from-pink-500 via-purple-500 via-blue-500 via-green-500 to-yellow-500 rounded-2xl p-8 shadow-2xl animate-pulse-slow">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">Welcome Back! 👋</h1>
            <p className="mt-2 text-white text-lg drop-shadow-md">Here's your overview for today</p>
          </div>
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white opacity-20 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-yellow-300 opacity-30 blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-48 w-48 rounded-full bg-white opacity-10 blur-3xl"></div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group relative bg-gradient-to-br from-blue-500 via-cyan-400 to-teal-500 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden border-2 border-blue-300/50">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400 via-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute -top-10 -right-10 h-32 w-32 bg-white rounded-full opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white drop-shadow-md">Total Tasks</p>
                <p className="mt-2 text-5xl font-bold text-white drop-shadow-lg">{tasks?.length || 0}</p>
              </div>
              <div className="h-16 w-16 bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 shadow-lg">
                <span className="text-4xl">📝</span>
              </div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-green-500 via-emerald-400 to-teal-500 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden border-2 border-green-300/50">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400 via-green-400 to-lime-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute -top-10 -right-10 h-32 w-32 bg-lime-300 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white drop-shadow-md">Completed</p>
                <p className="mt-2 text-5xl font-bold text-white drop-shadow-lg">{doneTasks.length}</p>
              </div>
              <div className="h-16 w-16 bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 shadow-lg">
                <span className="text-4xl">✅</span>
              </div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-orange-500 via-amber-400 to-yellow-500 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden border-2 border-orange-300/50">
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-400 via-orange-400 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute -top-10 -right-10 h-32 w-32 bg-yellow-300 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white drop-shadow-md">Pending</p>
                <p className="mt-2 text-5xl font-bold text-white drop-shadow-lg">{todoTasks.length}</p>
              </div>
              <div className="h-16 w-16 bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 shadow-lg">
                <span className="text-4xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden border-2 border-purple-300/50">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-400 via-pink-400 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute -top-10 -right-10 h-32 w-32 bg-pink-300 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white drop-shadow-md">Today's Plan</p>
                <p className="mt-2 text-5xl font-bold text-white drop-shadow-lg">{todayBlocks.length}</p>
              </div>
              <div className="h-16 w-16 bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 shadow-lg">
                <span className="text-4xl">📅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Plan */}
          <div className="bg-gradient-to-br from-white via-indigo-50 to-purple-50 rounded-2xl shadow-lg border-2 border-indigo-200 p-6 hover:shadow-2xl hover:border-purple-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">📅 Today's Plan</h2>
              <Link to="/planner" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 group">
                <span>View All</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
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
                    className="group p-4 border-l-4 bg-gradient-to-r from-gray-50 to-white hover:from-indigo-50 hover:to-purple-50 rounded-lg hover:shadow-md transition-all duration-300 border-indigo-400"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{block.task_title || '☕ Break'}</p>
                        <p className="text-sm text-gray-500 mt-1 flex items-center space-x-1">
                          <span>🕐</span>
                          <span>{new Date(block.start_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {new Date(block.end_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        block.status === 'done' ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' :
                        block.status === 'missed' ? 'bg-gradient-to-r from-red-400 to-red-500 text-white' :
                        'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                      }`}>
                        {block.status === 'done' ? '✓' : block.status === 'missed' ? '✗' : '⏳'} {block.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">📋 Upcoming Tasks</h2>
              <Link to="/tasks" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 group">
                <span>View All</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
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
                    className="group p-4 border-l-4 bg-gradient-to-r from-gray-50 to-white hover:from-purple-50 hover:to-pink-50 rounded-lg hover:shadow-md transition-all duration-300 border-purple-400"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">{task.title}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                            task.priority === 5 ? 'bg-gradient-to-r from-red-400 to-red-600 text-white' :
                            task.priority === 4 ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white' :
                            task.priority === 3 ? 'bg-gradient-to-r from-green-400 to-green-600 text-white' :
                            'bg-gradient-to-r from-gray-400 to-gray-600 text-white'
                          }`}>
                            🎯 P{task.priority}
                          </span>
                          {task.deadline_at && (
                            <span className="text-xs font-medium text-gray-500 flex items-center space-x-1">
                              <span>📅</span>
                              <span>{format(new Date(task.deadline_at), 'MMM dd')}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-indigo-600 flex items-center space-x-1">
                        <span>⏱️</span>
                        <span>{task.estimated_minutes}m</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <span>⚡</span>
            <span>Quick Actions</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link to="/tasks">
              <button className="group w-full px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 font-semibold shadow-md hover:shadow-xl hover:-translate-y-1 flex items-center justify-center space-x-2">
                <span className="text-xl">➕</span>
                <span>Add New Task</span>
              </button>
            </Link>
            <Link to="/busy-blocks">
              <button className="group w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-300 font-semibold shadow-md hover:shadow-xl hover:-translate-y-1 flex items-center justify-center space-x-2">
                <span className="text-xl">🚫</span>
                <span>Add Busy Block</span>
              </button>
            </Link>
            <Link to="/planner">
              <button className="group w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-semibold shadow-md hover:shadow-xl hover:-translate-y-1 flex items-center justify-center space-x-2">
                <span className="text-xl">📅</span>
                <span>Generate Plan</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
