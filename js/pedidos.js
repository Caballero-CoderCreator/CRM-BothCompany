let todosPedidos = []
let filtroActivo = 'todos'

const ESTADOS_PED = ['pendiente', 'en_produccion', 'listo', 'entregado', 'pagado']
const ETIQUETAS_PED = {
  pendiente: 'Pendiente',
  en_produccion: 'En producción',
  listo: 'Listo',
  entregado: 'Entregado',
  pagado: 'Pagado'
}

async function cargarPedidos() {
  const { data, error } = await db
    .from('pedidos')
    .select('*, clientes(nombre, empresa)')
    .order('created_at', { ascending: false })

  if (error) { console.error(error); return }
  todosPedidos = data
  renderizarPedidos()
}

function renderizarPedidos() {
  const lista = filtroActivo === 'todos'
    ? todosPedidos
    : todosPedidos.filter(p => p.estado === filtroActivo)

  const tbody = document.getElementById('tabla-pedidos')
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><p>No hay pedidos en este estado.</p></td></tr>'
    return
  }
  tbody.innerHTML = lista.map(p => `
    <tr>
      <td><strong>${p.numero}</strong></td>
      <td>${p.clientes?.nombre || '—'}<br><small style="color:#718096">${p.clientes?.empresa || ''}</small></td>
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
