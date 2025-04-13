import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './govuk-styles.scss'
import App from './App.tsx'

// Initialize GOV.UK Frontend after the DOM has loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check if GOVUKFrontend exists in window (should be provided by our import)
  if (window.GOVUKFrontend) {
    window.GOVUKFrontend.initAll()
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
