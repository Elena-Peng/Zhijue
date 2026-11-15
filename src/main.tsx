import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { App } from './App'
import { GardenProvider } from './store/GardenProvider'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <GardenProvider>
        <App />
      </GardenProvider>
    </HashRouter>
  </StrictMode>,
)
