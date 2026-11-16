# La Viandita

Aplicación de gestión para una precooperativa escolar de viandas. Vue 3, Vite, Pinia y Supabase opcional.

## Iniciar

Node.js 22 o 24 y npm. Desde el checkout:

```bash
npm ci
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

En el entorno en la nube, si la caché predeterminada no es escribible:

```bash
npm ci --cache /workspace/.npm-cache
```

Por defecto se conecta a **Supabase** en el proyecto `skctpovhhavsxoryhbjz`. La URL y la clave pública `publishable` están en `src/config/supabase.js`; se pueden sobrescribir con variables Vite. No hay claves administrativas en el cliente ni en el repositorio. Iniciar sesión requiere una cuenta de Auth con perfil activo en `usuarios`.

Las tablas ya existen. Para habilitar el tablero y actualizar permisos, ejecutar `sql/upgrade_gestion.sql` desde SQL Editor. Ver [sql/README.md](sql/README.md) y el asistente `sql/vincular_administrador.sql` para crear el perfil de Administración. Esta operación requiere acceso al panel del proyecto: la clave pública no puede aplicar migraciones.

Para recorrer una **demostración aislada con datos ficticios**:

```bash
VITE_DATA_MODE=demo npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

En ese modo, elegir **Administración** permite recorrer todos los módulos. Los roles de prueba son una simulación, no autenticación segura. No usar datos reales en la demostración. Una falla de conexión a Supabase nunca activa la demostración automáticamente.

## Funciones

- Navegación adaptable a computadoras y celulares.
- Asociados: alta, edición, búsqueda, baja lógica y reactivación.
- Suscripciones: modalidad, importe, vigencia y control de superposición.
- Menú: opciones, precios, características alimentarias y estado.
- Pedidos: asociación con suscripción vigente, menú y cantidad; cancelación sin borrar el historial. Los pedidos entregados no se cancelan ni editan.
- Entregas: retiro efectivo, puntualidad y observaciones; rechazo de duplicados.
- Caja: ingresos, egresos, responsable y referencia de comprobante.
- Tareas: comisión, plazo, cumplimiento y fecha de cierre.
- Actas: reunión, contenido, aprobación y responsable del registro.
- Tablero: cuatro KPI, tres gráficos, período, actualización y estados sin datos/error/carga.
- Informe: período, fuentes, resultados, metas, gráficos, acciones y observaciones; imprimir o guardar como PDF desde el navegador.
- Listados: búsqueda, filtros, paginación y exportación CSV.
- Datos de demostración persistentes y descarga/restauración de respaldo JSON.

Los cambios locales se guardan en `localStorage` (`viandita-data-v1`). La sesión de prueba se conserva en la pestaña mediante `sessionStorage`. El respaldo no sincroniza dispositivos ni migra automáticamente los datos a Supabase. Si se bloquea el almacenamiento o no alcanza el espacio, la operación informa el error y no aplica el cambio. Un respaldo corrupto no se reemplaza silenciosamente: se ofrece recuperación o restablecimiento desde Datos y respaldo.

## Una tarea de principio a fin

1. Ingresar como Administración y crear un asociado ficticio.
2. Crear su suscripción con fechas e importe. Se rechazan fechas invertidas y superposiciones activas.
3. Registrar el cobro confirmado en Caja con concepto y referencia de comprobante.
4. Seleccionar un menú activo y crear el pedido en una fecha de vigencia de la suscripción.
5. Registrar el retiro en Entregas. La ausencia de un estudiante se mantiene como pedido pendiente, no como entrega.
6. Seleccionar ese período en Resumen o Informe, revisar los resultados e imprimir el seguimiento.

Estos registros se completan explícitamente: una suscripción no cobra ni genera pedidos automáticamente. La referencia de comprobante es textual; no hay emisión fiscal ni procesamiento de pagos. Caja conserva los movimientos: una rectificación se documenta mediante un asiento compensatorio. El registro de estudiantes no acredita por sí solo membresía o derechos de voto en la precooperativa.

## Indicadores

- Margen: `(ingresos − egresos) / ingresos × 100`; meta ≥10%, revisar precio si supera el 20%.
- Suscriptores: personas distintas con estado activo y vigencia al cierre. No acredita pago. Meta de referencia: 40 al final de semana 8; requiere acordar inicio y capacidad.
- Puntualidad: entregas marcadas en franja / entregas registradas; meta ≥95%.
- Tareas: cierres en fecha / tareas cuyo vencimiento está en el período; meta ≥85%.

Sin denominador, se muestra **No calculable**, no cero. El filtro afecta las cuatro métricas y las tres visualizaciones. Las consultas se realizan al abrir la vista o aplicar un período. Una edición de fechas invalida el resultado anterior hasta aplicar el filtro. Los datos iniciales son de marzo de 2026 y el período inicial de la demo refleja ese mes. Hay 9 suscripciones con estado activo, pero solo 4 vigentes al cierre del 31/03. Las observaciones iniciales de entrega incluyen una ausencia: ese registro es histórico ficticio y debe depurarse antes de evaluar un servicio real.

## Roles

Administración escribe en todos los módulos; Tesorero en suscripciones y caja; Distribución en pedidos y entregas; Secretario en asociados, tareas y actas. Los roles internos y de supervisión pueden consultar la gestión y el seguimiento. Asociado consulta solo indicadores agregados, menú y proyecto. La ruta y el servicio local comprueban permisos; la protección real remota requiere RLS de Supabase.

## Supabase configurado

1. En el proyecto ya configurado, ejecutar solo `sql/upgrade_gestion.sql`: las tablas ya existen. Para otra base vacía, ejecutar primero `sql/schema.sql`.
2. La configuración pública predeterminada está en `src/config/supabase.js`. Opcionalmente sobrescribirla con `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`; se mantiene compatibilidad con `VITE_SUPABASE_ANON_KEY`. Nunca usar `service_role` ni claves secretas en el cliente.
3. Crear las cuentas en Supabase Auth. Desde SQL Editor, con acceso administrativo, insertar el perfil en `usuarios` usando el UUID de Auth, correo, nombre y rol autorizado. Los clientes no pueden crear ni cambiar perfiles/roles.
4. Cargar catálogos y datos del servicio. `sql/datos_prueba.sql` se puede inspeccionar como ejemplo; no ejecutar semillas en una base de producción ni suponer que los UUID de Auth coinciden.
5. Verificar con cuentas de cada rol: lectura y escritura permitida/denegada, recarga, segunda sesión, consulta agregada `resumen_periodo`, y respaldo/restauración administrados en Supabase.

La migración es transaccional, excluye al rol Asociado de lecturas internas, fija `search_path` de funciones privilegiadas, evita autoasignación de roles y agrega consulta agregada autenticada y un índice de entrega única por pedido. Si hay entregas duplicadas existentes, la migración falla sin borrar datos: revisar los duplicados antes de volver a aplicarla.

**Conectividad real verificada:** Auth devuelve HTTP 200 y las nueve tablas operativas responden HTTP 200 en consultas sin filas. La función `resumen_periodo` faltaba al verificar la base. **La migración y el acceso con una cuenta autenticada requieren completar los pasos de SQL Editor; no se afirma que ya se hayan validado.** El esquema de base conserva relaciones y controles básicos. El endurecimiento de reglas concurrentes (por ejemplo, superposición de suscripciones entre dos operadores), auditoría de cambios y políticas de respaldo operativas deben validarse en el servidor antes de uso productivo.

## Validación

```bash
npm test
npm run build
npm run test:e2e
```

Los tests unitarios verifican metas, denominadores, períodos y conteo de personas. Playwright prueba navegación, gestión, persistencia, circuito completo, duplicados, permisos, móvil, respaldo y PDF. Usa Chromium en `/usr/bin/chromium`; cambiar `CHROMIUM_PATH` si está en otra ubicación. No necesita descargar navegadores en el entorno preparado. El servidor de pruebas usa el puerto 5174 y fuerza `VITE_DATA_MODE=demo`, separado de la conexión real de 5173. No deben ejecutarse pruebas de escritura contra datos reales. Cada prueba usa un contexto de navegador aislado.

## Límites del proyecto

El sistema gestiona registros; no certifica seguridad alimentaria, autorización de actividades, aprobación de actas o firma de documentos. Encuestas, piloto alimentario, control de stock, trazabilidad sanitaria, comprobantes fiscales y ahorro real deben desarrollarse o verificarse con la escuela. Los gráficos usan texto, escalas desde cero y colores consistentes. El informe de seguimiento del sistema es distinto del informe final documental del proyecto.
