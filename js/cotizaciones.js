let todasLasCotizaciones = []
let filtroActivo = 'todas'

const ESTADOS = ['borrador', 'enviada', 'aprobada', 'en_produccion', 'entregada']
const ETIQUETAS_ESTADO = {
  borrador: 'Borrador', enviada: 'Enviada', aprobada: 'Aprobada',
  en_produccion: 'En producción', entregada: 'Entregada'
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
      <td><span class="badge badge-${c.estado}">${ETIQUETAS_ESTADO[c.estado]}</span></td>
      <td>
        <select class="btn btn-secondary btn-sm" onchange="cambiarEstado('${c.id}', this.value)">
          ${ESTADOS.map(e => `<option value="${e}" ${c.estado === e ? 'selected' : ''}>${ETIQUETAS_ESTADO[e]}</option>`).join('')}
        </select>
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

async function cambiarEstado(id, nuevoEstado) {
  const { error } = await db
    .from('cotizaciones')
    .update({ estado: nuevoEstado })
    .eq('id', id)
  if (error) { alert('Error al cambiar estado'); return }
  await cargarCotizaciones()
}
