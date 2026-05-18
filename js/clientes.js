let todosLosClientes = []
let todosPedidosClientes = []

async function cargarClientes() {
  const [
    { data: clientes, error },
    { data: pedidos }
  ] = await Promise.all([
    db.from('clientes').select('*').order('created_at', { ascending: false }),
    db.from('pedidos').select('cliente_id, total, created_at')
  ])

  if (error) { console.error(error); return }
  todosLosClientes    = clientes || []
  todosPedidosClientes = pedidos || []
  renderizarClientes(todosLosClientes)
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
  if (!confirm('¿Eliminar este cliente? Esta acción no se puede deshacer.')) return
  const { error } = await db.from('clientes').delete().eq('id', id)
  if (error) { alert('Error al eliminar: ' + error.message); return }
  await cargarClientes()
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
