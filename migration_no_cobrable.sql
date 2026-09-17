-- Migración 16-sep-2026: estado "no_cobrable" para pedidos que no se van a cobrar
-- (caso especial, cortesía o incobrable). Sale de cuentas por cobrar y de ingresos.
--
-- CÓMO APLICAR: Supabase > SQL Editor > pegar todo > Run.
-- Hasta que se aplique, elegir "No se cobra" en Pedidos da error de constraint.

ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_estado_check;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_estado_check
  CHECK (estado IN ('pendiente', 'en_produccion', 'listo', 'entregado', 'pagado', 'no_cobrable', 'eliminado'));

-- COT-158 / PROSEGUR: anotación del 16-sep-2026 "no se va a pagar, caso especial"
UPDATE pedidos SET estado = 'no_cobrable' WHERE numero = 'PED-COT-158';
