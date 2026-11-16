-- Ejecutar desde Supabase SQL Editor con la cuenta del dueño del proyecto.
-- 1. Crear primero la cuenta en Authentication > Users > Add user.
-- 2. Reemplazar SOLO el correo de abajo por el correo de esa cuenta.
-- No insertar contraseñas ni claves en este archivo.
DO $$
DECLARE
  correo TEXT := 'REEMPLAZAR_POR_CORREO_ADMIN';
  cuenta UUID;
BEGIN
  IF correo='REEMPLAZAR_POR_CORREO_ADMIN' THEN
    RAISE EXCEPTION 'Reemplazá el correo por el de tu cuenta creada en Authentication > Users';
  END IF;
  SELECT id INTO cuenta FROM auth.users WHERE lower(email)=lower(correo);
  IF cuenta IS NULL THEN RAISE EXCEPTION 'Primero creá la cuenta en Authentication > Users'; END IF;
  INSERT INTO public.usuarios(auth_user_id,email,nombre,rol,activo)
  VALUES(cuenta,correo,'Administración','administracion',true)
  ON CONFLICT(auth_user_id) DO UPDATE
  SET rol='administracion',activo=true,email=excluded.email;
END $$;
