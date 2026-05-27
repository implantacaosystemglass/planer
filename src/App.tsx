import {
  BrowserRouter,
  Routes,
  Route
} from 'react-router-dom'

import Login from './auth/Login'
import ProtectedRoute from './auth/ProtectedRoute'

import MainLayout from './layouts/MainLayout'

import Dashboard from './pages/Dashboard'
import Despesas from './pages/Despesas'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/despesas"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Despesas />
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App