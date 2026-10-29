/**
 * Componente DataBadge: muestra una etiqueta de estado con color.
 * Se usa para estados de registros (activa/baja, cumplida/pendiente, etc.).
 */
export default {
  name: 'DataBadge',
  props: {
    estado: { type: String, required: true },
  },
  template: `
    <span class="badge-meta" :class="claseColor">{{ texto }}</span>
  `,
  computed: {
    texto() {
      const map = {
        activa: 'Activa',
        baja: 'Baja',
        cumplida: 'Cumplida',
        pendiente: 'Pendiente',
        ingreso: 'Ingreso',
        egreso: 'Egreso',
        dentro: 'Dentro de franja',
        fuera: 'Fuera de franja',
      }
      return map[this.estado] || this.estado
    },
    claseColor() {
      const map = {
        activa: 'badge-verde',
        baja: 'badge-rojo',
        cumplida: 'badge-verde',
        pendiente: 'badge-amarillo',
        ingreso: 'badge-verde',
        egreso: 'badge-rojo',
        dentro: 'badge-verde',
        fuera: 'badge-rojo',
      }
      return map[this.estado] || 'badge-rojo'
    },
  },
}
