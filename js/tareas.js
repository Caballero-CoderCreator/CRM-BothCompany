let todasLasTareas = []
let filtroActivo = 'todas'
let textoBusqueda = ''

const PRIORIDAD_LABEL = { baja: '🟢 Baja', media: '🟡 Media', alta: '🔴 Alta' }
const ESTADO_LABEL    = { pendiente: 'Pendiente', en_progreso: 'En progreso', completada: 'Completada' }

function formatFecha(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' })
}

function esVencida(tarea) {
  if (!tarea.vencimiento || tarea.estado === 'completada') return false
  return new Date(tarea.vencimiento + 'T23:59:59') < new Date()
}

async function cargarTareas() {
  const { data, error } = await db
    .from('tareas')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) { console.error(error); return }
  todasLasTareas = data || []
  renderStats()
  renderTabla()
}

function renderStats() {
  const contar = e => todasLasTareas.filter(t => t.estado === e).length
  document.getElementById('stat-pendientes').textContent  = contar('pendiente')
  document.getElementById('stat-progreso').textContent    = contar('en_progreso')
  document.getElementById('stat-completadas').textContent = contar('completada')
  document.getElementById('stat-vencidas').textContent    = todasLasTareas.filter(esVencida).length
}

function renderTabla() {
  let lista = filtroActivo === 'todas'
    ? todasLasTareas
    : todasLasTareas.filter(t => t.estado === filtroActivo)

  if (textoBusqueda.trim()) {
    const q = textoBusqueda.toLowerCase()
    lista = lista.filter(t => (t.titulo || '').toLowerCase().includes(q))
  }

  const tbody = document.getElementById('tabla-tareas')
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><p>No hay tareas en este estado.</p></td></tr>'
    return
  }

  tbody.innerHTML = lista.map(t => {
    const vencida = esVencida(t)
    const rowStyle = vencida ? 'background:#fff5f5' : ''
    return `
    <tr style="${rowStyle}">
      <td>
        <strong>${t.titulo}</strong>
        ${t.descripcion ? `<div style="font-size:12px;color:#718096;margin-top:2px">${t.descripcion}</div>` : ''}
        ${vencida ? `<div style="font-size:11px;color:#F87171;margin-top:2px;font-weight:600">Vencida</div>` : ''}
      </td>
      <td>${PRIORIDAD_LABEL[t.prioridad] || t.prioridad}</td>
      <td style="white-space:nowrap;font-size:13px;color:${vencida ? '#dc2626' : '#718096'}">${formatFecha(t.vencimiento)}</td>
      <td>
        <select class="btn btn-secondary btn-sm" onchange="cambiarEstado('${t.id}', this.value)">
          ${Object.entries(ESTADO_LABEL).map(([v, l]) =>
            `<option value="${v}" ${t.estado === v ? 'selected' : ''}>${l}</option>`
          ).join('')}
        </select>
      </td>
      <td style="white-space:nowrap">
        <button class="btn btn-secondary btn-sm" onclick="abrirModalEditar('${t.id}')">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="eliminarTarea('${t.id}')">✕</button>
      </td>
    </tr>`
  }).join('')
}

function aplicarFiltro(estado) {
  filtroActivo = estado
  document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.estado === estado)
  })
  renderTabla()
}

function buscar(texto) { textoBusqueda = texto; renderTabla() }

async function cambiarEstado(id, nuevoEstado) {
  const { error } = await db.from('tareas').update({ estado: nuevoEstado }).eq('id', id)
  if (error) { alert('Error: ' + error.message); return }
  await cargarTareas()
}

function abrirModal() {
  document.getElementById('modal-titulo').textContent = 'Nueva tarea'
  document.getElementById('tarea-id').value = ''
  document.getElementById('campo-titulo').value = ''
  document.getElementById('campo-descripcion').value = ''
  document.getElementById('campo-prioridad').value = 'media'
  document.getElementById('campo-vencimiento').value = ''
  document.getElementById('campo-estado').value = 'pendiente'
  document.getElementById('modal-tarea').classList.add('visible')
  document.getElementById('campo-titulo').focus()
}

function abrirModalEditar(id) {
  const t = todasLasTareas.find(t => t.id === id)
  if (!t) return
  document.getElementById('modal-titulo').textContent = 'Editar tarea'
  document.getElementById('tarea-id').value = t.id
  document.getElementById('campo-titulo').value = t.titulo || ''
  document.getElementById('campo-descripcion').value = t.descripcion || ''
  document.getElementById('campo-prioridad').value = t.prioridad || 'media'
  document.getElementById('campo-vencimiento').value = t.vencimiento || ''
  document.getElementById('campo-estado').value = t.estado || 'pendiente'
  document.getElementById('modal-tarea').classList.add('visible')
}

function cerrarModal() {
  document.getElementById('modal-tarea').classList.remove('visible')
}

async function guardarTarea() {
  const id = document.getElementById('tarea-id').value
  const datos = {
    titulo:      document.getElementById('campo-titulo').value.trim(),
    descripcion: document.getElementById('campo-descripcion').value.trim(),
    prioridad:   document.getElementById('campo-prioridad').value,
    vencimiento: document.getElementById('campo-vencimiento').value || null,
    estado:      document.getElementById('campo-estado').value
  }

  if (!datos.titulo) { alert('El título es obligatorio'); return }

  let error
  if (id) {
    ;({ error } = await db.from('tareas').update(datos).eq('id', id))
  } else {
    ;({ error } = await db.from('tareas').insert(datos))
  }

  if (error) { alert('Error al guardar: ' + error.message); return }
  cerrarModal()
  await cargarTareas()
}

async function eliminarTarea(id) {
  if (!confirm('¿Eliminar esta tarea?')) return
  const { error } = await db.from('tareas').delete().eq('id', id)
  if (error) { alert('Error: ' + error.message); return }
  await cargarTareas()
}
