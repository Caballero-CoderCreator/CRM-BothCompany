let todasLasCotizaciones = []
let filtroActivo = 'todas'
let textoBusqueda = ''

const ESTADOS_COT = ['borrador', 'enviada', 'aprobada', 'rechazada']
const ETIQUETAS_COT = {
  borrador: 'Borrador', enviada: 'Enviada', aprobada: 'Aprobada', rechazada: 'Rechazada'
}

function formatFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function cargarCotizaciones() {
  const { data, error } = await db
    .from('cotizaciones')
    .select('*, clientes(nombre, empresa)')
    .order('created_at', { ascending: false })

  if (error) { console.error(error); return }
  todasLasCotizaciones = data
  renderizarStats()
  renderizarCotizaciones()
}

function renderizarStats() {
  const contar = estado => todasLasCotizaciones.filter(c => c.estado === estado).length
  document.getElementById('stat-borrador').textContent  = contar('borrador')
  document.getElementById('stat-enviada').textContent   = contar('enviada')
  document.getElementById('stat-aprobada').textContent  = contar('aprobada')
  document.getElementById('stat-rechazada').textContent = contar('rechazada')
}

function renderizarCotizaciones() {
  let lista = filtroActivo === 'todas'
    ? todasLasCotizaciones
    : todasLasCotizaciones.filter(c => c.estado === filtroActivo)

  if (textoBusqueda.trim()) {
    const q = textoBusqueda.toLowerCase()
    lista = lista.filter(c =>
      (c.numero || '').toLowerCase().includes(q) ||
      (c.clientes?.nombre || '').toLowerCase().includes(q) ||
      (c.clientes?.empresa || '').toLowerCase().includes(q)
    )
  }

  const tbody = document.getElementById('tabla-cotizaciones')
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>No hay cotizaciones en este estado.</p></td></tr>'
    return
  }
  tbody.innerHTML = lista.map(c => `
    <tr>
      <td><strong>${c.numero}</strong></td>
      <td>${c.clientes?.nombre || '—'}<br><small style="color:#718096">${c.clientes?.empresa || ''}</small></td>
      <td style="white-space:nowrap;color:#718096;font-size:13px">${formatFecha(c.created_at)}</td>
      <td>$${Number(c.total).toFixed(2)}</td>
      <td><span class="badge badge-${c.estado}">${ETIQUETAS_COT[c.estado] || c.estado}</span></td>
      <td>
        ${c.estado === 'aprobada' || c.estado === 'rechazada'
          ? `<span style="font-size:12px;color:#718096;font-style:italic">Estado final</span>`
          : `<select class="btn btn-secondary btn-sm" onchange="cambiarEstado('${c.id}', this.value, '${c.estado}')">
              ${ESTADOS_COT.filter(e => e !== 'aprobada' || c.estado !== 'rechazada')
                .map(e => `<option value="${e}" ${c.estado === e ? 'selected' : ''}>${ETIQUETAS_COT[e]}</option>`)
                .join('')}
            </select>`
        }
      </td>
    </tr>
  `).join('')
}

function buscarCotizaciones(texto) {
  textoBusqueda = texto
  renderizarCotizaciones()
}

function aplicarFiltro(estado) {
  filtroActivo = estado
  document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.estado === estado)
  })
  renderizarCotizaciones()
}

async function cambiarEstado(id, nuevoEstado, estadoActual) {
  if (nuevoEstado === estadoActual) return

  const cotizacion = todasLasCotizaciones.find(c => c.id === id)
  if (!cotizacion) return

  const { error } = await db
    .from('cotizaciones')
    .update({ estado: nuevoEstado })
    .eq('id', id)

  if (error) { alert('Error al cambiar estado: ' + error.message); return }

  if (nuevoEstado === 'aprobada') {
    const numeroPedido = 'PED-' + cotizacion.numero.replace(/^#/, '')
    const { error: errPedido } = await db.from('pedidos').insert({
      cotizacion_id: id,
      cliente_id: cotizacion.cliente_id,
      numero: numeroPedido,
      estado: 'pendiente',
      total: cotizacion.total,
      notas: cotizacion.notas || ''
    })
    if (errPedido) {
      console.error('Error creando pedido:', errPedido)
    } else {
      alert(`Cotización aprobada.\nSe creó el pedido ${numeroPedido} automáticamente en la sección Pedidos.`)
    }
  }

  await cargarCotizaciones()
}
