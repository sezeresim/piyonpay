import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Toaster } from '@/components/ui/sonner'
import { bindMoneySoundUnlock } from '@/lib/money-sound'

function Root() {
  useEffect(() => bindMoneySoundUnlock(), [])

  return (
    <>
      <App />
      <Toaster richColors closeButton />
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
