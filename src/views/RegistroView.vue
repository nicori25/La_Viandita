<script setup>
import BrandLogo from "@/components/BrandLogo.vue";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import Icon from "@/components/Icon.vue";
const auth = useAuthStore(),
  router = useRouter();
const nombre = ref(""),
  email = ref(""),
  password = ref(""),
  repeat = ref(""),
  visible = ref(false),
  busy = ref(false),
  error = ref(""),
  created = ref(false),
  profileError = ref("");
async function register() {
  if (busy.value || created.value) return;
  error.value = "";
  if (nombre.value.trim().length < 2) {
    error.value = "Ingresá tu nombre completo.";
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    error.value = "Ingresá un correo válido.";
    return;
  }
  if (password.value.length < 12) {
    error.value = "Usá una contraseña de al menos 12 caracteres.";
    return;
  }
  if (password.value !== repeat.value) {
    error.value = "Las contraseñas no coinciden.";
    return;
  }
  busy.value = true;
  try {
    const result = await auth.registrar(
      nombre.value,
      email.value,
      password.value,
    );
    password.value = "";
    repeat.value = "";
    if (!result.confirmationRequired && !result.profileError) {
      await router.replace("/");
      return;
    }
    created.value = true;
    profileError.value = result.profileError || "";
  } catch (e) {
    error.value =
      {
        user_already_exists:
          "No se pudo registrar ese correo. Si ya tenés cuenta, iniciá sesión o recuperá la contraseña.",
        over_email_send_rate_limit:
          "Esperá un minuto antes de intentar otra vez.",
        email_address_invalid:
          "Revisá que el correo esté escrito correctamente.",
        signup_disabled:
          "El registro está deshabilitado en Supabase. Consultá al responsable.",
      }[e.code] || e.message;
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <main class="login-panel" style="min-height: 100vh">
    <section class="login-card">
      <RouterLink
        to="/login"
        class="form-brand"
        aria-label="La Viandita: volver al ingreso"
        ><BrandLogo variant="form" /></RouterLink
      ><span class="eyebrow">SUMATE A NUESTRO ESPACIO</span>
      <h1>Creá tu cuenta</h1>
      <template v-if="created"
        ><div role="status" class="alert alert-success mt-5">
          {{
            profileError
              ? "Tu cuenta se creó. Falta habilitar su perfil para ingresar."
              : "Revisá tu correo y confirmá tu cuenta desde el enlace que envía Supabase. Mirá también en Spam. Si ya tenías cuenta, podés iniciar sesión o recuperar la contraseña."
          }}
        </div>
        <p v-if="profileError" role="alert" class="alert alert-warning mt-4">
          {{ profileError }}
        </p>
        <RouterLink to="/login" class="btn-primary mt-5"
          >Volver al ingreso</RouterLink
        ></template
      ><template v-else-if="!auth.estaEnModoPrueba"
        ><p class="muted mt-3">
          Registrate para consultar el menú y los indicadores generales como
          Asociado. Los permisos de gestión los asigna el responsable.
        </p>
        <form class="login-form" @submit.prevent="register" novalidate>
          <p v-if="error" class="alert alert-error mb-4" role="alert">
            {{ error }}
          </p>
          <label for="register-name" class="label">Nombre completo</label
          ><input
            id="register-name"
            v-model="nombre"
            type="text"
            class="input"
            autocomplete="name"
            maxlength="100"
            required
          /><label for="register-email" class="label mt-4"
            >Correo electrónico</label
          ><input
            id="register-email"
            v-model="email"
            type="email"
            class="input"
            autocomplete="email"
            maxlength="254"
            required
          /><label for="register-password" class="label mt-4">Contraseña</label
          ><input
            id="register-password"
            v-model="password"
            :type="visible ? 'text' : 'password'"
            class="input"
            autocomplete="new-password"
            minlength="12"
            required
          />
          <p class="helper mt-2">
            Al menos 12 caracteres. Elegí una que no uses en otros sitios.
          </p>
          <label for="register-repeat" class="label mt-4"
            >Repetir contraseña</label
          ><input
            id="register-repeat"
            v-model="repeat"
            :type="visible ? 'text' : 'password'"
            class="input"
            autocomplete="new-password"
            required
          /><label class="helper mt-3"
            ><input v-model="visible" type="checkbox" />Mostrar
            contraseñas</label
          ><button class="btn-primary login-submit" :disabled="busy">
            {{ busy ? "Creando cuenta…" : "Crear cuenta"
            }}<Icon name="ArrowRight" :size="18" />
          </button>
        </form>
        <p class="muted mt-5">
          ¿Ya tenés cuenta?
          <RouterLink to="/login" class="text-link">Iniciar sesión</RouterLink>
        </p></template
      ><template v-else
        ><p class="muted mt-4">
          El registro de cuentas está disponible en la versión conectada a
          Supabase. En la demostración podés elegir un rol de prueba.
        </p>
        <RouterLink to="/login" class="btn-primary mt-5"
          >Volver al ingreso</RouterLink
        ></template
      >
    </section>
  </main>
</template>
