<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { ROLES } from "@/utils/roles";
import Icon from "@/components/Icon.vue";
const auth = useAuthStore(),
  router = useRouter(),
  route = useRoute();
const selected = ref("administracion"),
  email = ref(""),
  password = ref(""),
  visible = ref(false),
  busy = ref(false),
  error = ref("");
async function login() {
  busy.value = true;
  error.value = "";
  try {
    if (auth.estaEnModoPrueba) auth.loginSimulado(selected.value);
    else {
      if (!email.value.trim() || !password.value)
        throw Error("Completá el correo y la contraseña.");
      await auth.login(email.value.trim(), password.value);
    }
    const next =
      typeof route.query.redirect === "string" &&
      route.query.redirect.startsWith("/")
        ? route.query.redirect
        : "/";
    await router.push(next);
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <main class="login-page">
    <section class="login-story">
      <div class="brand brand-light">
        <span class="brand-symbol"><Icon name="Sprout" :size="30" /></span
        ><span>La Viandita<small>PRECOOPERATIVA ESCOLAR</small></span>
      </div>
      <div class="login-story-content">
        <span class="welcome-label"
          >DE NUESTRA ESCUELA, PARA NUESTRA ESCUELA</span
        >
        <h1>Una buena idea<br />crece cuando<br />la compartimos.</h1>
        <p>
          Organizamos un servicio de viandas accesibles y aprendemos a construir
          una cooperativa, entre todos.
        </p>
        <div class="login-values">
          <span><Icon name="Utensils" :size="20" />Alimentación accesible</span
          ><span
            ><Icon name="HeartHandshake" :size="20" />Trabajo cooperativo</span
          ><span><Icon name="Sprout" :size="20" />Aprender haciendo</span>
        </div>
      </div>
      <p class="login-credit">Sebastián Lopez y Ariel Aranda · 7°3</p>
    </section>
    <section class="login-panel">
      <div class="login-card">
        <span class="eyebrow">BIENVENIDO A NUESTRO ESPACIO</span>
        <h2>Todo listo para empezar.</h2>
        <p class="muted">
          {{
            auth.estaEnModoPrueba
              ? "Elegí un rol para recorrer el proyecto."
              : "Ingresá con tu cuenta para continuar."
          }}
        </p>
        <form @submit.prevent="login" class="login-form">
          <p v-if="error" class="alert alert-error" role="alert">{{ error }}</p>
          <template v-if="auth.estaEnModoPrueba"
            ><label class="label" for="demo-role">Ingresar como</label>
            <div class="role-picker">
              <label
                v-for="role in ROLES"
                :key="role.id"
                :class="{ selected: selected === role.id }"
                ><input
                  v-model="selected"
                  type="radio"
                  name="role"
                  :value="role.id"
                  :aria-label="role.nombre" />
                <div>
                  <strong>{{ role.nombre }}</strong
                  ><small>{{ role.descripcion }}</small>
                </div>
                <Icon v-if="selected === role.id" name="CircleCheck" :size="19"
              /></label></div></template
          ><template v-else
            ><label for="login-email" class="label">Correo electrónico</label
            ><input
              id="login-email"
              v-model="email"
              type="email"
              class="input"
              autocomplete="username"
              required
            /><label for="login-password" class="label mt-4">Contraseña</label>
            <div class="password-field">
              <input
                id="login-password"
                v-model="password"
                :type="visible ? 'text' : 'password'"
                class="input"
                autocomplete="current-password"
                required
              /><button
                type="button"
                class="icon-button"
                :aria-label="
                  visible ? 'Ocultar contraseña' : 'Mostrar contraseña'
                "
                @click="visible = !visible"
              >
                <Icon :name="visible ? 'EyeOff' : 'Eye'" />
              </button>
            </div>
            <p class="helper mt-3">
              Las cuentas y sus permisos son asignados por el responsable de la
              cooperativa.
            </p></template
          ><button class="btn-primary login-submit" :disabled="busy">
            {{ busy ? "Ingresando…" : "Ingresar al sistema"
            }}<Icon name="ArrowRight" :size="18" />
          </button>
        </form>
        <div v-if="auth.estaEnModoPrueba" class="login-demo">
          <Icon name="Info" :size="19" />
          <p>
            <strong>Estás en modo demostración.</strong><br />Roles simulados y
            datos ficticios. Los cambios se guardan en este navegador; no se
            comparten entre dispositivos.
          </p>
        </div>
      </div>
    </section>
  </main>
</template>
