let todosPedidos = []
let filtroActivo = 'todos'
let textoBusqueda = ''
let modalNotaId = null

const ESTADOS_PED = ['pendiente', 'en_produccion', 'listo', 'entregado', 'pagado']
const ETIQUETAS_PED = {
  pendiente: 'Pendiente', en_produccion: 'En producción',
  listo: 'Listo', entregado: 'Entregado', pagado: 'Pagado'
}

function formatFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function cargarPedidos() {
  const { data, error } = await db
    .from('pedidos').select('*, clientes(nombre, empresa)')
    .order('created_at', { ascending: false })

  if (error) { console.error(error); return }
  todosPedidos = data
  renderizarStats()
  renderizarPedidos()
}

function renderizarStats() {
  const contar = estado => todosPedidos.filter(p => p.estado === estado).length
  document.getElementById('stat-pendientes').textContent    = contar('pendiente')
  document.getElementById('stat-en-produccion').textContent = contar('en_produccion')
  document.getElementById('stat-listos').textContent        = contar('listo')
  document.getElementById('stat-completados').textContent   = contar('entregado') + contar('pagado')

  const nEliminados = contar('eliminado')
  const badge = document.getElementById('stat-papelera-ped')
  if (badge) badge.textContent = nEliminados > 0 ? nEliminados : ''
}

function renderizarPedidos() {
  const esPapelera = filtroActivo === 'papelera'

  let lista = esPapelera
    ? todosPedidos.filter(p => p.estado === 'eliminado')
    : filtroActivo === 'todos'
      ? todosPedidos.filter(p => p.estado !== 'eliminado')
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
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><p>No hay pedidos en este estado.</p></td></tr>'
    return
  }
  tbody.innerHTML = lista.map(p => {
    if (esPapelera) {
      return `
      <tr style="opacity:.8">
        <td><strong>${p.numero}</strong></td>
        <td>${p.clientes?.nombre || '—'}<br><small style="color:#718096">${p.clientes?.empresa || ''}</small></td>
        <td style="white-space:nowrap;color:#718096;font-size:13px">${formatFecha(p.created_at)}</td>
        <td>$${Number(p.total).toFixed(2)}</td>
        <td colspan="4" style="white-space:nowrap">
          <span class="badge" style="background:#f3f4f6;color:#6b7280;margin-right:8px">Eliminado</span>
          <button class="btn btn-secondary btn-sm" onclick="restaurarPedido('${p.id}', '${p.numero}')">
            ↩️ Restaurar
          </button>
        </td>
      </tr>`
    }
    return `
    <tr>
      <td>
        <strong>${p.numero}</strong>
        ${p.notas ? `<div style="font-size:11px;color:#9ca3af;margin-top:2px;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.notas}</div>` : ''}
      </td>
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
      <td>
        <button class="btn btn-secondary btn-sm" onclick="editarNota('${p.id}')" title="Ver/editar nota">📝</button>
      </td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="eliminarPedido('${p.id}', '${p.numero}')" title="Mover a papelera" style="color:#ef4444">🗑️</button>
      </td>
    </tr>`
  }).join('')
}

function buscarPedidos(texto) { textoBusqueda = texto; renderizarPedidos() }

function aplicarFiltroPedido(estado) {
  filtroActivo = estado
  document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.estado === estado)
  })
  renderizarPedidos()
}

async function cambiarEstadoPedido(id, nuevoEstado) {
  const { error } = await db.from('pedidos').update({ estado: nuevoEstado }).eq('id', id)
  if (error) { alert('Error al cambiar estado: ' + error.message); return }
  await cargarPedidos()
}

// ── NOTAS ──
function editarNota(id) {
  modalNotaId = id
  const ped = todosPedidos.find(p => p.id === id)
  document.getElementById('nota-texto').value = ped?.notas || ''
  document.getElementById('nota-ref').textContent = ped?.numero || ''
  document.getElementById('modal-nota').classList.add('visible')
  document.getElementById('nota-texto').focus()
}

function cerrarModalNota() {
  document.getElementById('modal-nota').classList.remove('visible')
  modalNotaId = null
}

async function guardarNota() {
  if (!modalNotaId) return
  const texto = document.getElementById('nota-texto').value.trim()
  const btn = document.getElementById('btn-guardar-nota')
  btn.disabled = true; btn.textContent = 'Guardando...'

  const { error } = await db.from('pedidos').update({ notas: texto }).eq('id', modalNotaId)
  btn.disabled = false; btn.textContent = 'Guardar'

  if (error) { alert('Error: ' + error.message); return }
  cerrarModalNota()
  await cargarPedidos()
}

// ── ELIMINAR / RESTAURAR PEDIDO ──
async function eliminarPedido(id, numero) {
  if (!confirm(`¿Mover el pedido ${numero} a la papelera?\n\nPodrás restaurarlo desde la papelera si fue un error.`)) return

  const { error } = await db.from('pedidos').update({ estado: 'eliminado' }).eq('id', id)
  if (error) { alert('Error al eliminar: ' + error.message); return }

  await cargarPedidos()
}

async function restaurarPedido(id, numero) {
  const { error } = await db.from('pedidos').update({ estado: 'pendiente' }).eq('id', id)
  if (error) { alert('Error al restaurar: ' + error.message); return }
  await cargarPedidos()
}

// ── EXPORTAR CSV ──
function exportarCSV() {
  const lista = filtroActivo === 'todos'
    ? todosPedidos.filter(p => p.estado !== 'eliminado')
    : todosPedidos.filter(p => p.estado === filtroActivo)

  const filas = lista.map(p => [
    p.numero,
    p.clientes?.nombre || '',
    p.clientes?.empresa || '',
    new Date(p.created_at).toLocaleDateString('es-SV'),
    Number(p.total).toFixed(2),
    ETIQUETAS_PED[p.estado] || p.estado,
    p.notas || ''
  ])

  const csv = [
    ['Número', 'Cliente', 'Empresa', 'Fecha', 'Total', 'Estado', 'Notas'],
    ...filas
  ].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `pedidos_${new Date().toISOString().slice(0,10)}.csv`; a.click()
  URL.revokeObjectURL(url)
}
