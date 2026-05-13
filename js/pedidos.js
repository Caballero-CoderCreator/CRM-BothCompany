let todosPedidos = []
let filtroActivo = 'todos'
let textoBusqueda = ''

const ESTADOS_PED = ['pendiente', 'en_produccion', 'listo', 'entregado', 'pagado']
const ETIQUETAS_PED = {
  pendiente: 'Pendiente',
  en_produccion: 'En producción',
  listo: 'Listo',
  entregado: 'Entregado',
  pagado: 'Pagado'
}

function formatFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function cargarPedidos() {
  const { data, error } = await db
    .from('pedidos')
    .select('*, clientes(nombre, empresa)')
    .order('created_at', { ascending: false })

  if (error) { console.error(error); return }
  todosPedidos = data
  renderizarStats()
  renderizarPedidos()
}

function renderizarStats() {
  const contar = estado => todosPedidos.filter(p => p.estado === estado).length
  document.getElementById('stat-pendientes').textContent   = contar('pendiente')
  document.getElementById('stat-en-produccion').textContent = contar('en_produccion')
  document.getElementById('stat-listos').textContent       = contar('listo')
  document.getElementById('stat-completados').textContent  =
    contar('entregado') + contar('pagado')
}

function renderizarPedidos() {
  let lista = filtroActivo === 'todos'
    ? todosPedidos
    : todosPedidos.filter(p => p.estado === filtroActivo)

  if (textoBusqueda.trim()) {
    const q = textoBusqueda.toLowerCase()
    lista = lista.filter(p =>
      (p.numero || '').toLowerCase().includes(q) ||
      (p.clientes?.nombre || '').toLowerCase().includes(q) ||
      (p.clientes?.empresa || '').toLowerCase().includes(q)
    )
  }

  const tbody = document.getElementById('tabla-pedidos')
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>No hay pedidos en este estado.</p></td></tr>'
    return
  }
  tbody.innerHTML = lista.map(p => `
    <tr>
      <td><strong>${p.numero}</strong></td>
      <td>${p.clientes?.nombre || '—'}<br><small style="color:#718096">${p.clientes?.empresa || ''}</small></td>
      <td style="white-space:nowrap;color:#718096;font-size:13px">${formatFecha(p.created_at)}</td>
      <td>$${Number(p.total).toFixed(2)}</td>
      <td><span class="badge badge-${p.estado}">${ETIQUETAS_PED[p.estado] || p.estado}</span></td>
      <td>
        ${p.estado === 'pagado'
          ? `<span style="font-size:12px;color:#718096;font-style:italic">Completado</span>`
          : `<select class="btn btn-secondary btn-sm" onchange="cambiarEstadoPedido('${p.id}', this.value)">
              ${ESTADOS_PED.map(e => `<option value="${e}" ${p.estado === e ? 'selected' : ''}>${ETIQUETAS_PED[e]}</option>`).join('')}
            </select>`
        }
      </td>
    </tr>
  `).join('')
}

function buscarPedidos(texto) {
  textoBusqueda = texto
  renderizarPedidos()
}

function aplicarFiltroPedido(estado) {
  filtroActivo = estado
  document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.estado === estado)
  })
  renderizarPedidos()
}

async function cambiarEstadoPedido(id, nuevoEstado) {
  const { error } = await db
    .from('pedidos')
    .update({ estado: nuevoEstado })
    .eq('id', id)

  if (error) { alert('Error al cambiar estado: ' + error.message); return }
  await cargarPedidos()
}
