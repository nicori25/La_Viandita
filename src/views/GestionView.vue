<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { modules, etiquetaRegistro } from "@/data/modules";
import { obtenerTodos, insertar, actualizar } from "@/services/db";
import { useAuthStore } from "@/stores/auth";
import { puedeEditar } from "@/utils/roles";
import { moneda, fecha, texto, hoy } from "@/utils/format";
import Icon from "@/components/Icon.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
const props = defineProps({ moduleName: String });
const config = computed(() => modules[props.moduleName]);
const auth = useAuthStore();
const nuevoLabel = computed(() =>
  ["Suscripciones", "Entregas", "Tareas", "Actas"].includes(props.moduleName)
    ? "Nueva"
    : "Nuevo",
);
const editable = computed(() => puedeEditar(auth.role, props.moduleName));
const data = ref({}),
  rows = ref([]),
  loading = ref(true),
  error = ref(""),
  notice = ref(""),
  query = ref(""),
  status = ref("todos"),
  page = ref(1),
  from = ref(""),
  to = ref("");
const dialog = ref(null),
  form = ref({}),
  editing = ref(null),
  saving = ref(false),
  formError = ref(""),
  pending = ref(null);
const dateKey = computed(
  () => config.value.fields.find((f) => f.type === "date")?.key,
);
const columns = computed(() =>
  config.value.columns.map((k) => config.value.fields.find((f) => f.key === k)),
);
function options(field) {
  if (field.options) return field.options;
  const all = data.value[field.table] || [];
  return all
    .filter(
      (r) =>
        r.id === form.value[field.key] ||
        (r.activo !== false &&
          r.estado !== "baja" &&
          (field.table !== "usuarios" || r.activo)),
    )
    .map((r) => ({
      value: r.id,
      label: etiquetaRegistro(field.table, r, data.value),
    }));
}
function entregado(row) {
  return (
    props.moduleName === "Pedidos" &&
    data.value.entregas?.some((e) => e.pedido_id === row.id)
  );
}
function display(row, field) {
  if (props.moduleName === "Pedidos" && field.key === "estado")
    return entregado(row) ? "entregado" : row.estado || "pendiente";
  const v = row[field.key];
  if (field.table)
    return etiquetaRegistro(
      field.table,
      data.value[field.table]?.find((r) => r.id === v),
      data.value,
    );
  if (field.money) return moneda(v);
  if (field.type === "date") return fecha(v);
  if (field.type === "boolean")
    return field.key === "activo"
      ? v
        ? "Activo"
        : "De baja"
      : field.key === "cumplida"
        ? v
          ? "Cumplida"
          : "Pendiente"
        : field.key === "aprobada"
          ? v
            ? "Aprobada"
            : "Borrador"
          : v
            ? "Sí"
            : "No";
  return v || "—";
}
const filtered = computed(() =>
  rows.value.filter((r) => {
    const matches =
      !query.value ||
      columns.value.some((f) =>
        texto(display(r, f)).includes(texto(query.value)),
      );
    const key = config.value.status,
      sv =
        props.moduleName === "Pedidos" && entregado(r) ? "entregado" : r[key];
    const matchesStatus =
      status.value === "todos" || String(sv) === status.value;
    const d = r[dateKey.value];
    return (
      matches &&
      matchesStatus &&
      (!from.value || d >= from.value) &&
      (!to.value || d <= to.value)
    );
  }),
);
const paged = computed(() =>
  filtered.value.slice((page.value - 1) * 10, page.value * 10),
);
const pages = computed(() =>
  Math.max(1, Math.ceil(filtered.value.length / 10)),
);
const sum = computed(() =>
  filtered.value.reduce((s, r) => s + Number(r.monto || r.precio || 0), 0),
);
watch([query, status, from, to], () => (page.value = 1));
async function load() {
  loading.value = true;
  error.value = "";
  try {
    const tables = new Set([
      config.value.table,
      ...config.value.fields.filter((f) => f.table).map((f) => f.table),
    ]);
    // Resolver nombres de los vínculos sin mostrar identificadores técnicos.
    if (["Pedidos", "Entregas", "Suscripciones"].includes(props.moduleName))
      [
        "asociados",
        "suscripciones",
        "menu_semanal",
        "tipos_vianda",
        "pedidos",
      ].forEach((t) => tables.add(t));
    if (props.moduleName === "Pedidos") tables.add("entregas");
    const entries = await Promise.all(
      [...tables].map(async (t) => {
        const res = await obtenerTodos(t);
        if (res.error) throw res.error;
        return [t, res.data || []];
      }),
    );
    data.value = Object.fromEntries(entries);
    rows.value = data.value[config.value.table];
    page.value = Math.min(page.value, pages.value);
  } catch (e) {
    error.value = e.message;
    rows.value = [];
  } finally {
    loading.value = false;
  }
}
async function open(row = null) {
  if (!editable.value) return;
  editing.value = row?.id || null;
  formError.value = "";
  form.value = Object.fromEntries(
    config.value.fields.map((f) => [
      f.key,
      row?.[f.key] ??
        (typeof f.default === "function"
          ? f.default()
          : (f.default ?? (f.type === "boolean" ? false : ""))),
    ]),
  );
  if (!row && config.value.fields.some((f) => f.key === "usuario_id"))
    form.value.usuario_id =
      data.value.usuarios?.find((u) => u.auth_user_id === auth.user?.id)?.id ||
      data.value.usuarios?.find((u) => u.rol === auth.role)?.id ||
      "";
  await nextTick();
  dialog.value.showModal();
}
function validate(payload, exclude = editing.value) {
  for (const f of config.value.fields) {
    const v = payload[f.key];
    if (
      f.required &&
      (v === null || v === undefined || String(v).trim() === "")
    )
      throw Error(`Completá ${f.label.toLowerCase()}.`);
    if (
      f.type === "number" &&
      (!Number.isFinite(Number(v)) ||
        Number(v) < (f.min ?? 0) ||
        (f.max && Number(v) > f.max) ||
        (f.step === 1 && !Number.isInteger(Number(v))))
    )
      throw Error(`Revisá ${f.label.toLowerCase()}.`);
    if (f.table && v && !data.value[f.table]?.some((r) => r.id === v))
      throw Error(`Seleccioná ${f.label.toLowerCase()} de la lista.`);
    if (f.type === "date" && v && !/^\d{4}-\d{2}-\d{2}$/.test(v))
      throw Error("Ingresá una fecha válida.");
  }
  if (payload.telefono && !/^[\d\s+\-()]{7,20}$/.test(payload.telefono))
    throw Error("Revisá el teléfono: entre 7 y 20 caracteres.");
  if (payload.fecha_fin && payload.fecha_fin < payload.fecha_inicio)
    throw Error("El fin de vigencia no puede ser anterior al inicio.");
  if (payload.fecha_limite && payload.fecha_limite < payload.fecha_asignada)
    throw Error("El plazo no puede ser anterior a la asignación.");
  if (
    payload.cumplida &&
    (!payload.fecha_cumplimiento ||
      payload.fecha_cumplimiento < payload.fecha_asignada ||
      payload.fecha_cumplimiento > hoy())
  )
    throw Error(
      "Indicá una fecha de cumplimiento válida, posterior a la asignación y no futura.",
    );
  if (payload.fecha_alta > hoy())
    throw Error("La fecha de alta no puede ser futura.");
  if (props.moduleName === "Suscripciones" && payload.estado === "activa") {
    if (
      data.value.asociados.find((r) => r.id === payload.asociado_id)?.activo ===
      false
    )
      throw Error("El asociado está dado de baja.");
    if (
      rows.value.some(
        (r) =>
          r.id !== exclude &&
          r.asociado_id === payload.asociado_id &&
          r.estado === "activa" &&
          r.fecha_inicio <= payload.fecha_fin &&
          (!r.fecha_fin || r.fecha_fin >= payload.fecha_inicio),
      )
    )
      throw Error(
        "Ya existe una suscripción activa que se superpone con estas fechas.",
      );
  }
  if (props.moduleName === "Pedidos") {
    if (data.value.entregas?.some((e) => e.pedido_id === exclude))
      throw Error("Un pedido entregado no puede modificarse ni cancelarse.");
    if (payload.estado === "cancelado") return;
    const s = data.value.suscripciones.find(
      (r) => r.id === payload.suscripcion_id,
    );
    if (
      s?.estado !== "activa" ||
      payload.fecha < s.fecha_inicio ||
      (s.fecha_fin && payload.fecha > s.fecha_fin)
    )
      throw Error(
        "La suscripción debe estar activa y vigente en la fecha del pedido.",
      );
    if (
      data.value.menu_semanal.find((r) => r.id === payload.menu_id)?.activo ===
      false
    )
      throw Error("El menú seleccionado está dado de baja.");
    payload.curso = Number(
      data.value.asociados.find((r) => r.id === s.asociado_id)?.curso ||
        payload.curso,
    );
  }
  if (props.moduleName === "Entregas") {
    const pedido = data.value.pedidos.find((r) => r.id === payload.pedido_id);
    if (pedido.estado === "cancelado")
      throw Error("No se puede entregar un pedido cancelado.");
    if (
      rows.value.some(
        (r) => r.id !== exclude && r.pedido_id === payload.pedido_id,
      )
    )
      throw Error("Este pedido ya tiene una entrega registrada.");
    if (payload.fecha < pedido.fecha || payload.fecha > hoy())
      throw Error("La entrega no puede ser anterior al pedido ni futura.");
    payload.curso = Number(pedido.curso);
  }
  if (props.moduleName === "LibroCaja" && payload.monto <= 0)
    throw Error("El importe del movimiento debe ser mayor que cero.");
}
async function save() {
  if (saving.value) return;
  saving.value = true;
  formError.value = "";
  try {
    const payload = Object.fromEntries(
      config.value.fields.map((f) => [
        f.key,
        f.type === "number"
          ? Number(form.value[f.key])
          : f.type === "boolean"
            ? !!form.value[f.key]
            : String(form.value[f.key] ?? "").trim() || null,
      ]),
    );
    if (props.moduleName === "Tareas" && !payload.cumplida)
      payload.fecha_cumplimiento = null;
    validate(payload);
    const res = editing.value
      ? await actualizar(config.value.table, editing.value, payload)
      : await insertar(config.value.table, payload);
    if (res.error) throw res.error;
    dialog.value.close();
    notice.value = editing.value
      ? "Cambios guardados correctamente."
      : "Registro creado correctamente.";
    await load();
  } catch (e) {
    formError.value = e.message;
  } finally {
    saving.value = false;
  }
}
async function changeStatus() {
  saving.value = true;
  try {
    const row = pending.value;
    const key = config.value.status;
    const changes = {
      [key]:
        key === "estado" && props.moduleName === "Pedidos"
          ? row.estado === "cancelado"
            ? "pendiente"
            : "cancelado"
          : key === "estado"
            ? row.estado === "activa"
              ? "baja"
              : "activa"
            : !row[key],
    };
    validate({ ...row, ...changes }, row.id);
    const res = await actualizar(config.value.table, row.id, changes);
    if (res.error) throw res.error;
    pending.value = null;
    notice.value = "Estado actualizado. El historial se conserva.";
    await load();
  } catch (e) {
    error.value = e.message;
    pending.value = null;
  } finally {
    saving.value = false;
  }
}
function exportCSV() {
  const values = [
    columns.value.map((f) => f.label),
    ...filtered.value.map((r) => columns.value.map((f) => display(r, f))),
  ];
  const csv =
    "\uFEFF" +
    values
      .map((row) =>
        row
          .map(
            (v) =>
              '"' +
              String(v)
                .replace(/^[=+@-]/, "'$&")
                .replaceAll('"', '""') +
              '"',
          )
          .join(";"),
      )
      .join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = config.value.table + ".csv";
  a.click();
  URL.revokeObjectURL(url);
}
watch(
  () => props.moduleName,
  () => {
    query.value = "";
    status.value = "todos";
    from.value = "";
    to.value = "";
    notice.value = "";
    page.value = 1;
    load();
  },
);
onMounted(load);
</script>
<template>
  <section class="page-stack">
    <div class="page-heading">
      <div>
        <div class="eyebrow">GESTIÓN DEL SERVICIO</div>
        <h1>{{ config.title }}</h1>
        <p class="muted">{{ config.description }}</p>
      </div>
      <div class="button-row">
        <button
          class="btn-secondary"
          :disabled="loading || !!error"
          @click="exportCSV"
        >
          <Icon name="Download" :size="16" />Exportar CSV</button
        ><button
          v-if="editable"
          class="btn-primary"
          :disabled="loading || !!error"
          @click="open()"
        >
          <Icon name="Plus" :size="18" />{{ nuevoLabel }} {{ config.singular }}
        </button>
      </div>
    </div>
    <p v-if="notice" role="status" class="alert alert-success">{{ notice }}</p>
    <div class="context-note">
      <Icon :name="config.icon" />
      <p>{{ config.hint }}</p>
      <RouterLink v-if="config.next" :to="config.next" class="text-link"
        >{{ config.nextLabel }} →</RouterLink
      >
    </div>
    <div class="card registry">
      <div class="registry-toolbar">
        <label class="search-field"
          ><Icon name="Search" :size="18" /><input
            v-model="query"
            type="search"
            :aria-label="`Buscar ${config.title.toLowerCase()}`"
            placeholder="Buscar en los registros…" /></label
        ><label v-if="config.status" class="filter-label"
          >Estado<select v-model="status" class="input">
            <option value="todos">Todos</option>
            <template v-if="moduleName === 'Pedidos'"
              ><option value="pendiente">Pendientes</option>
              <option value="entregado">Entregados</option>
              <option value="cancelado">Cancelados</option></template
            ><template v-else-if="config.status === 'estado'"
              ><option value="activa">Activa</option>
              <option value="baja">De baja</option></template
            ><template v-else
              ><option value="true">
                {{
                  config.status === "cumplida"
                    ? "Cumplidas"
                    : config.status === "aprobada"
                      ? "Aprobadas"
                      : "Activos"
                }}
              </option>
              <option value="false">
                {{
                  config.status === "cumplida"
                    ? "Pendientes"
                    : config.status === "aprobada"
                      ? "Borradores"
                      : "De baja"
                }}
              </option></template
            >
          </select></label
        ><template v-if="dateKey"
          ><label class="filter-label"
            >Desde<input v-model="from" type="date" class="input" /></label
          ><label class="filter-label"
            >Hasta<input
              v-model="to"
              type="date"
              class="input"
              :min="from" /></label
        ></template>
      </div>
      <div v-if="loading" class="empty-state" role="status">
        <span class="spinner" />Cargando registros…
      </div>
      <div v-else-if="error" class="empty-state">
        <Icon name="CircleAlert" :size="30" />
        <h2>No se pudieron cargar los registros</h2>
        <p>{{ error }}</p>
        <button class="btn-secondary" @click="load">Reintentar</button>
      </div>
      <template v-else
        ><div v-if="!filtered.length" class="empty-state">
          <Icon :name="config.icon" :size="34" />
          <h2>
            {{
              query || from || to || status !== "todos"
                ? "No hay coincidencias"
                : "Todavía no hay registros"
            }}
          </h2>
          <p>
            {{
              query || from || to || status !== "todos"
                ? "Probá con otra búsqueda o cambiá los filtros."
                : "Agregá el primer registro para comenzar."
            }}
          </p>
          <button v-if="editable && !query" class="btn-primary" @click="open()">
            {{ nuevoLabel }} {{ config.singular }}
          </button>
        </div>
        <div v-else class="table-scroll">
          <table class="table">
            <caption class="sr-only">
              {{
                config.title
              }}:
              {{
                filtered.length
              }}
              registros
            </caption>
            <thead>
              <tr>
                <th v-for="field in columns" :key="field.key" scope="col">
                  {{ field.label }}
                </th>
                <th v-if="editable" scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in paged" :key="row.id">
                <td
                  v-for="field in columns"
                  :key="field.key"
                  :class="{
                    'money-cell': field.money,
                    'long-cell': field.type === 'textarea' || field.table,
                  }"
                >
                  <span
                    v-if="field.type === 'boolean' || field.key === 'estado'"
                    class="status-pill"
                    :class="
                      row[field.key] === true || row[field.key] === 'activa'
                        ? 'positive'
                        : 'quiet'
                    "
                    >{{ display(row, field) }}</span
                  ><span v-else>{{ display(row, field) }}</span>
                </td>
                <td v-if="editable">
                  <div class="row-actions">
                    <button
                      class="text-link"
                      :disabled="entregado(row)"
                      @click="open(row)"
                    >
                      Editar</button
                    ><button
                      v-if="['activo', 'estado'].includes(config.status)"
                      class="text-link"
                      :disabled="entregado(row)"
                      @click="pending = row"
                    >
                      {{
                        moduleName === "Pedidos"
                          ? row.estado === "cancelado"
                            ? "Reactivar"
                            : "Cancelar pedido"
                          : row[config.status] === false ||
                              row[config.status] === "baja"
                            ? "Reactivar"
                            : "Dar de baja"
                      }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="table-footer">
          <span
            >{{ filtered.length }}
            {{ filtered.length === 1 ? "registro" : "registros"
            }}<template
              v-if="['LibroCaja', 'Suscripciones'].includes(moduleName)"
            >
              · Importe: {{ moneda(sum) }}</template
            ></span
          >
          <div class="button-row">
            <button
              class="pagination-btn"
              aria-label="Página anterior"
              :disabled="page === 1"
              @click="page--"
            >
              ←</button
            ><span>{{ page }} / {{ pages }}</span
            ><button
              class="pagination-btn"
              aria-label="Página siguiente"
              :disabled="page >= pages"
              @click="page++"
            >
              →
            </button>
          </div>
        </div></template
      >
    </div>
    <p v-if="!editable" class="helper">
      <Icon name="Eye" :size="15" />Tu rol tiene acceso de consulta a este
      apartado.
    </p>
    <dialog
      ref="dialog"
      class="dialog-card form-dialog"
      aria-labelledby="form-title"
      @cancel.prevent="!saving && dialog.close()"
    >
      <div class="dialog-title">
        <div>
          <div class="eyebrow">
            {{ editing ? "ACTUALIZAR REGISTRO" : "NUEVO REGISTRO" }}
          </div>
          <h2 id="form-title">
            {{ editing ? "Editar" : nuevoLabel }} {{ config.singular }}
          </h2>
        </div>
        <button
          type="button"
          class="icon-button"
          aria-label="Cerrar formulario"
          :disabled="saving"
          @click="dialog.close()"
        >
          <Icon name="X" />
        </button>
      </div>
      <form @submit.prevent="save" novalidate>
        <p v-if="formError" role="alert" class="alert alert-error">
          {{ formError }}
        </p>
        <div class="form-grid">
          <div
            v-for="field in config.fields"
            :key="field.key"
            :class="{ 'full-field': field.type === 'textarea' }"
          >
            <label :for="'field-' + field.key" class="label"
              >{{ field.label }}
              <span
                v-if="field.required && field.type !== 'boolean'"
                aria-label="obligatorio"
                >*</span
              ></label
            ><select
              v-if="field.type === 'select'"
              :id="'field-' + field.key"
              v-model="form[field.key]"
              class="input"
              :required="field.required"
            >
              <option value="">Seleccionar…</option>
              <option
                v-for="option in options(field)"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option></select
            ><select
              v-else-if="field.type === 'boolean'"
              :id="'field-' + field.key"
              v-model="form[field.key]"
              class="input"
            >
              <option :value="true">Sí</option>
              <option :value="false">No</option></select
            ><textarea
              v-else-if="field.type === 'textarea'"
              :id="'field-' + field.key"
              v-model="form[field.key]"
              class="input"
              rows="5"
              :placeholder="field.placeholder"
            /><input
              v-else
              :id="'field-' + field.key"
              v-model="form[field.key]"
              class="input"
              :type="field.type"
              :min="field.min"
              :max="field.max"
              :step="field.step"
              :required="field.required"
              maxlength="500"
            />
          </div>
        </div>
        <div class="dialog-actions">
          <button
            type="button"
            class="btn-secondary"
            :disabled="saving"
            @click="dialog.close()"
          >
            Cancelar</button
          ><button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? "Guardando…" : "Guardar registro" }}
          </button>
        </div>
      </form>
    </dialog>
    <ConfirmDialog
      :abierto="!!pending"
      :ocupado="saving"
      titulo="Cambiar estado"
      mensaje="El registro y sus vínculos se conservarán en el historial. ¿Querés continuar?"
      @cancelar="pending = null"
      @confirmar="changeStatus"
    />
  </section>
</template>
