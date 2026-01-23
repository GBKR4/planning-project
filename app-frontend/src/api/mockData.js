// Mock data for frontend development
export const mockUser = {
  id: 1,
  name: "Demo User",
  email: "demo@example.com",
  email_verified: true,
  created_at: new Date().toISOString(),
};

export const mockTasks = [
  {
    id: 1,
    title: "Complete Project Documentation",
    notes: "Write comprehensive documentation for the planning app",
    estimated_minutes: 120,
    deadline_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 4,
    status: "todo",
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Review Code Changes",
    notes: "Review pull requests from team members",
    estimated_minutes: 60,
    deadline_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 5,
    status: "todo",
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    title: "Update Dependencies",
    notes: "Update npm packages to latest versions",
    estimated_minutes: 30,
    deadline_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 2,
    status: "done",
    created_at: new Date().toISOString(),
  },
];

export const mockBusyBlocks = [
  {
    id: 1,
    title: "DBMS Class",
    start_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    end_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Gym Session",
    start_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    end_at: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  },
];

export const mockPlan = {
  date: new Date().toISOString().split('T')[0],
  blocks: [
    {
      id: 1,
      task_id: 1,
      task_title: "Complete Project Documentation",
      priority: 4,
      estimated_minutes: 120,
      start_at: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
      end_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      status: "pending",
    },
    {
      id: 2,
      task_id: 2,
      task_title: "Review Code Changes",
      priority: 5,
      estimated_minutes: 60,
      start_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      end_at: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
      status: "pending",
    },
  ],
};
