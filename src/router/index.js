import { createRouter, createWebHistory } from "vue-router";
import HomeMain from "@/pages/HomeMain.vue";
import MapMenuChoice from "@/pages/MapTestVue.vue";
import RouletteGame from "@/pages/RouletteGame.vue"; 

const routes = [
  {
    path: "/",
    name: "Home",
    component: HomeMain,
  },
  {
    path: "/MapTestVue",
    name: "MapMenuChoice",
    component: MapMenuChoice,
  },
  {
    path: "/Roulette",
    name: "Roulette",
    component: RouletteGame,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
