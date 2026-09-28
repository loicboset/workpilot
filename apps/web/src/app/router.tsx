import { createBrowserRouter } from 'react-router'
import { HomePage } from './HomePage'

// Feature pages (today, direction, onboarding…) are added here as they are built.
export const router = createBrowserRouter([{ path: '/', element: <HomePage /> }])
