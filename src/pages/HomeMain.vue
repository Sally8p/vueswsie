<template>
  <v-container>
    <v-row>
      <v-col class="title">
        <v-slide-y-transition>
          <h2
            ref="introTitle"
            class="title_intro animate__animated animate__bounce animate__delay-3s"
          ></h2>
        </v-slide-y-transition>
        <p>지금 날씨에 딱 맞는 메뉴를 추천할게요</p>
      </v-col>
    </v-row>

    <div class="test">
      <v-row>
        <v-col class="search-container">
          <v-text-field
            prepend-inner-icon="mdi-map-marker"
            label="지역을 입력해주세요. (예 : 청주시)"
            v-model="location"
            outlined
            dense
            class="text-field"
            @keypress.enter="fetchWeather"
          />
          <v-btn class="ma-3" icon="mdi-magnify" @click="fetchWeather" style="background: #dff6ff; color: #000;"></v-btn>
        </v-col>
      </v-row>

      <transition name="fade" mode="out-in">
        <v-row v-if="isWeatherVisible || notFound">
          <v-col class="weatherBox_content">
            <div v-if="notFound" class="not-found">
              <DotLottieVue
                src="lottie_notfound.json"
                style="width: 400px; height: 200px"
                autoplay
                loop
              />
              <p>다시 한번 검색해보시겠어요...?🙏🏻</p>
            </div>
            <div v-else>
              <div v-if="weatherData && weatherAnimation" class="weather-box">
                <DotLottieVue
                  autoplay
                  loop
                  :src="weatherAnimation"
                  style="width: 400px; height: 200px"
                />
                <p class="temperature">{{ temperature }}<span>°C</span></p>
                <p class="description">{{ description }}</p>
              </div>
              <div v-if="weatherData" class="weather-details">
                <v-row>
                  <v-col>
                    <v-icon>mdi-water</v-icon>
                    <div class="text">
                      <span>{{ humidity }}%</span>
                      <p>습도</p>
                    </div>
                  </v-col>
                  <v-col>
                    <v-icon>mdi-weather-windy</v-icon>
                    <div class="text">
                      <span>{{ windSpeed }}Km/h</span>
                      <p>풍속</p>
                    </div>
                  </v-col>
                </v-row>
              </div>
            </div>
          </v-col>
        </v-row>
      </transition>
    </div>

    <v-row v-if="foodRecommendations.length > 0 && !notFound">
      <v-col>
        <div class="food-recommendations">
          <p id="food-recommendation-text">{{ foodRecommendationText }}</p>
          <div id="food-buttons">
            <v-btn
              v-for="food in foodRecommendations"
              :key="food"
              @click="navigateToFood(food)"
            >
              {{ food }}
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <section>
          <div class="wave wave1"></div>
          <div class="wave wave2"></div>
          <div class="wave wave3"></div>
          <div class="wave wave4"></div>
        </section>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { DotLottieVue } from '@lottiefiles/dotlottie-vue';

const router = useRouter();

// 상태를 저장하는 변수들
const location = ref(''); // 사용자가 입력한 위치
const weatherData = ref(null); // 날씨 데이터
const weatherAnimation = ref(''); // 날씨 애니메이션 URL
const temperature = ref(''); // 온도
const description = ref(''); // 날씨 설명
const humidity = ref(''); // 습도
const windSpeed = ref(''); // 풍속
const notFound = ref(false); // 데이터 찾을 수 없음을 나타내는 상태
const foodRecommendationText = ref(''); // 음식 추천 텍스트
const foodRecommendations = ref([]); // 음식 추천 리스트
const introTitle = ref(null); // 인트로 타이틀 참조
const isWeatherVisible = ref(false); // 날씨 데이터 표시 상태

// 날씨 상태에 따른 애니메이션과 설명 매핑
const weatherDataMapping = {
  Clear: {
    url: 'lottie_clear.json',
    desc: '맑음',
  },
  Rain: {
    url: 'lottie_rain.json',
    desc: '비',
  },
  Snow: {
    url: 'lottie_snow.json',
    desc: '눈',
  },
  Clouds: {
    url: 'lottie_clouds.json',
    desc: '흐림',
  },
  Haze: {
    url: 'lottie_haze.json',
    desc: '연무',
  },
  Mist: {
    url: 'lottie_mist.json',
    desc: '안개',
  },
};

// OpenWeather API 키
const openWeatherApiKey = 'ae8e063da1df5b402ef32dd62bf29536';

// 날씨 데이터를 가져오는 함수
const fetchWeather = async () => {
  isWeatherVisible.value = false; // 날씨 데이터 표시 상태 초기화
  notFound.value = false; // notFound 상태 초기화
  await new Promise(resolve => setTimeout(resolve, 300)); // 트랜지션 효과를 위해 딜레이 추가

  const city = location.value.trim(); // 입력된 위치를 가져옴
  if (city === '') return; // 위치가 빈 문자열이면 반환
  localStorage.setItem('userCity', city); // 로컬 스토리지에 사용자 도시 저장

  // 위치의 다양한 변형을 시도 (예: '서울', '서울특별시', '서울시', '서울구', '서울동' 등)
  const cityVariants = [
    city,
    `${city}특별시`,
    `${city}광역시`,
    `${city}시`,
    `${city}도`,
    `${city}읍`,
    `${city}리`,
    `${city}구`,
    `${city}동`
  ];

  // 각 변형된 위치에 대해 날씨 데이터를 가져오기 시도
  for (const variant of cityVariants) {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${variant}&units=metric&appid=${openWeatherApiKey}`
      );
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      const json = await response.json();
      if (json.cod === '404') {
        continue;
      }

      // 날씨 데이터를 성공적으로 가져온 경우
      notFound.value = false;
      weatherData.value = json;
      isWeatherVisible.value = true; // 날씨 데이터 표시

      // 날씨 상태에 따라 애니메이션과 설명 설정
      const weatherMain = json.weather[0].main;
      const { url = '', desc = '' } = weatherDataMapping[weatherMain] || {};
      weatherAnimation.value = url;
      description.value = desc;

      // API로부터 받은 온도와 풍속을 'parseInt'를 사용하여 정수로 변환 후 문자열로 변환 / 습도를 그대로 문자열로 변환
      temperature.value = `${parseInt(json.main.temp)}`;
      humidity.value = `${json.main.humidity}`;
      windSpeed.value = `${parseInt(json.wind.speed)}`;

      // 날씨 상태에 따라 음식 추천 설정
      let foodList = [];
      switch (weatherMain) {
        case 'Rain':
          foodRecommendationText.value = '비가 오네요, 이런 음식은 어때요?';
          foodList = [ '파전', '오뎅탕', '국밥', '칼국수', '부대찌개', '된장찌개', '라면', '전', ];
          break;
        case 'Clouds':
          foodRecommendationText.value = '구름 낀 날이네요, 이런 음식은 어때요?';
          foodList = [ '마라탕', '국밥', '튀김', '순대국', '제육볶음', '닭갈비', '보쌈', '족발', ];
          break;
        case 'Clear':
          foodRecommendationText.value = '맑은 날씨네요, 이런 음식은 어때요?';
          foodList = [ '카페', '아이스크림', '샐러드', '브런치', '스시', '샌드위치', '파스타', '스테이크', ];
          break;
        case 'Snow':
          foodRecommendationText.value = '눈이 오네요, 이런 음식은 어때요?';
          foodList = [ '전골', '마라탕', '샤브샤브', '김치찌개', '감자탕', '닭볶음탕', '칼국수', '부대찌개', ];
          break;
        default:
          foodRecommendationText.value = '이 메뉴는 어때요?';
          foodList = ['음식점'];
      }

      // 음식 추천 리스트를 랜덤하게 정렬하여 4개 선택
      foodList.sort(() => Math.random() - 0.5);
      const selectedFoods = foodList.slice(0, 4);
      localStorage.setItem('selectedFoods', JSON.stringify(selectedFoods)); // 로컬 스토리지에 선택된 음식 저장
      foodRecommendations.value = selectedFoods;
      return; // 성공적으로 호출이 되면 루프를 종료
    } catch (error) {
      console.error('Error fetching data:', error);
      notFound.value = true;
      isWeatherVisible.value = false;
      weatherData.value = null;
    }
  }

  // 모든 시도 후에도 결과가 없을 때
  notFound.value = true;
  weatherData.value = null;
  isWeatherVisible.value = false; // 날씨 데이터를 표시하지 않음
};

// 음식 추천 버튼 클릭 시 지도 페이지로 이동
const navigateToFood = (food) => {
  const city = location.value.trim();
  router.push({ name: 'MapMenuChoice', query: { city, food } });
};

// 컴포넌트가 마운트될 때 인트로 타이틀을 타이핑 애니메이션으로 설정
onMounted(() => {
  const title = '그래서 뭐 먹지? 🤔';
  let cnt = 0;

  const typingIntroTitle = () => {
    if (cnt < title.length) {
      introTitle.value.innerHTML += title[cnt++];
    } else {
      clearInterval(timer);
    }
  };

  const timer = setInterval(typingIntroTitle, 200);
});
</script>


<style>
@import url('https://webfontworld.github.io/woowahan/BMJua.css');

* {
  margin: 0;
  padding: 0;
  border: 0;
  outline: none;
  box-sizing: border-box;
}
:root {
  font-family: 'BMJua';
}

body {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background: #ff9100;
  position: relative;
  overflow: hidden;
}

.title {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  color: #fff;
  text-shadow: 1px 1px 1px #000;
}

.title h2 {
  font-size: 50px;
  font-weight: 400;
}

.title p {
  font-size: 20px;
}

.test {
  display: flex;
  flex-direction: column;
  width: 500px;
  background-color: white;
  border-radius: 15px;
  padding: 15px;
  justify-content: space-between;
}

.text-field {
  color: #000;
}
.search-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.weatherBox_content.hidden {
  display: none;
}

.weather-box {
  text-align: center;
  opacity: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.weather-box img {
  width: 60%;
  margin-top: 30px;
}

.weather-box .temperature {
  position: relative;
  color: #06283d;
  font-size: 40px;
  font-weight: 800;
  margin-top: 20px;
  margin-left: -16px;
}

.weather-box .temperature span {
  position: absolute;
  margin-left: 4px;
  font-size: 1.5rem;
}

.weather-box .description {
  color: #06283d;
  font-size: 22px;
  font-weight: 500;
  text-transform: capitalize;
}

.weather-details {
  width: 100%;
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
}

.weather-details .humidity,
.weather-details .wind {
  display: flex;
  align-items: center;
  width: 50%;
  height: 20px;
}

.weather-details .humidity {
  padding-left: 70px;
  justify-content: flex-start;
}

.weather-details .wind {
  padding-right: 70px;
  justify-content: flex-end;
}

.weather-details i {
  color: #06283d;
  font-size: 26px;
  margin-right: 10px;
  margin-top: 6px;
}

.weather-details span {
  color: #06283d;
  font-size: 22px;
  font-weight: 500;
}

.weather-details p {
  color: #06283d;
  font-size: 14px;
  font-weight: 500;
}

.weather-details .v-col {
  align-items: center;
  justify-content: center;
  text-align: center;
  display: flex;
}

.not-found {
  width: 100%;
  height: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.not-found lottie-player {
  width: 100%;
}

.not-found p {
  color: #06283d;
  font-size: 22px;
  font-weight: 500;
  margin-top: 12px;
}

.weather-box,
.weather-details {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}

#find-restaurant {
  display: none;
  margin-top: 30px;
  font-family: 'BMJua';
}

#food-recommendation-text {
  text-align: center;
  font-size: 25px;
  color: #fff;
  margin: 20px 0;
  text-shadow: 1px 1px 1px #000;
}

#food-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 1s ease-in-out, transform 1s ease-in-out;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

section {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100px;
  z-index: 0;
}

section .wave {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 90px;
  background: url('../assets/wave.png');
  background-size: 1000px 100px;
}

section .wave.wave1 {
  animation: animate 30s linear infinite;
  z-index: 1000;
  opacity: 1;
  animation-delay: 0s;
  bottom: 0;
}

section .wave.wave2 {
  animation: animate2 15s linear infinite;
  z-index: 999;
  opacity: 0.5;
  animation-delay: -5s;
  bottom: 10px;
}

section .wave.wave3 {
  animation: animate 30s linear infinite;
  z-index: 998;
  opacity: 0.2;
  animation-delay: -2s;
  bottom: 15px;
}

section .wave.wave4 {
  animation: animate2 15s linear infinite;
  z-index: 997;
  opacity: 0.7;
  animation-delay: -5s;
  bottom: 20px;
}

@keyframes animate {
  0% {
    background-position-x: 0;
  }
  100% {
    background-position-x: 1000px;
  }
}

@keyframes animate2 {
  0% {
    background-position-x: 0;
  }
  100% {
    background-position-x: -1000px;
  }
}

.title_intro:after {
  content: '|';
  display: inline-block;
  font-size: 60px;
  animation: moveCursor 600ms infinite;
}

@keyframes moveCursor {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

#food-buttons button {
  background-color: #f2522e;
  color: #fff;
  font-family: 'BMJua';
  font-size: 30px;
  text-shadow: 0.5px 0.5px 0.5px #000;
  z-index: 1001;
  padding: 10px;
  border-radius: 5px;
  display: flex;
}

.weather-box lottie-player,
.not-found lottie-player {
  width: 100%;
  height: auto;
  display: block;
  visibility: visible;
  opacity: 1;
}
.v-text-field .v-input__details { display: none; }
.v-field.v-field--prepended { border-radius: 10px 10px 0 0;}
</style>
