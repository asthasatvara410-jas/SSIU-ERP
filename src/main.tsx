import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './utils/modalScrollLock'
import App from './App.tsx'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { SocketProvider } from './context/SocketContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <SocketProvider>
        <App />
      </SocketProvider>
    </ErrorBoundary>
  </StrictMode>,
)
