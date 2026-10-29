/**
 * Componente LoadingSpinner: indica que una operación está en curso.
 * Requisito del paso 16 (mensajes de carga).
 */
export default {
  name: 'LoadingSpinner',
  props: {
    mensaje: { type: String, default: 'Cargando...' },
  },
  template: `
    <div class="flex flex-col items-center justify-center py-8">
      <div class="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-2"></div>
      <p class="text-sm text-gray-600">{{ mensaje }}</p>
    </div>
  `,
}
