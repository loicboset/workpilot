import '@fontsource-variable/figtree'
import '@fontsource-variable/lora'
import './styles/index.css'
import './i18n'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing <div id="root"> in index.html')

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
