const SUPABASE_URL = 'https://hoxorkwxjvavtvfeqsgc.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_jdUC-570RuBzex6D8ZvpwQ_Sbc9O6Zx'

const { createClient } = window.supabase
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
