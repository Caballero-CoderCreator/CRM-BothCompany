// ── EDITAR PEDIDO (compartido entre pedidos.html y pagos.html) ──
// Permite corregir cualquier pedido sin importar su estado: estado, total, notas,
// o mandarlo a la papelera (por ejemplo un pedido que nunca se produjo y aparece "Sin pagar").
const EDIT_ESTADOS = {
  pendiente: 'Pendiente', en_produccion: 'En producción', listo: 'Listo',
  entregado: 'Entregado', pagado: 'Pagado', no_cobrable: 'No se cobra'
}
let editPedidoId = null
let editRecargar = null

function montarModalEditarPedido() {
  if (document.getElementById('modal-editar-pedido')) return
  const div = document.createElement('div')
  div.innerHTML = `
  <div class="modal-overlay" id="modal-editar-pedido" onclick="if(event.target===this)cerrarEditarPedido()">
    <div class="modal" style="max-width:460px">
      <div class="modal-header">
        <span class="modal-title">Editar pedido <span id="edit-ped-numero"></span></span>
        <button class="btn-close" onclick="cerrarEditarPedido()">✕</button>
      </div>
      <div id="edit-ped-info" style="background:#f7f3ee;border-radius:8px;padding:10px 14px;font-size:13px;color:#4a5568;margin-bottom:20px"></div>
      <div class="form-group">
        <label>Estado</label>
        <select id="edit-ped-estado">
          ${Object.entries(EDIT_ESTADOS).map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Total del pedido ($)</label>
        <input type="number" id="edit-ped-total" min="0" step="0.01">
      </div>
      <div class="form-group">
        <label>Notas</label>
        <textarea id="edit-ped-notas" style="min-height:70px"></textarea>
      </div>
      <div style="display:flex;gap:8px;justify-content:space-between;align-items:center;flex-wrap:wrap">
        <button class="btn btn-secondary" style="color:#ef4444" onclick="papeleraDesdeEditar()" title="No se produjo / fue un error">🗑️ Mover a papelera</button>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary" onclick="cerrarEditarPedido()">Cancelar</button>
          <button class="btn btn-primary" id="btn-guardar-edit-ped" onclick="guardarEditarPedido()">Guardar</button>
        </div>
      </div>
    </div>
  </div>`
  document.body.appendChild(div.firstElementChild)
}

// lista: array con los pedidos cargados en la página; recargar: función que vuelve a cargar la tabla
function abrirEditarPedido(id, lista, recargar) {
  montarModalEditarPedido()
  const ped = (lista || []).find(p => p.id === id)
  if (!ped) return
  editPedidoId = id
  editRecargar = recargar

  document.getElementById('edit-ped-numero').textContent = ped.numero || ''
  document.getElementById('edit-ped-info').innerHTML =
    `${ped.clientes?.nombre || '—'}${ped.clientes?.empresa ? ' · ' + ped.clientes.empresa : ''}` +
    `<br><span style="color:#9ca3af">Se puede editar en cualquier estado. Si el pedido nunca se hizo, usa "Mover a papelera" para que salga de cuentas por cobrar.</span>`
  const sel = document.getElementById('edit-ped-estado')
  sel.value = EDIT_ESTADOS[ped.estado] ? ped.estado : 'pendiente'
  document.getElementById('edit-ped-total').value = Number(ped.total || 0).toFixed(2)
  document.getElementById('edit-ped-notas').value = ped.notas || ''
  document.getElementById('modal-editar-pedido').classList.add('visible')
}

function cerrarEditarPedido() {
  document.getElementById('modal-editar-pedido')?.classList.remove('visible')
  editPedidoId = null
}

async function guardarEditarPedido() {
  if (!editPedidoId) return
  const estado = document.getElementById('edit-ped-estado').value
  const total  = parseFloat(document.getElementById('edit-ped-total').value)
  const notas  = document.getElementById('edit-ped-notas').value.trim()
  if (isNaN(total) || total < 0) { alert('El total debe ser un número mayor o igual a cero'); return }
  if (estado === 'no_cobrable' &&
      !confirm('Marcar como "No se cobra" saca el pedido de cuentas por cobrar y de los ingresos.\n\n¿Confirmar?')) return

  const btn = document.getElementById('btn-guardar-edit-ped')
  btn.disabled = true; btn.textContent = 'Guardando...'
  const { error } = await db.from('pedidos').update({ estado, total, notas }).eq('id', editPedidoId)
  btn.disabled = false; btn.textContent = 'Guardar'
  if (error) { alert('Error al guardar: ' + error.message); return }

  cerrarEditarPedido()
  if (typeof editRecargar === 'function') await editRecargar()
}

async function papeleraDesdeEditar() {
  if (!editPedidoId) return
  const numero = document.getElementById('edit-ped-numero').textContent
  if (!confirm(`¿Mover el pedido ${numero} a la papelera?\n\nDejará de contar en pedidos y en cuentas por cobrar. Podrás restaurarlo desde la papelera de Pedidos.`)) return
  const { error } = await db.from('pedidos').update({ estado: 'eliminado' }).eq('id', editPedidoId)
  if (error) { alert('Error: ' + error.message); return }
  cerrarEditarPedido()
  if (typeof editRecargar === 'function') await editRecargar()
}
