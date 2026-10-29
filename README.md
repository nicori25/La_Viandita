# La Viandita - Sistema de Gestión de Precooperativa Escolar

Trabajo integrador de la escuela técnica. Precooperativa formada por estudiantes (Sebastián Lopez y Ariel Aranda, curso 7°3) que ofrece viandas accesibles a los alumnos durante la jornada escolar.

## 📋 ¿Qué es este proyecto?

Es una aplicación web para gestionar la precooperativa escolar "La Viandita". Permite llevar el registro de asociados, suscripciones, pedidos, menú semanal, libro de caja, entregas, tareas y actas, con un tablero de indicadores (KPI) para el seguimiento del desempeño.

## 🚀 Cómo correr el proyecto

### Requisitos previos
- Node.js 18 o superior
- npm (viene con Node.js)

### 1. Instalar dependencias
```bash
cd C:\Users\ariar\Desktop\La_Viandita
npm install
```

### 2. Configurar variables de entorno (opcional, para Supabase)
El proyecto funciona en **modo datos de prueba** sin necesidad de configurar nada. Si querés conectar una base de datos real en Supabase:

1. Copiá el archivo de ejemplo:
   ```bash
   copy .env.example .env
   ```
2. Edita `.env` y completá con tu URL y clave anónima de Supabase:
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-anon-publica
   ```

> ⚠️ Nunca subas el archivo `.env` al control de versiones. Está incluido en `.gitignore`.

### 3. Ejecutar en modo desarrollo
```bash
npm run dev
```
La app se abre en: http://localhost:5173

### 4. Build para producción
```bash
npm run build
```
Los archivos se generan en la carpeta `dist/`.

## 🔐 Roles simulados (primera versión)

En esta primera versión la autenticación está **simulada**: al ingresar, seleccionás un rol y no se pide contraseña. Los roles disponibles son:

| Rol | Qué puede hacer |
|-----|-----------------|
| Tesorero | Ver tablero, gestionar Libro de Caja y suscripciones |
| Administración | Ver tablero, gestionar asociados, suscripciones y pedidos |
| Distribución | Ver tablero, gestionar pedidos y entregas |
| Secretario | Ver tablero, gestionar tareas y actas |
| Asociado | Ver tablero (solo lectura) |
| Docente Asesor | Ver tablero, asociados y actas |
| Director | Ver tablero, asociados y actas |

Los permisos se reflejan en la interfaz (los menús y botones se muestran u ocultan según el rol).

## 🗄️ Base de datos (Supabase) — Pasos 14 y 15

### Cómo configurar Supabase

1. **Crear un proyecto en Supabase**
   - Ir a [https://supabase.com](https://supabase.com)
   - Creá un nuevo proyecto (elige una contraseña para la base de datos, la necesitarás para el SQL Editor)
   - Anotá la **URL del proyecto** y la **clave pública (anon key)** de la sección Settings > API

2. **Configurar variables de entorno**
   - Copiá el archivo de ejemplo:
     ```bash
     copy .env.example .env
     ```
   - Edita `.env` y completá con tus valores:
     ```
     VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
     VITE_SUPABASE_ANON_KEY=tu-clave-anon-publica
     ```

   > ⚠️ Nunca subas el archivo `.env` al control de versiones. Está incluido en `.gitignore`. Solo la clave anónima va en el cliente.

3. **Ejecutar el script SQL**
   - Entrá al **SQL Editor** de tu proyecto Supabase
   - Copiá y pegá todo el contenido de `sql/schema.sql`
   - Ejecutá el script. Esto creará todas las tablas, claves foráneas, índices y **políticas RLS** (seguridad a nivel de fila).

4. **Crear usuarios en Supabase Auth**
   - En Authentication > Users, podés crear usuarios con email y contraseña
   - O bien, desde la app, usá la opción "Crear cuenta" en el login (si habilitás el registro)
   - Después, desde el SQL Editor, insertá un registro en la tabla `usuarios` vinculando cada usuario de Auth con su rol:
     ```sql
     INSERT INTO usuarios (auth_user_id, email, nombre, rol, activo)
     VALUES ('<auth_user_id>', 'sebastian@escuela.edu.ar', 'Sebastián López', 'tesorero', true);
     ```

### Script SQL (`sql/schema.sql`)
Contiene todas las tablas, claves foráneas, índices y relaciones necesarias para reproducir la base de datos en Supabase (PostgreSQL).

Tablas incluidas:
- `usuarios` - Usuarios del sistema con rol (vinculados a auth.users)
- `asociados` - Estudiantes asociados (datos personales confidenciales)
- `cargos` - Cargos del Consejo de Administración
- `comisiones` - Comisiones de trabajo
- `tipos_vianda` - Catálogo de viandas
- `menu_semanal` - Menú semanal con restricciones alimentarias y precio
- `suscripciones` - Suscripciones semanales/mensuales (baja lógica)
- `pedidos` - Pedidos de viandas
- `libro_caja` - Ingresos y egresos
- `entregas` - Registro de entregas con control de franja horaria
- `tareas` - Tareas asignadas a comisiones
- `actas` - Actas de asamblea y consejo

### Políticas RLS (Row Level Security)
El script SQL incluye políticas de seguridad que restringen el acceso a los datos según el rol del usuario:

| Tabla | Quién puede leer | Quién puede escribir |
|-------|-----------------|---------------------|
| usuarios | Todos autenticados (propio + interno) | Solo propio |
| asociados | Roles internos | Administración, Secretario |
| suscripciones | Roles internos | Administración, Tesorero |
| pedidos | Roles internos | Administración, Distribución, Secretario |
| libro_caja | Roles internos | Tesorero, Administración |
| entregas | Roles internos | Distribución |
| tareas | Roles internos | Secretario |
| actas | Roles internos | Secretario |
| catálogos (cargos, comisiones, tipos_vianda, menu_semanal) | Todos autenticados | Roles internos |

Los alumnos suscriptos (rol `asociado`) solo pueden leer el tablero, no ver datos personales de otros asociados.

### Modo prueba (sin Supabase)
Si no completás el `.env`, la app funciona en **modo datos de prueba** con datos ficticios. Los cambios no se guardan permanentemente. Esto permite probar todas las pantallas sin configurar Supabase.

## 📊 KPI del tablero

El tablero muestra 4 indicadores con color y etiqueta:

| KPI | Fórmula | Meta | Colores |
|-----|---------|------|---------|
| Margen mensual | (ingresos − egresos) ÷ ingresos × 100 | ≥ 10% | Verde: en meta / Amarillo: >20% revisar precio / Rojo: crítico |
| Suscriptos activos | Cantidad de suscripciones vigentes | 40 (semana 8) | Verde ≥100% / Amarillo 90-99% / Rojo <90% |
| Entregas en horario | entregas en franja ÷ totales × 100 | ≥ 95% | Verde ≥100% / Amarillo 90-99% / Rojo <90% |
| Cumplimiento de tareas | cumplidas en plazo ÷ asignadas × 100 | ≥ 85% | Verde ≥100% / Amarillo 90-99% / Rojo <90% |

- **Verde** = "En meta" (≥100% de la meta)
- **Amarillo** = "En alerta" (90% a <100%)
- **Rojo** = "Crítico" (<90% o no calculable)

El tablero muestra **solo totales, sin datos personales** de asociados.

## 🗃️ Estructura del proyecto

```
la-viandita/
├── src/
│   ├── views/          # Páginas principales (10 vistas)
│   ├── components/     # Componentes reutilizables (tarjetas KPI, alertas, diálogos, etc.)
│   ├── router/         # Rutas y protección por rol
│   ├── stores/         # Estado global (autenticación simulada)
│   ├── services/       # Servicio de conexión con Supabase
│   ├── data/           # Datos ficticios para pruebas
│   ├── utils/          # Utilidades (KPIs, validaciones, roles)
│   ├── assets/css/     # Estilos (Tailwind CSS)
│   ├── App.vue
│   └── main.js
├── sql/
│   └── schema.sql      # Script de base de datos para Supabase
├── .env.example        # Ejemplo de variables de entorno (no subir a git)
├── .gitignore          # Archivos ignorados por git
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 📝 Pasos de la consigna "Diseño del sistema"

| Paso | Estado | Descripción |
|------|--------|-------------|
| 1 | ✅ | Revisar pantallas e historias (partimos de cero, carpeta vacía) |
| 2 | ✅ | Proyecto Vue.js creado con Vite, carpetas organizadas |
| 3 | ✅ | 10 vistas principales implementadas |
| 4 | ✅ | Navegación con Vue Router, roles simulados |
| 5 | ✅ | Formularios con validación de campos obligatorios, formatos y valores permitidos |
| 6 | ✅ | Listados con datos ficticios, identificados como "datos de prueba" |
| 7 | ✅ | Interfaz responsiva con Tailwind CSS (computadora y celular) |
| 8 | ✅ | ABMC implementado; bajas lógicas (no se borran registros, se desactivan) |
| 9 | ✅ | Búsquedas y filtros en cada listado |
| 10 | ✅ | Se conserva historial al dar de baja; datos compartidos vía Supabase |
| 11 | ✅ | Se justifica el uso de Supabase como backend (ver abajo) |
| 12 | ✅ | Modelo de tablas diseñado en `sql/schema.sql` |
| 13 | ✅ | Script SQL creado en `sql/schema.sql` |
| 14 | ✅ | Servicios de Supabase creados; app conecta si hay .env, si no usa mock data |
| 15 | ✅ | Store de auth con Supabase Auth; SQL con políticas RLS por rol |
| 16 | ✅ | Mensajes de carga, confirmación y error implementados |

## 🎯 Justificación del backend (Paso 11)

**Se usa Supabase como backend** porque:

- Permite que los datos se conserven y se compartan entre usuarios y dispositivos (no quedan atrapados en una sola computadora).
- Ofrece autenticación real (Supabase Auth) y políticas de acceso a nivel de fila (RLS), lo cual permite aplicar permisos sobre los datos, no solo en la interfaz.
- Se puede reproducir la base de datos con el script SQL (`sql/schema.sql`).
- Cumple con los pasos 14, 15 y 16 de la consigna.

**Limitación de no usar backend (alternativa desestimada):** si solo usáramos `localStorage`, los datos quedarían solo en ese navegador y esa computadora, no se compartirían entre usuarios, no habría autenticación real ni RLS, y no se cumplirían varios pasos de la consigna.

## ⚠️ Seguridad y confidencialidad

- Los datos personales de asociados (nombre, apellido, curso, división, teléfono) son confidenciales. Solo roles internos pueden verlos.
- Los alumnos suscriptos son clientes y NO acceden a los datos internos.
- **Nunca se incluyen contraseñas ni claves secretas en el cliente ni en la documentación.** La clave anónima de Supabase es pública y va en `.env`; la clave secreta (`service_role`) se usa solo en el servidor, nunca en el frontend.
- El tablero muestra solo totales, nunca datos personales.

## 🛠️ Tecnologías usadas

- Vue 3 (Composition API)
- Vite (build tool)
- Vue Router (navegación)
- Pinia (estado global)
- Tailwind CSS (estilos, responsivo)
- Supabase (base de datos y auth - pendiente de configurar)
- Lucide Vue (iconos)

## ✍️ Idioma

Todos los textos de la interfaz y la documentación están en español rioplatense neutro.

---

Desarrollado por Sebastián Lopez y Ariel Aranda, 7°3 - Escuela Técnica