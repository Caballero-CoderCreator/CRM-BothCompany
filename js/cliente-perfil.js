let clienteId   = null
let clienteData  = null
const BUCKET     = 'archivos-clientes'
const COTIZADOR_URL_PERFIL = 'https://cotizador-both-company-production.up.railway.app'

let modalEditarCotId = null
let editarItemsCot   = []
let cotizacionesPerfil = []

// ── CARGA PRINCIPAL ──
async function cargarPerfil() {
  const params = new URLSearchParams(location.search)
  clienteId = params.get('id')
  if (!clienteId) { location.href = '/clientes.html'; return }

  const [
    { data: cliente },
    { data: cotizaciones },
    { data: pedidos }
  ] = await Promise.all([
    db.from('clientes').select('*').eq('id', clienteId).single(),
    db.from('cotizaciones').select('*').eq('cliente_id', clienteId).neq('estado', 'eliminado').order('created_at', { ascending: false }),
    db.from('pedidos').select('*').eq('cliente_id', clienteId).order('created_at', { ascending: false })
  ])

  if (!cliente) { location.href = '/clientes.html'; return }
  clienteData = cliente
  renderPerfil(cliente, cotizaciones || [], pedidos || [])
  cambiarTab('cotizaciones')
}

// ── BADGES ──
function calcularBadgesPerfil(pedidos) {
  const totalGastado = pedidos.reduce((s, p) => s + Number(p.total || 0), 0)
  const numPedidos   = pedidos.length
  const esVIP        = totalGastado >= 500
  const esFrecuente  = numPedidos   >= 3

  const tags = []
  if (esVIP && esFrecuente) tags.push('<span class="badge-tag premium">💎 Premium</span>')
  else if (esVIP)           tags.push('<span class="badge-tag vip">⭐ VIP</span>')
  if (esFrecuente && !esVIP) tags.push('<span class="badge-tag frecuente">🔄 Frecuente</span>')
  return tags.join(' ')
}

// ── RENDER PERFIL ──
function renderPerfil(c, cotizaciones, pedidos) {
  document.title = `${c.nombre} — CRM Both Company`

  const iniciales = c.nombre.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
  document.getElementById('perfil-avatar').textContent = iniciales
  document.getElementById('perfil-nombre').textContent = c.nombre
  document.getElementById('perfil-badges').innerHTML   = calcularBadgesPerfil(pedidos)
  document.getElementById('perfil-empresa').textContent   = c.empresa  || '—'
  document.getElementById('perfil-telefono').textContent  = c.telefono || '—'
  document.getElementById('perfil-email').innerHTML =
    c.email ? `<a href="mailto:${c.email}" style="color:var(--gold-dark)">${c.email}</a>` : '—'
  document.getElementById('perfil-fuente').textContent = c.fuente || 'manual'
  document.getElementById('perfil-desde').textContent  =
    new Date(c.created_at).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' })

  const totalGastado = pedidos.reduce((s, p) => s + Number(p.total || 0), 0)
  document.getElementById('stat-cot').textContent     = cotizaciones.length
  document.getElementById('stat-ped').textContent     = pedidos.length
  document.getElementById('stat-total').textContent   = '$' + totalGastado.toFixed(2)
  document.getElementById('stat-ultimo').textContent  =
    pedidos[0] ? formatFecha(pedidos[0].created_at) : '—'

  cotizacionesPerfil = cotizaciones || []
  renderTablaCotizaciones(cotizacionesPerfil)
  renderTablaPedidos(pedidos)
  cargarArchivos()
}

// ── TABLAS ──
function formatFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' })
}

const ESTADOS_COT = { borrador: 'Borrador', enviada: 'Enviada', aprobada: 'Aprobada', rechazada: 'Rechazada' }
const ESTADOS_PED = { pendiente: 'Pendiente', en_produccion: 'En producción', listo: 'Listo', completado: 'Completado', entregado: 'Entregado' }

function renderTablaCotizaciones(cots) {
  const tbody = document.getElementById('tabla-cot-perfil')
  if (!cots.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state" style="padding:30px">Sin cotizaciones aún.</td></tr>'
    return
  }
  tbody.innerHTML = cots.map(c => {
    const puedeEditar  = c.estado === 'borrador' || c.estado === 'enviada'
    const puedeEliminar = c.estado === 'borrador'
    return `
    <tr>
      <td>
        <strong>${c.numero}</strong>
        ${c.pdf_url ? `<div style="margin-top:3px"><a href="${c.pdf_url}" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;font-weight:500">📄 Ver PDF</a></div>` : ''}
      </td>
      <td style="color:#718096;font-size:13px">${formatFecha(c.created_at)}</td>
      <td>$${Number(c.total).toFixed(2)}</td>
      <td><span class="badge badge-${c.estado}">${ESTADOS_COT[c.estado] || c.estado}</span></td>
      <td style="white-space:nowrap">
        ${puedeEditar  ? `<button class="btn btn-secondary btn-sm" onclick="abrirModalEditarCot('${c.id}')" style="margin-right:4px">✏️ Editar</button>` : ''}
        ${puedeEliminar ? `<button class="btn btn-secondary btn-sm" onclick="eliminarCotPerfil('${c.id}','${c.numero}')" style="color:#ef4444">🗑️</button>` : ''}
      </td>
    </tr>`
  }).join('')
}

function renderTablaPedidos(peds) {
  const tbody = document.getElementById('tabla-ped-perfil')
  if (!peds.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state" style="padding:30px">Sin pedidos aún.</td></tr>'
    return
  }
  tbody.innerHTML = peds.map(p => `
    <tr>
      <td><strong>${p.numero}</strong></td>
      <td style="color:#718096;font-size:13px">${formatFecha(p.created_at)}</td>
      <td>$${Number(p.total).toFixed(2)}</td>
      <td><span class="badge badge-${p.estado}">${ESTADOS_PED[p.estado] || p.estado}</span></td>
    </tr>`).join('')
}

// ── TABS ──
function cambiarTab(tab) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'))
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
  document.getElementById('panel-' + tab).classList.add('active')
  document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active')
}

// ── ARCHIVOS ──
async function cargarArchivos() {
  const grid = document.getElementById('archivos-lista')
  grid.innerHTML = '<p style="color:#9ca3af;font-size:13px">Cargando archivos...</p>'

  const { data, error } = await db.storage.from(BUCKET).list(clienteId, {
    limit: 100, sortBy: { column: 'created_at', order: 'desc' }
  })

  if (error) {
    grid.innerHTML = `<p style="color:#9ca3af;font-size:13px">No se pudo cargar archivos.<br>
      Asegúrate de crear el bucket "<strong>${BUCKET}</strong>" en Supabase Storage.</p>`
    return
  }
  const archivos = (data || []).filter(f => f.name !== '.emptyFolderPlaceholder')
  renderArchivos(archivos)
}

function renderArchivos(archivos) {
  const grid = document.getElementById('archivos-lista')
  if (!archivos.length) {
    grid.innerHTML = '<p style="color:#9ca3af;font-size:13px;text-align:center;padding:20px">Sin archivos adjuntos.</p>'
    return
  }
  grid.innerHTML = archivos.map(f => {
    const { data: { publicUrl } } = db.storage.from(BUCKET).getPublicUrl(`${clienteId}/${f.name}`)
    const icono = /\.(pdf)$/i.test(f.name) ? '📄'
      : /\.(jpe?g|png|gif|webp|svg)$/i.test(f.name) ? '🖼️'
      : /\.(doc|docx)$/i.test(f.name) ? '📝'
      : /\.(xls|xlsx)$/i.test(f.name) ? '📊'
      : '📎'
    const kb = f.metadata?.size ? (f.metadata.size / 1024).toFixed(0) + ' KB' : ''
    return `
      <div class="archivo-item">
        <span class="archivo-icono">${icono}</span>
        <div class="archivo-info">
          <a href="${publicUrl}" target="_blank" class="archivo-nombre">${f.name}</a>
          ${kb ? `<div class="archivo-size">${kb}</div>` : ''}
        </div>
        <button class="btn-arch-del" title="Eliminar" onclick="eliminarArchivo('${f.name}')">🗑️</button>
      </div>`
  }).join('')
}

async function subirArchivo(input) {
  const file = input.files[0]
  if (!file) return

  const btn = document.getElementById('btn-subir')
  btn.disabled = true; btn.textContent = 'Subiendo...'

  const { error } = await db.storage
    .from(BUCKET)
    .upload(`${clienteId}/${file.name}`, file, { upsert: true })

  btn.disabled = false; btn.textContent = '+ Subir archivo'
  input.value = ''

  if (error) { alert('Error al subir: ' + error.message); return }
  await cargarArchivos()
}

async function eliminarArchivo(nombre) {
  if (!confirm(`¿Eliminar "${nombre}"?`)) return
  const { error } = await db.storage.from(BUCKET).remove([`${clienteId}/${nombre}`])
  if (error) { alert('Error: ' + error.message); return }
  await cargarArchivos()
}

// ── ELIMINAR BORRADOR (desde perfil) ──
async function eliminarCotPerfil(id, numero) {
  if (!confirm(`¿Eliminar el borrador ${numero}?\n\nEl correlativo no se verá afectado.`)) return
  const { error } = await db.from('cotizaciones').update({ estado: 'eliminado' }).eq('id', id)
  if (error) { alert('Error al eliminar: ' + error.message); return }
  cotizacionesPerfil = cotizacionesPerfil.filter(c => c.id !== id)
  renderTablaCotizaciones(cotizacionesPerfil)
}

// ── MODAL EDITAR COTIZACIÓN (desde perfil) ──
function abrirModalEditarCot(id) {
  const cot = cotizacionesPerfil.find(c => c.id === id)
  if (!cot) return

  modalEditarCotId = id
  const d = cot.datos || {}

  document.getElementById('editarcot-numero').textContent   = cot.numero
  document.getElementById('editarcot-cliente').value        = d.cliente  || cot.nombre || clienteData?.nombre || ''
  document.getElementById('editarcot-contacto').value       = d.contacto || ''
  document.getElementById('editarcot-forma-pago').value     = d.formaPagoKey || ''
  document.getElementById('editarcot-entrega').value        = d.entrega  || '30 días'
  document.getElementById('editarcot-con-iva').checked      = !!d.conIva
  document.getElementById('editarcot-con-banco').checked    = !!d.conBanco
  document.getElementById('editarcot-con-firma').checked    = !!d.conFirma

  editarItemsCot = d.items
    ? d.items.map(i => ({ ...i }))
    : [{ descripcion: '', tallas: '', cantidad: 1, precioUnit: 0, total: 0 }]

  renderizarItemsCot()
  recalcularTotalesCot()

  const aviso = document.getElementById('editarcot-aviso-sin-datos')
  if (aviso) aviso.style.display = cot.datos ? 'none' : 'block'

  document.getElementById('editarcot-msg').textContent = ''
  document.getElementById('modal-editar-cot').classList.add('visible')
}

function cerrarModalEditarCot() {
  document.getElementById('modal-editar-cot').classList.remove('visible')
  modalEditarCotId = null
  editarItemsCot   = []
}

function escCot(s) {
  return (s || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function renderizarItemsCot() {
  const tbody = document.getElementById('editarcot-items-body')
  if (!editarItemsCot.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:12px">Sin productos. Agrega una línea.</td></tr>'
    return
  }
  tbody.innerHTML = editarItemsCot.map((item, idx) => `
    <tr>
      <td><input type="text" value="${escCot(item.descripcion)}" oninput="editarItemsCot[${idx}].descripcion=this.value" style="width:100%;min-width:140px" class="form-input-sm"></td>
      <td><input type="text" value="${escCot(item.tallas)}" oninput="editarItemsCot[${idx}].tallas=this.value" style="width:100%;min-width:80px" class="form-input-sm" placeholder="Opcional"></td>
      <td><input type="number" value="${item.cantidad}" min="1" step="1" oninput="editarItemsCot[${idx}].cantidad=+this.value;recalcularTotalesCot()" style="width:64px" class="form-input-sm"></td>
      <td><input type="number" value="${item.precioUnit}" min="0" step="0.01" oninput="editarItemsCot[${idx}].precioUnit=+this.value;recalcularTotalesCot()" style="width:80px" class="form-input-sm"></td>
      <td style="text-align:right;white-space:nowrap">$${((item.cantidad||0)*(item.precioUnit||0)).toFixed(2)}</td>
      <td style="text-align:center"><button onclick="eliminarFilaCot(${idx})" style="background:none;border:none;cursor:pointer;color:#ef4444;font-size:16px;line-height:1" title="Eliminar línea">✕</button></td>
    </tr>`).join('')
}

function agregarFilaCot() {
  editarItemsCot.push({ descripcion: '', tallas: '', cantidad: 1, precioUnit: 0, total: 0 })
  renderizarItemsCot()
  recalcularTotalesCot()
}

function eliminarFilaCot(idx) {
  editarItemsCot.splice(idx, 1)
  renderizarItemsCot()
  recalcularTotalesCot()
}

function recalcularTotalesCot() {
  const conIva   = document.getElementById('editarcot-con-iva').checked
  const subtotal = editarItemsCot.reduce((s, i) => s + (i.cantidad||0)*(i.precioUnit||0), 0)
  const iva      = conIva ? subtotal * 0.13 : 0
  const total    = subtotal + iva

  document.getElementById('editarcot-subtotal').textContent = '$' + subtotal.toFixed(2)
  document.getElementById('editarcot-iva').textContent      = conIva ? '$' + iva.toFixed(2) : '—'
  document.getElementById('editarcot-total').textContent    = '$' + total.toFixed(2)

  renderizarItemsCot()
}

async function guardarEdicionCot() {
  if (!modalEditarCotId) return
  const cot = cotizacionesPerfil.find(c => c.id === modalEditarCotId)
  if (!cot) return

  if (!editarItemsCot.length) { alert('Agrega al menos un producto.'); return }

  const cliente   = document.getElementById('editarcot-cliente').value.trim()
  const contacto  = document.getElementById('editarcot-contacto').value.trim()
  const formaPago = document.getElementById('editarcot-forma-pago').value
  const entrega   = document.getElementById('editarcot-entrega').value
  const conIva    = document.getElementById('editarcot-con-iva').checked
  const conBanco  = document.getElementById('editarcot-con-banco').checked
  const conFirma  = document.getElementById('editarcot-con-firma').checked

  if (!cliente)   { alert('El nombre del cliente es obligatorio.'); return }
  if (!formaPago) { alert('Selecciona una forma de pago.'); return }

  const btn = document.getElementById('btn-guardar-edicion-cot')
  const msg = document.getElementById('editarcot-msg')
  btn.disabled = true
  btn.textContent = 'Generando PDF...'
  msg.textContent = ''

  try {
    const resp = await fetch(`${COTIZADOR_URL_PERFIL}/actualizar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numero: cot.numero, cliente, contacto,
        items: editarItemsCot, formaPago, entrega,
        validez: cot.datos?.validez || '15 días',
        conIva, conBanco, conFirma,
      }),
    })
    const result = await resp.json()
    if (!resp.ok) throw new Error(result.error || 'Error al actualizar')

    msg.style.color = '#16a34a'
    msg.textContent = `✅ ${cot.numero} actualizado correctamente.`
    btn.textContent = 'Guardado'

    setTimeout(async () => {
      cerrarModalEditarCot()
      await cargarPerfil()
    }, 1200)
  } catch (err) {
    msg.style.color = '#ef4444'
    msg.textContent = 'Error: ' + err.message
    btn.disabled = false
    btn.textContent = 'Guardar y regenerar PDF'
  }
}

// ── MODAL EDITAR CLIENTE ──
function abrirModalEditar() {
  if (!clienteData) return
  document.getElementById('edit-nombre').value   = clienteData.nombre   || ''
  document.getElementById('edit-empresa').value  = clienteData.empresa  || ''
  document.getElementById('edit-telefono').value = clienteData.telefono || ''
  document.getElementById('edit-email').value    = clienteData.email    || ''
  document.getElementById('edit-notas').value    = clienteData.notas    || ''
  document.getElementById('edit-fuente').value   = clienteData.fuente   || 'manual'
  document.getElementById('modal-editar').classList.add('visible')
}

function cerrarModalEditar() {
  document.getElementById('modal-editar').classList.remove('visible')
}

async function guardarEdicion() {
  const datos = {
    nombre:   document.getElementById('edit-nombre').value.trim(),
    empresa:  document.getElementById('edit-empresa').value.trim(),
    telefono: document.getElementById('edit-telefono').value.trim(),
    email:    document.getElementById('edit-email').value.trim(),
    notas:    document.getElementById('edit-notas').value.trim(),
    fuente:   document.getElementById('edit-fuente').value
  }
  if (!datos.nombre) { alert('El nombre es obligatorio'); return }

  const btn = document.getElementById('btn-guardar-edit')
  btn.disabled = true; btn.textContent = 'Guardando...'

  const { error } = await db.from('clientes').update(datos).eq('id', clienteId)
  btn.disabled = false; btn.textContent = 'Guardar'

  if (error) { alert('Error: ' + error.message); return }
  cerrarModalEditar()
  location.reload()
}
