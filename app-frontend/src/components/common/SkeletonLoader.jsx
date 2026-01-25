export default function SkeletonLoader({ className = '' }) {
  return (
    <div className={`animate-pulse ${className}`}>
      {/* Skeleton content */}
      <div className="h-full w-full bg-gray-200 rounded"></div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-3 bg-white/30 rounded w-1/2 mb-3"></div>
          <div className="h-8 bg-white/40 rounded w-1/3"></div>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-full"></div>
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </td>
      ))}
    </tr>
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
      </div>
      <div className="flex items-center justify-between">
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        <div className="h-8 w-8 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

export function TimelineBlockSkeleton() {
  return (
    <div className="bg-white rounded-lg border-l-4 border-gray-300 p-4 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
      </div>
      <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <TimelineBlockSkeleton />
          <TimelineBlockSkeleton />
        </div>
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <TaskCardSkeleton />
          <TaskCardSkeleton />
        </div>
      </div>
    </div>
  );
}

export function TasksPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center animate-pulse">
        <div>
          <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 animate-pulse">
        <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
        <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
        <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
      </div>

      {/* Task Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
      </div>
    </div>
  );
}

export function BusyBlocksPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center animate-pulse">
        <div>
          <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
      </div>

      {/* Date Groups */}
      <div className="space-y-6">
        {[1, 2].map((group) => (
          <div key={group} className="space-y-3">
            <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
            <div className="space-y-2">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlannerPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-64"></div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div className="h-12 w-full bg-gray-200 rounded-lg"></div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <TimelineBlockSkeleton />
        <TimelineBlockSkeleton />
        <TimelineBlockSkeleton />
      </div>
    </div>
  );
}
