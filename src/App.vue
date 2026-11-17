<script setup>
import BrandLogo from "@/components/BrandLogo.vue";
import { ref, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { MODULOS, puedeAcceder, nombreRol } from "@/utils/roles";
import Icon from "@/components/Icon.vue";
const auth = useAuthStore(),
  router = useRouter(),
  route = useRoute(),
  menuOpen = ref(false),
  logoutError = ref("");
const navigation = computed(() =>
  MODULOS.filter((m) => puedeAcceder(auth.role, m.name)),
);
const groups = computed(() => [
  ...new Set(navigation.value.map((m) => m.group)),
]);
watch(
  () => route.fullPath,
  () => (menuOpen.value = false),
);
async function logout() {
  try {
    await auth.logout();
    router.push("/login");
  } catch (e) {
    logoutError.value = e.message;
  }
}
</script>
<template>
  <RouterView
    v-if="
      !auth.isAuthenticated || auth.recovering || route.name === 'Restablecer'
    "
  />
  <div v-else class="app-shell">
    <button
      v-if="menuOpen"
      class="sidebar-backdrop"
      aria-label="Cerrar navegación"
      @click="menuOpen = false"
    />
    <aside
      class="sidebar no-print"
      :class="{ open: menuOpen }"
      aria-label="Navegación principal"
    >
      <RouterLink
        to="/"
        class="brand-home"
        aria-label="La Viandita: ir al resumen"
        ><BrandLogo variant="sidebar"
      /></RouterLink>
      <div class="sidebar-context">
        <span class="context-avatar">LV</span
        ><span>Nuestro espacio<small>Gestión de la cooperativa</small></span
        ><Icon name="ChevronDown" :size="15" />
      </div>
      <nav>
        <div v-for="group in groups" :key="group" class="nav-group">
          <p class="nav-group-label">{{ group }}</p>
          <RouterLink
            v-for="item in navigation.filter((m) => m.group === group)"
            :key="item.name"
            :to="item.path"
            class="nav-link"
            :class="{ active: route.name === item.name }"
            :aria-current="route.name === item.name ? 'page' : undefined"
            ><Icon :name="item.icon" :size="19" /><span>{{ item.label }}</span
            ><span v-if="route.name === item.name" class="nav-dot"
          /></RouterLink>
        </div>
      </nav>
      <div class="sidebar-bottom">
        <div class="sidebar-message">
          <Icon name="HeartHandshake" :size="23" />
          <h3>Mejor, entre todos.</h3>
          <p>Pequeñas acciones.<br />Un gran proyecto compartido.</p>
        </div>
        <button class="user-profile" @click="logout">
          <span class="user-avatar">{{ auth.userName?.slice(0, 1) }}</span
          ><span
            >{{ nombreRol(auth.role)
            }}<small>{{
              auth.estaEnModoPrueba ? "Cambiar rol de prueba" : "Cerrar sesión"
            }}</small></span
          ><Icon name="LogOut" :size="17" />
        </button>
      </div>
    </aside>
    <div class="app-main">
      <header class="topbar no-print">
        <div class="topbar-left">
          <button
            class="icon-button mobile-menu"
            aria-label="Abrir navegación"
            :aria-expanded="menuOpen"
            @click="menuOpen = !menuOpen"
          >
            <Icon name="Menu" /></button
          ><BrandLogo variant="topbar" /><span class="breadcrumb"
            >Nuestro espacio <Icon name="ChevronRight" :size="14" />
            <strong>{{ route.meta.title }}</strong></span
          >
        </div>
        <div class="topbar-right">
          <span class="mode-badge"
            ><span class="live-dot" />{{
              auth.estaEnModoPrueba
                ? "Demostración local"
                : "Conectado a Supabase"
            }}</span
          ><span class="topbar-avatar">{{ auth.userName?.slice(0, 1) }}</span>
        </div>
      </header>
      <main id="contenido" class="main-content">
        <div v-if="auth.estaEnModoPrueba" class="demo-notice no-print">
          <Icon name="Info" :size="16" />
          <p>
            Datos de prueba · Tus cambios se conservan en este navegador. Usá
            solo información ficticia.
          </p>
          <RouterLink v-if="puedeAcceder(auth.role, 'Datos')" to="/datos"
            >Ver respaldo →</RouterLink
          >
        </div>
        <p v-if="logoutError" role="alert" class="alert alert-error">
          {{ logoutError }}
        </p>
        <RouterView :key="route.name" />
      </main>
      <footer class="app-footer">
        <span
          >© {{ new Date().getFullYear() }} La Viandita · Precooperativa
          escolar</span
        ><span>Mejor, entre todos.</span>
      </footer>
    </div>
  </div>
</template>
