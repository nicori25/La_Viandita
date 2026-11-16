import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "@/stores/auth";
import "./assets/css/main.css";
const app = createApp(App);
app.use(createPinia());
async function start() {
  try {
    await useAuthStore().inicializar();
  } catch (error) {
    console.error("No se pudo restaurar la sesión:", error.message);
  }
  app.use(router);
  await router.isReady();
  app.mount("#app");
}
start();
