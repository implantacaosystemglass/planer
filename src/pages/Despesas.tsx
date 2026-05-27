import { useEffect, useState } from 'react'

import '../styles/despesas.css'

import {
  salvarDespesa,
  removerDespesa,
  uploadComprovante
} from '../services/despesasService'

import {
  gerarPDFDespesas
} from '../services/pdfService'

import { supabase } from '../lib/supabase'

type Despesa = {
  id: number
  funcionario: string
  cliente: string
  finalidade: string
  data_cupom: string
  categoria: string
  descricao: string
  valor: number
  comprovante_url?: string
}

type Funcionario = {
  id: number
  nome: string
}

export default function Despesas() {

  const [despesas, setDespesas] =
    useState<Despesa[]>([])

  const [funcionarios, setFuncionarios] =
    useState<Funcionario[]>([])

  const [imagem, setImagem] =
    useState<File | null>(null)

  const [loading, setLoading] =
    useState(false)

  const [form, setForm] = useState({

    funcionario: '',

    cliente: '',

    finalidade: '',

    data_inicio: '',

    data_fim: '',

    data_cupom: '',

    categoria: 'Refeição',

    descricao: '',

    valor: '',
  })

  useEffect(() => {

    carregarFuncionarios()

  }, [])

  useEffect(() => {

    if (!form.funcionario) {

      setDespesas([])

      return
    }

    carregarDespesas()

  }, [
    form.funcionario,
    form.data_inicio,
    form.data_fim
  ])

  async function carregarFuncionarios() {

    try {

      const {
        data,
        error
      } = await supabase

        .from('UsuariosInternos')

        .select('*')

        .order('nome')

      if (error) {

        console.error(error)

        return
      }

      setFuncionarios(
        Array.isArray(data)
          ? data
          : []
      )

    } catch (error) {

      console.error(
        'Erro funcionários:',
        error
      )
    }
  }

  async function carregarDespesas() {

    try {

      if (!form.funcionario) {

        setDespesas([])

        return
      }

      let query = supabase

        .from('ControleDespesas')

        .select('*')

        .eq(
          'funcionario',
          form.funcionario
        )

      // FILTRO DATA INICIAL

      if (form.data_inicio) {

        query = query.gte(
          'data_cupom',
          form.data_inicio
        )
      }

      // FILTRO DATA FINAL

      if (form.data_fim) {

        query = query.lte(
          'data_cupom',
          form.data_fim
        )
      }

      const {
        data,
        error
      } = await query.order(
        'data_cupom',
        {
          ascending: true
        }
      )

      if (error) {

        console.error(error)

        return
      }

      setDespesas(
        Array.isArray(data)
          ? data
          : []
      )

    } catch (error) {

      console.error(
        'Erro despesas:',
        error
      )
    }
  }

  function alterarCampo(
    campo: string,
    valor: string
  ) {

    setForm((prev) => ({
      ...prev,
      [campo]: valor
    }))
  }

  // CORREÇÃO TIMEZONE

  function formatarData(
    data?: string
  ) {

    if (!data) {

      return '-'
    }

    const partes =
      data.split('-')

    if (partes.length !== 3) {

      return data
    }

    return `
      ${partes[2]}/
      ${partes[1]}/
      ${partes[0]}
    `
      .replace(/\s/g, '')
  }

  function formatarMoeda(
    valor: number
  ) {

    return new Intl.NumberFormat(
      'pt-BR',
      {
        style: 'currency',
        currency: 'BRL'
      }
    ).format(valor || 0)
  }

  async function salvar() {

    try {

      if (
        !form.funcionario ||
        !form.data_cupom ||
        !form.valor
      ) {

        alert(
          'Preencha os campos obrigatórios.'
        )

        return
      }

      setLoading(true)

      const {
        data: { user }
      } = await supabase.auth.getUser()

      let comprovanteUrl = ''

      if (imagem) {

        const url =
          await uploadComprovante(
            imagem
          )

        comprovanteUrl =
          url || ''
      }

      const payload = {

        usuario_id:
          user?.id,

        funcionario:
          form.funcionario,

        cliente:
          form.cliente,

        finalidade:
          form.finalidade,

        data_cupom:
          form.data_cupom,

        categoria:
          form.categoria,

        descricao:
          form.descricao,

        valor:
          Number(form.valor),

        comprovante_url:
          comprovanteUrl
      }

      await salvarDespesa(
        payload
      )

      alert(
        'Despesa salva!'
      )

      limparFormulario()

      await carregarDespesas()

    } catch (error) {

      console.error(error)

      alert(
        'Erro ao salvar'
      )

    } finally {

      setLoading(false)
    }
  }

  async function excluir(
    id: number
  ) {

    try {

      const confirmar =
        confirm(
          'Excluir despesa?'
        )

      if (!confirmar) {

        return
      }

      await removerDespesa(id)

      await carregarDespesas()

    } catch (error) {

      console.error(error)

      alert(
        'Erro ao excluir'
      )
    }
  }

  async function gerarPDF() {

    try {

      if (
        despesas.length === 0
      ) {

        alert(
          'Nenhuma despesa encontrada'
        )

        return
      }

      await gerarPDFDespesas({

        despesas,

        funcionario:
          form.funcionario,

        cliente:
          form.cliente,

        finalidade:
          form.finalidade,

        dataInicio:
          form.data_inicio,

        dataFim:
          form.data_fim
      })

    } catch (error) {

      console.error(error)

      alert(
        'Erro ao gerar PDF'
      )
    }
  }

  function limparFormulario() {

    setForm((prev) => ({

      ...prev,

      data_cupom: '',

      categoria: 'Refeição',

      descricao: '',

      valor: ''
    }))

    setImagem(null)
  }

  const total =
    (despesas || []).reduce(
      (acc, item) =>
        acc +
        Number(
          item.valor || 0
        ),
      0
    )

  return (

    <div className="page-despesas">

      <div className="container-despesas">

        <h1>
          Controle de Despesas
        </h1>

        {/* FILTROS */}

        <div className="form-grid">

          <div className="field">

            <label>
              Funcionário
            </label>

            <select
              value={form.funcionario}
              onChange={(e) =>
                alterarCampo(
                  'funcionario',
                  e.target.value
                )
              }
            >

              <option value="">
                Selecione
              </option>

              {funcionarios.map(
                (item) => (

                  <option
                    key={item.id}
                    value={item.nome}
                  >
                    {item.nome}
                  </option>

                )
              )}

            </select>

          </div>

          <div className="field">

            <label>
              Período Inicial
            </label>

            <input
              type="date"
              value={form.data_inicio}
              onChange={(e) =>
                alterarCampo(
                  'data_inicio',
                  e.target.value
                )
              }
            />

          </div>

          <div className="field">

            <label>
              Período Final
            </label>

            <input
              type="date"
              value={form.data_fim}
              onChange={(e) =>
                alterarCampo(
                  'data_fim',
                  e.target.value
                )
              }
            />

          </div>

        </div>

        <br />

        {/* CADASTRO */}

        <div className="form-grid">

          <div className="field">

            <label>
              Cliente
            </label>

            <input
              value={form.cliente}
              onChange={(e) =>
                alterarCampo(
                  'cliente',
                  e.target.value
                )
              }
            />

          </div>

          <div className="field">

            <label>
              Finalidade
            </label>

            <input
              value={form.finalidade}
              onChange={(e) =>
                alterarCampo(
                  'finalidade',
                  e.target.value
                )
              }
            />

          </div>

          <div className="field">

            <label>
              Data Cupom
            </label>

            <input
              type="date"
              value={form.data_cupom}
              onChange={(e) =>
                alterarCampo(
                  'data_cupom',
                  e.target.value
                )
              }
            />

          </div>

          <div className="field">

            <label>
              Categoria
            </label>

            <select
              value={form.categoria}
              onChange={(e) =>
                alterarCampo(
                  'categoria',
                  e.target.value
                )
              }
            >

              <option>
                Refeição
              </option>

              <option>
                Passagem
              </option>

              <option>
                Hotel
              </option>

              <option>
                Despesa Veículo
              </option>

              <option>
                Outros
              </option>

            </select>

          </div>

          <div className="field">

            <label>
              Valor
            </label>

            <input
              type="number"
              step="0.01"
              value={form.valor}
              onChange={(e) =>
                alterarCampo(
                  'valor',
                  e.target.value
                )
              }
            />

          </div>

          <div className="field field-full">

            <label>
              Descrição
            </label>

            <input
              value={form.descricao}
              onChange={(e) =>
                alterarCampo(
                  'descricao',
                  e.target.value
                )
              }
            />

          </div>

          <div className="field">

            <label>
              Comprovante
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setImagem(
                  e.target.files?.[0]
                  || null
                )
              }
            />

          </div>

        </div>

        {/* BOTÕES */}

        <div className="actions">

          <button
            className="btn btn-primary"
            onClick={salvar}
            disabled={loading}
          >

            {loading
              ? 'Salvando...'
              : 'Salvar Despesa'}

          </button>

          <button
            className="btn btn-primary"
            onClick={gerarPDF}
          >
            Gerar Relatório PDF
          </button>

        </div>

        {/* RESUMO */}

        <div className="resumo-filtro">

          <strong>
            Funcionário:
          </strong>

          {' '}
          {form.funcionario || '-'}

          {' | '}

          <strong>
            Período:
          </strong>

          {' '}

          {form.data_inicio
            ? formatarData(form.data_inicio)
            : '-'}

          {' até '}

          {form.data_fim
            ? formatarData(form.data_fim)
            : '-'}

        </div>

        {/* TABELA */}

        {despesas.length === 0 ? (

          <p>
            Nenhuma despesa encontrada.
          </p>

        ) : (

          <table className="table">

            <thead>

              <tr>

                <th>
                  Data
                </th>

                <th>
                  Categoria
                </th>

                <th>
                  Cliente
                </th>

                <th>
                  Finalidade
                </th>

                <th>
                  Descrição
                </th>

                <th>
                  Valor
                </th>

                <th>
                  Comprovante
                </th>

                <th>
                  Ação
                </th>

              </tr>

            </thead>

            <tbody>

              {despesas.map(
                (item) => (

                  <tr key={item.id}>

                    <td>
                      {formatarData(
                        item.data_cupom
                      )}
                    </td>

                    <td>
                      {item.categoria}
                    </td>

                    <td>
                      {item.cliente}
                    </td>

                    <td>
                      {item.finalidade}
                    </td>

                    <td>
                      {item.descricao}
                    </td>

                    <td>
                      {formatarMoeda(
                        Number(
                          item.valor
                        )
                      )}
                    </td>

                    <td>

                      {item.comprovante_url ? (

                        <img
                          src={
                            item.comprovante_url
                          }
                          alt="Comprovante"
                          className="comprovante-img"
                        />

                      ) : (

                        'Sem imagem'

                      )}

                    </td>

                    <td>

                      <button
                        className="btn btn-danger"
                        onClick={() =>
                          excluir(item.id)
                        }
                      >
                        Excluir
                      </button>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        )}

        {/* TOTAL */}

        <div className="total">

          Total:
          {' '}
          {formatarMoeda(total)}

        </div>

      </div>

    </div>
  )
}