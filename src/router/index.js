import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
} from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { MODULOS, puedeAcceder } from "@/utils/roles";
import { modules } from "@/data/modules";
const pages = {
  Dashboard: () => import("@/views/DashboardView.vue"),
  Informe: () => import("@/views/InformeView.vue"),
  Proyecto: () => import("@/views/ProyectoView.vue"),
  Datos: () => import("@/views/DatosView.vue"),
};
const router = createRouter({
  history:
    import.meta.env.VITE_ROUTER_MODE === "hash"
      ? createWebHashHistory(import.meta.env.BASE_URL)
      : createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "Login",
      component: () => import("@/views/LoginView.vue"),
    },
    {
      path: "/restablecer",
      name: "Restablecer",
      component: () => import("@/views/RestablecerView.vue"),
      meta: { title: "Nueva contraseña" },
    },
    ...MODULOS.map((m) => ({
      path: m.path,
      name: m.name,
      component: pages[m.name] || (() => import("@/views/GestionView.vue")),
      props: modules[m.name] ? { moduleName: m.name } : false,
      meta: { title: m.label },
    })),
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});
router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.name === "Restablecer") return true;
  if (auth.recovering && auth.user) return "/restablecer";
  if (auth.recovering && !auth.user && to.name !== "Login")
    return { path: "/login", query: { recovery: "expired" } };
  if (to.name === "Login") return auth.isAuthenticated ? "/" : true;
  if (!auth.isAuthenticated)
    return { path: "/login", query: { redirect: to.fullPath } };
  if (!puedeAcceder(auth.role, to.name)) return "/";
});
router.afterEach((to) => {
  document.title = `${to.meta.title || "Ingreso"} · La Viandita`;
});
export default router;
