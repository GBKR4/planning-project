// Toggle between mock data and real API
export const USE_MOCK_DATA = true; // Set to false when backend is ready

// Helper to simulate API delay
export const mockDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));
