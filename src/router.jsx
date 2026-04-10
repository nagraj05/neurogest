import { createBrowserRouter } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Draw from './pages/Draw.jsx'
import Solar from './pages/Solar.jsx'

export const router = createBrowserRouter([
  { path: '/',       element: <Home /> },
  { path: '/draw',   element: <Draw /> },
  { path: '/solar',  element: <Solar /> },
])
