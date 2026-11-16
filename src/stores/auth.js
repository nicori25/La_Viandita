import { defineStore } from "pinia";
import { supabase, supabaseConfigurado } from "@/services/supabase";
import { ROLES } from "@/utils/roles";
const KEY = "viandita-session-v1";
export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    role: null,
    userName: null,
    usingSupabase: supabaseConfigurado(),
    initialized: false,
    recovering:
      new URLSearchParams(location.search).get("recuperar") === "1" ||
      location.pathname.endsWith("/restablecer") ||
      location.hash.startsWith("#/restablecer"),
    listaRoles: ROLES,
  }),
  actions: {
    async inicializar() {
      if (this.initialized) return;
      if (!this.usingSupabase) {
        try {
          const saved = JSON.parse(sessionStorage.getItem(KEY));
          if (ROLES.some((r) => r.id === saved?.role))
            this.loginSimulado(saved.role, saved.userName);
        } catch {
          /* Sesión inválida: volver a ingresar. */
        }
      } else {
        // Registrar el evento antes de restaurar la sesión: el enlace de recuperación
        // puede llegar al iniciar la aplicación, antes de que exista el router.
        supabase.auth.onAuthStateChange((event, session) => {
          if (event === "PASSWORD_RECOVERY") this.recovering = true;
          if (event === "INITIAL_SESSION") return;
          if (
            session?.user.id === this.user?.id &&
            this.role &&
            !this.recovering
          ) {
            this.user = session.user;
            return;
          }
          this.user = session?.user || null;
          this.role = null;
          this.userName = null;
          const id = this.user?.id;
          if (id && !this.recovering)
            setTimeout(() => {
              if (this.user?.id !== id) return;
              this.cargarRolDesdeBD(id).catch(() => {
                this.role = null;
              });
            }, 0);
        });
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (data.session) {
          this.user = data.session.user;
          if (!this.recovering) await this.cargarRolDesdeBD(this.user.id);
        }
      }
      this.initialized = true;
    },
    async cargarRolDesdeBD(id) {
      this.role = null;
      let { data, error } = await supabase
        .from("usuarios")
        .select("rol,nombre,activo")
        .eq("auth_user_id", id)
        .single();
      if (error?.code === "PGRST116") {
        const result = await supabase.rpc("asegurar_mi_perfil");
        if (result.error?.code === "PGRST202")
          throw Error(
            "El registro todavía no está habilitado. Pedí al responsable que complete la configuración.",
          );
        data = result.data;
        error = result.error;
      }
      if (error) throw error;
      if (!data)
        throw Error("No se pudo obtener tu perfil. Volvé a iniciar sesión.");
      if (!data.activo || !ROLES.some((r) => r.id === data.rol))
        throw Error(
          "La cuenta no tiene un perfil habilitado. Consultá al responsable.",
        );
      this.role = data.rol;
      this.userName = data.nombre;
    },
    loginSimulado(role, userName) {
      if (this.usingSupabase || !ROLES.some((r) => r.id === role))
        throw Error("Rol no válido.");
      this.user = { id: "simulado-" + role };
      this.role = role;
      this.userName = userName || ROLES.find((r) => r.id === role).nombre;
      sessionStorage.setItem(
        KEY,
        JSON.stringify({ role, userName: this.userName }),
      );
    },
    async login(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      this.user = data.user;
      await this.cargarRolDesdeBD(data.user.id);
    },
    async registrar(nombre, email, password) {
      if (!this.usingSupabase)
        throw Error("El registro requiere la conexión a Supabase.");
      const redirect = new URL(import.meta.env.BASE_URL, location.origin);
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { nombre: nombre.trim() },
          emailRedirectTo: redirect.href,
        },
      });
      if (error) throw error;
      if (data.session) {
        this.user = data.user;
        try {
          await this.cargarRolDesdeBD(data.user.id);
        } catch (e) {
          return { confirmationRequired: false, profileError: e.message };
        }
      }
      return { confirmationRequired: !data.session, profileError: null };
    },
    async solicitarRecuperacion(email) {
      if (!this.usingSupabase)
        throw Error(
          "La recuperación está disponible para cuentas de Supabase.",
        );
      const redirect = new URL(import.meta.env.BASE_URL, location.origin);
      redirect.searchParams.set("recuperar", "1");
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: redirect.href },
      );
      if (error) throw error;
    },
    async cambiarPassword(password) {
      if (!this.usingSupabase || !this.user)
        throw Error("El enlace venció. Solicitá uno nuevo desde el ingreso.");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      this.recovering = false;
      // El cambio ya está confirmado; cerrar únicamente esta sesión temporal.
      const result = await supabase.auth.signOut({ scope: "local" });
      this.user = null;
      this.role = null;
      this.userName = null;
      return { signOutError: result.error?.message || null };
    },
    async logout() {
      if (this.usingSupabase) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
      sessionStorage.removeItem(KEY);
      this.user = null;
      this.role = null;
      this.userName = null;
      this.recovering = false;
    },
  },
  getters: {
    isAuthenticated: (s) => !!s.user && !!s.role,
    estaEnModoPrueba: (s) => !s.usingSupabase,
  },
});
