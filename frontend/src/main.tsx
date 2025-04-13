import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Initialize GOV.UK Frontend components after the app has rendered
// We need to use this approach because we're loading the CSS from CDN
const initGovUKFrontend = () => {
  // This dynamically adds the script to initialize GOV.UK Frontend
  const script = document.createElement('script')
  script.src = 'https://cdn.jsdelivr.net/npm/govuk-frontend@5.9.0/dist/govuk/govuk-frontend.min.js'
  script.onload = () => {
    // @ts-ignore - the window.GOVUKFrontend will be available after the script loads
    if (window.GOVUKFrontend) {
      // @ts-ignore
      window.GOVUKFrontend.initAll()
    }
  }
  document.body.appendChild(script)
}

// Initialize GOV.UK Frontend after component mount
document.addEventListener('DOMContentLoaded', initGovUKFrontend)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
