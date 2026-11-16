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
const recoveryDialog = ref(null),
  recoveryEmail = ref(""),
  recoveryBusy = ref(false),
  recoveryMessage = ref(""),
  recoveryError = ref("");
async function requestRecovery() {
  recoveryBusy.value = true;
  recoveryMessage.value = "";
  recoveryError.value = "";
  try {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail.value.trim()))
      throw Error("Ingresá un correo válido.");
    await auth.solicitarRecuperacion(recoveryEmail.value);
    recoveryMessage.value =
      "Si existe una cuenta con ese correo, recibirás un enlace para elegir una contraseña nueva. Revisá también Spam.";
  } catch (e) {
    recoveryError.value =
      e.code === "over_email_send_rate_limit"
        ? "Esperá un minuto antes de solicitar otro enlace."
        : e.message;
  } finally {
    recoveryBusy.value = false;
  }
}
function openRecovery() {
  recoveryEmail.value = email.value;
  recoveryMessage.value = "";
  recoveryError.value = "";
  recoveryDialog.value.showModal();
}

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
    error.value =
      e.code === "invalid_credentials"
        ? "El correo o la contraseña no son correctos. Podés recuperar el acceso con «Olvidé mi contraseña»."
        : e.message;
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
          <p
            v-if="route.query.changed"
            class="alert alert-success"
            role="status"
          >
            Contraseña actualizada. Iniciá sesión con la nueva contraseña.
          </p>
          <p v-if="route.query.recovery" class="alert alert-error" role="alert">
            El enlace no abrió una sesión válida. Solicitá uno nuevo.
          </p>
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
            <button type="button" class="text-link mt-3" @click="openRecovery">
              Olvidé mi contraseña
            </button>
            <p class="helper mt-3">
              Las cuentas nuevas ingresan como Asociado. Los permisos de gestión
              los asigna el responsable de la cooperativa.
            </p></template
          ><button class="btn-primary login-submit" :disabled="busy">
            {{ busy ? "Ingresando…" : "Ingresar al sistema"
            }}<Icon name="ArrowRight" :size="18" />
          </button>
        </form>
        <p v-if="!auth.estaEnModoPrueba" class="muted mt-5">
          ¿Todavía no tenés cuenta?
          <RouterLink to="/registro" class="text-link">Crear cuenta</RouterLink>
        </p>
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
    <dialog
      ref="recoveryDialog"
      class="dialog-card"
      aria-labelledby="recovery-title"
      @cancel.prevent="!recoveryBusy && recoveryDialog.close()"
    >
      <h2 id="recovery-title">Recuperar acceso</h2>
      <p class="muted mt-3">
        Te enviaremos un enlace para elegir una nueva contraseña.
      </p>
      <form @submit.prevent="requestRecovery">
        <label for="recovery-email" class="label mt-4"
          >Correo de tu cuenta</label
        ><input
          id="recovery-email"
          v-model="recoveryEmail"
          type="email"
          class="input"
          autocomplete="email"
          required
        />
        <p
          v-if="recoveryMessage"
          class="alert alert-success mt-4"
          role="status"
        >
          {{ recoveryMessage }}
        </p>
        <p v-if="recoveryError" class="alert alert-error mt-4" role="alert">
          {{ recoveryError }}
        </p>
        <div class="dialog-actions">
          <button
            type="button"
            class="btn-secondary"
            :disabled="recoveryBusy"
            @click="recoveryDialog.close()"
          >
            Cerrar</button
          ><button
            class="btn-primary"
            :disabled="recoveryBusy || !!recoveryMessage"
          >
            {{ recoveryBusy ? "Enviando…" : "Enviar enlace" }}
          </button>
        </div>
      </form>
    </dialog>
  </main>
</template>
