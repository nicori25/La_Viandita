/**
 * Componente ConfirmDialog: muestra un diálogo de confirmación antes de
 * eliminar o dar de baja un registro.
 */
export default {
  name: 'ConfirmDialog',
  props: {
    abierto: { type: Boolean, default: false },
    titulo: { type: String, default: '¿Confirmar acción?' },
    mensaje: { type: String, default: 'Esta acción no se puede deshacer.' },
    textoBoton: { type: String, default: 'Confirmar' },
  },
  emits: ['confirmar', 'cancelar'],
  template: `
    <div v-if="abierto" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black opacity-50" @click="$emit('cancelar')"></div>
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-bold mb-2">{{ titulo }}</h3>
        <p class="text-gray-700 mb-6">{{ mensaje }}</p>
        <div class="flex justify-end gap-3">
          <button @click="$emit('cancelar')" class="btn-secondary">Cancelar</button>
          <button @click="$emit('confirmar')" class="btn-danger">{{ textoBoton }}</button>
        </div>
      </div>
    </div>
  `,
}
