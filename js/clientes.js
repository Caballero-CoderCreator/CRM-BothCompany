let todosLosClientes = []
let todosPedidosClientes = []
let todasCotsClientes = []
let fusionOrigenId = null

async function cargarClientes() {
  const [
    { data: clientes, error },
    { data: pedidos },
    { data: cots }
  ] = await Promise.all([
    db.from('clientes').select('*').order('created_at', { ascending: false }),
    db.from('pedidos').select('cliente_id, total, created_at, estado'),
    db.from('cotizaciones').select('cliente_id, estado')
  ])

  if (error) { console.error(error); return }
  todosLosClientes     = clientes || []
  todosPedidosClientes = (pedidos || []).filter(p => p.estado !== 'eliminado')
  todasCotsClientes    = cots || []
  renderizarClientes(todosLosClientes)

  const badge = document.getElementById('stat-duplicados')
  if (badge) { const n = gruposDuplicados().length; badge.textContent = n > 0 ? n : '' }
}

// ── NORMALIZACIÓN DE NOMBRES (para detectar "Cosper" = "COSPER" = "Cosper, S.A. de C.V.") ──
function normalizarNombre(n) {
  return String(n || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')      // quita acentos
    .replace(/[.,;:'"()\-]/g, ' ')                          // puntuación -> espacio
    .replace(/\s+/g, ' ').trim()
    .replace(/\s*(s\s?a\s+de\s+c\s?v|sa\s+de\s+cv|s\s?a|de\s+c\s?v|de\s+r\s?l|cv|ltda|inc)$/i, '')  // sufijos legales
    .trim()
}

function gruposDuplicados() {
  const grupos = {}
  for (const c of todosLosClientes) {
    const k = normalizarNombre(c.nombre)
    if (!k) continue
    ;(grupos[k] ||= []).push(c)
  }
  return Object.values(grupos)
    .filter(g => g.length > 1)
    .sort((a, b) => a[0].nombre.localeCompare(b[0].nombre))
}

function resumenCliente(id) {
  const cots = todasCotsClientes.filter(c => c.cliente_id === id && c.estado !== 'eliminado').length
  const peds = todosPedidosClientes.filter(p => p.cliente_id === id).length
  return { cots, peds }
}

function calcularBadges(clienteId, createdAt) {
  const peds = todosPedidosClientes.filter(p => p.cliente_id === clienteId)
  const totalGastado = peds.reduce((s, p) => s + Number(p.total || 0), 0)
  const numPedidos   = peds.length
  const diasDesde    = (Date.now() - new Date(createdAt)) / 86400000

  const esVIP       = totalGastado >= 5000
  const esFrecuente = numPedidos   >= 5
  const esNuevo     = diasDesde    <= 30 && numPedidos === 0

  const tags = []
  if (esVIP && esFrecuente) tags.push('<span class="badge-tag premium">💎 Premium</span>')
  else if (esVIP)           tags.push('<span class="badge-tag vip">⭐ VIP</span>')
  if (esFrecuente && !esVIP) tags.push('<span class="badge-tag frecuente">🔄 Frecuente</span>')
  if (esNuevo)               tags.push('<span class="badge-tag nuevo">🆕 Nuevo</span>')
  return tags.join(' ')
}

function renderizarClientes(lista) {
  const tbody = document.getElementById('tabla-clientes')
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>No hay clientes aún. Crea el primero.</p></td></tr>'
    return
  }
  tbody.innerHTML = lista.map(c => `
    <tr>
      <td>
        <a href="/cliente-perfil.html?id=${c.id}" class="cliente-nombre-link">${c.nombre}</a>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:5px">
          ${calcularBadges(c.id, c.created_at)}
        </div>
        ${c.notas ? `<div style="font-size:12px;color:#718096;margin-top:3px">${c.notas}</div>` : ''}
      </td>
      <td>${c.empresa || '—'}</td>
      <td>${c.telefono || '—'}</td>
      <td>${c.email ? `<a href="mailto:${c.email}" style="color:#3b82f6;font-size:13px">${c.email}</a>` : '—'}</td>
      <td>${BADGES_FUENTE[c.fuente] || c.fuente || '—'}</td>
      <td style="white-space:nowrap">
        <a href="/cliente-perfil.html?id=${c.id}" class="btn btn-secondary btn-sm">👁 Ver</a>
        <button class="btn btn-secondary btn-sm" onclick="abrirModalEditar('${c.id}')">Editar</button>
        <button class="btn btn-secondary btn-sm" onclick="abrirModalFusion('${c.id}')" title="Unir este perfil con otro del mismo cliente">Fusionar</button>
        <button class="btn btn-danger btn-sm" onclick="eliminarCliente('${c.id}')">Eliminar</button>
      </td>
    </tr>
  `).join('')
}

function buscarClientes(termino) {
  const t = termino.toLowerCase()
  const filtrados = todosLosClientes.filter(c =>
    c.nombre.toLowerCase().includes(t) ||
    (c.empresa || '').toLowerCase().includes(t) ||
    (c.telefono || '').includes(t) ||
    (c.email || '').toLowerCase().includes(t)
  )
  renderizarClientes(filtrados)
}

function abrirModalNuevo() {
  document.getElementById('modal-titulo').textContent = 'Nuevo cliente'
  document.getElementById('cliente-id').value = ''
  document.getElementById('campo-nombre').value = ''
  document.getElementById('campo-empresa').value = ''
  document.getElementById('campo-telefono').value = ''
  document.getElementById('campo-email').value = ''
  document.getElementById('campo-notas').value = ''
  document.getElementById('campo-fuente').value = 'manual'
  document.getElementById('modal-cliente').classList.add('visible')
}

async function abrirModalEditar(id) {
  const cliente = todosLosClientes.find(c => c.id === id)
  if (!cliente) return
  document.getElementById('modal-titulo').textContent = 'Editar cliente'
  document.getElementById('cliente-id').value = cliente.id
  document.getElementById('campo-nombre').value = cliente.nombre || ''
  document.getElementById('campo-empresa').value = cliente.empresa || ''
  document.getElementById('campo-telefono').value = cliente.telefono || ''
  document.getElementById('campo-email').value = cliente.email || ''
  document.getElementById('campo-notas').value = cliente.notas || ''
  document.getElementById('campo-fuente').value = cliente.fuente || 'manual'
  document.getElementById('modal-cliente').classList.add('visible')
}

function cerrarModal() {
  document.getElementById('modal-cliente').classList.remove('visible')
}

async function guardarCliente() {
  const id = document.getElementById('cliente-id').value
  const datos = {
    nombre:   document.getElementById('campo-nombre').value.trim(),
    empresa:  document.getElementById('campo-empresa').value.trim(),
    telefono: document.getElementById('campo-telefono').value.trim(),
    email:    document.getElementById('campo-email').value.trim(),
    notas:    document.getElementById('campo-notas').value.trim(),
    fuente:   document.getElementById('campo-fuente').value
  }

  if (!datos.nombre) { alert('El nombre es obligatorio'); return }

  // Evitar crear un perfil duplicado por mayúsculas/minúsculas o sufijo legal
  const k = normalizarNombre(datos.nombre)
  const parecido = todosLosClientes.find(c => c.id !== id && normalizarNombre(c.nombre) === k)
  if (parecido && !id) {
    alert(`Ya existe el cliente "${parecido.nombre}".\n\nNo se creó otro perfil. Búscalo en la lista o edítalo.`)
    return
  }
  if (parecido && id && !confirm(`Ya existe otro perfil llamado "${parecido.nombre}". ¿Guardar de todos modos?\n\n(Si es el mismo cliente, mejor usa "Fusionar".)`)) return

  let error
  if (id) {
    ;({ error } = await db.from('clientes').update(datos).eq('id', id))
  } else {
    ;({ error } = await db.from('clientes').insert(datos))
  }

  if (error) { alert('Error al guardar: ' + error.message); return }
  cerrarModal()
  await cargarClientes()
}

async function eliminarCliente(id) {
  const r = resumenCliente(id)
  if (r.cots || r.peds) {
    alert(`Este cliente tiene ${r.cots} cotización(es) y ${r.peds} pedido(s).\n\nNo se puede eliminar. Si es un duplicado, usa "Fusionar" para pasar su historial al perfil correcto.`)
    return
  }
  if (!confirm('¿Eliminar este cliente? Esta acción no se puede deshacer.')) return
  const { error } = await db.from('clientes').delete().eq('id', id)
  if (error) { alert('Error al eliminar: ' + error.message); return }
  await cargarClientes()
}

// ── FUSIONAR CLIENTES ──
function abrirModalFusion(origenId) {
  const origen = todosLosClientes.find(c => c.id === origenId)
  if (!origen) return
  fusionOrigenId = origenId
  document.getElementById('fusion-origen-nombre').textContent = origen.nombre
  document.getElementById('fusion-buscar').value = ''
  filtrarDestinosFusion('')
  // Preseleccionar el candidato más probable (mismo nombre normalizado)
  const k = normalizarNombre(origen.nombre)
  const sugerido = todosLosClientes.find(c => c.id !== origenId && normalizarNombre(c.nombre) === k)
  const sel = document.getElementById('fusion-destino')
  if (sugerido) sel.value = sugerido.id
  actualizarResumenFusion()
  sel.onchange = actualizarResumenFusion
  document.getElementById('modal-fusion').classList.add('visible')
}

function filtrarDestinosFusion(texto) {
  const t = texto.toLowerCase()
  const sel = document.getElementById('fusion-destino')
  const k = normalizarNombre(todosLosClientes.find(c => c.id === fusionOrigenId)?.nombre)
  const lista = todosLosClientes
    .filter(c => c.id !== fusionOrigenId)
    .filter(c => !t || c.nombre.toLowerCase().includes(t) || (c.empresa || '').toLowerCase().includes(t))
    .sort((a, b) => (normalizarNombre(b.nombre) === k) - (normalizarNombre(a.nombre) === k) || a.nombre.localeCompare(b.nombre))
  sel.innerHTML = lista.map(c => {
    const r = resumenCliente(c.id)
    return `<option value="${c.id}">${c.nombre}${c.empresa ? ' · ' + c.empresa : ''}  (${r.cots} cot / ${r.peds} ped)</option>`
  }).join('')
  actualizarResumenFusion()
}

function actualizarResumenFusion() {
  const destinoId = document.getElementById('fusion-destino').value
  const box = document.getElementById('fusion-resumen')
  if (!destinoId) { box.textContent = ''; return }
  const o = resumenCliente(fusionOrigenId)
  const d = todosLosClientes.find(c => c.id === destinoId)
  box.innerHTML = `Se moverán <strong>${o.cots}</strong> cotización(es) y <strong>${o.peds}</strong> pedido(s) al perfil <strong style="color:#E6BE73">${d?.nombre || ''}</strong>.`
}

function cerrarModalFusion() {
  document.getElementById('modal-fusion').classList.remove('visible')
  fusionOrigenId = null
}

async function confirmarFusion() {
  const destinoId = document.getElementById('fusion-destino').value
  if (!fusionOrigenId || !destinoId) { alert('Elige el perfil que se conserva.'); return }
  const origen  = todosLosClientes.find(c => c.id === fusionOrigenId)
  const destino = todosLosClientes.find(c => c.id === destinoId)
  if (!confirm(`¿Fusionar "${origen.nombre}" dentro de "${destino.nombre}"?\n\nEl perfil "${origen.nombre}" desaparecerá. Esta acción no se puede deshacer.`)) return

  const btn = document.getElementById('btn-fusionar')
  btn.disabled = true; btn.textContent = 'Fusionando...'
  try {
    await fusionarClientes(fusionOrigenId, destinoId)
    cerrarModalFusion()
    await cargarClientes()
  } catch (err) {
    alert('Error al fusionar: ' + err.message + '\n\nRevisa el perfil, puede haber quedado a medias.')
  } finally {
    btn.disabled = false; btn.textContent = 'Fusionar'
  }
}

// Mueve todo lo del origen al destino, completa datos vacíos del destino y borra el origen.
async function fusionarClientes(origenId, destinoId) {
  if (origenId === destinoId) throw new Error('origen y destino son el mismo perfil')
  const origen  = todosLosClientes.find(c => c.id === origenId)
  const destino = todosLosClientes.find(c => c.id === destinoId)
  if (!origen || !destino) throw new Error('perfil no encontrado')

  for (const tabla of ['cotizaciones', 'pedidos', 'pagos', 'prospectos']) {
    const { error } = await db.from(tabla).update({ cliente_id: destinoId }).eq('cliente_id', origenId)
    if (error) throw new Error(`${tabla}: ${error.message}`)
  }

  const upd = {}
  for (const f of ['empresa', 'telefono', 'email']) if (!destino[f] && origen[f]) upd[f] = origen[f]
  if (origen.notas) upd.notas = destino.notas ? destino.notas + '\n' + origen.notas : origen.notas
  if (origen.created_at < destino.created_at) upd.created_at = origen.created_at
  if (Object.keys(upd).length) {
    const { error } = await db.from('clientes').update(upd).eq('id', destinoId)
    if (error) throw new Error('clientes: ' + error.message)
  }

  const { error: errDel } = await db.from('clientes').delete().eq('id', origenId)
  if (errDel) throw new Error('borrar origen: ' + errDel.message)
}

// ── DETECTOR DE DUPLICADOS ──
function abrirModalDuplicados() {
  const grupos = gruposDuplicados()
  const box = document.getElementById('lista-duplicados')
  if (!grupos.length) {
    box.innerHTML = '<p class="empty-state" style="padding:30px">No se detectaron perfiles duplicados. 🎉</p>'
  } else {
    box.innerHTML = grupos.map((g, gi) => `
      <div style="border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:12px 14px;margin-bottom:12px">
        <div style="font-size:12px;color:#A8A29E;margin-bottom:8px">Grupo ${gi + 1} · ${g.length} perfiles</div>
        ${g.map(c => {
          const r = resumenCliente(c.id)
          return `
          <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-top:1px solid rgba(255,255,255,.05)">
            <div style="flex:1">
              <a href="/cliente-perfil.html?id=${c.id}" class="cliente-nombre-link">${c.nombre}</a>
              <div style="font-size:12px;color:#718096">${r.cots} cot · ${r.peds} ped · alta ${new Date(c.created_at).toLocaleDateString('es-SV')}${c.telefono ? ' · ' + c.telefono : ''}${c.email ? ' · ' + c.email : ''}</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="fusionarGrupoEn('${c.id}', ${JSON.stringify(g.map(x => x.id)).replace(/"/g, '&quot;')})">Conservar este</button>
          </div>`
        }).join('')}
      </div>`).join('')
  }
  document.getElementById('modal-duplicados').classList.add('visible')
}

function cerrarModalDuplicados() {
  document.getElementById('modal-duplicados').classList.remove('visible')
}

async function fusionarGrupoEn(destinoId, ids) {
  const destino = todosLosClientes.find(c => c.id === destinoId)
  const otros = ids.filter(id => id !== destinoId).map(id => todosLosClientes.find(c => c.id === id)).filter(Boolean)
  if (!destino || !otros.length) return
  if (!confirm(`Se conservará "${destino.nombre}" y se fusionarán en él:\n\n${otros.map(o => '• ' + o.nombre).join('\n')}\n\nEsta acción no se puede deshacer. ¿Continuar?`)) return
  try {
    for (const o of otros) await fusionarClientes(o.id, destinoId)
    await cargarClientes()
    abrirModalDuplicados()   // refresca la lista
  } catch (err) {
    alert('Error al fusionar: ' + err.message)
    await cargarClientes()
  }
}

function exportarCSV() {
  const ETIQUETAS_FUENTE = { web: 'Web', whatsapp: 'WhatsApp', manual: 'Manual' }
  const filas = todosLosClientes.map(c => {
    const peds = todosPedidosClientes.filter(p => p.cliente_id === c.id)
    const total = peds.reduce((s, p) => s + Number(p.total || 0), 0)
    return [
      c.nombre,
      c.empresa || '',
      c.telefono || '',
      c.email || '',
      ETIQUETAS_FUENTE[c.fuente] || c.fuente || '',
      total.toFixed(2),
      peds.length,
      new Date(c.created_at).toLocaleDateString('es-SV'),
      c.notas || ''
    ]
  })

  const csv = [
    ['Nombre', 'Empresa', 'Teléfono', 'Email', 'Origen', 'Total gastado', 'Pedidos', 'Fecha registro', 'Notas'],
    ...filas
  ].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `clientes_${new Date().toISOString().slice(0,10)}.csv`; a.click()
  URL.revokeObjectURL(url)
}
