-- Ejecutar una vez en Supabase SQL Editor. No modifica perfiles existentes.
-- El navegador puede crear únicamente su propio perfil de Asociado, con sesión
-- válida y correo confirmado. Nunca acepta roles, correos o IDs del cliente.
BEGIN;
CREATE OR REPLACE FUNCTION public.asegurar_mi_perfil()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cuenta UUID := auth.uid();
  correo TEXT;
  nombre_nuevo TEXT;
  confirmado TIMESTAMPTZ;
  resultado jsonb;
BEGIN
  IF cuenta IS NULL THEN RAISE EXCEPTION 'Iniciá sesión para crear tu perfil' USING ERRCODE = '42501'; END IF;
  SELECT u.email, u.email_confirmed_at,
         left(coalesce(nullif(trim(u.raw_user_meta_data->>'nombre'),''),split_part(u.email,'@',1),'Asociado'),100)
  INTO correo, confirmado, nombre_nuevo
  FROM auth.users u WHERE u.id=cuenta;
  IF correo IS NULL OR confirmado IS NULL THEN
    RAISE EXCEPTION 'Confirmá tu correo antes de ingresar' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.usuarios(auth_user_id,email,nombre,rol,activo)
  VALUES(cuenta,correo,nombre_nuevo,'asociado',true)
  ON CONFLICT(auth_user_id) DO NOTHING;
  SELECT jsonb_build_object('rol',u.rol,'nombre',u.nombre,'activo',u.activo)
  INTO resultado FROM public.usuarios u WHERE u.auth_user_id=cuenta;
  RETURN resultado;
END $$;
REVOKE ALL ON FUNCTION public.asegurar_mi_perfil() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.asegurar_mi_perfil() TO authenticated;
COMMIT;
