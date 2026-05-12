let todosLosClientes = []

async function cargarClientes() {
  const { data, error } = await db
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) { console.error(error); return }
  todosLosClientes = data
  renderizarClientes(data)
}

function renderizarClientes(lista) {
  const tbody = document.getElementById('tabla-clientes')
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><p>No hay clientes aún. Crea el primero.</p></td></tr>'
    return
  }
  tbody.innerHTML = lista.map(c => `
    <tr>
      <td><strong>${c.nombre}</strong></td>
      <td>${c.empresa || '—'}</td>
      <td>${c.telefono || '—'}</td>
      <td>${BADGES_FUENTE[c.fuente] || c.fuente}</td>
      <td>
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
    (c.telefono || '').includes(t)
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
    nombre: document.getElementById('campo-nombre').value.trim(),
    empresa: document.getElementById('campo-empresa').value.trim(),
    telefono: document.getElementById('campo-telefono').value.trim(),
    email: document.getElementById('campo-email').value.trim(),
    notas: document.getElementById('campo-notas').value.trim(),
    fuente: document.getElementById('campo-fuente').value
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
