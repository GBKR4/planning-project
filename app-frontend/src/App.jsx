import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={
              <div className="flex items-center justify-center h-screen">
                <h1 className="text-4xl font-bold text-gray-900">Planning App</h1>
              </div>
            } />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App
