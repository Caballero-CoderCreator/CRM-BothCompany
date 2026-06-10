/* ════════════════════════════════════════════════════════════
   Both Company — UI Icons (Dark Luxury)
   Reemplaza emojis por iconos SVG (estilo Lucide) sin tocar la
   lógica ni los datos. Solo mejora el aspecto visual.
   Se aplica a .nav-icon, .stat-icon y .btn-icon que contengan
   un emoji conocido.
   ════════════════════════════════════════════════════════════ */
(function () {
  const S = (p, extra) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"${extra || ''}>${p}</svg>`;

  // Mapa emoji -> path SVG
  const ICONS = {
    '⊞': S('<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>'),
    '👤': S('<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
    '👥': S('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'),
    '📋': S('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h4"/>'),
    '📦': S('<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>'),
    '🗂️': S('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>'),
    '🗂': S('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>'),
    '💳': S('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>'),
    '✅': S('<path d="M11 12H3M16 6H3M21 18H3"/><path d="m16 16 2 2 4-4"/>'),
    '📱': S('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/>'),
    '❓': S('<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>'),
    '⚙': S('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
    '⚙️': S('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
    '💰': S('<line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
    '📊': S('<path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6" rx="1"/><rect x="12" y="7" width="3" height="10" rx="1"/><rect x="17" y="13" width="3" height="4" rx="1"/>'),
    '🏭': S('<path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2.6L16 4H8L6.6 6H4a2 2 0 0 0-2 2z"/><path d="M6 14h.01M10 14h.01M14 14h.01M18 14h.01"/>'),
    '📤': S('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/>'),
    '🧾': S('<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M8 7h8M8 11h8M8 15h5"/>'),
    '💸': S('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>'),
    '📈': S('<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>'),
    '⚖️': S('<path d="M12 3v18M7 21h10"/><path d="M5 7h14l-3 6a3 3 0 0 1-4 0zM5 7 2 13a3 3 0 0 0 4 0z"/><path d="m19 7-3 6a3 3 0 0 0 4 0z"/>'),
    '⚖': S('<path d="M12 3v18M7 21h10"/><path d="M5 7h14l-3 6a3 3 0 0 1-4 0zM5 7 2 13a3 3 0 0 0 4 0z"/><path d="m19 7-3 6a3 3 0 0 0 4 0z"/>'),
    '🔄': S('<path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>'),
    '🎯': S('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
    '📅': S('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
    '🌐': S('<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
    '🏢': S('<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/>'),
    '📞': S('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>'),
    '✉️': S('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>'),
    '✉': S('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>'),
    '📎': S('<path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.49"/>'),
    '✏️': S('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
    '✏': S('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
    '📝': S('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z"/>'),
    '✅': S('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/>'),
    '✔️': S('<path d="M20 6 9 17l-5-5"/>'),
    '✔': S('<path d="M20 6 9 17l-5-5"/>'),
    '❌': S('<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>'),
    '❎': S('<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>'),
    '🔴': S('<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>'),
    '🟡': S('<circle cx="12" cy="12" r="9"/>'),
    '🟢': S('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/>'),
    '💵': S('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>'),
    '🏦': S('<path d="M3 21h18M4 10h16M5 6l7-3 7 3M5 10v11M12 10v11M19 10v11"/>'),
    '🗑️': S('<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
    '🗑': S('<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
    '📥': S('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/>')
  };

  // Emojis de estado con color propio (se conserva el significado de color)
  const DOTS = { '🔴': '#F87171', '🟡': '#E6BE73', '🟢': '#4ADE80' };

  function replaceIn(el) {
    const key = (el.textContent || '').trim();
    if (ICONS[key]) {
      el.innerHTML = ICONS[key];
      el.classList.add('icon-svg');
    }
  }

  // Reemplaza un emoji al INICIO del contenido por su SVG, conservando el resto
  // (p. ej. "🏢 <span>Empresa</span>" o "📋 Cotizaciones").
  const LEAD_RE = /^\s*(\p{Extended_Pictographic}️?)\s*/u;

  function decorateLead(el) {
    if (el.dataset.dlIcon) return;
    // <option> no admite SVG: solo se quita el emoji (el value no cambia)
    if (el.tagName === 'OPTION') {
      const t = el.textContent;
      const n = t.replace(LEAD_RE, '');
      if (n !== t) { el.textContent = n; el.dataset.dlIcon = '1'; }
      return;
    }
    const html = el.innerHTML;
    const m = html.match(LEAD_RE);
    if (!m) return;
    const emoji = m[1].replace('️', '');
    el.dataset.dlIcon = '1';
    let lead = '';
    if (DOTS[emoji]) lead = `<span class="dl-dot" style="background:${DOTS[emoji]}"></span>`;
    else if (ICONS[emoji]) lead = `<span class="dl-lead-ic">${ICONS[emoji]}</span>`;
    el.innerHTML = lead + html.slice(m[0].length);
  }

  function run() {
    document.querySelectorAll('.nav-icon, .stat-icon, .btn-icon, .archivo-icono').forEach(replaceIn);
    document.querySelectorAll('.perfil-dato, .tab-btn, .filtro-btn, .modal-title, .btn, option').forEach(decorateLead);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  // Tema oscuro para Chart.js (solo visual: legibilidad sobre tarjetas oscuras)
  if (window.Chart) {
    Chart.defaults.color = '#87837A';
    Chart.defaults.borderColor = 'rgba(255,255,255,.08)';
    Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
  }
})();
