import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const CORES = {
  primaria: [15, 23, 42],
  secundaria: [248, 250, 252],
  borda: [220, 220, 220],
  textoCinza: [120, 120, 120]
}

function formatarData(
  data: string
) {

  if (!data) return ''

  return new Date(data)
    .toLocaleDateString('pt-BR')
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
  ).format(valor)
}

async function carregarImagemBase64(
  url: string
): Promise<string> {

  const response = await fetch(url)

  const blob = await response.blob()

  return new Promise((resolve) => {

    const reader = new FileReader()

    reader.onloadend = () => {

      resolve(
        reader.result as string
      )
    }

    reader.readAsDataURL(blob)
  })
}

function calcularProporcaoImagem(
  larguraOriginal: number,
  alturaOriginal: number,
  larguraMax: number,
  alturaMax: number
) {

  let largura = larguraOriginal

  let altura = alturaOriginal

  const proporcao =
    largura / altura

  if (largura > larguraMax) {

    largura = larguraMax

    altura = largura / proporcao
  }

  if (altura > alturaMax) {

    altura = alturaMax

    largura = altura * proporcao
  }

  return {
    largura,
    altura
  }
}

async function obterDimensoesImagem(
  base64: string
): Promise<{
  width: number
  height: number
}> {

  return new Promise((resolve) => {

    const img = new Image()

    img.onload = () => {

      resolve({
        width: img.width,
        height: img.height
      })
    }

    img.src = base64
  })
}

function adicionarHeader(
  doc: jsPDF,
  funcionario: string,
  cliente: string,
  dataInicio: string,
  dataFim: string
) {

  doc.setFillColor(
    ...CORES.primaria
  )

  doc.rect(
    0,
    0,
    220,
    42,
    'F'
  )

  doc.setTextColor(
    255,
    255,
    255
  )

  // EMPRESA

  doc.setFont(
    'helvetica',
    'bold'
  )

  doc.setFontSize(12)

  doc.text(
    'MINHA EMPRESA',
    14,
    12
  )

  // TÍTULO

  doc.setFontSize(22)

  doc.text(
    'RELATÓRIO DE DESPESAS',
    14,
    24
  )

  // INFORMAÇÕES

  doc.setFontSize(9)

  doc.setFont(
    'helvetica',
    'normal'
  )

  doc.text(
    `Funcionário: ${funcionario || '-'}`,
    14,
    32
  )

  doc.text(
    `Cliente: ${cliente || '-'}`,
    80,
    32
  )

  doc.text(
    `Período: ${formatarData(dataInicio)} até ${formatarData(dataFim)}`,
    14,
    37
  )

  doc.setTextColor(
    0,
    0,
    0
  )
}

function adicionarRodape(
  doc: jsPDF
) {

  const paginas =
    doc.getNumberOfPages()

  for (
    let i = 1;
    i <= paginas;
    i++
  ) {

    doc.setPage(i)

    doc.setDrawColor(
      ...CORES.borda
    )

    doc.line(
      14,
      285,
      195,
      285
    )

    doc.setFontSize(9)

    doc.setTextColor(
      ...CORES.textoCinza
    )

    doc.text(
      `Gerado em ${new Date()
        .toLocaleDateString('pt-BR')}`,
      14,
      291
    )

    doc.text(
      `Página ${i} de ${paginas}`,
      170,
      291
    )
  }
}

function adicionarCampoInfo(
  doc: jsPDF,
  label: string,
  valor: string,
  y: number
) {

  doc.setFont(
    'helvetica',
    'bold'
  )

  doc.text(
    label,
    20,
    y
  )

  doc.setFont(
    'helvetica',
    'normal'
  )

  const texto =
    doc.splitTextToSize(
      valor || '-',
      130
    )

  doc.text(
    texto,
    55,
    y
  )
}

export async function gerarPDFDespesas({

  despesas,

  funcionario,

  cliente,

  finalidade,

  dataInicio,

  dataFim

}: any) {

  const doc = new jsPDF()

  // TOTAL

  const total = despesas.reduce(
    (acc: number, item: any) =>
      acc + Number(item.valor),
    0
  )

  // SUBTOTAL CATEGORIAS

  const subtotalCategorias: any = {}

  despesas.forEach((item: any) => {

    if (!subtotalCategorias[item.categoria]) {

      subtotalCategorias[item.categoria] = 0
    }

    subtotalCategorias[item.categoria] +=
      Number(item.valor)
  })

  // HEADER

  adicionarHeader(
    doc,
    funcionario,
    cliente,
    dataInicio,
    dataFim
  )

  // BLOCO INFORMAÇÕES

  doc.setDrawColor(
    ...CORES.borda
  )

  doc.setFillColor(
    ...CORES.secundaria
  )

  doc.roundedRect(
    14,
    52,
    182,
    58,
    4,
    4,
    'FD'
  )

  // ORDEM INFORMAÇÕES

  adicionarCampoInfo(
    doc,
    'Período',
    `${formatarData(dataInicio)} até ${formatarData(dataFim)}`,
    64
  )

  adicionarCampoInfo(
    doc,
    'Finalidade',
    finalidade || '-',
    76
  )

  adicionarCampoInfo(
    doc,
    'Cliente',
    cliente || '-',
    88
  )

  adicionarCampoInfo(
    doc,
    'Funcionário',
    funcionario || '-',
    100
  )

  // TABELA

  autoTable(doc, {

    startY: 124,

    margin: {
      top: 45
    },

    head: [[
      'Data',
      'Categoria',
      'Descrição',
      'Valor'
    ]],

    body: despesas.map(
      (item: any) => ([

        formatarData(
          item.data_cupom
        ),

        item.categoria,

        item.descricao || '',

        formatarMoeda(
          Number(item.valor)
        )
      ])
    ),

    foot: [

      ...Object.entries(
        subtotalCategorias
      ).map(([categoria, valor]) => ([

        '',
        '',
        `Subtotal ${categoria}`,
        formatarMoeda(
          Number(valor)
        )
      ])),

      [
        '',
        '',
        'TOTAL GERAL',
        formatarMoeda(total)
      ]
    ],

    theme: 'grid',

    styles: {

      fontSize: 10,

      cellPadding: 5,

      valign: 'middle',

      overflow: 'linebreak',

      cellWidth: 'wrap',

      lineColor: [230, 230, 230],

      lineWidth: 0.2
    },

    headStyles: {

      fillColor: [30, 41, 59],

      textColor: 255,

      fontStyle: 'bold',

      fontSize: 11
    },

    footStyles: {

      fillColor: [241, 245, 249],

      textColor: 15,

      fontStyle: 'bold',

      fontSize: 10
    },

    alternateRowStyles: {

      fillColor: [248, 250, 252]
    },

    columnStyles: {

      0: {
        cellWidth: 28
      },

      1: {
        cellWidth: 40
      },

      2: {
        cellWidth: 85,
        minCellHeight: 12
      },

      3: {
        halign: 'right',
        cellWidth: 35
      }
    },

    didDrawPage: () => {

      adicionarHeader(
        doc,
        funcionario,
        cliente,
        dataInicio,
        dataFim
      )
    }
  })

  // COMPROVANTES

  const despesasComImagem =
    despesas.filter(
      (item: any) =>
        item.comprovante_url
    )

  if (
    despesasComImagem.length > 0
  ) {

    doc.addPage()

    adicionarHeader(
      doc,
      funcionario,
      cliente,
      dataInicio,
      dataFim
    )

    let posX = 15

    let posY = 55

    for (
      let i = 0;
      i < despesasComImagem.length;
      i++
    ) {

      const item =
        despesasComImagem[i]

      try {

        const imagemBase64 =
          await carregarImagemBase64(
            item.comprovante_url
          )

        const dimensoes =
          await obterDimensoesImagem(
            imagemBase64
          )

        const tamanho =
          calcularProporcaoImagem(
            dimensoes.width,
            dimensoes.height,
            80,
            80
          )

        doc.setDrawColor(220)

        doc.roundedRect(
          posX - 3,
          posY - 10,
          86,
          tamanho.altura + 22,
          2,
          2
        )

        doc.setFontSize(10)

        doc.setFont(
          'helvetica',
          'bold'
        )

        const titulo =
          `${formatarData(item.data_cupom)} - ${item.categoria}`

        doc.text(
          doc.splitTextToSize(
            titulo,
            75
          ),
          posX,
          posY - 2
        )

        doc.addImage(
          imagemBase64,
          'JPEG',
          posX,
          posY + 6,
          tamanho.largura,
          tamanho.altura
        )

        posX += 95

        if (posX > 110) {

          posX = 15

          posY += 115
        }

        if (posY > 220) {

          doc.addPage()

          adicionarHeader(
            doc,
            funcionario,
            cliente,
            dataInicio,
            dataFim
          )

          posX = 15

          posY = 55
        }

      } catch (error) {

        console.error(
          'Erro imagem:',
          error
        )
      }
    }
  }

  // RODAPÉ

  adicionarRodape(doc)

  // SALVAR PDF

  doc.save(
    `despesas-${funcionario}.pdf`
  )
}