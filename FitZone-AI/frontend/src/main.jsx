import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 30s, then quietly revalidated in the
      // background on refocus/remount instead of showing a blank loading
      // state every time the user navigates back to a page.
      staleTime: 15 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
