let todosPedidos  = []
let todosPagos    = []
let filtroActivo  = 'todos'
let textoBusqueda = ''
let pedidoSeleccionado = null
let chartDonut = null
let chartLinea  = null

// ── CARGA ──
async function cargarPagos() {
  const [
    { data: pedidos },
    { data: pagos }
  ] = await Promise.all([
    db.from('pedidos').select('*, clientes(nombre, empresa)').order('created_at', { ascending: false }),
    db.from('pagos').select('*')
  ])

  todosPedidos = pedidos || []
  todosPagos   = pagos   || []
  renderStats()
  renderGraficos()
  renderTabla()
}

// ── CÁLCULOS ──
function pagadoDe(pedidoId) {
  return todosPagos
    .filter(p => p.pedido_id === pedidoId)
    .reduce((s, p) => s + Number(p.monto || 0), 0)
}

function estadoPago(pedido) {
  const pagado = pagadoDe(pedido.id)
  const total  = Number(pedido.total || 0)
  if (pagado <= 0)      return 'sin_pagar'
  if (pagado >= total)  return 'pagado'
  return 'abonado'
}

// ── STATS ──
function renderStats() {
  const totalRecibido = todosPagos.reduce((s, p) => s + Number(p.monto || 0), 0)
  const totalPendiente = todosPedidos.reduce((s, ped) => {
    const saldo = Number(ped.total || 0) - pagadoDe(ped.id)
    return s + Math.max(0, saldo)
  }, 0)
  const pedidosPagados = todosPedidos.filter(p => estadoPago(p) === 'pagado').length

  document.getElementById('stat-recibido').textContent = '$' + totalRecibido.toFixed(2)
  document.getElementById('stat-pendiente').textContent = '$' + totalPendiente.toFixed(2)
  document.getElementById('stat-pagados').textContent   = pedidosPagados
  document.getElementById('stat-sinpagar').textContent  =
    todosPedidos.filter(p => estadoPago(p) === 'sin_pagar').length
}

// ── TABLA ──
const LABEL_ESTADO = { sin_pagar: 'Sin pagar', abonado: 'Abonado', pagado: 'Pagado' }

function renderTabla() {
  let lista = todosPedidos

  if (filtroActivo !== 'todos') {
    lista = lista.filter(p => estadoPago(p) === filtroActivo)
  }

  if (textoBusqueda.trim()) {
    const q = textoBusqueda.toLowerCase()
    lista = lista.filter(p =>
      (p.numero || '').toLowerCase().includes(q) ||
      (p.clientes?.nombre || '').toLowerCase().includes(q) ||
      (p.clientes?.empresa || '').toLowerCase().includes(q)
    )
  }

  const tbody = document.getElementById('tabla-pagos')
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><p>No hay pedidos en este estado.</p></td></tr>'
    return
  }

  tbody.innerHTML = lista.map(ped => {
    const total   = Number(ped.total || 0)
    const pagado  = pagadoDe(ped.id)
    const saldo   = total - pagado
    const estado  = estadoPago(ped)
    const pagosDelPed = todosPagos.filter(p => p.pedido_id === ped.id)

    return `
      <tr>
        <td>
          <strong>${ped.numero}</strong>
          ${pagosDelPed.length > 0 ? `
            <div style="margin-top:4px;display:flex;flex-direction:column;gap:2px">
              ${pagosDelPed.map(p => `
                <span style="font-size:11px;color:#718096">
                  ${formatFecha(p.created_at)} · ${LABEL_TIPO[p.tipo] || p.tipo} · $${Number(p.monto).toFixed(2)}
                  ${p.metodo ? `· ${LABEL_METODO[p.metodo] || p.metodo}` : ''}
                </span>`).join('')}
            </div>` : ''}
        </td>
        <td>${ped.clientes?.nombre || '—'}<br>
          <small style="color:#718096">${ped.clientes?.empresa || ''}</small>
        </td>
        <td style="font-weight:600">$${total.toFixed(2)}</td>
        <td style="color:#22543d;font-weight:600">$${pagado.toFixed(2)}</td>
        <td style="color:${saldo > 0 ? '#c53030' : '#718096'};font-weight:${saldo > 0 ? '700' : '400'}">
          ${saldo > 0 ? '$' + saldo.toFixed(2) : '—'}
        </td>
        <td><span class="badge-pago badge-pago-${estado}">${LABEL_ESTADO[estado]}</span></td>
        <td>
          ${estado !== 'pagado'
            ? `<button class="btn btn-primary btn-sm" onclick="abrirModalPago('${ped.id}')">+ Registrar pago</button>`
            : `<span style="font-size:12px;color:#22543d;font-weight:600">✓ Saldado</span>`
          }
        </td>
      </tr>`
  }).join('')
}

function buscarPagos(texto) {
  textoBusqueda = texto
  renderTabla()
}

function aplicarFiltro(f) {
  filtroActivo = f
  document.querySelectorAll('.filtro-btn').forEach(b => b.classList.toggle('active', b.dataset.f === f))
  renderTabla()
}

// ── MODAL REGISTRAR PAGO ──
const LABEL_TIPO   = { anticipo: 'Anticipo', abono: 'Abono', pago_final: 'Pago final' }
const LABEL_METODO = { efectivo: 'Efectivo', transferencia: 'Transferencia', cheque: 'Cheque', tarjeta: 'Tarjeta' }

function abrirModalPago(pedidoId) {
  pedidoSeleccionado = todosPedidos.find(p => p.id === pedidoId)
  if (!pedidoSeleccionado) return

  const pagado  = pagadoDe(pedidoId)
  const saldo   = Number(pedidoSeleccionado.total || 0) - pagado

  document.getElementById('modal-ped-info').innerHTML =
    `<strong>${pedidoSeleccionado.numero}</strong> · ${pedidoSeleccionado.clientes?.nombre || ''} ·
     Total: <strong>$${Number(pedidoSeleccionado.total).toFixed(2)}</strong> ·
     Saldo: <strong style="color:#c53030">$${saldo.toFixed(2)}</strong>`

  document.getElementById('pago-monto').value     = saldo > 0 ? saldo.toFixed(2) : ''
  document.getElementById('pago-tipo').value      = pagado > 0 ? 'pago_final' : 'anticipo'
  document.getElementById('pago-metodo').value    = 'transferencia'
  document.getElementById('pago-referencia').value = ''
  document.getElementById('pago-notas').value      = ''

  document.getElementById('modal-pago').classList.add('visible')
  document.getElementById('pago-monto').focus()
}

function cerrarModalPago() {
  document.getElementById('modal-pago').classList.remove('visible')
  pedidoSeleccionado = null
}

async function guardarPago() {
  if (!pedidoSeleccionado) return

  const monto = parseFloat(document.getElementById('pago-monto').value)
  if (!monto || monto <= 0) { alert('El monto debe ser mayor a cero'); return }

  const datos = {
    pedido_id:  pedidoSeleccionado.id,
    cliente_id: pedidoSeleccionado.cliente_id,
    tipo:       document.getElementById('pago-tipo').value,
    monto:      monto,
    metodo:     document.getElementById('pago-metodo').value,
    referencia: document.getElementById('pago-referencia').value.trim(),
    notas:      document.getElementById('pago-notas').value.trim()
  }

  const btn = document.getElementById('btn-guardar-pago')
  btn.disabled = true; btn.textContent = 'Guardando...'

  const { error } = await db.from('pagos').insert(datos)
  btn.disabled = false; btn.textContent = 'Registrar pago'

  if (error) { alert('Error: ' + error.message); return }
  cerrarModalPago()
  await cargarPagos()
}

// ── GRÁFICOS ──
function agruparPorMes(n = 6) {
  const now = new Date()
  const etiquetas = [], valores = []
  for (let i = n - 1; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    etiquetas.push(d.toLocaleDateString('es-SV', { month: 'short', year: '2-digit' }))
    valores.push(
      todosPagos
        .filter(p => {
          const pd = new Date(p.created_at)
          return `${pd.getFullYear()}-${String(pd.getMonth() + 1).padStart(2, '0')}` === key
        })
        .reduce((s, p) => s + Number(p.monto || 0), 0)
    )
  }
  return { etiquetas, valores }
}

function tendenciaLineal(vals) {
  const n = vals.length
  if (n < 2) return vals.slice()
  const xMed = (n - 1) / 2
  const yMed = vals.reduce((s, v) => s + v, 0) / n
  let num = 0, den = 0
  vals.forEach((y, x) => { num += (x - xMed) * (y - yMed); den += (x - xMed) ** 2 })
  const m = den ? num / den : 0
  const b = yMed - m * xMed
  return vals.map((_, x) => Math.max(0, +(m * x + b).toFixed(2)))
}

function renderGraficos() {
  // ── DONUT ──
  const cobrado   = todosPagos.reduce((s, p) => s + Number(p.monto || 0), 0)
  const pendiente = todosPedidos.reduce((s, ped) => {
    return s + Math.max(0, Number(ped.total || 0) - pagadoDe(ped.id))
  }, 0)

  const ctxD = document.getElementById('chart-donut').getContext('2d')
  if (chartDonut) chartDonut.destroy()
  chartDonut = new Chart(ctxD, {
    type: 'doughnut',
    data: {
      labels: ['Cobrado', 'Por cobrar'],
      datasets: [{
        data: [cobrado, pendiente],
        backgroundColor: ['rgba(39,103,73,.15)', 'rgba(197,48,48,.12)'],
        borderColor:     ['#276749', '#c53030'],
        borderWidth: 2,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 14 } },
        tooltip: {
          callbacks: { label: ctx => ` $${Number(ctx.raw).toFixed(2)}` }
        }
      }
    }
  })

  // ── LÍNEA + TENDENCIA ──
  const { etiquetas, valores } = agruparPorMes(6)
  const tendencia = tendenciaLineal(valores)

  const ctxL = document.getElementById('chart-linea').getContext('2d')
  if (chartLinea) chartLinea.destroy()
  chartLinea = new Chart(ctxL, {
    type: 'line',
    data: {
      labels: etiquetas,
      datasets: [
        {
          label: 'Cobrado ($)',
          data: valores,
          borderColor: '#C4923A',
          backgroundColor: 'rgba(196,146,58,.08)',
          borderWidth: 2.5,
          pointBackgroundColor: '#C4923A',
          pointRadius: 5,
          tension: 0.4,
          fill: true
        },
        {
          label: 'Tendencia',
          data: tendencia,
          borderColor: '#9ca3af',
          borderWidth: 1.5,
          borderDash: [6, 4],
          pointRadius: 0,
          tension: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 14 } },
        tooltip: {
          callbacks: { label: ctx => ` $${Number(ctx.raw).toFixed(2)}` }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 12 } } },
        y: {
          beginAtZero: true,
          grid: { color: '#f3f4f6' },
          ticks: { font: { size: 12 }, callback: v => '$' + v }
        }
      }
    }
  })
}

// ── UTILS ──
function formatFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' })
}
