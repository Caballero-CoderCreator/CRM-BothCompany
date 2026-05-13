-- ================================================================
-- CATÁLOGO DE PRODUCTOS BOTH COMPANY
-- Ejecutar en Supabase SQL Editor
-- ================================================================

-- Tabla de secciones/categorías
CREATE TABLE IF NOT EXISTS catalogo_secciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  icono TEXT DEFAULT '📦',
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS catalogo_productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seccion_id UUID REFERENCES catalogo_secciones(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  precio TEXT DEFAULT '',
  notas TEXT DEFAULT '',
  tipo TEXT DEFAULT 'custom',
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE catalogo_secciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cat_sec_auth" ON catalogo_secciones FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE catalogo_productos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cat_prod_auth" ON catalogo_productos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────
-- DATOS INICIALES
-- ────────────────────────────────────────────

-- Insertar secciones
WITH secciones AS (
  INSERT INTO catalogo_secciones (nombre, descripcion, icono, orden) VALUES
    ('Camisas Tipo Polo',        'Tela piqué y Dryfit · Cuello y botones',                          '👔', 1),
    ('Camisas Tipo Oxford',      'Tela Oxford y Lino · Formales · Manga corta, ¾ y larga',          '🔵', 2),
    ('Camisas / Blusas Columbia','Locales e importadas · Manga corta y larga · Con reflectivo',     '🟦', 3),
    ('Camisetas',                'Manga corta y larga · Estampado o bordado · Tallas adulto y niño','👕', 4),
    ('Chumpas y Outerwear',      'Con forro interior · Bordado personalizado',                       '🧥', 5),
    ('Ropa de Trabajo',          'Gastronomía · Mecánica · Seguridad · Salud',                      '🍳', 6),
    ('Pantalones',               'Vestir, jeans y deportivos · Hombre y mujer',                     '👖', 7),
    ('Gorras',                   'Con bordado personalizado · O bordado solo en tu gorra',           '🧢', 8),
    ('Bordados y Serigrafía',    'Servicio de personalización por unidad',                           '🪡', 9),
    ('Impresos y Promo',         'Bolsas, listones, volantes y más',                                '🖨️',10),
    ('Accesorios',               'Artículos personalizados para empresa',                            '☕',11)
  RETURNING id, nombre, orden
)
-- Insertar productos por sección
INSERT INTO catalogo_productos (seccion_id, nombre, precio, notas, tipo, orden)

-- ── POLO ──
SELECT id, 'Polo Piqué — base sin personalización',         '$12 – $14',   'Sin bordado ni estampado', 'base',     1  FROM secciones WHERE nombre = 'Camisas Tipo Polo' UNION ALL
SELECT id, 'Polo Piqué + 1 bordado',                        '$17 – $20',   'Pedidos 2–20 u.', 'bordado1', 2  FROM secciones WHERE nombre = 'Camisas Tipo Polo' UNION ALL
SELECT id, 'Polo Piqué + 2 bordados',                       '$21 – $24',   '', 'bordado2', 3  FROM secciones WHERE nombre = 'Camisas Tipo Polo' UNION ALL
SELECT id, 'Polo Piqué + 3 bordados',                       '$24 – $28',   'En volumen 100+ u.: desde $14.03', 'bordado3', 4  FROM secciones WHERE nombre = 'Camisas Tipo Polo' UNION ALL
SELECT id, 'Polo Piqué — Talla especial (5XL+)',             '$21.00',      'PRD-38', 'especial', 5  FROM secciones WHERE nombre = 'Camisas Tipo Polo' UNION ALL
SELECT id, 'Polo Dryfit — base sin personalización',         '$8 – $10',    'Tela técnica liviana', 'base',     6  FROM secciones WHERE nombre = 'Camisas Tipo Polo' UNION ALL
SELECT id, 'Polo Dryfit + 1 bordado',                        '$12 – $15',   '', 'bordado1', 7  FROM secciones WHERE nombre = 'Camisas Tipo Polo' UNION ALL
SELECT id, 'Polo Dryfit + 2 bordados',                       '$16 – $19',   'En volumen: $8.00/u (pedido 9 u.)', 'bordado2', 8  FROM secciones WHERE nombre = 'Camisas Tipo Polo' UNION ALL
SELECT id, 'Polo Dryfit + 3 bordados',                       '$19 – $22',   '', 'bordado3', 9  FROM secciones WHERE nombre = 'Camisas Tipo Polo' UNION ALL
SELECT id, 'Polo Dryfit talla 4XL + 3 bordados',             '$19.50',      'Confirmado en factura', 'especial', 10 FROM secciones WHERE nombre = 'Camisas Tipo Polo' UNION ALL

-- ── OXFORD ──
SELECT id, 'Oxford Manga Corta — base',                      '$13 – $15',   'Sin bordado', 'base',     1  FROM secciones WHERE nombre = 'Camisas Tipo Oxford' UNION ALL
SELECT id, 'Oxford Manga Corta + 1 bordado',                 '$17.75 – $21','Pedidos 2–10 u.', 'bordado1', 2  FROM secciones WHERE nombre = 'Camisas Tipo Oxford' UNION ALL
SELECT id, 'Oxford Manga Corta + 2 bordados',                '$21 – $25',   '', 'bordado2', 3  FROM secciones WHERE nombre = 'Camisas Tipo Oxford' UNION ALL
SELECT id, 'Oxford Manga 3/4 + bordados',                    '$21.50',      'Pedido de 4 u. confirmado', 'especial', 4  FROM secciones WHERE nombre = 'Camisas Tipo Oxford' UNION ALL
SELECT id, 'Oxford Manga Corta — Talla especial',             '$23.00',      'PRD-37', 'especial', 5  FROM secciones WHERE nombre = 'Camisas Tipo Oxford' UNION ALL
SELECT id, 'Oxford Manga Larga — base',                      '$14 – $16',   'Sin bordado', 'base',     6  FROM secciones WHERE nombre = 'Camisas Tipo Oxford' UNION ALL
SELECT id, 'Oxford Manga Larga + 1 bordado',                 '$18.50 – $23','Pedidos 2–10 u.', 'bordado1', 7  FROM secciones WHERE nombre = 'Camisas Tipo Oxford' UNION ALL
SELECT id, 'Oxford Manga Larga tipo Racing (Lino) + 2 logos','$19.90',      'Pedido 54 u. confirmado', 'bordado2', 8  FROM secciones WHERE nombre = 'Camisas Tipo Oxford' UNION ALL
SELECT id, 'Oxford Manga Larga + 2 bordados',                '$22 – $27',   '', 'bordado2', 9  FROM secciones WHERE nombre = 'Camisas Tipo Oxford' UNION ALL
SELECT id, 'Oxford Manga Larga — Talla especial',             '$25.00',      'PRD-39', 'especial', 10 FROM secciones WHERE nombre = 'Camisas Tipo Oxford' UNION ALL

-- ── COLUMBIA ──
SELECT id, 'Columbia Manga Corta — base (local)',             '$14 – $17',   'Sin personalización', 'base',     1  FROM secciones WHERE nombre = 'Camisas / Blusas Columbia' UNION ALL
SELECT id, 'Columbia Manga Corta + 1 bordado',               '$18 – $22',   '', 'bordado1', 2  FROM secciones WHERE nombre = 'Camisas / Blusas Columbia' UNION ALL
SELECT id, 'Columbia Manga Corta + 2 bordados',              '$19.50 – $23','', 'bordado2', 3  FROM secciones WHERE nombre = 'Camisas / Blusas Columbia' UNION ALL
SELECT id, 'Columbia Manga Corta + 3 bordados',              '$24.72',      'Pedido 130 u. confirmado', 'bordado3', 4  FROM secciones WHERE nombre = 'Camisas / Blusas Columbia' UNION ALL
SELECT id, 'Columbia Manga Corta Importada + 1 bordado',     '$27.99',      'Confirmado en factura', 'especial', 5  FROM secciones WHERE nombre = 'Camisas / Blusas Columbia' UNION ALL
SELECT id, 'Columbia Manga Larga — base (local)',             '$16 – $20',   'Sin personalización', 'base',     6  FROM secciones WHERE nombre = 'Camisas / Blusas Columbia' UNION ALL
SELECT id, 'Columbia Manga Larga + 2 bordados',              '$31.99 – $32','', 'bordado2', 7  FROM secciones WHERE nombre = 'Camisas / Blusas Columbia' UNION ALL
SELECT id, 'Columbia Manga Larga + 3 bordados',              '$26.51',      'Pedido 260+ u. confirmado', 'bordado3', 8  FROM secciones WHERE nombre = 'Camisas / Blusas Columbia' UNION ALL
SELECT id, 'Columbia Manga Larga Importada + 1 bordado',     '$30.00',      'Confirmado en factura', 'especial', 9  FROM secciones WHERE nombre = 'Camisas / Blusas Columbia' UNION ALL
SELECT id, 'Columbia Manga Larga Importada + 2 bordados',    '$32.00',      'Confirmado en factura', 'especial', 10 FROM secciones WHERE nombre = 'Camisas / Blusas Columbia' UNION ALL
SELECT id, 'Columbia Manga Larga + Reflectivo + 2 logos',    '$26.00',      'Pedido 81 u. confirmado', 'reflectivo', 11 FROM secciones WHERE nombre = 'Camisas / Blusas Columbia' UNION ALL

-- ── CAMISETAS ──
SELECT id, 'Camiseta Manga Corta — base',                    '$5 – $6',     '', 'base',     1  FROM secciones WHERE nombre = 'Camisetas' UNION ALL
SELECT id, 'Camiseta Manga Corta + 1 estampado',             '$5.75 – $7',  '', 'bordado1', 2  FROM secciones WHERE nombre = 'Camisetas' UNION ALL
SELECT id, 'Camiseta Manga Corta + 2 estampados',            '$9 – $11',    '', 'bordado2', 3  FROM secciones WHERE nombre = 'Camisetas' UNION ALL
SELECT id, 'Camiseta Manga Corta + 3 estampados',            '$10.57',      'Pedido 7 u. confirmado', 'bordado3', 4  FROM secciones WHERE nombre = 'Camisetas' UNION ALL
SELECT id, 'Camiseta Manga Corta + bordado',                 '$9 – $11',    'En lugar de estampado', 'bordado1', 5  FROM secciones WHERE nombre = 'Camisetas' UNION ALL
SELECT id, 'Camiseta Manga Corta — Talla especial adulto',   '$11.00',      '', 'especial', 6  FROM secciones WHERE nombre = 'Camisetas' UNION ALL
SELECT id, 'Camiseta niño — talla 4 a 8',                   '$5 – $7',     'Con o sin estampado', 'base',     7  FROM secciones WHERE nombre = 'Camisetas' UNION ALL
SELECT id, 'Camiseta Manga Larga — base',                    '$10 – $11.87','Confirmado 310+ u.', 'base',     8  FROM secciones WHERE nombre = 'Camisetas' UNION ALL
SELECT id, 'Camiseta Manga Larga — color especial (roja)',   '$13.50',      '', 'especial', 9  FROM secciones WHERE nombre = 'Camisetas' UNION ALL
SELECT id, 'Camiseta Manga Larga + Reflectivo bordado',      '$14.00',      'Pedido 12 u.', 'reflectivo', 10 FROM secciones WHERE nombre = 'Camisetas' UNION ALL
SELECT id, 'Camiseta Manga Larga Reflectivo — Talla 4XL',    '$17.00',      '', 'reflectivo', 11 FROM secciones WHERE nombre = 'Camisetas' UNION ALL

-- ── CHUMPAS ──
SELECT id, 'Chumpa Rodeo Sport — base sin bordado',          '$28 – $32',   'Con forro interior', 'base',     1  FROM secciones WHERE nombre = 'Chumpas y Outerwear' UNION ALL
SELECT id, 'Chumpa Rodeo Sport + 1 bordado',                 '$35.00',      'Pedido 49 u. confirmado', 'bordado1', 2  FROM secciones WHERE nombre = 'Chumpas y Outerwear' UNION ALL
SELECT id, 'Chumpa Rodeo Sport + 2 bordados',                '$39 – $43',   '', 'bordado2', 3  FROM secciones WHERE nombre = 'Chumpas y Outerwear' UNION ALL
SELECT id, 'Chumpa Importada + 1 bordado',                   '$35.40',      'Confirmado en factura', 'especial', 4  FROM secciones WHERE nombre = 'Chumpas y Outerwear' UNION ALL
SELECT id, 'Paquete Promo (Chumpa + Polo + Camiseta)',       '$77.00',      'Precio de paquete completo', 'especial', 5  FROM secciones WHERE nombre = 'Chumpas y Outerwear' UNION ALL
SELECT id, 'Suéter',                                         '$10.00',      '', 'base',     6  FROM secciones WHERE nombre = 'Chumpas y Outerwear' UNION ALL
SELECT id, 'Pants Deportivo',                                '$9.50',       'Adulto y niño (talla 4–8)', 'base',  7  FROM secciones WHERE nombre = 'Chumpas y Outerwear' UNION ALL
SELECT id, 'Pants Enfermero',                                '$11.00',      'Tela especial uso médico', 'base',   8  FROM secciones WHERE nombre = 'Chumpas y Outerwear' UNION ALL

-- ── ROPA DE TRABAJO ──
SELECT id, 'Filipina Chef Manga Corta + 1 bordado',          '$25 – $26',   'Pedido 16 u. confirmado', 'bordado1', 1  FROM secciones WHERE nombre = 'Ropa de Trabajo' UNION ALL
SELECT id, 'Filipina Chef Manga Larga + 1 bordado',          '$27.00',      'Confirmado en factura', 'bordado1', 2  FROM secciones WHERE nombre = 'Ropa de Trabajo' UNION ALL
SELECT id, 'Gabacha Tipo Mecánico con Reflectivo',           '$22.00',      'Ideal talleres y mecánicos', 'reflectivo', 3  FROM secciones WHERE nombre = 'Ropa de Trabajo' UNION ALL
SELECT id, 'Mandiles',                                       '$12.00',      'Cocina y gastronomía', 'base',     4  FROM secciones WHERE nombre = 'Ropa de Trabajo' UNION ALL
SELECT id, 'Chalecos',                                       '$25.00',      'Corporativo y de campo', 'base',    5  FROM secciones WHERE nombre = 'Ropa de Trabajo' UNION ALL
SELECT id, 'Bata Embarazada con bordado',                    '$18.50',      'Bordado incluido', 'bordado1', 6  FROM secciones WHERE nombre = 'Ropa de Trabajo' UNION ALL

-- ── PANTALONES ──
SELECT id, 'Pantalón Vestir Hombre',                         '$22 – $25',   'Precio según talla y modelo', 'base', 1  FROM secciones WHERE nombre = 'Pantalones' UNION ALL
SELECT id, 'Pantalón Vestir Mujer',                          '$22.00',      'Confirmado en factura', 'base',    2  FROM secciones WHERE nombre = 'Pantalones' UNION ALL
SELECT id, 'Jeans Hombre (Lona 14.5 oz)',                    '$22.50',      'Mezclilla pesada resistente', 'base', 3 FROM secciones WHERE nombre = 'Pantalones' UNION ALL
SELECT id, 'Bermudas Hombre',                                '$15.00',      '', 'base',     4  FROM secciones WHERE nombre = 'Pantalones' UNION ALL

-- ── GORRAS ──
SELECT id, 'Solo bordado (cliente trae la gorra)',            '$3 – $4',     'El cliente proporciona la gorra', 'bordado1', 1  FROM secciones WHERE nombre = 'Gorras' UNION ALL
SELECT id, 'Gorra básica + 1 bordado',                       '$5.50',       'Pedido 30 gorras amarillas confirmado', 'bordado1', 2  FROM secciones WHERE nombre = 'Gorras' UNION ALL
SELECT id, 'Gorra premium + 1 bordado',                      '$8 – $9.94',  'Gorra de mejor calidad incluida', 'especial', 3  FROM secciones WHERE nombre = 'Gorras' UNION ALL

-- ── BORDADOS ──
SELECT id, 'Bordado en camisa (por unidad)',                  '$4 – $6',     'Logo hasta X puntadas · Baja en volumen', 'base', 1  FROM secciones WHERE nombre = 'Bordados y Serigrafía' UNION ALL
SELECT id, 'Bordado en gorra (por unidad)',                   '$3 – $4',     'El cliente trae la gorra', 'base',  2  FROM secciones WHERE nombre = 'Bordados y Serigrafía' UNION ALL
SELECT id, 'Serigrafía 1 color por unidad',                  '$0.75',       'Mínimo según cantidad', 'base',     3  FROM secciones WHERE nombre = 'Bordados y Serigrafía' UNION ALL
SELECT id, 'Serigrafía full color (paquete)',                 'desde $88',   'Precio por lote completo', 'especial', 4  FROM secciones WHERE nombre = 'Bordados y Serigrafía' UNION ALL

-- ── IMPRESOS ──
SELECT id, 'Bolsas ecológicas con serigrafía',               '$1.50 c/u',   'Pedido mínimo 100 u.', 'base',     1  FROM secciones WHERE nombre = 'Impresos y Promo' UNION ALL
SELECT id, 'Listón impreso',                                 '$17.70 – $35','Precio según longitud y diseño', 'base', 2  FROM secciones WHERE nombre = 'Impresos y Promo' UNION ALL
SELECT id, 'Trifoliares para capacitación',                  '$1.35 c/u',   'Pedido mínimo 250 u.', 'base',     3  FROM secciones WHERE nombre = 'Impresos y Promo' UNION ALL
SELECT id, 'Stickers / Flyers adhesivos',                    '$2.00 c/u',   '', 'base',     4  FROM secciones WHERE nombre = 'Impresos y Promo' UNION ALL
SELECT id, '300 Volantes Full Color (Tiro y Retiro)',        '$80 paquete', 'Precio por paquete de 300 unidades', 'especial', 5  FROM secciones WHERE nombre = 'Impresos y Promo' UNION ALL

-- ── ACCESORIOS ──
SELECT id, 'Tazas personalizadas',                           '$6.78 c/u',   'Con diseño impreso', 'base',       1  FROM secciones WHERE nombre = 'Accesorios' UNION ALL
SELECT id, 'Porta vasos',                                    '$2.26 c/u',   '', 'base',     2  FROM secciones WHERE nombre = 'Accesorios';

-- Verificar
SELECT s.nombre AS seccion, COUNT(p.id) AS productos
FROM catalogo_secciones s
LEFT JOIN catalogo_productos p ON p.seccion_id = s.id
GROUP BY s.nombre, s.orden
ORDER BY s.orden;
