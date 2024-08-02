import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import vuetify from "./plugins/vuetify";
import { useKakao } from "vue3-kakao-maps";

useKakao("0b6aba300cc5a5bcc48d1265f8f3371e", [
  "clusterer",
  "services",
  "drawing",
]); // Kakao Maps API Key와 필요한 라이브러리들을 추가

createApp(App).use(router).use(vuetify).mount("#app");
