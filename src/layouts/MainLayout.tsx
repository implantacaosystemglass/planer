import { Link } from 'react-router-dom'

import { logout } from '../services/authService'

export default function MainLayout({
  children
}: any) {
  async function sair() {
    await logout()

    window.location.href = '/'
  }

  return (
    <div>
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: 20,
          background: '#EAEAEA'
        }}
      >
        <Link to="/dashboard">
          Dashboard
        </Link>

        <Link to="/despesas">
          Despesas
        </Link>

        <button onClick={sair}>
          Logout
        </button>
      </nav>

      <div
        style={{
          padding: 20
        }}
      >
        {children}
      </div>
    </div>
  )
}