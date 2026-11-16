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
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (data.session) {
          this.user = data.session.user;
          await this.cargarRolDesdeBD(this.user.id);
        }
        supabase.auth.onAuthStateChange((event, session) => {
          if (event === "INITIAL_SESSION") return;
          if (session?.user.id === this.user?.id && this.role) {
            this.user = session.user;
            return;
          }
          this.role = null;
          this.user = session?.user || null;
          this.userName = null;
          if (this.user)
            setTimeout(
              () =>
                this.cargarRolDesdeBD(this.user.id).catch(() => {
                  this.role = null;
                }),
              0,
            );
        });
      }
      this.initialized = true;
    },
    async cargarRolDesdeBD(id) {
      this.role = null;
      const { data, error } = await supabase
        .from("usuarios")
        .select("rol,nombre,activo")
        .eq("auth_user_id", id)
        .single();
      if (error) {
        if (error.code === "PGRST116")
          throw Error(
            "Tu cuenta no tiene un perfil habilitado. El responsable debe vincularla en la tabla usuarios.",
          );
        throw error;
      }
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
    async logout() {
      if (this.usingSupabase) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
      sessionStorage.removeItem(KEY);
      this.user = null;
      this.role = null;
      this.userName = null;
    },
  },
  getters: {
    isAuthenticated: (s) => !!s.user && !!s.role,
    estaEnModoPrueba: (s) => !s.usingSupabase,
  },
});
