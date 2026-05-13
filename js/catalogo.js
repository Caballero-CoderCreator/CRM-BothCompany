let secciones = []

const TIPO_CONFIG = {
  base:       { bg: '#f9fafb', border: '#e5e7eb', label: 'Base',      dot: '#9ca3af' },
  bordado1:   { bg: '#eff6ff', border: '#bfdbfe', label: '+ 1 bordado', dot: '#3b82f6' },
  bordado2:   { bg: '#f0f9ff', border: '#bae6fd', label: '+ 2 bordados', dot: '#0284c7' },
  bordado3:   { bg: '#f5f3ff', border: '#ddd6fe', label: '+ 3 bordados', dot: '#8b5cf6' },
  especial:   { bg: '#fffbeb', border: '#fde68a', label: 'Especial',  dot: '#f59e0b' },
  reflectivo: { bg: '#fef9c3', border: '#fde047', label: 'Reflectivo', dot: '#ca8a04' },
  custom:     { bg: '#ffffff', border: '#e5e7eb', label: '',          dot: '#e5e7eb' }
}

const TIPOS = ['base','bordado1','bordado2','bordado3','especial','reflectivo','custom']
const TIPOS_LABELS = {
  base: '● Base (sin personalización)',
  bordado1: '+ 1 Bordado / Estampado',
  bordado2: '++ 2 Bordados / Estampados',
  bordado3: '+++ 3 Bordados / Estampados',
  especial: '✦ Talla especial / Premium',
  reflectivo: '⚡ Con reflectivo',
  custom: '— Sin clasificar'
}

// ── CARGA Y RENDER ──
async function cargarCatalogo() {
  const [{ data: secs }, { data: prods }] = await Promise.all([
    db.from('catalogo_secciones').select('*').order('orden'),
    db.from('catalogo_productos').select('*').order('orden')
  ])
  secciones = (secs || []).map(s => ({
    ...s,
    productos: (prods || []).filter(p => p.seccion_id === s.id)
  }))
  renderCatalogo()
}

function renderCatalogo() {
  const container = document.getElementById('catalogo-container')
  if (!secciones.length) {
    container.innerHTML = `
      <div class="empty-cat">
        <p>No hay secciones aún.</p>
        <button class="btn btn-primary" onclick="abrirModalSeccion()">+ Crear primera sección</button>
      </div>`
    return
  }
  container.innerHTML = secciones.map(s => renderSeccion(s)).join('')
}

function renderSeccion(s) {
  const productos = s.productos || []
  return `
    <div class="cat-seccion" id="sec-${s.id}">
      <div class="cat-sec-head">
        <div class="cat-sec-info">
          <span class="cat-sec-icon">${s.icono || '📦'}</span>
          <div>
            <div class="cat-sec-nombre">${escHtml(s.nombre)}</div>
            <div class="cat-sec-desc">${escHtml(s.descripcion || '')}</div>
          </div>
        </div>
        <div class="cat-sec-actions">
          <button class="btn btn-secondary btn-sm" onclick="abrirModalSeccion('${s.id}')">✏️ Editar sección</button>
          <button class="btn btn-danger btn-sm" onclick="eliminarSeccion('${s.id}')">🗑️</button>
        </div>
      </div>

      <div class="cat-productos-grid" id="grid-${s.id}">
        ${productos.length
          ? productos.map(p => renderProducto(p)).join('')
          : `<div class="cat-empty-sec">Aún no hay productos en esta sección.</div>`
        }
      </div>

      <div class="cat-sec-footer">
        <button class="btn-add-prod" onclick="abrirModalProducto(null, '${s.id}')">
          + Agregar producto
        </button>
      </div>
    </div>`
}

function renderProducto(p) {
  const cfg = TIPO_CONFIG[p.tipo] || TIPO_CONFIG.custom
  return `
    <div class="cat-prod-card" id="prod-${p.id}"
         style="background:${cfg.bg};border-color:${cfg.border};">
      ${p.tipo && p.tipo !== 'custom'
        ? `<div class="cat-prod-tipo" style="background:${cfg.dot};"></div>`
        : ''}
      <div class="cat-prod-body">
        <div class="cat-prod-nombre">${escHtml(p.nombre)}</div>
        <div class="cat-prod-precio">${escHtml(p.precio || '—')}</div>
        ${p.notas ? `<div class="cat-prod-notas">${escHtml(p.notas)}</div>` : ''}
      </div>
      <div class="cat-prod-actions">
        <button class="btn-prod-edit" onclick="abrirModalProducto('${p.id}')">✏️</button>
        <button class="btn-prod-del"  onclick="eliminarProducto('${p.id}')">🗑️</button>
      </div>
    </div>`
}

// ── MODAL SECCIÓN ──
function abrirModalSeccion(id = null) {
  const sec = id ? secciones.find(s => s.id === id) : null
  document.getElementById('modal-sec-id').value = id || ''
  document.getElementById('modal-sec-nombre').value = sec?.nombre || ''
  document.getElementById('modal-sec-desc').value = sec?.descripcion || ''
  document.getElementById('modal-sec-icono').value = sec?.icono || '📦'
  document.getElementById('modal-sec-titulo').textContent = id ? 'Editar sección' : 'Nueva sección'
  document.getElementById('modal-seccion').classList.add('visible')
  document.getElementById('modal-sec-nombre').focus()
}

function cerrarModalSeccion() {
  document.getElementById('modal-seccion').classList.remove('visible')
}

async function guardarSeccion() {
  const id = document.getElementById('modal-sec-id').value
  const datos = {
    nombre:      document.getElementById('modal-sec-nombre').value.trim(),
    descripcion: document.getElementById('modal-sec-desc').value.trim(),
    icono:       document.getElementById('modal-sec-icono').value.trim() || '📦'
  }
  if (!datos.nombre) { alert('El nombre es obligatorio'); return }

  const btn = document.getElementById('btn-guardar-sec')
  btn.disabled = true; btn.textContent = 'Guardando...'

  let error
  if (id) {
    ;({ error } = await db.from('catalogo_secciones').update(datos).eq('id', id))
  } else {
    const maxOrden = secciones.length ? Math.max(...secciones.map(s => s.orden)) + 1 : 1
    ;({ error } = await db.from('catalogo_secciones').insert({ ...datos, orden: maxOrden }))
  }

  btn.disabled = false; btn.textContent = 'Guardar'
  if (error) { alert('Error: ' + error.message); return }
  cerrarModalSeccion()
  await cargarCatalogo()
}

async function eliminarSeccion(id) {
  const sec = secciones.find(s => s.id === id)
  const nProds = sec?.productos?.length || 0
  const msg = nProds > 0
    ? `¿Eliminar la sección "${sec.nombre}" y sus ${nProds} productos? Esta acción no se puede deshacer.`
    : `¿Eliminar la sección "${sec.nombre}"?`
  if (!confirm(msg)) return
  const { error } = await db.from('catalogo_secciones').delete().eq('id', id)
  if (error) { alert('Error: ' + error.message); return }
  await cargarCatalogo()
}

// ── MODAL PRODUCTO ──
function abrirModalProducto(id = null, seccionId = null) {
  let prod = null
  if (id) {
    for (const s of secciones) {
      prod = s.productos.find(p => p.id === id)
      if (prod) { seccionId = s.id; break }
    }
  }
  document.getElementById('modal-prod-id').value = id || ''
  document.getElementById('modal-prod-seccion').value = seccionId || ''
  document.getElementById('modal-prod-nombre').value = prod?.nombre || ''
  document.getElementById('modal-prod-precio').value = prod?.precio || ''
  document.getElementById('modal-prod-notas').value = prod?.notas || ''
  document.getElementById('modal-prod-tipo').value = prod?.tipo || 'custom'
  document.getElementById('modal-prod-titulo').textContent = id ? 'Editar producto' : 'Nuevo producto'
  actualizarVistaTipo()
  document.getElementById('modal-producto').classList.add('visible')
  document.getElementById('modal-prod-nombre').focus()
}

function cerrarModalProducto() {
  document.getElementById('modal-producto').classList.remove('visible')
}

function actualizarVistaTipo() {
  const tipo = document.getElementById('modal-prod-tipo').value
  const cfg = TIPO_CONFIG[tipo] || TIPO_CONFIG.custom
  const preview = document.getElementById('tipo-preview')
  preview.style.background = cfg.bg
  preview.style.borderColor = cfg.border
  preview.textContent = TIPOS_LABELS[tipo] || ''
}

async function guardarProducto() {
  const id      = document.getElementById('modal-prod-id').value
  const secId   = document.getElementById('modal-prod-seccion').value
  const datos = {
    nombre:     document.getElementById('modal-prod-nombre').value.trim(),
    precio:     document.getElementById('modal-prod-precio').value.trim(),
    notas:      document.getElementById('modal-prod-notas').value.trim(),
    tipo:       document.getElementById('modal-prod-tipo').value,
    seccion_id: secId
  }
  if (!datos.nombre) { alert('El nombre es obligatorio'); return }

  const btn = document.getElementById('btn-guardar-prod')
  btn.disabled = true; btn.textContent = 'Guardando...'

  let error
  if (id) {
    ;({ error } = await db.from('catalogo_productos').update(datos).eq('id', id))
  } else {
    const sec = secciones.find(s => s.id === secId)
    const maxOrden = sec?.productos?.length ? Math.max(...sec.productos.map(p => p.orden)) + 1 : 1
    ;({ error } = await db.from('catalogo_productos').insert({ ...datos, orden: maxOrden }))
  }

  btn.disabled = false; btn.textContent = 'Guardar'
  if (error) { alert('Error: ' + error.message); return }
  cerrarModalProducto()
  await cargarCatalogo()
}

async function eliminarProducto(id) {
  let nombre = ''
  for (const s of secciones) {
    const p = s.productos.find(p => p.id === id)
    if (p) { nombre = p.nombre; break }
  }
  if (!confirm(`¿Eliminar "${nombre}"?`)) return
  const { error } = await db.from('catalogo_productos').delete().eq('id', id)
  if (error) { alert('Error: ' + error.message); return }
  await cargarCatalogo()
}

// ── UTILS ──
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
