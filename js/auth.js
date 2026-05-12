async function requireAuth() {
  const { data: { session } } = await db.auth.getSession()
  if (!session) {
    window.location.href = '/index.html'
    return null
  }
  return session
}

async function mostrarUsuario() {
  const { data: { session } } = await db.auth.getSession()
  const el = document.getElementById('nav-user-email')
  if (el && session) el.textContent = session.user.email
}

async function logout() {
  await db.auth.signOut()
  window.location.href = '/index.html'
}

async function loginConEmail(email, password) {
  const { error } = await db.auth.signInWithPassword({ email, password })
  if (error) throw error
  window.location.href = '/dashboard.html'
}
