/**
 * Componente EmptyState: se muestra cuando no hay datos en un listado.
 */
export default {
  name: 'EmptyState',
  props: {
    mensaje: { type: String, default: 'No hay datos disponibles.' },
  },
  template: `
    <div class="text-center py-12">
      <p class="text-gray-500">{{ mensaje }}</p>
    </div>
  `,
}
