const COTIZADOR_URL = 'https://cotizador-both-company-production.up.railway.app'

let todasLasCotizaciones = []
let filtroActivo = 'todas'
let textoBusqueda = ''
let modalNotaId = null
let modalEditarId = null
let editarItems = []

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
    .not('estado', 'eq', 'eliminado')
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
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><p>No hay cotizaciones en este estado.</p></td></tr>'
    return
  }
  tbody.innerHTML = lista.map(c => {
    const puedeEditar = (c.estado === 'borrador' || c.estado === 'enviada') && c.datos
    const puedeEliminar = c.estado === 'borrador'
    return `
    <tr>
      <td>
        <strong>${c.numero}</strong>
        ${c.pdf_url ? `<div style="margin-top:3px"><a href="${c.pdf_url}" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;font-weight:500">📄 Ver PDF</a></div>` : ''}
        ${c.notas ? `<div style="font-size:11px;color:#9ca3af;margin-top:2px;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.notas}</div>` : ''}
      </td>
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
      <td>
        <button class="btn btn-secondary btn-sm" onclick="editarNota('${c.id}')" title="Ver/editar nota">📝</button>
      </td>
      <td style="white-space:nowrap">
        ${puedeEditar
          ? `<button class="btn btn-secondary btn-sm" onclick="abrirModalEditar('${c.id}')" title="Editar cotización" style="margin-right:4px">✏️ Editar</button>`
          : ''}
        ${puedeEliminar
          ? `<button class="btn btn-secondary btn-sm" onclick="eliminarCotizacion('${c.id}', '${c.numero}')" title="Eliminar borrador" style="color:#ef4444">🗑️</button>`
          : ''}
      </td>
    </tr>`
  }).join('')
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

  const { error } = await db.from('cotizaciones').update({ estado: nuevoEstado }).eq('id', id)
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

// ── ELIMINAR BORRADOR ──
async function eliminarCotizacion(id, numero) {
  if (!confirm(`¿Eliminar el borrador ${numero}?\n\nEl correlativo no se verá afectado. Esta acción no puede deshacerse.`)) return

  const { error } = await db.from('cotizaciones').update({ estado: 'eliminado' }).eq('id', id)
  if (error) { alert('Error al eliminar: ' + error.message); return }

  await cargarCotizaciones()
}

// ── NOTAS ──
function editarNota(id) {
  modalNotaId = id
  const cot = todasLasCotizaciones.find(c => c.id === id)
  document.getElementById('nota-texto').value = cot?.notas || ''
  document.getElementById('nota-ref').textContent = cot?.numero || ''
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

  const { error } = await db.from('cotizaciones').update({ notas: texto }).eq('id', modalNotaId)
  btn.disabled = false; btn.textContent = 'Guardar'

  if (error) { alert('Error: ' + error.message); return }
  cerrarModalNota()
  await cargarCotizaciones()
}

// ── EDITAR COTIZACIÓN ──
function abrirModalEditar(id) {
  const cot = todasLasCotizaciones.find(c => c.id === id)
  if (!cot || !cot.datos) { alert('Esta cotización no tiene datos editables guardados.'); return }

  modalEditarId = id
  const d = cot.datos

  document.getElementById('editar-numero').textContent = cot.numero
  document.getElementById('editar-cliente').value  = d.cliente || ''
  document.getElementById('editar-contacto').value = d.contacto || ''

  const selPago = document.getElementById('editar-forma-pago')
  selPago.value = d.formaPagoKey || ''

  const selEntrega = document.getElementById('editar-entrega')
  selEntrega.value = d.entrega || '30 días'

  document.getElementById('editar-con-iva').checked    = !!d.conIva
  document.getElementById('editar-con-banco').checked  = !!d.conBanco
  document.getElementById('editar-con-firma').checked  = !!d.conFirma

  editarItems = (d.items || []).map(i => ({ ...i }))
  renderizarItemsEditar()
  recalcularTotalesEditar()

  document.getElementById('editar-msg').textContent = ''
  document.getElementById('modal-editar').classList.add('visible')
}

function cerrarModalEditar() {
  document.getElementById('modal-editar').classList.remove('visible')
  modalEditarId = null
  editarItems = []
}

function renderizarItemsEditar() {
  const tbody = document.getElementById('editar-items-body')
  if (!editarItems.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:12px">Sin productos. Agrega una línea.</td></tr>'
    return
  }
  tbody.innerHTML = editarItems.map((item, idx) => `
    <tr>
      <td><input type="text" value="${esc(item.descripcion)}" oninput="editarItems[${idx}].descripcion=this.value" style="width:100%;min-width:140px" class="form-input-sm"></td>
      <td><input type="text" value="${esc(item.tallas)}" oninput="editarItems[${idx}].tallas=this.value" style="width:100%;min-width:80px" class="form-input-sm" placeholder="Opcional"></td>
      <td><input type="number" value="${item.cantidad}" min="1" step="1" oninput="editarItems[${idx}].cantidad=+this.value;recalcularTotalesEditar()" style="width:64px" class="form-input-sm"></td>
      <td><input type="number" value="${item.precioUnit}" min="0" step="0.01" oninput="editarItems[${idx}].precioUnit=+this.value;recalcularTotalesEditar()" style="width:80px" class="form-input-sm"></td>
      <td style="text-align:right;white-space:nowrap">$${((item.cantidad||0)*(item.precioUnit||0)).toFixed(2)}</td>
      <td style="text-align:center"><button onclick="eliminarFilaEditar(${idx})" style="background:none;border:none;cursor:pointer;color:#ef4444;font-size:16px;line-height:1" title="Eliminar línea">✕</button></td>
    </tr>`).join('')
}

function esc(s) {
  return (s || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function agregarFilaEditar() {
  editarItems.push({ descripcion: '', tallas: '', cantidad: 1, precioUnit: 0, total: 0 })
  renderizarItemsEditar()
  recalcularTotalesEditar()
}

function eliminarFilaEditar(idx) {
  editarItems.splice(idx, 1)
  renderizarItemsEditar()
  recalcularTotalesEditar()
}

function recalcularTotalesEditar() {
  const conIva = document.getElementById('editar-con-iva').checked
  const subtotal = editarItems.reduce((s, i) => s + (i.cantidad||0)*(i.precioUnit||0), 0)
  const iva      = conIva ? subtotal * 0.13 : 0
  const total    = subtotal + iva

  document.getElementById('editar-subtotal').textContent = '$' + subtotal.toFixed(2)
  document.getElementById('editar-iva').textContent      = conIva ? '$' + iva.toFixed(2) : '—'
  document.getElementById('editar-total').textContent    = '$' + total.toFixed(2)

  // Actualizar totales de fila en la tabla
  renderizarItemsEditar()
}

async function guardarEdicion() {
  if (!modalEditarId) return
  const cot = todasLasCotizaciones.find(c => c.id === modalEditarId)
  if (!cot) return

  if (!editarItems.length) { alert('Agrega al menos un producto.'); return }

  const cliente   = document.getElementById('editar-cliente').value.trim()
  const contacto  = document.getElementById('editar-contacto').value.trim()
  const formaPago = document.getElementById('editar-forma-pago').value
  const entrega   = document.getElementById('editar-entrega').value
  const conIva    = document.getElementById('editar-con-iva').checked
  const conBanco  = document.getElementById('editar-con-banco').checked
  const conFirma  = document.getElementById('editar-con-firma').checked

  if (!cliente) { alert('El nombre del cliente es obligatorio.'); return }
  if (!formaPago) { alert('Selecciona una forma de pago.'); return }

  const btn = document.getElementById('btn-guardar-edicion')
  const msg = document.getElementById('editar-msg')
  btn.disabled = true
  btn.textContent = 'Generando PDF...'
  msg.textContent = ''

  try {
    const resp = await fetch(`${COTIZADOR_URL}/actualizar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numero:   cot.numero,
        cliente,
        contacto,
        items:    editarItems,
        formaPago,
        entrega,
        validez:  cot.datos?.validez || '15 días',
        conIva,
        conBanco,
        conFirma,
      }),
    })

    const result = await resp.json()
    if (!resp.ok) throw new Error(result.error || 'Error al actualizar')

    msg.style.color = '#16a34a'
    msg.textContent = `✅ ${cot.numero} actualizado correctamente.`
    btn.textContent = 'Guardado'

    setTimeout(async () => {
      cerrarModalEditar()
      await cargarCotizaciones()
    }, 1200)

  } catch (err) {
    msg.style.color = '#ef4444'
    msg.textContent = 'Error: ' + err.message
    btn.disabled = false
    btn.textContent = 'Guardar y regenerar PDF'
  }
}

// ── EXPORTAR CSV ──
function exportarCSV() {
  const lista = filtroActivo === 'todas' ? todasLasCotizaciones
    : todasLasCotizaciones.filter(c => c.estado === filtroActivo)

  const filas = lista.map(c => [
    c.numero,
    c.clientes?.nombre || '',
    c.clientes?.empresa || '',
    new Date(c.created_at).toLocaleDateString('es-SV'),
    Number(c.total).toFixed(2),
    ETIQUETAS_COT[c.estado] || c.estado,
    c.notas || ''
  ])

  const csv = [
    ['Número', 'Cliente', 'Empresa', 'Fecha', 'Total', 'Estado', 'Notas'],
    ...filas
  ].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')

  descargarCSV('﻿' + csv, `cotizaciones_${new Date().toISOString().slice(0,10)}.csv`)
}

function descargarCSV(contenido, nombre) {
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = nombre; a.click()
  URL.revokeObjectURL(url)
}
