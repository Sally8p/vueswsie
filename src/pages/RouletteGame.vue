<template>
  <div class="container">
    <div class="roulette-container">
      <img id="marker" src="@/assets/pointer.png" alt="마커">
      <canvas ref="canvas" width="700" height="700"></canvas>
      <div class="controls">
        <input type="text" v-model="menuInput" placeholder="이곳에 메뉴 추가! 🙌🏻" @keypress.enter="addMenu">
        <button @click="addMenu">메뉴 추가</button>
        <button @click="rotate">{{ rotateButtonText }}</button>
      </div>
      <div id="menuList">
        <div v-for="(menu, index) in product" :key="index" class="menu-item">
          <span>{{ menu }}</span>
          <button @click="removeMenu(index)">삭제</button>
        </div>
      </div>
    </div>
    <div id="result-container">
      <button @click="viewOnMap" class="animate__animated animate__pulse animate__infinite" v-if="showViewOnMap">결과를 지도로 다시 보기</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 캔버스 및 컨텍스트 참조 설정
const canvas = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);

// 입력된 메뉴와 룰렛에 표시될 메뉴 리스트
const menuInput = ref('');
const product = ref<string[]>([]);
const colors = ref<string[]>([]);
const proportions = ref<number[]>([]);
const showViewOnMap = ref(false);  // 지도로 보기 버튼 표시 여부
const rotateButtonText = ref('룰렛 돌리기');  // 룰렛 돌리기 버튼 텍스트
let selectedFood = '';  // 선택된 음식 저장

// 미리 정의된 메뉴 리스트
const predefinedMenus = [
  '파스타', '피자', '햄버거', '초밥', '치킨', '떡볶이', '샌드위치', '국밥' ,'족발' ,'마라탕','샌드위치','닭발','곱창','전골','찜닭'
];

// 랜덤 색상 생성 함수
const getRandomColor = () => {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgb(${r},${g},${b})`;
};

// 랜덤 비율 생성 함수
const getRandomProportion = () => {
  return Math.random() + 0.1;
};

// 초기 메뉴 설정 함수
const initializeMenus = () => {
  // 메뉴 리스트를 셔플하고 4개를 선택
  const shuffledMenus = predefinedMenus.sort(() => Math.random() - 0.5);
  const selectedMenus = shuffledMenus.slice(0, 4);

  // 선택된 메뉴를 룰렛에 추가
  selectedMenus.forEach(menu => {
    product.value.push(menu);
    colors.value.push(getRandomColor());
    proportions.value.push(getRandomProportion());
  });

  // 룰렛 다시 그리기
  newMake();
};

// 룰렛 그리기 함수
const newMake = () => {
  if (!ctx.value || !canvas.value) return;

  // 캔버스 초기화
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
  const [cw, ch] = [canvas.value.width / 2, canvas.value.height / 2];
  const totalProportions = proportions.value.reduce((acc, curr) => acc + curr, 0);

  let startAngle = 0;

  // 각 메뉴의 섹션을 그리기
  for (let i = 0; i < product.value.length; i++) {
    const arc = (Math.PI * 2 * proportions.value[i]) / totalProportions;
    ctx.value.beginPath();
    ctx.value.fillStyle = colors.value[i];
    ctx.value.moveTo(cw, ch);
    ctx.value.arc(cw, ch, cw, startAngle, startAngle + arc);
    ctx.value.fill();
    ctx.value.closePath();
    startAngle += arc;
  }

  // 메뉴 텍스트 그리기
  ctx.value.fillStyle = "#fff";
  ctx.value.font = "20px BMJua";
  ctx.value.textAlign = "center";

  startAngle = 0;

  // 각 메뉴의 텍스트 위치 설정 및 그리기
  for (let i = 0; i < product.value.length; i++) {
    const arc = (Math.PI * 2 * proportions.value[i]) / totalProportions;
    const angle = startAngle + arc / 2;

    ctx.value.save();

    ctx.value.translate(
      cw + Math.cos(angle) * (cw - 50),
      ch + Math.sin(angle) * (ch - 50)
    );

    ctx.value.rotate(angle + Math.PI / 2);

    product.value[i].split(" ").forEach((text, j) => {
      ctx.value?.fillText(text, 0, 30 * j);
    });

    ctx.value.restore();
    startAngle += arc;
  }
};

// 룰렛 돌리기 함수
const rotate = () => {
  if (rotateButtonText.value === "다시 돌리기") {
    resetRoulette();
    return;
  }

  if (product.value.length === 0) {
    alert("메뉴를 추가해주세요!");
    return;
  }

  if (!canvas.value) return;

  canvas.value.style.transform = "initial";
  canvas.value.style.transition = "initial";

  setTimeout(() => {
    const ran = Math.floor(Math.random() * product.value.length);
    const totalProportions = proportions.value.reduce((acc, curr) => acc + curr, 0);
    const arc = 360 / totalProportions;
    const rotate =
      360 * 3 -
      (arc * proportions.value.slice(0, ran).reduce((acc, curr) => acc + curr, 0) +
        (arc * proportions.value[ran]) / 2);

    canvas.value.style.transform = `rotate(${rotate}deg)`;
    canvas.value.style.transition = "2s";

    setTimeout(() => {
      selectedFood = product.value[ran];
      alert(`오늘의 선택은?! ${product.value[ran]} 어떠신가요?? 😎`);
      rotateButtonText.value = "다시 돌리기"; // 버튼 텍스트 변경
      showViewOnMap.value = true; // 지도로 보기 버튼 표시
    }, 2000);
  }, 1);
};

// 메뉴 추가 함수
const addMenu = () => {
  const menu = menuInput.value.trim();

  if (menu && product.value.length < 10) {
    product.value.push(menu);
    colors.value.push(getRandomColor());
    proportions.value.push(getRandomProportion());
    newMake();
    menuInput.value = "";
  } else if (product.value.length >= 10) {
    alert("메뉴는 최대 10개까지 추가할 수 있습니다.");
  } else {
    alert("메뉴를 입력해주세요.");
  }
};

// 메뉴 삭제 함수
const removeMenu = (index: number) => {
  product.value.splice(index, 1);
  colors.value.splice(index, 1);
  proportions.value.splice(index, 1);
  newMake();
};

// 룰렛 초기화 함수
const resetRoulette = () => {
  product.value = [];
  colors.value = [];
  proportions.value = [];
  newMake();
  rotateButtonText.value = "룰렛 돌리기";
  showViewOnMap.value = false;
};

// 지도로 보기 함수
const viewOnMap = () => {
  const userCity = localStorage.getItem('userCity') || '';
  router.push({ name: 'MapMenuChoice', query: { city: userCity, food: selectedFood } });
};

// 컴포넌트가 마운트될 때 초기 설정
onMounted(() => {
  if (canvas.value) {
    ctx.value = canvas.value.getContext("2d");
  }
  initializeMenus();
});
</script>

<style scoped>
@import url('https://webfontworld.github.io/woowahan/BMJua.css');

* {
  font-family: 'BMJua';
}

body {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
  background: #ff9100;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.roulette-container {
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 750px;
}

canvas {
  transition: transform 2s cubic-bezier(0.42, 0, 0.58, 1);
  pointer-events: none;
  margin: 0 auto;
  transform-origin: center center;
}

#marker {
  width: 70px;
  height: 60px;
  position: absolute;
  top: 43.5%;
  right: -4px;
  transform: translateY(-50%) scaleX(-1);
  z-index: 1;
}

.controls {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 20px;
}

input {
  padding: 0.5rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  width: 150px;
  margin-right: 10px;
  color: #000;
}

button {
  background: #f2522e;
  color: #fff;
  padding: 0.5rem 1rem;
  border: none;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 5px;
  transition: 0.2s;
  cursor: pointer;
  margin-right: 10px;
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
}

button:active {
  background: #444;
  color: #f9f9f9;
}

#menuList {
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.menu-item {
  display: flex;
  align-items: center;
  margin: 5px;
  font-size: 0.8rem;
}

.menu-item span {
  margin-right: 5px;
  color: #000;
}

.menu-item button {
  background: #ff4d4d;
  color: white;
  border: none;
  padding: 5px;
  font-size: 0.8rem;
  border-radius: 5px;
  cursor: pointer;
}

.menu-item button:hover {
  background: #ff1a1a;
}

#home-button {
  margin: 10px;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 16px;
  cursor: pointer;
  background-color: #febf00;
  font-family: ‘ONE-Mobile-POP’;
  position: absolute;
  top: 10px;
  right: 10px;
}

#result-container button {
  font-size: 25px;
}
</style>
