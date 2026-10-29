/**
 * Componente Alert: muestra mensajes de carga, confirmación y error.
 * Requisito del paso 16.
 */
export default {
  name: 'Alert',
  props: {
    tipo: { type: String, default: 'info' }, // 'success' | 'error' | 'info' | 'warning'
    mensaje: { type: String, required: true },
    visible: { type: Boolean, default: true },
  },
  template: `
    <div v-if="visible" :class="['alert', `alert-${tipo}`]" role="alert">
      {{ mensaje }}
    </div>
  `,
}
