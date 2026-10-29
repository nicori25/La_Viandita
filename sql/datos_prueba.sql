-- ============================================================================
-- Datos de prueba para "La Viandita" - Precooperativa escolar
-- Script para cargar cuentas de ejemplo y datos predeterminados.
-- Compatible con Supabase (PostgreSQL).
--
-- IMPORTANTE SOBRE CONTRASEÑAS:
--   Supabase Auth gestiona las contraseñas con hash bcrypt. Por seguridad,
--   no se pueden insertar contraseñas en texto plano directamente en la tabla
--   auth.users desde SQL simple. Las cuentas de auth deben crearse en:
--     Supabase Dashboard > Authentication > Users > Add user
--   Una vez creadas, copiá el "User ID" de cada cuenta y pegalo en la columna
--   auth_user_id de la tabla usuarios (más abajo).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. CATÁLOGOS (tipos de vianda, comisiones, cargos)
-- ---------------------------------------------------------------------------

INSERT INTO tipos_vianda (nombre, descripcion, activo) VALUES
  ('sándwich', 'Sándwich de miga o pan casero', true),
  ('tarta', 'Tarta salada por porción', true),
  ('ensalada', 'Ensalada mixta con aderezo', true),
  ('pasta', 'Pastas con salsa', true),
  ('wrap', 'Wrap o tortilla rellena', true),
  ('otra', 'Otro tipo de vianda', true)
ON CONFLICT DO NOTHING;

INSERT INTO comisiones (nombre, descripcion, activo) VALUES
  ('Administración', 'Cobros, registro de suscripciones, comprobantes, Libro de Caja', true),
  ('Compras', 'Presupuestos y compra de insumos', true),
  ('Producción', 'Armar las viandas', true),
  ('Distribución', 'Entregas y lista de retiro por curso', true),
  ('Comunicación', 'Publicidad y menú semanal', true),
  ('Control e higiene', 'Limpieza, vencimientos y temperaturas', true)
ON CONFLICT DO NOTHING;

INSERT INTO cargos (nombre, descripcion) VALUES
  ('Presidente', 'Encabeza el Consejo de Administración'),
  ('Secretario', 'Lleva el Libro de Actas y actas de reuniones'),
  ('Tesorero', 'Maneja el Libro de Caja y pagos'),
  ('Coordinador de Producción', 'Coordina el armado de viandas'),
  ('Coordinador de Distribución', 'Coordina entregas y lista de retiro')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. ASOCIADOS (datos personales confidenciales)
-- ---------------------------------------------------------------------------

INSERT INTO asociados (nombre, apellido, curso, division, telefono, fecha_alta, activo) VALUES
  ('Juan', 'Pérez', 1, '1', '2231-123456', '2026-03-01', true),
  ('María', 'González', 2, '2', '2231-123457', '2026-03-01', true),
  ('Luis', 'Rodríguez', 3, '1', '2231-123458', '2026-03-02', true),
  ('Ana', 'Martínez', 4, '3', '2231-123459', '2026-03-02', true),
  ('Pedro', 'López', 5, '2', '2231-123460', '2026-03-03', true),
  ('Sofía', 'Fernández', 6, '1', '2231-123461', '2026-03-03', true),
  ('Tomás', 'Díaz', 7, '3', '2231-123462', '2026-03-04', true),
  ('Valentina', 'Suárez', 1, '3', '2231-123463', '2026-03-04', true),
  ('Bruno', 'Romero', 2, '1', '2231-123464', '2026-03-05', true),
  ('Camila', 'Álvarez', 3, '2', '2231-123465', '2026-03-05', true)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. MENÚ SEMANAL (ejemplos para varias semanas)
-- ---------------------------------------------------------------------------

INSERT INTO menu_semanal (semana, tipo_vianda_id, celiaco, vegetariano, alergia, otra_restriccion, precio, activo)
SELECT
  'Semana 1 (02/03 - 06/03)',
  id,
  false,
  true,
  false,
  NULL,
  1200,
  true
FROM tipos_vianda WHERE nombre = 'sándwich'
ON CONFLICT DO NOTHING;

INSERT INTO menu_semanal (semana, tipo_vianda_id, celiaco, vegetariano, alergia, otra_restriccion, precio, activo)
SELECT
  'Semana 1 (02/03 - 06/03)',
  id,
  true,
  true,
  false,
  NULL,
  1300,
  true
FROM tipos_vianda WHERE nombre = 'ensalada'
ON CONFLICT DO NOTHING;

INSERT INTO menu_semanal (semana, tipo_vianda_id, celiaco, vegetariano, alergia, otra_restriccion, precio, activo)
SELECT
  'Semana 2 (09/03 - 13/03)',
  id,
  false,
  true,
  false,
  NULL,
  1200,
  true
FROM tipos_vianda WHERE nombre = 'tarta'
ON CONFLICT DO NOTHING;

INSERT INTO menu_semanal (semana, tipo_vianda_id, celiaco, vegetariano, alergia, otra_restriccion, precio, activo)
SELECT
  'Semana 2 (09/03 - 13/03)',
  id,
  false,
  false,
  false,
  NULL,
  1100,
  true
FROM tipos_vianda WHERE nombre = 'pasta'
ON CONFLICT DO NOTHING;

INSERT INTO menu_semanal (semana, tipo_vianda_id, celiaco, vegetariano, alergia, otra_restriccion, precio, activo)
SELECT
  'Semana 3 (16/03 - 20/03)',
  id,
  false,
  false,
  true,
  'Sin frutos secos',
  1300,
  true
FROM tipos_vianda WHERE nombre = 'wrap'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. USUARIOS (vinculados a Supabase Auth)
--
-- Pasos previos:
--   a) Creá cada cuenta en Supabase Dashboard > Authentication > Users > Add user
--      con el email y contraseña que quieras.
--   b) Copiá el "User ID" (UUID) que genera Supabase.
--   c) Reemplazá los UUID de ejemplo abajo (auth_user_id) por los reales.
-- ---------------------------------------------------------------------------

INSERT INTO usuarios (auth_user_id, nombre, email, rol, activo) VALUES
  -- Ejemplo: reemplaza '00000000-0000-0000-0000-000000000001' por el User ID real de Supabase Auth
  ('00000000-0000-0000-0000-000000000001', 'Sebastián López', 'sebastian@escuela.edu.ar', 'tesorero', true),
  ('00000000-0000-0000-0000-000000000002', 'Ariel Aranda', 'ariel@escuela.edu.ar', 'administracion', true),
  ('00000000-0000-0000-0000-000000000003', 'Prof. García', 'garcia@escuela.edu.ar', 'docente_asesor', true),
  ('00000000-0000-0000-0000-000000000004', 'Directora Martínez', 'directora@escuela.edu.ar', 'director', true),
  ('00000000-0000-0000-0000-000000000005', 'Carlos Pérez', 'carlos@escuela.edu.ar', 'secretario', true),
  ('00000000-0000-0000-0000-000000000006', 'Lucía Gómez', 'lucia@escuela.edu.ar', 'distribucion', true),
  ('00000000-0000-0000-0000-000000000007', 'Martín Ruiz', 'martin@escuela.edu.ar', 'asociado', true)
ON CONFLICT (auth_user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. SUSCRIPCIONES (vinculadas a asociados)
-- ---------------------------------------------------------------------------

INSERT INTO suscripciones (asociado_id, tipo, fecha_inicio, fecha_fin, estado, monto)
SELECT a.id, 'semanal', '2026-03-01', '2026-03-08', 'activa', 6000
FROM asociados a WHERE a.nombre = 'Juan' AND a.apellido = 'Pérez'
ON CONFLICT DO NOTHING;

INSERT INTO suscripciones (asociado_id, tipo, fecha_inicio, fecha_fin, estado, monto)
SELECT a.id, 'mensual', '2026-03-01', '2026-03-31', 'activa', 22000
FROM asociados a WHERE a.nombre = 'María' AND a.apellido = 'González'
ON CONFLICT DO NOTHING;

INSERT INTO suscripciones (asociado_id, tipo, fecha_inicio, fecha_fin, estado, monto)
SELECT a.id, 'semanal', '2026-03-01', '2026-03-08', 'activa', 6000
FROM asociados a WHERE a.nombre = 'Luis' AND a.apellido = 'Rodríguez'
ON CONFLICT DO NOTHING;

INSERT INTO suscripciones (asociado_id, tipo, fecha_inicio, fecha_fin, estado, monto)
SELECT a.id, 'mensual', '2026-03-01', '2026-03-31', 'activa', 22000
FROM asociados a WHERE a.nombre = 'Ana' AND a.apellido = 'Martínez'
ON CONFLICT DO NOTHING;

INSERT INTO suscripciones (asociado_id, tipo, fecha_inicio, fecha_fin, estado, monto)
SELECT a.id, 'semanal', '2026-03-01', '2026-03-08', 'baja', 6000
FROM asociados a WHERE a.nombre = 'Pedro' AND a.apellido = 'López'
ON CONFLICT DO NOTHING;

INSERT INTO suscripciones (asociado_id, tipo, fecha_inicio, fecha_fin, estado, monto)
SELECT a.id, 'mensual', '2026-03-01', '2026-03-31', 'activa', 22000
FROM asociados a WHERE a.nombre = 'Sofía' AND a.apellido = 'Fernández'
ON CONFLICT DO NOTHING;

INSERT INTO suscripciones (asociado_id, tipo, fecha_inicio, fecha_fin, estado, monto)
SELECT a.id, 'semanal', '2026-03-01', '2026-03-08', 'activa', 6000
FROM asociados a WHERE a.nombre = 'Tomás' AND a.apellido = 'Díaz'
ON CONFLICT DO NOTHING;

INSERT INTO suscripciones (asociado_id, tipo, fecha_inicio, fecha_fin, estado, monto)
SELECT a.id, 'semanal', '2026-03-01', '2026-03-08', 'activa', 6000
FROM asociados a WHERE a.nombre = 'Valentina' AND a.apellido = 'Suárez'
ON CONFLICT DO NOTHING;

INSERT INTO suscripciones (asociado_id, tipo, fecha_inicio, fecha_fin, estado, monto)
SELECT a.id, 'semanal', '2026-03-01', '2026-03-08', 'activa', 6000
FROM asociados a WHERE a.nombre = 'Bruno' AND a.apellido = 'Romero'
ON CONFLICT DO NOTHING;

INSERT INTO suscripciones (asociado_id, tipo, fecha_inicio, fecha_fin, estado, monto)
SELECT a.id, 'mensual', '2026-03-01', '2026-03-31', 'activa', 22000
FROM asociados a WHERE a.nombre = 'Camila' AND a.apellido = 'Álvarez'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. PEDIDOS (ejemplos)
-- ---------------------------------------------------------------------------

INSERT INTO pedidos (suscripcion_id, menu_id, curso, cantidad, fecha)
SELECT s.id, m.id, 1, 1, '2026-03-03'
FROM suscripciones s
JOIN asociados a ON s.asociado_id = a.id
JOIN menu_semanal m ON m.semana = 'Semana 1 (02/03 - 06/03)' AND m.tipo_vianda_id = (SELECT id FROM tipos_vianda WHERE nombre = 'sándwich')
WHERE a.nombre = 'Juan' AND a.apellido = 'Pérez' AND s.estado = 'activa'
ON CONFLICT DO NOTHING;

INSERT INTO pedidos (suscripcion_id, menu_id, curso, cantidad, fecha)
SELECT s.id, m.id, 2, 1, '2026-03-10'
FROM suscripciones s
JOIN asociados a ON s.asociado_id = a.id
JOIN menu_semanal m ON m.semana = 'Semana 2 (09/03 - 13/03)' AND m.tipo_vianda_id = (SELECT id FROM tipos_vianda WHERE nombre = 'tarta')
WHERE a.nombre = 'María' AND a.apellido = 'González' AND s.estado = 'activa'
ON CONFLICT DO NOTHING;

INSERT INTO pedidos (suscripcion_id, menu_id, curso, cantidad, fecha)
SELECT s.id, m.id, 3, 2, '2026-03-03'
FROM suscripciones s
JOIN asociados a ON s.asociado_id = a.id
JOIN menu_semanal m ON m.semana = 'Semana 1 (02/03 - 06/03)' AND m.tipo_vianda_id = (SELECT id FROM tipos_vianda WHERE nombre = 'sándwich')
WHERE a.nombre = 'Luis' AND a.apellido = 'Rodríguez' AND s.estado = 'activa'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. LIBRO DE CAJA (ingresos y egresos)
-- ---------------------------------------------------------------------------

INSERT INTO libro_caja (tipo, monto, concepto, fecha, usuario_id)
SELECT 'ingreso', 6000, 'Suscripción semanal Juan Pérez', '2026-03-01', u.id
FROM usuarios u WHERE u.email = 'ariel@escuela.edu.ar'
ON CONFLICT DO NOTHING;

INSERT INTO libro_caja (tipo, monto, concepto, fecha, usuario_id)
SELECT 'ingreso', 22000, 'Suscripción mensual María González', '2026-03-01', u.id
FROM usuarios u WHERE u.email = 'ariel@escuela.edu.ar'
ON CONFLICT DO NOTHING;

INSERT INTO libro_caja (tipo, monto, concepto, fecha, usuario_id)
SELECT 'ingreso', 6000, 'Suscripción semanal Luis Rodríguez', '2026-03-01', u.id
FROM usuarios u WHERE u.email = 'ariel@escuela.edu.ar'
ON CONFLICT DO NOTHING;

INSERT INTO libro_caja (tipo, monto, concepto, fecha, usuario_id)
SELECT 'ingreso', 22000, 'Suscripción mensual Ana Martínez', '2026-03-01', u.id
FROM usuarios u WHERE u.email = 'ariel@escuela.edu.ar'
ON CONFLICT DO NOTHING;

INSERT INTO libro_caja (tipo, monto, concepto, fecha, usuario_id)
SELECT 'egreso', 15000, 'Compra de insumos (pan, fiambre, verduras)', '2026-03-05', u.id
FROM usuarios u WHERE u.email = 'sebastian@escuela.edu.ar'
ON CONFLICT DO NOTHING;

INSERT INTO libro_caja (tipo, monto, concepto, fecha, usuario_id)
SELECT 'egreso', 8000, 'Gasoil para transporte', '2026-03-07', u.id
FROM usuarios u WHERE u.email = 'sebastian@escuela.edu.ar'
ON CONFLICT DO NOTHING;

INSERT INTO libro_caja (tipo, monto, concepto, fecha, usuario_id)
SELECT 'egreso', 12000, 'Compra de viandas para semana 2', '2026-03-08', u.id
FROM usuarios u WHERE u.email = 'sebastian@escuela.edu.ar'
ON CONFLICT DO NOTHING;

INSERT INTO libro_caja (tipo, monto, concepto, fecha, usuario_id)
SELECT 'egreso', 3000, 'Productos de limpieza', '2026-03-09', u.id
FROM usuarios u WHERE u.email = 'sebastian@escuela.edu.ar'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8. ENTREGAS (algunas dentro de franja, otras no)
-- ---------------------------------------------------------------------------

INSERT INTO entregas (pedido_id, fecha, curso, dentro_franja, observaciones)
SELECT p.id, '2026-03-03', 1, true, 'Entregado en hora'
FROM pedidos p WHERE p.curso = 1 AND p.fecha = '2026-03-03'
ON CONFLICT DO NOTHING;

INSERT INTO entregas (pedido_id, fecha, curso, dentro_franja, observaciones)
SELECT p.id, '2026-03-10', 2, true, 'Entregado en hora'
FROM pedidos p WHERE p.curso = 2 AND p.fecha = '2026-03-10'
ON CONFLICT DO NOTHING;

INSERT INTO entregas (pedido_id, fecha, curso, dentro_franja, observaciones)
SELECT p.id, '2026-03-03', 3, false, 'Retraso por lluvia'
FROM pedidos p WHERE p.curso = 3 AND p.fecha = '2026-03-03'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 9. TAREAS (algunas cumplidas, otras pendientes)
-- ---------------------------------------------------------------------------

INSERT INTO tareas (comision_id, descripcion, fecha_asignada, fecha_limite, cumplida, fecha_cumplimiento)
SELECT c.id, 'Cobrar suscripciones de la semana', '2026-03-01', '2026-03-02', true, '2026-03-02'
FROM comisiones c WHERE c.nombre = 'Administración'
ON CONFLICT DO NOTHING;

INSERT INTO tareas (comision_id, descripcion, fecha_asignada, fecha_limite, cumplida, fecha_cumplimiento)
SELECT c.id, 'Pedir presupuesto de pan', '2026-03-01', '2026-03-04', true, '2026-03-03'
FROM comisiones c WHERE c.nombre = 'Compras'
ON CONFLICT DO NOTHING;

INSERT INTO tareas (comision_id, descripcion, fecha_asignada, fecha_limite, cumplida, fecha_cumplimiento)
SELECT c.id, 'Armar viandas semana 1', '2026-03-02', '2026-03-03', true, '2026-03-03'
FROM comisiones c WHERE c.nombre = 'Producción'
ON CONFLICT DO NOTHING;

INSERT INTO tareas (comision_id, descripcion, fecha_asignada, fecha_limite, cumplida, fecha_cumplimiento)
SELECT c.id, 'Preparar lista de retiro semana 1', '2026-03-02', '2026-03-03', false, NULL
FROM comisiones c WHERE c.nombre = 'Distribución'
ON CONFLICT DO NOTHING;

INSERT INTO tareas (comision_id, descripcion, fecha_asignada, fecha_limite, cumplida, fecha_cumplimiento)
SELECT c.id, 'Control de temperaturas semana 1', '2026-03-03', '2026-03-04', false, NULL
FROM comisiones c WHERE c.nombre = 'Control e higiene'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 10. ACTAS (ejemplos)
-- ---------------------------------------------------------------------------

INSERT INTO actas (fecha, tipo_reunion, contenido, aprobada, usuario_id)
SELECT '2026-02-25', 'asamblea', 'Asamblea constitutiva. Se aprueba el reglamento interno y se elige el primer Consejo de Administración.', true, u.id
FROM usuarios u WHERE u.email = 'carlos@escuela.edu.ar'
ON CONFLICT DO NOTHING;

INSERT INTO actas (fecha, tipo_reunion, contenido, aprobada, usuario_id)
SELECT '2026-03-01', 'consejo', 'Primera reunión del Consejo. Se distribuyen las comisiones y se fija el menú de la primera semana.', true, u.id
FROM usuarios u WHERE u.email = 'carlos@escuela.edu.ar'
ON CONFLICT DO NOTHING;

INSERT INTO actas (fecha, tipo_reunion, contenido, aprobada, usuario_id)
SELECT '2026-03-08', 'consejo', 'Revisión de la primera semana de funcionamiento. Se acuerda mejorar los tiempos de entrega.', false, u.id
FROM usuarios u WHERE u.email = 'carlos@escuela.edu.ar'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
