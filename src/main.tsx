import {StrictMode, lazy, Suspense} from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter, Route, Routes} from 'react-router-dom'
import './index.css'
import {Landing} from './landing'
import {Privacy, Terms} from './legal'
import {initI18n} from './i18n'

const Editor = lazy(() => import('./editor/editor'))

// Template images are drawn with Geist, so wait for the font before the editor makes them.
initI18n()
document.fonts.load('500 40px Geist').catch(() => {}).finally(() => createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/editor" element={<Suspense fallback={null}><Editor /></Suspense>} />
        <Route path="/editor/:preset" element={<Suspense fallback={null}><Editor /></Suspense>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
))
