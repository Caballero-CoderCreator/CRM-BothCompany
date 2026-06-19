let todosLosLeads = []
let filtroEstado = 'todos'

const ESTADOS = ['nuevo', 'contactado', 'cotizado', 'ganado', 'perdido']
const ESTADO_COLOR = {
  nuevo:      { bg: '#fef3c7', fg: '#92400e', label: '🆕 Nuevo' },
  contactado: { bg: '#dbeafe', fg: '#1e40af', label: '📞 Contactado' },
  cotizado:   { bg: '#e0e7ff', fg: '#3730a3', label: '📋 Cotizado' },
  ganado:     { bg: '#dcfce7', fg: '#166534', label: '✅ Ganado' },
  perdido:    { bg: '#fee2e2', fg: '#991b1b', label: '✖ Perdido' }
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, m => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]
  ))
}
function soloDigitos(t) { return String(t || '').replace(/\D/g, '') }

function fechaCorta(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-SV', { day: '2-digit', month: 'short' }) +
    ' ' + d.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })
}

async function cargarLeads() {
  const { data, error } = await db.from('leads').select('*').order('created_at', { ascending: false })
  const tbody = document.getElementById('tabla-leads')
  if (error) {
    console.error(error)
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><p>Error al cargar: ${esc(error.message)}</p></td></tr>`
    return
  }
  todosLosLeads = data || []
  actualizarContadores()
  aplicarFiltro()
}

function actualizarContadores() {
  const nuevos = todosLosLeads.filter(l => l.estado === 'nuevo').length
  const elN = document.getElementById('contador-nuevos')
  const elT = document.getElementById('contador-total')
  if (elN) elN.textContent = nuevos
  if (elT) elT.textContent = todosLosLeads.length
}

function setFiltro(estado, btn) {
  filtroEstado = estado
  document.querySelectorAll('.filtro-chip').forEach(b => b.classList.remove('active'))
  if (btn) btn.classList.add('active')
  aplicarFiltro()
}

function aplicarFiltro() {
  const termino = (document.getElementById('buscar-leads')?.value || '').toLowerCase()
  let lista = todosLosLeads
  if (filtroEstado !== 'todos') lista = lista.filter(l => l.estado === filtroEstado)
  if (termino) lista = lista.filter(l =>
    (l.nombre || '').toLowerCase().includes(termino) ||
    (l.empresa || '').toLowerCase().includes(termino) ||
    (l.telefono || '').includes(termino) ||
    (l.correo || '').toLowerCase().includes(termino) ||
    (l.mensaje || '').toLowerCase().includes(termino)
  )
  renderizar(lista)
}

function renderizar(lista) {
  const tbody = document.getElementById('tabla-leads')
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>No hay solicitudes en este filtro.</p></td></tr>'
    return
  }
  tbody.innerHTML = lista.map(l => {
    const wa = soloDigitos(l.telefono)
    const waMsg = encodeURIComponent(
      `Hola ${l.nombre || ''}, somos Both Company. Recibimos tu solicitud de cotización` +
      (l.tipo ? ` (${l.tipo})` : '') + '. ¿Cómo te podemos ayudar?'
    )
    const col = ESTADO_COLOR[l.estado] || { bg: '#fff', fg: '#000' }
    const opciones = ESTADOS.map(e =>
      `<option value="${e}" ${l.estado === e ? 'selected' : ''}>${ESTADO_COLOR[e].label}</option>`
    ).join('')
    return `
    <tr>
      <td style="white-space:nowrap;font-size:13px;color:#718096">${fechaCorta(l.created_at)}</td>
      <td>
        <strong>${esc(l.nombre)}</strong>
        ${l.tipo ? `<div style="font-size:12px;color:#3730a3;margin-top:3px">📋 ${esc(l.tipo)}</div>` : ''}
        ${l.mensaje ? `<div style="font-size:12px;color:#718096;margin-top:4px;max-width:340px">${esc(l.mensaje)}</div>` : ''}
      </td>
      <td>${esc(l.empresa) || '—'}</td>
      <td style="font-size:13px">
        ${l.telefono ? `<div>📱 ${esc(l.telefono)}</div>` : ''}
        ${l.correo ? `<a href="mailto:${esc(l.correo)}" style="color:#3b82f6">✉ ${esc(l.correo)}</a>` : ''}
        ${(!l.telefono && !l.correo) ? '—' : ''}
      </td>
      <td>
        <select onchange="cambiarEstado('${l.id}', this.value)"
          style="padding:5px 8px;border-radius:6px;border:1px solid #e2e8f0;background:${col.bg};color:${col.fg};font-weight:600;font-size:12px;cursor:pointer">
          ${opciones}
        </select>
      </td>
      <td style="white-space:nowrap">
        ${wa ? `<a href="https://wa.me/${wa}?text=${waMsg}" target="_blank" class="btn btn-secondary btn-sm" title="Escribir por WhatsApp">💬</a>` : ''}
        <button class="btn btn-primary btn-sm" onclick="convertirACliente('${l.id}')" title="Convertir en cliente">➕ Cliente</button>
        <button class="btn btn-danger btn-sm" onclick="eliminarLead('${l.id}')" title="Eliminar">🗑</button>
      </td>
    </tr>`
  }).join('')
}

async function cambiarEstado(id, estado) {
  const { error } = await db.from('leads').update({ estado }).eq('id', id)
  if (error) { alert('Error al actualizar: ' + error.message); return }
  const l = todosLosLeads.find(x => x.id === id)
  if (l) l.estado = estado
  actualizarContadores()
  aplicarFiltro()
}

async function eliminarLead(id) {
  if (!confirm('¿Eliminar esta solicitud? Esta acción no se puede deshacer.')) return
  const { error } = await db.from('leads').delete().eq('id', id)
  if (error) { alert('Error al eliminar: ' + error.message); return }
  todosLosLeads = todosLosLeads.filter(x => x.id !== id)
  actualizarContadores()
  aplicarFiltro()
}

async function convertirACliente(id) {
  const l = todosLosLeads.find(x => x.id === id)
  if (!l) return
  if (!confirm(`¿Crear un cliente a partir de "${l.nombre}" y marcar esta solicitud como Ganada?`)) return
  const { error: e1 } = await db.from('clientes').insert({
    nombre:   l.nombre,
    empresa:  l.empresa || null,
    telefono: l.telefono || null,
    email:    l.correo || null,
    fuente:   'web',
    notas:    l.mensaje ? `Solicitud web: ${l.mensaje}` : 'Convertido desde solicitud web'
  })
  if (e1) { alert('Error al crear cliente: ' + e1.message); return }
  await db.from('leads').update({ estado: 'ganado' }).eq('id', id)
  const lead = todosLosLeads.find(x => x.id === id)
  if (lead) lead.estado = 'ganado'
  actualizarContadores()
  aplicarFiltro()
  alert('✅ Cliente creado. Lo encontrarás en la pestaña Clientes.')
}

function exportarLeadsCSV() {
  const filas = todosLosLeads.map(l => [
    new Date(l.created_at).toLocaleString('es-SV'),
    l.nombre, l.empresa || '', l.telefono || '', l.correo || '',
    l.tipo || '', l.estado || '', (l.mensaje || '').replace(/\n/g, ' ')
  ])
  const csv = [
    ['Fecha', 'Nombre', 'Empresa', 'Teléfono', 'Correo', 'Tipo', 'Estado', 'Mensaje'],
    ...filas
  ].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `solicitudes_${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  URL.revokeObjectURL(url)
}
