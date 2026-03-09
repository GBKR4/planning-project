import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useTasks } from '../hooks/useTasks';
import { usePlan } from '../hooks/usePlans';
import { useMe } from '../hooks/useUsers';
import { resendVerification } from '../api/authApi';
import { format } from 'date-fns';
import { DashboardSkeleton } from '../components/common/SkeletonLoader';
import showToast from '../utils/toast';
import { 
  MdCheckCircle, 
  MdWarning, 
  MdArrowForward,
  MdAdd,
  MdSchedule,
  MdEventBusy
} from 'react-icons/md';
import { 
  FaTasks, 
  FaCheckCircle, 
  FaClock, 
  FaCalendarDay,
  FaPlus
} from 'react-icons/fa';
import { BsLightningChargeFill } from 'react-icons/bs';

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
      <div className="space-y-6">
        {/* Email Verification Banner */}
        {user && !user.email_verified && (
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 flex items-start space-x-3">
            <MdWarning className="text-gray-600 text-2xl flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">
                Email Verification Required
              </h3>
              <p className="mt-1 text-sm text-gray-700">
                Please verify your email to access all features.{' '}
                <button
                  onClick={handleResendVerification}
                  className="font-semibold underline hover:text-gray-900"
                >
                  Resend verification email
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="mt-1 text-gray-600">Here's your overview for today</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{tasks?.length || 0}</p>
              </div>
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <FaTasks className="text-gray-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{doneTasks.length}</p>
              </div>
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <FaCheckCircle className="text-gray-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{todoTasks.length}</p>
              </div>
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <FaClock className="text-gray-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Plan</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{todayBlocks.length}</p>
              </div>
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <FaCalendarDay className="text-gray-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Plan */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Today's Plan</h2>
              <Link 
                to="/planner" 
                className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center space-x-1"
              >
                <span>View All</span>
                <MdArrowForward />
              </Link>
            </div>
            {todayBlocks.length === 0 ? (
              <div className="text-center py-8">
                <FaCalendarDay className="mx-auto text-4xl text-gray-300 mb-3" />
                <p className="text-gray-500 mb-4">No plan generated for today</p>
                <Link to="/planner">
                  <button className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                    Generate Plan
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {todayBlocks.slice(0, 5).map((block) => (
                  <div
                    key={block.id}
                    className="p-4 border-l-4 border-gray-400 bg-gray-50 rounded-r-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{block.task_title || 'Break'}</p>
                        <p className="text-sm text-gray-500 mt-1 flex items-center space-x-1">
                          <FaClock className="text-xs" />
                          <span>{new Date(block.start_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {new Date(block.end_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        block.status === 'done' ? 'bg-gray-200 text-gray-800' :
                        block.status === 'missed' ? 'bg-gray-300 text-gray-900' :
                        'bg-gray-100 text-gray-700'
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
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h2>
              <Link 
                to="/tasks" 
                className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center space-x-1"
              >
                <span>View All</span>
                <MdArrowForward />
              </Link>
            </div>
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-8">
                <FaTasks className="mx-auto text-4xl text-gray-300 mb-3" />
                <p className="text-gray-500 mb-4">No pending tasks</p>
                <Link to="/tasks">
                  <button className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                    Add Task
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 border-l-4 border-gray-400 bg-gray-50 rounded-r-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{task.title}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                            task.priority === 5 ? 'bg-gray-300 text-gray-900' :
                            task.priority === 4 ? 'bg-gray-200 text-gray-800' :
                            task.priority === 3 ? 'bg-gray-200 text-gray-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            P{task.priority}
                          </span>
                          {task.deadline_at && (
                            <span className="text-xs text-gray-500">
                              {format(new Date(task.deadline_at), 'MMM dd')}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-600 flex items-center space-x-1">
                        <FaClock className="text-xs" />
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
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-5">
            <BsLightningChargeFill className="text-gray-600 text-xl" />
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link to="/tasks">
              <button className="w-full flex items-center justify-center space-x-2 px-5 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                <MdAdd className="text-lg" />
                <span>Add New Task</span>
              </button>
            </Link>
            <Link to="/busy-blocks">
              <button className="w-full flex items-center justify-center space-x-2 px-5 py-3 bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors">
                <MdEventBusy className="text-lg" />
                <span>Add Busy Block</span>
              </button>
            </Link>
            <Link to="/planner">
              <button className="w-full flex items-center justify-center space-x-2 px-5 py-3 bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors">
                <MdSchedule className="text-lg" />
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
