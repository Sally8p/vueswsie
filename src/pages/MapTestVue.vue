<template>
  <div class="container">
    <header>
      <h1>
        <span>오</span>
        <span>늘</span>
        <span>은</span>
        <span>여</span>
        <span>기</span>
        <span>서</span>
        <span>한</span>
        <span>끼</span>
        <span>?</span>
      </h1>
    </header>

    <section>
      <div class="map_wrap">
        <KakaoMap
          :lat="37.566826"
          :lng="126.9786567"
          @onLoadKakaoMap="onLoadKakaoMap"
          style="width: 100%; height: 100%"
        >
          <KakaoMapMarker
            v-for="(marker, index) in markerList"
            :key="marker.key === undefined ? index : marker.key"
            :lat="marker.lat"
            :lng="marker.lng"
            :infoWindow="marker.infoWindow"
            :clickable="true"
            :image="{
              imageSrc: 'https://cdn.icon-icons.com/icons2/1283/PNG/512/1497620001-jd22_85165.png',
              imageWidth: 50,
              imageHeight: 50,
            }"
            @onClickKakaoMapMarker="() => onClickMapMarker(marker)"
          />
        </KakaoMap>
        <div id="menu_wrap" class="bg_white" :class="{ open: menuOpen }">
          <div class="selectedFoods">
            <p>다른 키워드 선택하기</p>
            <div class="food-options">
              <ul id="storedFoodsList">
                <li
                  v-for="(food, index) in storedFoods"
                  :key="index"
                  @click="updateKeywordWithCity(food)"
                  :class="{ selected: selectedFood === food }"
                >
                  {{ food }}
                </li> 
              </ul> 
            </div>
          </div>
          <div class="option">
            <div>
              <form @submit.prevent="searchPlaces">
                키워드 : <input type="text" v-model="keyword" size="15" style="border: 1px solid rgba(0, 0, 0, 0.5); padding-left: 5px; border-radius: 3px;" />
              </form>
            </div>
          </div>
          <hr />
          <ul id="placesList">
            <li
              v-for="(place, index) in places"
              :key="index"
              class="item"
              @click="highlightMarker(index)"
            >
              <span :class="`markerbg marker_${index + 1}`"></span>
              <div class="info">
                <h5 style="font-size: 14px; font-weight: 500">
                  {{ place.place_name }}
                </h5>
                <span>{{ place.road_address_name }}</span>
                <span class="jibun gray">{{ place.address_name }}</span>
                <span class="tel">{{ place.phone }}</span>
              </div>
            </li>
          </ul>
          <div id="pagination"></div>
        </div>
      </div>
      <i
        class="mdi mdi-dots-horizontal-circle"
        id="plusBt"
        @click="toggleMenu"
        :class="{ open: menuOpen }"
      ></i>
    </section>

    <div class="learnMoreWrapper">
      <p>다른 지역도 궁금하신가요? 🤔</p>
      <button id="home-button">
        <router-link to="/">다시 검색하러 가기</router-link>
      </button>
    </div>

    <div
      class="goToRoulette animate__animated animate__pulse animate__infinite"
    >
      <p>혹시 랜덤은 어때요?</p>
      <button id="go-roulette" @click="goToRoulette">룰렛 돌려보기</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { KakaoMap, KakaoMapMarker, type KakaoMapMarkerListItem, } from "vue3-kakao-maps";

// 상태를 저장하는 변수들
const map = ref<kakao.maps.Map | null>(null); // 카카오 맵 객체 참조
const markerList = ref<KakaoMapMarkerListItem[]>([]); // 마커 리스트
const keyword = ref(""); // 검색 키워드
const city = ref(""); // 도시 이름
const places = ref([]); // 검색된 장소 리스트
const allFoods = [
  '전골', '마라탕', '샤브샤브', '김치찌개', '감자탕', '닭볶음탕', '칼국수', '부대찌개','카페', '아이스크림', '샐러드', '브런치', '스시',
  '샌드위치', '파스타', '스테이크','파전', '오뎅탕', '국밥', '칼국수', '부대찌개', '된장찌개', '라면', '전', '마라탕', '국밥', '튀김', 
  '순대국', '제육볶음', '닭갈비', '보쌈', '족발', 
]; // 모든 메뉴 리스트
const storedFoods = ref<string[]>([]); // 랜덤으로 선택된 메뉴 리스트
const selectedFood = ref<string | null>(null); // 선택된 음식
const menuOpen = ref(false); // 메뉴 열기/닫기 상태
const router = useRouter();
const route = useRoute();

// 메뉴 열기/닫기 토글 함수
const toggleMenu = () => {
  menuOpen.value = !menuOpen.value;
};

// 카카오 맵이 로드될 때 실행되는 함수
const onLoadKakaoMap = (mapRef: kakao.maps.Map) => {
  map.value = mapRef; // 맵 객체 설정
  const ps = new kakao.maps.services.Places();  // 장소 검색 서비스를 제공하는 객체
  ps.keywordSearch(keyword.value, placesSearchCB); // 특정 키워드로 장소를 검색 실행
};

// 장소 검색 콜백 함수
// 장소 검색 콜백 함수
const placesSearchCB = (
  data: kakao.maps.services.PlacesSearchResult,
  status: kakao.maps.services.Status
): void => {
  if (status === kakao.maps.services.Status.OK) {
    const bounds = new kakao.maps.LatLngBounds();
    markerList.value = []; // 이전 마커 리스트 초기화
    // 검색된 장소 데이터 저장 및 첫 글자 기준으로 정렬
    places.value = data.sort((a, b) => a.place_name.localeCompare(b.place_name));

    for (let marker of places.value) {
      const markerItem: KakaoMapMarkerListItem = {
        lat: Number(marker.y),
        lng: Number(marker.x),
        infoWindow: {
          content: `<div style="border-radius: 3px; padding: 5px; font-size: 14px; color: #000; text-align: center;">${marker.place_name}</div>`,
          visible: false,
        },
      };
      markerList.value.push(markerItem);
      bounds.extend(new kakao.maps.LatLng(Number(marker.y), Number(marker.x)));
    }
    map.value?.setBounds(bounds); // 맵의 경계를 검색된 장소로 설정
  }
};


// 맵 마커 클릭 시 실행되는 함수
const onClickMapMarker = (markerItem: KakaoMapMarkerListItem): void => {
  if (
    markerItem.infoWindow?.visible !== null && markerItem.infoWindow?.visible !== undefined
  ) {
    markerItem.infoWindow.visible = !markerItem.infoWindow.visible; // 인포윈도우의 가시성 토글
  } else {
    markerItem.infoWindow.visible = true; // 인포윈도우를 보이도록 설정
  }
};

// 장소를 검색하는 함수
const searchPlaces = () => {
  if (!map.value) return;
  const ps = new kakao.maps.services.Places();
  ps.keywordSearch(keyword.value, placesSearchCB); // 키워드 검색 실행
};

// 키워드를 도시와 음식으로 업데이트하는 함수
const updateKeywordWithCity = (food) => {
  keyword.value = `${city.value} ${food}`;
  selectedFood.value = food;
  searchPlaces(); // 장소 검색 실행
};

// 랜덤으로 음식을 선택하는 함수
const getRandomFoods = () => {
  const shuffled = allFoods.sort(() => 0.5 - Math.random());
  storedFoods.value = shuffled.slice(0, 4); // 랜덤으로 4개의 음식 선택
};

// 마커를 강조하는 함수
const highlightMarker = (index: number) => {
  if (markerList.value[index]) {
    onClickMapMarker(markerList.value[index]); // 마커 클릭 함수 실행
  }
};

// 룰렛 페이지로 이동하는 함수
const goToRoulette = () => {
  router.push({ name: 'Roulette' }); // 라우터를 이용해 룰렛 페이지로 이동
};

// route.query가 변경될 때 실행되는 함수
watch(
  () => route.query,
  (newQuery) => {
    if (newQuery && newQuery.city && newQuery.food) {
      city.value = newQuery.city;
      keyword.value = `${newQuery.city} ${newQuery.food}`;
      searchPlaces(); // 장소 검색 실행
    }
  },
  { immediate: true } // 즉시 실행
);

// 컴포넌트가 마운트될 때 실행되는 함수
onMounted(() => {
  getRandomFoods(); // 랜덤 음식 선택
  const newQuery = route.query;
  if (newQuery && newQuery.city && newQuery.food) {
    city.value = newQuery.city;
    keyword.value = `${newQuery.city} ${newQuery.food}`;
    searchPlaces(); // 장소 검색 실행
  }
});
</script>


<style scoped>
@import url("https://webfontworld.github.io/woowahan/BMJua.css");

* {
  box-sizing: border-box;
}

.container {
  background-color: white;
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

header {
  text-align: center;
  padding-top: 10px;
  margin-bottom: 20px;
}

header h1 {
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: "BMJua", sans-serif;
  font-size: 48px;
  gap: 5px;
  color: #3a3a3a;
  text-shadow: 0 1px 0 #ccc, 0 2px 0 #ccc, 0 3px 0 #ccc, 0 4px 0 #ccc,
    0 5px 0 #000, 0 6px 0 transparent, 0 7px 0 transparent, 0 8px 0 transparent,
    0 9px 0 transparent, 0 10px 10px rgba(0, 0, 0, 0.3);
}

header h1 span {
  position: relative;
  top: 20px;
  display: inline-block;
  animation: bounce 0.4s ease infinite alternate;
}

header h1 span:nth-child(2) { animation-delay: 0.1s; }
header h1 span:nth-child(3) { animation-delay: 0.2s; }
header h1 span:nth-child(4) { animation-delay: 0.3s; }
header h1 span:nth-child(5) { animation-delay: 0.4s; }
header h1 span:nth-child(6) { animation-delay: 0.5s; }
header h1 span:nth-child(7) { animation-delay: 0.6s; }
header h1 span:nth-child(8) { animation-delay: 0.7s; }

@keyframes bounce {
  100% {
    top: -20px;
    text-shadow: 0 1px 0 #ccc, 0 2px 0 #ccc, 0 3px 0 #ccc, 0 4px 0 #ccc,
      0 5px 0 #000, 0 6px 0 transparent, 0 7px 0 transparent,
      0 8px 0 transparent, 0 9px 0 transparent, 0 10px 10px rgba(0, 0, 0, 0.2);
  }
}

section {
  display: flex;
  justify-content: center;
  width: 100%;
  height: calc(
    100vh - 200px
  ); /* Adjust height according to header and footer */
  position: relative;
  overflow: hidden;
}

.map_wrap {
  display: flex;
  justify-content: center;
  position: relative;
  width: 100%;
  height: 100%;
}

#map {
  width: 100%;
  height: 100%;
  overflow: visible;
}

#menu_wrap {
  position: absolute;
  top: 60px;
  left: -280px; /* 초기 상태에서 숨겨둡니다 */
  bottom: 0;
  width: 280px;
  height: calc(100% - 100px);
  margin: 10px 0 10px 10px;
  padding: 5px;
  border-radius: 15px;
  background: rgba(255, 255, 255);
  box-shadow: 1px 0px 0px 0.2px #ccc; /* Adjust background transparency */
  z-index: 10;
  font-size: 12px;
  transition: left 0.3s;
  color: #000;
}

#menu_wrap.open { left: 0; /* 열림 상태에서 보이도록 변경 */ }

#menu_wrap input { color: #000; /* 글씨색을 검은색으로 수정 */ }

.bg_white {
  background: #fff;
}

#menu_wrap hr {
  display: block;
  height: 1px;
  border: 0;
  border-top: 2px solid #5f5f5f;
  margin: 3px 0;
}

#menu_wrap .option { text-align: center; }

#menu_wrap .option p { margin: 10px 0; }

#menu_wrap .option button { margin-left: 5px; }

#placesList {
  max-height: calc(100% - 140px);
  overflow-y: auto;
}

#placesList li { list-style: none; }

#placesList .item {
  position: relative;
  border-bottom: 1px solid #888;
  overflow: hidden;
  cursor: pointer;
  min-height: 65px;
}

#placesList .item span {
  display: block;
  margin-top: 4px;
}

#placesList .item h5,
#placesList .item .info {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

#placesList .item .info { padding: 10px 0 10px 55px; }

#placesList .info .gray { color: #8a8a8a; }

#placesList .info .jibun {
  padding-left: 26px;
  background: url(https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/places_jibun.png)
    no-repeat;
}

#placesList .info .tel { color: #009900; }

#placesList .item .markerbg {
  position: absolute;
  width: 50px;
  height: 50px;
  left: 0;
  top: 30%;
  transform: translateY(-50%);
  background: url('https://cdn.icon-icons.com/icons2/1283/PNG/512/1497620001-jd22_85165.png') no-repeat;
  background-size: contain;
}

#placesList::-webkit-scrollbar { width: 10px; }

#placesList::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

#placesList::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

#placesList::-webkit-scrollbar-thumb:hover { background: #555; }

#pagination {
  margin: 10px auto;
  text-align: center;
}

#pagination a {
  display: inline-block;
  margin-right: 10px;
}

#pagination .on {
  font-weight: bold;
  cursor: default;
  color: #777;
}

.learnMoreWrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0;
  margin-bottom: 30px;
  font-family: "BMJua";
}

.learnMoreWrapper p {
  margin-top: 20px;
  margin-bottom: 5px;
  color: #5f5f5f;
  font-size: 20px;
  color: #fff;
  text-shadow: 0px 0px 5px #000;
}

.learnMoreWrapper button,
.goToRoulette button {
  font-family: "BMJua";
  font-size: 24px;
  border: none;
  background-color: #f2522e;
  padding: 5px 20px;
  border-radius: 25px;
  color: #fff;
  cursor: pointer;
  transition: 0.3s;
  color: #fff;
}

.learnMoreWrapper button:hover,
.goToRoulette button:hover {
  opacity: 0.6;
}

.goToRoulette {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: absolute;
  z-index: 30;
  bottom: 25px;
  right: 15px;
}

.goToRoulette button {
  font-size: 15px;
  padding: 5px 15px;
  background-color: #f2522e;
}

.goToRoulette p {
  margin-bottom: 5px;
  font-family: "BMJua";
  color: #fff;
  text-shadow: 0px 0px 5px #000;
}

.selectedFoods {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  background-color: #fff;
  padding: 20px;
  width: 250px;
  font-family: "BMJua";
  font-size: 24px;
  color: #f2522e;
}

.selectedFoods ul {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 0;
}

.selectedFoods li {
  list-style-type: none;
  font-size: 14px;
  font-family: "BMJua";
  color: #000000;
}

.selectedFoods .selected {
  color: #f2522e;
  font-size: 19px;
}

#plusBt {
  font-size: 32px;
  position: absolute;
  z-index: 20;
  left: 60px;
  top: 50%;
  transform: translateY(-50%);
  transition: 0.3s;
  border-radius: 10px;
  color: #f2522e;
  padding-left: 20px;
}

#plusBt.open { left: 290px; }
a { text-decoration: none; }

a:link { color: #fff; }

a:visited { color: #fff; }

a:hover { color: #fff; }

a:active { color: #fff; }

html,
body {
  width: 100%;
  height: 100%;
  -webkit-font-smoothing: antialiased;
  display: flex;
  justify-content: center;
  align-items: center;
}

.customoverlay {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 200px;
  cursor: pointer;
}

.customoverlay .title {
  display: block;
  text-align: center;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 3px;
  padding: 5px;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: -20px; /* 오버레이 위치 조정 */
}

.marker-icon { margin-top: -20px; /* 마커 위치 조정 */ }
</style>
