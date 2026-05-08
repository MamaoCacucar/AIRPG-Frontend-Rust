import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './style.css' // Se tiver um ficheiro de CSS global

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)