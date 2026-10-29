/**
 * Datos ficticios para pruebas (modo sin Supabase).
 * Identificado claramente como "datos de prueba" en la interfaz.
 * Estos datos se usan hasta que se conecte la base de datos real.
 */

export const MODO_PRUEBA = true

// Usuarios simulados (roles)
export const USUARIOS_MOCK = [
  { id: 'u1', nombre: 'Sebastián López', email: 'sebastian@escuela.edu.ar', rol: 'tesorero', activo: true },
  { id: 'u2', nombre: 'Ariel Aranda', email: 'ariel@escuela.edu.ar', rol: 'administracion', activo: true },
  { id: 'u3', nombre: 'Prof. García', email: 'garcia@escuela.edu.ar', rol: 'docente_asesor', activo: true },
  { id: 'u4', nombre: 'Directora Martínez', email: 'directora@escuela.edu.ar', rol: 'director', activo: true },
  { id: 'u5', nombre: 'Carlos Pérez', email: 'carlos@escuela.edu.ar', rol: 'secretario', activo: true },
  { id: 'u6', nombre: 'Lucía Gómez', email: 'lucia@escuela.edu.ar', rol: 'distribucion', activo: true },
  { id: 'u7', nombre: 'Martín Ruiz', email: 'martin@escuela.edu.ar', rol: 'asociado', activo: true },
]

// Asociados (datos personales confidenciales - solo roles internos)
export const ASOCIADOS_MOCK = [
  { id: 'a1', nombre: 'Juan', apellido: 'Pérez', curso: 1, division: '1', telefono: '2231-123456', fecha_alta: '2026-03-01', activo: true },
  { id: 'a2', nombre: 'María', apellido: 'González', curso: 2, division: '2', telefono: '2231-123457', fecha_alta: '2026-03-01', activo: true },
  { id: 'a3', nombre: 'Luis', apellido: 'Rodríguez', curso: 3, division: '1', telefono: '2231-123458', fecha_alta: '2026-03-02', activo: true },
  { id: 'a4', nombre: 'Ana', apellido: 'Martínez', curso: 4, division: '3', telefono: '2231-123459', fecha_alta: '2026-03-02', activo: true },
  { id: 'a5', nombre: 'Pedro', apellido: 'López', curso: 5, division: '2', telefono: '2231-123460', fecha_alta: '2026-03-03', activo: true },
  { id: 'a6', nombre: 'Sofía', apellido: 'Fernández', curso: 6, division: '1', telefono: '2231-123461', fecha_alta: '2026-03-03', activo: true },
  { id: 'a7', nombre: 'Tomás', apellido: 'Díaz', curso: 7, division: '3', telefono: '2231-123462', fecha_alta: '2026-03-04', activo: true },
  { id: 'a8', nombre: 'Valentina', apellido: 'Suárez', curso: 1, division: '3', telefono: '2231-123463', fecha_alta: '2026-03-04', activo: true },
  { id: 'a9', nombre: 'Bruno', apellido: 'Romero', curso: 2, division: '1', telefono: '2231-123464', fecha_alta: '2026-03-05', activo: true },
  { id: 'a10', nombre: 'Camila', apellido: 'Álvarez', curso: 3, division: '2', telefono: '2231-123465', fecha_alta: '2026-03-05', activo: true },
]

// Cargos del Consejo
export const CARGOS_MOCK = [
  { id: 'c1', nombre: 'Presidente', descripcion: 'Encabeza el Consejo de Administración' },
  { id: 'c2', nombre: 'Secretario', descripcion: 'Lleva el Libro de Actas y actas de reuniones' },
  { id: 'c3', nombre: 'Tesorero', descripcion: 'Maneja el Libro de Caja y pagos' },
  { id: 'c4', nombre: 'Coordinador de Comisión de Producción', descripcion: 'Coordina el armado de viandas' },
  { id: 'c5', nombre: 'Coordinador de Comisión de Distribución', descripcion: 'Coordina entregas y lista de retiro' },
]

// Comisiones
export const COMISIONES_MOCK = [
  { id: 'cm1', nombre: 'Administración', descripcion: 'Cobros, registro de suscripciones, comprobantes, Libro de Caja', activo: true },
  { id: 'cm2', nombre: 'Compras', descripcion: 'Presupuestos y compra de insumos', activo: true },
  { id: 'cm3', nombre: 'Producción', descripcion: 'Armar las viandas', activo: true },
  { id: 'cm4', nombre: 'Distribución', descripcion: 'Entregas y lista de retiro por curso', activo: true },
  { id: 'cm5', nombre: 'Comunicación', descripcion: 'Publicidad y menú semanal', activo: true },
  { id: 'cm6', nombre: 'Control e higiene', descripcion: 'Limpieza, vencimientos y temperaturas', activo: true },
]

// Tipos de vianda
export const TIPOS_VIANDA_MOCK = [
  { id: 'tv1', nombre: 'sándwich', descripcion: 'Sándwich de miga o pan casero', activo: true },
  { id: 'tv2', nombre: 'tarta', descripcion: 'Tarta salada por porción', activo: true },
  { id: 'tv3', nombre: 'ensalada', descripcion: 'Ensalada mixta con aderezo', activo: true },
  { id: 'tv4', nombre: 'pasta', descripcion: 'Pastas con salsa', activo: true },
  { id: 'tv5', nombre: 'wrap', descripcion: 'Wrap o tortilla rellena', activo: true },
  { id: 'tv6', nombre: 'otra', descripcion: 'Otro tipo de vianda', activo: true },
]

// Menú semanal (ejemplo para varias semanas)
export const MENU_SEMANAL_MOCK = [
  {
    id: 'm1',
    semana: 'Semana 1 (02/03 - 06/03)',
    tipo_vianda_id: 'tv1',
    celiaco: false,
    vegetariano: true,
    alergia: false,
    otra_restriccion: null,
    precio: 1200,
    activo: true,
  },
  {
    id: 'm2',
    semana: 'Semana 1 (02/03 - 06/03)',
    tipo_vianda_id: 'tv3',
    celiaco: true,
    vegetariano: true,
    alergia: false,
    otra_restriccion: null,
    precio: 1300,
    activo: true,
  },
  {
    id: 'm3',
    semana: 'Semana 2 (09/03 - 13/03)',
    tipo_vianda_id: 'tv2',
    celiaco: false,
    vegetariano: true,
    alergia: false,
    otra_restriccion: null,
    precio: 1200,
    activo: true,
  },
  {
    id: 'm4',
    semana: 'Semana 2 (09/03 - 13/03)',
    tipo_vianda_id: 'tv4',
    celiaco: false,
    vegetariano: false,
    alergia: false,
    otra_restriccion: null,
    precio: 1100,
    activo: true,
  },
  {
    id: 'm5',
    semana: 'Semana 3 (16/03 - 20/03)',
    tipo_vianda_id: 'tv5',
    celiaco: false,
    vegetariano: false,
    alergia: true,
    otra_restriccion: 'Sin frutos secos',
    precio: 1300,
    activo: true,
  },
]

// Suscripciones (varias activas, una de baja para probar historial)
export const SUSCRIPCIONES_MOCK = [
  { id: 's1', asociado_id: 'a1', tipo: 'semanal', fecha_inicio: '2026-03-01', fecha_fin: '2026-03-08', estado: 'activa', monto: 6000 },
  { id: 's2', asociado_id: 'a2', tipo: 'mensual', fecha_inicio: '2026-03-01', fecha_fin: '2026-03-31', estado: 'activa', monto: 22000 },
  { id: 's3', asociado_id: 'a3', tipo: 'semanal', fecha_inicio: '2026-03-01', fecha_fin: '2026-03-08', estado: 'activa', monto: 6000 },
  { id: 's4', asociado_id: 'a4', tipo: 'mensual', fecha_inicio: '2026-03-01', fecha_fin: '2026-03-31', estado: 'activa', monto: 22000 },
  { id: 's5', asociado_id: 'a5', tipo: 'semanal', fecha_inicio: '2026-03-01', fecha_fin: '2026-03-08', estado: 'baja', monto: 6000 }, // baja: conserva historial
  { id: 's6', asociado_id: 'a6', tipo: 'mensual', fecha_inicio: '2026-03-01', fecha_fin: '2026-03-31', estado: 'activa', monto: 22000 },
  { id: 's7', asociado_id: 'a7', tipo: 'semanal', fecha_inicio: '2026-03-01', fecha_fin: '2026-03-08', estado: 'activa', monto: 6000 },
  { id: 's8', asociado_id: 'a8', tipo: 'semanal', fecha_inicio: '2026-03-01', fecha_fin: '2026-03-08', estado: 'activa', monto: 6000 },
  { id: 's9', asociado_id: 'a9', tipo: 'semanal', fecha_inicio: '2026-03-01', fecha_fin: '2026-03-08', estado: 'activa', monto: 6000 },
  { id: 's10', asociado_id: 'a10', tipo: 'mensual', fecha_inicio: '2026-03-01', fecha_fin: '2026-03-31', estado: 'activa', monto: 22000 },
]

// Pedidos
export const PEDIDOS_MOCK = [
  { id: 'p1', suscripcion_id: 's1', menu_id: 'm1', curso: 1, cantidad: 1, fecha: '2026-03-03' },
  { id: 'p2', suscripcion_id: 's2', menu_id: 'm3', curso: 2, cantidad: 1, fecha: '2026-03-10' },
  { id: 'p3', suscripcion_id: 's3', menu_id: 'm1', curso: 3, cantidad: 2, fecha: '2026-03-03' },
  { id: 'p4', suscripcion_id: 's4', menu_id: 'm4', curso: 4, cantidad: 1, fecha: '2026-03-10' },
  { id: 'p5', suscripcion_id: 's6', menu_id: 'm5', curso: 6, cantidad: 1, fecha: '2026-03-17' },
  { id: 'p6', suscripcion_id: 's7', menu_id: 'm1', curso: 7, cantidad: 1, fecha: '2026-03-03' },
  { id: 'p7', suscripcion_id: 's8', menu_id: 'm2', curso: 1, cantidad: 1, fecha: '2026-03-03' },
  { id: 'p8', suscripcion_id: 's9', menu_id: 'm1', curso: 2, cantidad: 1, fecha: '2026-03-03' },
  { id: 'p9', suscripcion_id: 's10', menu_id: 'm3', curso: 3, cantidad: 1, fecha: '2026-03-10' },
]

// Libro de caja (ingresos y egresos)
export const LIBRO_CAJA_MOCK = [
  { id: 'lc1', tipo: 'ingreso', monto: 6000, concepto: 'Suscripción semanal Juan Pérez', fecha: '2026-03-01', usuario_id: 'u2' },
  { id: 'lc2', tipo: 'ingreso', monto: 22000, concepto: 'Suscripción mensual María González', fecha: '2026-03-01', usuario_id: 'u2' },
  { id: 'lc3', tipo: 'ingreso', monto: 6000, concepto: 'Suscripción semanal Luis Rodríguez', fecha: '2026-03-01', usuario_id: 'u2' },
  { id: 'lc4', tipo: 'ingreso', monto: 22000, concepto: 'Suscripción mensual Ana Martínez', fecha: '2026-03-01', usuario_id: 'u2' },
  { id: 'lc5', tipo: 'egreso', monto: 15000, concepto: 'Compra de insumos (pan, fiambre, verduras)', fecha: '2026-03-05', usuario_id: 'u1' },
  { id: 'lc6', tipo: 'egreso', monto: 8000, concepto: 'Gasoil para transporte', fecha: '2026-03-07', usuario_id: 'u1' },
  { id: 'lc7', tipo: 'ingreso', monto: 6000, concepto: 'Suscripción semanal Sofía Fernández', fecha: '2026-03-01', usuario_id: 'u2' },
  { id: 'lc8', tipo: 'ingreso', monto: 22000, concepto: 'Suscripción mensual Camila Álvarez', fecha: '2026-03-01', usuario_id: 'u2' },
  { id: 'lc9', tipo: 'egreso', monto: 12000, concepto: 'Compra de viandas para semana 2', fecha: '2026-03-08', usuario_id: 'u1' },
  { id: 'lc10', tipo: 'egreso', monto: 3000, concepto: 'Productos de limpieza', fecha: '2026-03-09', usuario_id: 'u1' },
]

// Entregas (algunas dentro de franja, otras no)
export const ENTREGAS_MOCK = [
  { id: 'e1', pedido_id: 'p1', fecha: '2026-03-03', curso: 1, dentro_franja: true, observaciones: 'Entregado en hora' },
  { id: 'e2', pedido_id: 'p2', fecha: '2026-03-10', curso: 2, dentro_franja: true, observaciones: 'Entregado en hora' },
  { id: 'e3', pedido_id: 'p3', fecha: '2026-03-03', curso: 3, dentro_franja: false, observaciones: 'Retraso por lluvia' },
  { id: 'e4', pedido_id: 'p4', fecha: '2026-03-10', curso: 4, dentro_franja: true, observaciones: 'Entregado en hora' },
  { id: 'e5', pedido_id: 'p5', fecha: '2026-03-17', curso: 6, dentro_franja: true, observaciones: 'Entregado en hora' },
  { id: 'e6', pedido_id: 'p6', fecha: '2026-03-03', curso: 7, dentro_franja: true, observaciones: 'Entregado en hora' },
  { id: 'e7', pedido_id: 'p7', fecha: '2026-03-03', curso: 1, dentro_franja: false, observaciones: 'Alumno ausente' },
  { id: 'e8', pedido_id: 'p8', fecha: '2026-03-03', curso: 2, dentro_franja: true, observaciones: 'Entregado en hora' },
  { id: 'e9', pedido_id: 'p9', fecha: '2026-03-10', curso: 3, dentro_franja: true, observaciones: 'Entregado en hora' },
]

// Tareas (algunas cumplidas, otras pendientes, algunas vencidas)
export const TAREAS_MOCK = [
  { id: 't1', comision_id: 'cm1', descripcion: 'Cobrar suscripciones de la semana', fecha_asignada: '2026-03-01', fecha_limite: '2026-03-02', cumplida: true, fecha_cumplimiento: '2026-03-02' },
  { id: 't2', comision_id: 'cm2', descripcion: 'Pedir presupuesto de pan', fecha_asignada: '2026-03-01', fecha_limite: '2026-03-04', cumplida: true, fecha_cumplimiento: '2026-03-03' },
  { id: 't3', comision_id: 'cm3', descripcion: 'Armar viandas semana 1', fecha_asignada: '2026-03-02', fecha_limite: '2026-03-03', cumplida: true, fecha_cumplimiento: '2026-03-03' },
  { id: 't4', comision_id: 'cm4', descripcion: 'Preparar lista de retiro semana 1', fecha_asignada: '2026-03-02', fecha_limite: '2026-03-03', cumplida: false, fecha_cumplimiento: null },
  { id: 't5', comision_id: 'cm5', descripcion: 'Diseñar menú semana 2', fecha_asignada: '2026-03-05', fecha_limite: '2026-03-06', cumplida: true, fecha_cumplimiento: '2026-03-06' },
  { id: 't6', comision_id: 'cm6', descripcion: 'Control de temperaturas semana 1', fecha_asignada: '2026-03-03', fecha_limite: '2026-03-04', cumplida: false, fecha_cumplimiento: null },
  { id: 't7', comision_id: 'cm1', descripcion: 'Actualizar Libro de Caja', fecha_asignada: '2026-03-08', fecha_limite: '2026-03-09', cumplida: false, fecha_cumplimiento: null },
]

// Actas
export const ACTAS_MOCK = [
  { id: 'ac1', fecha: '2026-02-25', tipo_reunion: 'asamblea', contenido: 'Asamblea constitutiva. Se aprueba el reglamento interno y se elige el primer Consejo de Administración.', aprobada: true, usuario_id: 'u5' },
  { id: 'ac2', fecha: '2026-03-01', tipo_reunion: 'consejo', contenido: 'Primera reunión del Consejo. Se distribuyen las comisiones y se fija el menú de la primera semana.', aprobada: true, usuario_id: 'u5' },
  { id: 'ac3', fecha: '2026-03-08', tipo_reunion: 'consejo', contenido: 'Revisión de la primera semana de funcionamiento. Se acuerda mejorar los tiempos de entrega.', aprobada: false, usuario_id: 'u5' },
]
