import { StrictMode, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const rootElement = document.getElementById('root')

const renderFatal = (title, detail) => {
  if (!rootElement) {
    return
  }

  rootElement.innerHTML = `
    <div style="min-height:100vh;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;padding:32px;font-family:Inter,system-ui,sans-serif;">
      <div style="max-width:720px;width:100%;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:24px;background:rgba(255,255,255,.04);box-shadow:0 20px 60px rgba(0,0,0,.35);">
        <h1 style="margin:0 0 12px;font-size:28px;">${title}</h1>
        <pre style="margin:0;white-space:pre-wrap;word-break:break-word;color:rgba(255,255,255,.78);font:14px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;">${detail}</pre>
      </div>
    </div>
  `
}

window.addEventListener('error', (event) => {
  console.error('Renderer error:', event.error || event.message)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Renderer rejection:', event.reason)
})

import('./App.jsx')
  .then(({ default: AppComponent }) => {
    createRoot(rootElement).render(
      createElement(
        StrictMode,
        null,
        createElement(AppComponent),
      ),
    )
  })
  .catch((error) => {
    console.error('App bootstrap failed:', error)
    renderFatal('Uygulama yuklenemedi', error?.stack || String(error))
  })
