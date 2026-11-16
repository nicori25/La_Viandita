<script setup>
import { ref, computed } from "vue";
import {
  exportarDatos,
  importarDatos,
  restablecerDatos,
  storageError,
} from "@/services/db";
import { useAuthStore } from "@/stores/auth";
import { puedeEditar } from "@/utils/roles";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import Icon from "@/components/Icon.vue";
const auth = useAuthStore(),
  message = ref(""),
  error = ref(""),
  pending = ref(null),
  file = ref(null),
  storageIssue = ref(storageError);
const editable = computed(() => puedeEditar(auth.role, "Datos"));
function download() {
  error.value = "";
  try {
    const body = exportarDatos();
    const url = URL.createObjectURL(
      new Blob([body], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `la-viandita-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.value = "Respaldo descargado. Guardalo en un lugar seguro.";
  } catch (e) {
    error.value = e.message;
  }
}
async function selected(event) {
  error.value = "";
  file.value = null;
  try {
    const input = event.target.files[0];
    if (!input) return;
    if (input.size > 5 * 1024 * 1024)
      throw Error("El archivo no debe superar 5 MB.");
    file.value = JSON.parse(await input.text());
    pending.value = "import";
  } catch (e) {
    error.value = "No se pudo leer el respaldo: " + e.message;
  } finally {
    event.target.value = "";
  }
}
function confirm() {
  try {
    if (pending.value === "reset") restablecerDatos();
    else importarDatos(file.value);
    storageIssue.value = "";
    message.value = "Datos locales actualizados correctamente.";
    error.value = "";
  } catch (e) {
    error.value = e.message;
  } finally {
    pending.value = null;
    file.value = null;
  }
}
</script>
<template>
  <section class="page-stack">
    <div class="page-heading">
      <div>
        <div class="eyebrow">CONSERVACIÓN DE LA INFORMACIÓN</div>
        <h1>Datos y respaldo</h1>
        <p class="muted">Cuidar los registros también es cuidar el proyecto.</p>
      </div>
      <Icon name="Database" :size="40" />
    </div>
    <p v-if="error || storageIssue" class="alert alert-error" role="alert">
      {{ error || storageIssue }}
    </p>
    <p v-if="message" class="alert alert-success" role="status">
      {{ message }}
    </p>
    <article class="card">
      <div class="section-line">
        <h2>
          {{
            auth.estaEnModoPrueba
              ? "Demostración guardada en este navegador"
              : "Base compartida en Supabase"
          }}
        </h2>
        <span class="status-pill positive">{{
          auth.estaEnModoPrueba
            ? "Almacenamiento local"
            : "Conexión configurada"
        }}</span>
      </div>
      <p class="muted mt-3">
        {{
          auth.estaEnModoPrueba
            ? "Los cambios se guardan con cada operación y se conservan al recargar. No se sincronizan entre dispositivos y pueden perderse si borrás los datos del navegador. Usá exclusivamente datos ficticios."
            : "Los registros se consultan y guardan en el proyecto configurado. Los respaldos y la recuperación de la base se administran desde Supabase."
        }}
      </p>
    </article>
    <div v-if="auth.estaEnModoPrueba" class="two-columns">
      <article class="card">
        <span class="feature-icon"><Icon name="Download" :size="24" /></span>
        <h2 class="mt-4">Guardar una copia</h2>
        <p class="muted mt-3">
          Descargá un respaldo JSON con los registros de la demostración.
          Incluye todos los módulos y sus relaciones.
        </p>
        <button class="btn-primary mt-5" @click="download">
          <Icon name="Download" :size="17" />Descargar respaldo
        </button>
      </article>
      <article class="card">
        <span class="feature-icon"><Icon name="Upload" :size="24" /></span>
        <h2 class="mt-4">Restaurar un respaldo</h2>
        <p class="muted mt-3">
          Reemplaza los datos locales por una copia anterior. Descargá primero
          el estado actual para conservarlo.
        </p>
        <label v-if="editable" class="btn-secondary mt-5 upload-label"
          ><Icon name="Upload" :size="17" />Elegir archivo JSON<input
            type="file"
            accept=".json,application/json"
            class="sr-only"
            @change="selected"
        /></label>
        <p v-else class="helper mt-4">
          Solo Administración puede restaurar una copia.
        </p>
      </article>
    </div>
    <article class="card">
      <h2>Configuración de Supabase</h2>
      <ol class="numbered-list">
        <li>
          En el proyecto configurado las tablas ya existen: ejecutar solo
          <code>sql/upgrade_gestion.sql</code> desde SQL Editor. Para una base
          nueva, ejecutar antes <code>sql/schema.sql</code>.
        </li>
        <li>
          Configurar <code>VITE_SUPABASE_URL</code> y
          <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> en el entorno de ejecución
          y reiniciar la aplicación.
        </li>
        <li>
          Crear cuentas en Auth y asignar sus perfiles desde una sesión
          administrativa de la base. No usar claves de servicio en el cliente.
        </li>
        <li>
          Probar acceso, escritura, persistencia y respaldo con cada rol antes
          de usar datos reales. Los datos locales no se migran automáticamente.
        </li>
      </ol>
      <p class="helper">
        La conexión predeterminada usa el proyecto público configurado. La
        demostración local requiere VITE_DATA_MODE=demo. La conexión remota y
        las políticas deben verificarse en tu proyecto.
      </p>
    </article>
    <article v-if="auth.estaEnModoPrueba && editable" class="card danger-card">
      <h2>Volver al ejemplo inicial</h2>
      <p class="muted mt-3">
        Reemplaza tus cambios locales por los datos ficticios originales de
        marzo de 2026. Esta acción no modifica una base de Supabase.
      </p>
      <button class="btn-secondary mt-4" @click="pending = 'reset'">
        Restablecer datos de ejemplo
      </button>
    </article>
    <ConfirmDialog
      :abierto="!!pending"
      :titulo="
        pending === 'reset'
          ? 'Restablecer la demostración'
          : 'Restaurar respaldo'
      "
      mensaje="Se reemplazarán los registros locales. Descargá un respaldo antes de continuar. ¿Confirmás el reemplazo?"
      @cancelar="pending = null"
      @confirmar="confirm"
    />
  </section>
</template>
