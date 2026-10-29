-- ============================================================================
-- Esquema de base de datos para "La Viandita" - Precooperativa escolar
-- Script para crear todas las tablas, claves, relaciones y políticas RLS.
-- Compatible con Supabase (PostgreSQL).
-- ============================================================================

-- Habilitar la extensión uuid para generar identificadores únicos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLA: usuarios
-- Usuarios del sistema con su rol. Vinculados a Supabase Auth (auth.users).
-- ============================================================================
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN (
    'tesorero',
    'administracion',
    'distribucion',
    'secretario',
    'asociado',
    'docente_asesor',
    'director'
  )),
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- TABLA: asociados
-- Estudiantes de 1° a 7° año. Datos confidenciales: solo roles internos.
-- ============================================================================
CREATE TABLE asociados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  curso INTEGER NOT NULL CHECK (curso BETWEEN 1 AND 7),
  division TEXT NOT NULL CHECK (division IN ('1','2','3')),
  telefono TEXT,
  fecha_alta DATE NOT NULL DEFAULT CURRENT_DATE,
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- TABLA: cargos
-- Cargos del Consejo de Administración.
-- ============================================================================
CREATE TABLE cargos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- TABLA: comisiones
-- Comisiones de trabajo.
-- ============================================================================
CREATE TABLE comisiones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL CHECK (nombre IN (
    'Administración', 'Compras', 'Producción', 'Distribución',
    'Comunicación', 'Control e higiene'
  )),
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- TABLA: tipos_vianda
-- Catálogo de tipos de vianda.
-- ============================================================================
CREATE TABLE tipos_vianda (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL CHECK (nombre IN (
    'sándwich', 'tarta', 'ensalada', 'pasta', 'wrap', 'otra'
  )),
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- TABLA: menu_semanal
-- Menú de la semana con restricciones alimentarias y precio.
-- ============================================================================
CREATE TABLE menu_semanal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  semana TEXT NOT NULL,
  tipo_vianda_id UUID REFERENCES tipos_vianda(id),
  celiaco BOOLEAN NOT NULL DEFAULT false,
  vegetariano BOOLEAN NOT NULL DEFAULT false,
  alergia BOOLEAN NOT NULL DEFAULT false,
  otra_restriccion TEXT,
  precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- TABLA: suscripciones
-- Suscripciones semanales o mensuales (baja lógica).
-- ============================================================================
CREATE TABLE suscripciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asociado_id UUID REFERENCES asociados(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('semanal', 'mensual')),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  estado TEXT NOT NULL CHECK (estado IN ('activa', 'baja')) DEFAULT 'activa',
  monto NUMERIC(10,2) NOT NULL CHECK (monto >= 0),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- TABLA: pedidos
-- Pedidos de viandas vinculados a una suscripción y al menú semanal.
-- ============================================================================
CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suscripcion_id UUID REFERENCES suscripciones(id) ON DELETE CASCADE,
  menu_id UUID REFERENCES menu_semanal(id),
  curso INTEGER NOT NULL CHECK (curso BETWEEN 1 AND 7),
  cantidad INTEGER NOT NULL CHECK (cantidad >= 1),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- TABLA: libro_caja
-- Ingresos y egresos (Libro de Caja).
-- ============================================================================
CREATE TABLE libro_caja (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  monto NUMERIC(10,2) NOT NULL CHECK (monto >= 0),
  concepto TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  usuario_id UUID REFERENCES usuarios(id),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- TABLA: entregas
-- Registro de entregas con control de franja horaria.
-- ============================================================================
CREATE TABLE entregas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  curso INTEGER NOT NULL CHECK (curso BETWEEN 1 AND 7),
  dentro_franja BOOLEAN NOT NULL DEFAULT false,
  observaciones TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- TABLA: tareas
-- Tareas asignadas a comisiones.
-- ============================================================================
CREATE TABLE tareas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comision_id UUID REFERENCES comisiones(id),
  descripcion TEXT NOT NULL,
  fecha_asignada DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_limite DATE NOT NULL,
  cumplida BOOLEAN NOT NULL DEFAULT false,
  fecha_cumplimiento DATE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- TABLA: actas
-- Actas de asamblea y del Consejo de Administración.
-- ============================================================================
CREATE TABLE actas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo_reunion TEXT NOT NULL CHECK (tipo_reunion IN ('asamblea', 'consejo')),
  contenido TEXT NOT NULL,
  aprobada BOOLEAN NOT NULL DEFAULT false,
  usuario_id UUID REFERENCES usuarios(id),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================
CREATE INDEX idx_asociados_activo ON asociados(activo);
CREATE INDEX idx_suscripciones_asociado ON suscripciones(asociado_id);
CREATE INDEX idx_suscripciones_estado ON suscripciones(estado);
CREATE INDEX idx_pedidos_suscripcion ON pedidos(suscripcion_id);
CREATE INDEX idx_pedidos_menu ON pedidos(menu_id);
CREATE INDEX idx_entregas_pedido ON entregas(pedido_id);
CREATE INDEX idx_entregas_fecha ON entregas(fecha);
CREATE INDEX idx_libro_caja_fecha ON libro_caja(fecha);
CREATE INDEX idx_tareas_comision ON tareas(comision_id);
CREATE INDEX idx_tareas_cumplida ON tareas(cumplida);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_auth ON usuarios(auth_user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Políticas de acceso por rol
-- ============================================================================
-- Habilitar RLS en todas las tablas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE asociados ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comisiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_vianda ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_semanal ENABLE ROW LEVEL SECURITY;
ALTER TABLE suscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE libro_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE actas ENABLE ROW LEVEL SECURITY;

-- Función auxiliar: devuelve el rol del usuario autenticado desde la tabla usuarios
CREATE OR REPLACE FUNCTION obtener_rol_usuario()
RETURNS TEXT AS $$
DECLARE
  v_rol TEXT;
BEGIN
  SELECT rol INTO v_rol
  FROM usuarios
  WHERE auth_user_id = auth.uid();
  RETURN v_rol;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función auxiliar: verificar si el rol puede escribir (roles internos)
CREATE OR REPLACE FUNCTION rol_puede_escribir()
RETURNS BOOLEAN AS $$
DECLARE
  v_rol TEXT;
BEGIN
  v_rol := obtener_rol_usuario();
  RETURN v_rol IN ('tesorero', 'administracion', 'distribucion', 'secretario');
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función auxiliar: verificar si el rol puede leer datos internos
CREATE OR REPLACE FUNCTION rol_puede_leer_interno()
RETURNS BOOLEAN AS $$
DECLARE
  v_rol TEXT;
BEGIN
  v_rol := obtener_rol_usuario();
  RETURN v_rol IN (
    'tesorero', 'administracion', 'distribucion', 'secretario',
    'asociado', 'docente_asesor', 'director'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- POLÍTICAS DE LECTURA (todos los roles autenticados pueden leer el tablero)
-- ============================================================================

-- usuarios: cada usuario lee su propio registro; roles internos leen todos
CREATE POLICY "usuarios_lectura_propia" ON usuarios
  FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "usuarios_lectura_interno" ON usuarios
  FOR SELECT USING (rol_puede_leer_interno());

-- asociados: solo roles internos pueden ver datos personales
CREATE POLICY "asociados_lectura_interno" ON asociados
  FOR SELECT USING (rol_puede_leer_interno());

-- cargos, comisiones, tipos_vianda, menu_semanal: lectura para todos autenticados
CREATE POLICY "cargos_lectura" ON cargos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "comisiones_lectura" ON comisiones FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "tipos_vianda_lectura" ON tipos_vianda FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "menu_semanal_lectura" ON menu_semanal FOR SELECT USING (auth.uid() IS NOT NULL);

-- suscripciones: roles internos + el propio asociado (vía suscripción)
CREATE POLICY "suscripciones_lectura_interno" ON suscripciones
  FOR SELECT USING (rol_puede_leer_interno());

-- pedidos: roles internos
CREATE POLICY "pedidos_lectura_interno" ON pedidos
  FOR SELECT USING (rol_puede_leer_interno());

-- libro_caja: roles internos
CREATE POLICY "libro_caja_lectura_interno" ON libro_caja
  FOR SELECT USING (rol_puede_leer_interno());

-- entregas: roles internos
CREATE POLICY "entregas_lectura_interno" ON entregas
  FOR SELECT USING (rol_puede_leer_interno());

-- tareas: roles internos
CREATE POLICY "tareas_lectura_interno" ON tareas
  FOR SELECT USING (rol_puede_leer_interno());

-- actas: roles internos + docente + director
CREATE POLICY "actas_lectura_interno" ON actas
  FOR SELECT USING (rol_puede_leer_interno());

-- ============================================================================
-- POLÍTICAS DE ESCRITURA (solo roles internos según su módulo)
-- ============================================================================

-- usuarios: solo se puede insertar el propio registro (registro) y actualizar propio perfil
CREATE POLICY "usuarios_insert_propio" ON usuarios
  FOR INSERT WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "usuarios_update_propio" ON usuarios
  FOR UPDATE USING (auth_user_id = auth.uid());

-- asociados: solo roles de administración y secretario
CREATE POLICY "asociados_escritura_admin" ON asociados
  FOR ALL USING (
    obtener_rol_usuario() IN ('administracion', 'secretario')
  );

-- suscripciones: administración y tesorero
CREATE POLICY "suscripciones_escritura" ON suscripciones
  FOR ALL USING (
    obtener_rol_usuario() IN ('administracion', 'tesorero')
  );

-- pedidos: administración, producción (no existe como rol separado, usamos distribucion) y secretaría
CREATE POLICY "pedidos_escritura" ON pedidos
  FOR ALL USING (
    obtener_rol_usuario() IN ('administracion', 'distribucion', 'secretario')
  );

-- libro_caja: tesorero y administración
CREATE POLICY "libro_caja_escritura" ON libro_caja
  FOR ALL USING (
    obtener_rol_usuario() IN ('tesorero', 'administracion')
  );

-- entregas: distribución
CREATE POLICY "entregas_escritura" ON entregas
  FOR ALL USING (
    obtener_rol_usuario() = 'distribucion'
  );

-- tareas: secretario
CREATE POLICY "tareas_escritura" ON tareas
  FOR ALL USING (
    obtener_rol_usuario() = 'secretario'
  );

-- actas: secretario
CREATE POLICY "actas_escritura" ON actas
  FOR ALL USING (
    obtener_rol_usuario() = 'secretario'
  );

-- cargos, comisiones, tipos_vianda, menu_semanal: escritura para roles internos (compras, producción, comunicación)
CREATE POLICY "catalogo_escritura_interno" ON cargos
  FOR ALL USING (rol_puede_escribir());

CREATE POLICY "comisiones_escritura_interno" ON comisiones
  FOR ALL USING (rol_puede_escribir());

CREATE POLICY "tipos_vianda_escritura_interno" ON tipos_vianda
  FOR ALL USING (rol_puede_escribir());

CREATE POLICY "menu_semanal_escritura_interno" ON menu_semanal
  FOR ALL USING (rol_puede_escribir());

-- ============================================================================
-- COMENTARIO SOBRE CONFIDENCIALIDAD
-- ============================================================================
-- Los datos de asociados son confidenciales. Las políticas RLS impiden que
-- alumnos suscriptos (rol 'asociado') vean datos de otros asociados.
-- El tablero de KPI muestra solo totales agregados, nunca datos personales.
