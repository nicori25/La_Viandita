import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Vistas (carga perezosa para que la app arranque rápido)
const LoginView = () => import('@/views/LoginView.vue')
const DashboardView = () => import('@/views/DashboardView.vue')
const AsociadosView = () => import('@/views/AsociadosView.vue')
const SuscripcionesView = () => import('@/views/SuscripcionesView.vue')
const PedidosView = () => import('@/views/PedidosView.vue')
const MenuSemanalView = () => import('@/views/MenuSemanalView.vue')
const LibroCajaView = () => import('@/views/LibroCajaView.vue')
const EntregasView = () => import('@/views/EntregasView.vue')
const TareasView = () => import('@/views/TareasView.vue')
const ActasView = () => import('@/views/ActasView.vue')

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresGuest: true },
  },
  {
    path: '/',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true, puedeLeer: true },
  },
  {
    path: '/asociados',
    name: 'Asociados',
    component: AsociadosView,
    meta: { requiresAuth: true, puedeEscribir: true },
  },
  {
    path: '/suscripciones',
    name: 'Suscripciones',
    component: SuscripcionesView,
    meta: { requiresAuth: true, puedeEscribir: true },
  },
  {
    path: '/pedidos',
    name: 'Pedidos',
    component: PedidosView,
    meta: { requiresAuth: true, puedeEscribir: true },
  },
  {
    path: '/menu-semanal',
    name: 'MenuSemanal',
    component: MenuSemanalView,
    meta: { requiresAuth: true, puedeEscribir: true },
  },
  {
    path: '/libro-caja',
    name: 'LibroCaja',
    component: LibroCajaView,
    meta: { requiresAuth: true, puedeEscribir: true },
  },
  {
    path: '/entregas',
    name: 'Entregas',
    component: EntregasView,
    meta: { requiresAuth: true, puedeEscribir: true },
  },
  {
    path: '/tareas',
    name: 'Tareas',
    component: TareasView,
    meta: { requiresAuth: true, puedeEscribir: true },
  },
  {
    path: '/actas',
    name: 'Actas',
    component: ActasView,
    meta: { requiresAuth: true, puedeEscribir: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Guardia de navegación: verifica autenticación y permisos por rol
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  // Si requiere autenticación y no hay rol, redirige a login
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next({ name: 'Login' })
  }

  // Si es solo para invitados y ya hay sesión, redirige al tablero
  if (to.meta.requiresGuest && auth.isAuthenticated) {
    return next({ name: 'Dashboard' })
  }

  next()
})

export default router
