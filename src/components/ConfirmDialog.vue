<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from "vue";
const props = defineProps({
  abierto: Boolean,
  titulo: { type: String, default: "Confirmar acción" },
  mensaje: String,
  textoBoton: { type: String, default: "Confirmar" },
  ocupado: Boolean,
});
const emit = defineEmits(["confirmar", "cancelar"]);
const dialog = ref(null);
watch(
  () => props.abierto,
  async (value) => {
    await nextTick();
    if (value) dialog.value?.showModal();
    else dialog.value?.close();
  },
);
onBeforeUnmount(() => dialog.value?.close());
</script>
<template>
  <dialog
    ref="dialog"
    class="dialog-card"
    aria-labelledby="confirm-title"
    @cancel.prevent="!ocupado && emit('cancelar')"
  >
    <h2 id="confirm-title">{{ titulo }}</h2>
    <p class="muted mt-3">{{ mensaje }}</p>
    <div class="dialog-actions">
      <button
        class="btn-secondary"
        :disabled="ocupado"
        @click="emit('cancelar')"
      >
        Cancelar</button
      ><button
        class="btn-primary"
        :disabled="ocupado"
        @click="emit('confirmar')"
      >
        {{ ocupado ? "Guardando…" : textoBoton }}
      </button>
    </div>
  </dialog>
</template>
