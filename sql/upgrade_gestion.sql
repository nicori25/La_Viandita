-- Ejecutar DESPUÉS de schema.sql en Supabase SQL Editor.
-- No contiene credenciales ni asigna roles automáticamente.
BEGIN;
GRANT USAGE ON SCHEMA public TO authenticated;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','cancelado'));
CREATE OR REPLACE FUNCTION public.obtener_rol_usuario()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT rol FROM public.usuarios WHERE auth_user_id = auth.uid() AND activo LIMIT 1 $$;
CREATE OR REPLACE FUNCTION public.rol_puede_leer_interno()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT coalesce(public.obtener_rol_usuario() IN ('administracion','tesorero','distribucion','secretario','docente_asesor','director'),false) $$;
CREATE OR REPLACE FUNCTION public.rol_puede_escribir()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT coalesce(public.obtener_rol_usuario() IN ('administracion','tesorero','distribucion','secretario'),false) $$;
-- Reemplaza las políticas del esquema inicial por una única matriz de permisos.
DO $$
DECLARE t text; p record; roles text;
BEGIN
 FOREACH t IN ARRAY ARRAY['usuarios','asociados','suscripciones','pedidos','entregas','libro_caja','tareas','actas','menu_semanal','tipos_vianda','cargos','comisiones'] LOOP
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
   EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,t);
  END LOOP;
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM anon',t);
  IF t='usuarios' THEN
   EXECUTE 'CREATE POLICY lectura ON public.usuarios FOR SELECT TO authenticated USING (auth_user_id=auth.uid() OR public.rol_puede_leer_interno())';
   EXECUTE 'REVOKE INSERT, UPDATE, DELETE ON public.usuarios FROM authenticated';
   EXECUTE 'GRANT SELECT ON public.usuarios TO authenticated';
  ELSE
   EXECUTE format('GRANT SELECT, INSERT, UPDATE ON public.%I TO authenticated',t);
   EXECUTE format('REVOKE DELETE ON public.%I FROM authenticated',t);
   IF t IN ('menu_semanal','tipos_vianda','cargos','comisiones') THEN
    EXECUTE format('CREATE POLICY lectura ON public.%I FOR SELECT TO authenticated USING (public.obtener_rol_usuario() IS NOT NULL)',t);
   ELSE
    EXECUTE format('CREATE POLICY lectura ON public.%I FOR SELECT TO authenticated USING (public.rol_puede_leer_interno())',t);
   END IF;
   roles := CASE
    WHEN t IN ('asociados','tareas','actas') THEN '(''administracion'',''secretario'')'
    WHEN t IN ('suscripciones','libro_caja') THEN '(''administracion'',''tesorero'')'
    WHEN t IN ('pedidos','entregas') THEN '(''administracion'',''distribucion'')'
    ELSE '(''administracion'')' END;
   EXECUTE format('CREATE POLICY insertar ON public.%I FOR INSERT TO authenticated WITH CHECK (public.obtener_rol_usuario() IN %s)',t,roles);
   EXECUTE format('CREATE POLICY actualizar ON public.%I FOR UPDATE TO authenticated USING (public.obtener_rol_usuario() IN %s) WITH CHECK (public.obtener_rol_usuario() IN %s)',t,roles,roles);
   -- Se conserva historial: no hay política de eliminación física en la aplicación.
  END IF;
 END LOOP;
END $$;
-- Solo agregados: los asociados no necesitan descargar datos personales para ver el tablero.
CREATE OR REPLACE FUNCTION public.resumen_periodo(desde date,hasta date)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE output jsonb;
BEGIN
 IF public.obtener_rol_usuario() IS NULL THEN RAISE EXCEPTION 'Cuenta no habilitada'; END IF;
 IF desde IS NULL OR hasta IS NULL OR desde > hasta THEN RAISE EXCEPTION 'Período inválido'; END IF;
 SELECT jsonb_build_object(
  'ingresos',(SELECT coalesce(sum(monto),0) FROM public.libro_caja WHERE tipo='ingreso' AND fecha BETWEEN desde AND hasta),
  'egresos',(SELECT coalesce(sum(monto),0) FROM public.libro_caja WHERE tipo='egreso' AND fecha BETWEEN desde AND hasta),
  'vigentes',(SELECT count(DISTINCT asociado_id) FROM public.suscripciones WHERE estado='activa' AND fecha_inicio<=hasta AND (fecha_fin IS NULL OR fecha_fin>=hasta)),
  'entregas',(SELECT count(*) FROM public.entregas WHERE fecha BETWEEN desde AND hasta),
  'enHorario',(SELECT count(*) FROM public.entregas WHERE fecha BETWEEN desde AND hasta AND dentro_franja),
  'tareas',(SELECT count(*) FROM public.tareas WHERE fecha_limite BETWEEN desde AND hasta),
  'cumplidas',(SELECT count(*) FROM public.tareas WHERE fecha_limite BETWEEN desde AND hasta AND cumplida AND fecha_cumplimiento<=fecha_limite AND fecha_cumplimiento<=hasta),
  'pedidos',(SELECT coalesce(sum(cantidad),0) FROM public.pedidos WHERE fecha BETWEEN desde AND hasta AND estado <> 'cancelado')
 ) INTO output;
 RETURN output;
END $$;
REVOKE ALL ON FUNCTION public.resumen_periodo(date,date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.resumen_periodo(date,date) TO authenticated;
REVOKE ALL ON FUNCTION public.obtener_rol_usuario(),public.rol_puede_leer_interno(),public.rol_puede_escribir() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.obtener_rol_usuario(),public.rol_puede_leer_interno(),public.rol_puede_escribir() TO authenticated;
-- Evita retiros duplicados incluso si dos operadores trabajan a la vez.
-- Si existen duplicados previos, revisarlos antes: la migración falla sin borrar datos.
CREATE UNIQUE INDEX IF NOT EXISTS entrega_unica_por_pedido ON public.entregas(pedido_id);
COMMIT;
