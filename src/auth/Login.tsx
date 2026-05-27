import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

import {
  login,
  cadastrar
} from '../services/authService'

export default function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [modoCadastro, setModoCadastro] =
    useState(false)

    async function handleSubmit() {

      setLoading(true)
    
      if (modoCadastro) {
    
        const response = await cadastrar(
          email,
          password
        )
    
        const { error } = response
    
        if (error) {
    
          alert(error.message)
    
          setLoading(false)
    
          return
        }
    
        const user =
          response.data.user
    
        if (user) {
    
          await supabase
            .from('UsuariosInternos')
            .insert([
              {
                id: user.id,
                email: user.email,
                nome:
                  user.email?.split('@')[0]
              }
            ])
        }
    
        alert('Usuário criado com sucesso.')
    
        navigate('/dashboard')
    
      } else {
    
        const response = await login(
          email,
          password
        )
    
        const { error } = response
    
        if (error) {
    
          alert(error.message)
    
          setLoading(false)
    
          return
        }
    
        navigate('/dashboard')
      }
    
      setLoading(false)
    }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#F5F5F5'
      }}
    >
      <div
        style={{
          background: '#FFF',
          padding: 40,
          borderRadius: 10,
          width: 350,
          display: 'flex',
          flexDirection: 'column',
          gap: 15
        }}
      >
        <h1>
          {modoCadastro
            ? 'Criar Conta'
            : 'Login'}
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          style={{
            padding: 12
          }}
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          style={{
            padding: 12
          }}
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            padding: 12
          }}
        >
          {loading
            ? 'Carregando...'
            : modoCadastro
            ? 'Criar Conta'
            : 'Entrar'}
        </button>

        <button
          onClick={() =>
            setModoCadastro(!modoCadastro)
          }
        >
          {modoCadastro
            ? 'Já tenho conta'
            : 'Criar nova conta'}
        </button>
      </div>
    </div>
  )
}