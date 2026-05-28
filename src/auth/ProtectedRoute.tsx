import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

import { supabase } from '../lib/supabase'

interface Props {
  children: React.ReactNode
}

export default function ProtectedRoute({
  children
}: Props) {
  const [loading, setLoading] =
    useState(true)

  const [authenticated, setAuthenticated] =
    useState(false)

  useEffect(() => {
    verificarUsuario()
  }, [])

  async function verificarUsuario() {
    const {
      data: { user }
    } = await supabase.auth.getUser()

    setAuthenticated(!!user)

    setLoading(false)
  }

  if (loading) {
    return <h1>Carregando...</h1>
  }

  if (!authenticated) {
    return <Navigate to="/" />
  }

  return children
}
