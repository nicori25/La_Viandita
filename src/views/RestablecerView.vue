<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import Icon from "@/components/Icon.vue";
const auth = useAuthStore(),
  router = useRouter(),
  password = ref(""),
  repeat = ref(""),
  visible = ref(false),
  busy = ref(false),
  error = ref("");
async function save() {
  error.value = "";
  if (password.value.length < 12) {
    error.value = "Usá al menos 12 caracteres.";
    return;
  }
  if (password.value !== repeat.value) {
    error.value = "Las contraseñas no coinciden.";
    return;
  }
  busy.value = true;
  try {
    await auth.cambiarPassword(password.value);
    password.value = "";
    repeat.value = "";
    await router.replace({ path: "/login", query: { changed: "1" } });
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <main class="login-panel" style="min-height: 100vh">
    <section class="login-card">
      <div class="brand mb-8">
        <span class="brand-symbol"><Icon name="Sprout" :size="28" /></span>La
        Viandita
      </div>
      <span class="eyebrow">RECUPERACIÓN DE CUENTA</span>
      <h1>Elegí una nueva contraseña</h1>
      <template v-if="auth.user && auth.usingSupabase"
        ><p class="muted mt-3">
          Usá una contraseña de al menos 12 caracteres que no uses en otros
          sitios.
        </p>
        <form class="login-form" @submit.prevent="save">
          <label for="new-password" class="label">Nueva contraseña</label
          ><input
            id="new-password"
            v-model="password"
            :type="visible ? 'text' : 'password'"
            class="input"
            autocomplete="new-password"
            minlength="12"
            required
          /><label for="repeat-password" class="label mt-4"
            >Repetir contraseña</label
          ><input
            id="repeat-password"
            v-model="repeat"
            :type="visible ? 'text' : 'password'"
            class="input"
            autocomplete="new-password"
            required
          /><label class="helper mt-3"
            ><input v-model="visible" type="checkbox" />Mostrar
            contraseñas</label
          >
          <p v-if="error" role="alert" class="alert alert-error mt-4">
            {{ error }}
          </p>
          <button class="btn-primary login-submit" :disabled="busy">
            {{ busy ? "Guardando…" : "Guardar nueva contraseña" }}
          </button>
        </form></template
      ><template v-else
        ><p class="alert alert-error mt-4">
          No hay una sesión válida de recuperación. El enlace puede haber
          vencido o ya haberse utilizado.
        </p>
        <RouterLink to="/login" class="btn-primary mt-5"
          >Volver y solicitar otro enlace</RouterLink
        ></template
      >
    </section>
  </main>
</template>
