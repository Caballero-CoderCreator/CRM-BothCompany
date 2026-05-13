-- Crear tabla de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  estado TEXT DEFAULT 'pendiente',
  total NUMERIC DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pedidos_auth" ON pedidos
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Actualizar constraint de cotizaciones (quitar en_produccion/entregada, agregar rechazada)
ALTER TABLE cotizaciones DROP CONSTRAINT IF EXISTS cotizaciones_estado_check;
ALTER TABLE cotizaciones
  ADD CONSTRAINT cotizaciones_estado_check
  CHECK (estado IN ('borrador', 'enviada', 'aprobada', 'rechazada'));
