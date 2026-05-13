let todasLasCotizaciones = []
let filtroActivo = 'todas'

const ESTADOS_COT = ['borrador', 'enviada', 'aprobada', 'rechazada']
const ETIQUETAS_COT = {
  borrador: 'Borrador', enviada: 'Enviada', aprobada: 'Aprobada', rechazada: 'Rechazada'
}

async function cargarCotizaciones() {
  const { data, error } = await db
    .from('cotizaciones')
    .select('*, clientes(nombre, empresa)')
    .order('created_at', { ascending: false })

  if (error) { console.error(error); return }
  todasLasCotizaciones = data
  renderizarCotizaciones()
}

function renderizarCotizaciones() {
  const lista = filtroActivo === 'todas'
    ? todasLasCotizaciones
    : todasLasCotizaciones.filter(c => c.estado === filtroActivo)

  const tbody = document.getElementById('tabla-cotizaciones')
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><p>No hay cotizaciones en este estado.</p></td></tr>'
    return
  }
  tbody.innerHTML = lista.map(c => `
    <tr>
      <td><strong>${c.numero}</strong></td>
      <td>${c.clientes?.nombre || '—'}<br><small style="color:#718096">${c.clientes?.empresa || ''}</small></td>
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
