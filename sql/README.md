# Conexión a Supabase

Proyecto configurado: https://supabase.com/dashboard/project/skctpovhhavsxoryhbjz

La clave `publishable` del cliente es pública: no permite ejecutar SQL, crear usuarios administrativos ni modificar permisos. No hace falta compartir una clave secreta en el chat ni subirla a Git.

## Completar la base existente

1. Abrir **SQL Editor** del proyecto.
2. Ejecutar el contenido completo de **`upgrade_gestion.sql`**. Es transaccional: actualiza permisos, agrega estado de pedidos, evita entregas duplicadas y crea la función agregada del tablero. No borra registros. Si informa entregas duplicadas, revisarlas antes de repetir la migración.
3. Si no hay una cuenta de administración, crearla en **Authentication → Users → Add user**. Elegir el correo y una contraseña allí.
4. Abrir **`vincular_administrador.sql`**, reemplazar el correo indicado y ejecutarlo en SQL Editor. La asignación de roles solo se realiza con acceso administrativo de la base.
5. Iniciar sesión en la aplicación con esa cuenta. Verificar crear un registro ficticio, recargar, consultarlo desde otra sesión e imprimir el informe. No insertar ejemplos en registros productivos.

Las tablas ya existían en el proyecto al comprobar la conexión el 16/11/2026: **no volver a ejecutar `schema.sql` sobre esa base**. Para una base vacía diferente, ejecutar primero `schema.sql` y luego `upgrade_gestion.sql`.

`datos_prueba.sql` es solo un ejemplo previo; no se ejecuta automáticamente ni se usa como migración.

## Comprobación realizada

- Auth health: HTTP 200.
- Consultas a las nueve tablas operativas con `limit=0`: HTTP 200; no se descargaron datos personales.
- `resumen_periodo`: no existía (`PGRST202`). La migración requiere SQL Editor o una conexión administrativa que no se proporcionó.
- No se crearon cuentas ni se alteraron registros remotos con la clave pública.
