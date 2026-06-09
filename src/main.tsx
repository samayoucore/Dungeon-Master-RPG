import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// NOTE: React.StrictMode is intentionally omitted. Under React 19 its dev-only
// double-mount breaks framer-motion's AnimatePresence (mode="wait") exit
// tracking, leaving screen transitions stuck on the exiting screen. Every route
// change in this app flows through AnimatePresence, so StrictMode stays off.
createRoot(document.getElementById('root')!).render(<App />)
