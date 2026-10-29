/**
 * Componente KpiCard: muestra un indicador clave con su valor, meta, estado
 * (verde/amarillo/rojo) y etiqueta escrita.
 * Usado en el tablero (Dashboard).
 */
export default {
  name: 'KpiCard',
  props: {
    titulo: { type: String, required: true },
    valor: { type: [Number, String], required: true },
    meta: { type: [Number, String], default: null },
    estado: { type: String, required: true }, // 'verde' | 'amarillo' | 'rojo'
    etiqueta: { type: String, required: true },
    subtitulo: { type: String, default: '' },
  },
  template: `
    <div class="card">
      <div class="datos-prueba" v-if="$root.modoPrueba">Datos de prueba</div>
      <h3 class="text-sm font-semibold text-gray-500 mb-1">{{ titulo }}</h3>
      <div class="flex items-baseline gap-2 mb-2">
        <span class="text-2xl font-bold text-gray-900">{{ valor }}</span>
        <span v-if="meta !== null" class="text-sm text-gray-500">Meta: {{ meta }}</span>
      </div>
      <span class="badge-meta" :class="colorEstado">{{ etiqueta }}</span>
      <p v-if="subtitulo" class="text-xs text-gray-500 mt-1">{{ subtitulo }}</p>
    </div>
  `,
  computed: {
    colorEstado() {
      return {
        verde: 'badge-verde',
        amarillo: 'badge-amarillo',
        rojo: 'badge-rojo',
      }[this.estado] || 'badge-rojo'
    },
  },
}
