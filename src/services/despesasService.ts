import { supabase } from '../lib/supabase'

export async function listarDespesas() {
  return await supabase
    .from('ControleDespesas')
    .select('*')
    .order('id', { ascending: false })
}

export async function salvarDespesa(
  dados: any
) {
  return await supabase
    .from('ControleDespesas')
    .insert([dados])
}

export async function removerDespesa(
  id: number
) {
  return await supabase
    .from('ControleDespesas')
    .delete()
    .eq('id', id)
}

export async function uploadComprovante(
  arquivo: File
) {

  const extensao =
    arquivo.name.split('.').pop()

  const nomeArquivo =
    `${Date.now()}.${extensao}`

  const { error } =
    await supabase.storage
      .from('comprovantes')
      .upload(nomeArquivo, arquivo, {
        cacheControl: '3600',
        upsert: false
      })

  if (error) {

    console.error(
      'Erro upload:',
      error
    )

    alert(error.message)

    return null
  }

  const {
    data
  } = supabase.storage
    .from('comprovantes')
    .getPublicUrl(nomeArquivo)

  return data.publicUrl
}