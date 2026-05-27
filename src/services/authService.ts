import { supabase } from '../lib/supabase'

export async function login(
  email: string,
  password: string
) {
  return await supabase.auth.signInWithPassword({
    email,
    password
  })
}

export async function cadastrar(
  email: string,
  password: string
) {
  return await supabase.auth.signUp({
    email,
    password
  })
}

export async function logout() {
  return await supabase.auth.signOut()
}

export async function getUser() {
  return await supabase.auth.getUser()
}

export async function recuperarSenha(
  email: string
) {
  return await supabase.auth.resetPasswordForEmail(
    email,
    {
      redirectTo: 'http://localhost:5173'
    }
  )
}