/**
 * Store de autenticación.
 *
 * Paso 15: autenticación con Supabase Auth.
 *
 * Cómo funciona:
 * - Si Supabase está configurado (.env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY),
 *   se usa Supabase Auth real (iniciar sesión, cerrar sesión, obtener usuario).
 * - Si no está configurado, se usa MODO SIMULADO: el usuario elige un rol al entrar
 *   y no se pide contraseña (primera versión).
 *
 * El rol se guarda en la tabla `usuarios` de Supabase y se recupera al iniciar sesión.
 */

import { defineStore } from 'pinia'
import { supabase, supabaseConfigurado } from '@/services/supabase'
import { ROLES } from '@/utils/roles'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,        // objeto de usuario de Supabase Auth o null
    role: null,        // rol del usuario (tesorero, administracion, etc.)
    userName: null,
    usingSupabase: false, // true si Supabase está configurado
    listaRoles: ROLES,
  }),
  actions: {
    /**
     * Inicializa el store: verifica si hay sesión activa en Supabase.
     */
    async inicializar() {
      this.usingSupabase = supabaseConfigurado()

      if (!this.usingSupabase) {
        // Modo simulado: no hay sesión real
        this.user = null
        this.role = null
        this.userName = null
        return
      }

      // Escuchar cambios de sesión en Supabase
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session && session.user) {
          this.user = session.user
          this.userName = session.user.email || 'Usuario'
          await this.cargarRolDesdeBD(session.user.id)
        } else {
          this.user = null
          this.role = null
          this.userName = null
        }
      })

      // Verificar sesión existente al cargar la app
      const { data: { session } } = await supabase.auth.getSession()
      if (session && session.user) {
        this.user = session.user
        this.userName = session.user.email || 'Usuario'
        await this.cargarRolDesdeBD(session.user.id)
      }
    },

    /**
     * Carga el rol del usuario desde la tabla usuarios de Supabase.
     */
    async cargarRolDesdeBD(authUserId) {
      if (!supabaseConfigurado()) return

      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('rol, nombre')
          .eq('auth_user_id', authUserId)
          .single()

        if (!error && data) {
          this.role = data.rol
          this.userName = data.nombre || this.userName
        }
      } catch (e) {
        console.warn('No se pudo cargar el rol desde la base de datos:', e)
      }
    },

    /**
     * Inicio de sesión simulado (modo prueba sin Supabase).
     * El usuario elige el rol y no hay contraseña real.
     */
    loginSimulado(role, userName = 'Usuario') {
      if (supabaseConfigurado()) {
        console.warn('loginSimulado solo se usa en modo prueba. Usá login() con Supabase.')
        return
      }
      this.user = { id: 'simulado-' + role, email: role + '@prueba.edu.ar' }
      this.role = role
      this.userName = userName
    },

    /**
     * Inicio de sesión real con Supabase Auth (email + contraseña).
     */
    async login(email, password) {
      if (!supabaseConfigurado()) {
        throw new Error('Supabase no está configurado. Usá loginSimulado().')
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        this.user = data.user
        this.userName = data.user.email || 'Usuario'
        await this.cargarRolDesdeBD(data.user.id)
      }

      return { data, error: null }
    },

    /**
     * Registro de nuevo usuario (solo para crear la cuenta en Supabase Auth).
     * El rol se asigna después desde la tabla usuarios.
     */
    async registrar(email, password, rol, nombre) {
      if (!supabaseConfigurado()) {
        throw new Error('Supabase no está configurado.')
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // Crear el registro en la tabla usuarios vinculado al auth_user_id
        await supabase.from('usuarios').insert({
          auth_user_id: data.user.id,
          email,
          nombre,
          rol,
          activo: true,
        })
        this.user = data.user
        this.role = rol
        this.userName = nombre
      }

      return { data, error: null }
    },

    /**
     * Cerrar sesión.
     */
    async logout() {
      if (supabaseConfigurado()) {
        await supabase.auth.signOut()
      }
      this.user = null
      this.role = null
      this.userName = null
    },

    /**
     * Establece el rol manualmente (solo modo simulado).
     */
    setRole(role) {
      this.role = role
    },

    setUsingSupabase(value) {
      this.usingSupabase = value
    },
  },
  getters: {
    isAuthenticated: (state) => state.user !== null,
    rolActual: (state) => state.role,
    puedeLeerTablero: (state) => [
      'tesorero', 'administracion', 'distribucion', 'secretario',
      'asociado', 'docente_asesor', 'director'
    ].includes(state.role),
    puedeEscribir: (state) => [
      'tesorero', 'administracion', 'distribucion', 'secretario'
    ].includes(state.role),
    estaEnModoPrueba: (state) => !state.usingSupabase,
  },
})
