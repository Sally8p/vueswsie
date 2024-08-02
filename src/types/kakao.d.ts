// src/types/kakao.d.ts
declare module "vue3-kakao-maps" {
  export namespace kakao.maps {
    class Map {
      constructor(container: HTMLElement, options: object);
      setBounds(bounds: LatLngBounds): void;
    }

    class LatLngBounds {
      constructor();
      extend(latlng: LatLng): void;
    }

    class LatLng {
      constructor(lat: number, lng: number);
    }

    namespace services {
      class Places {
        keywordSearch(
          keyword: string,
          callback: (result: PlacesSearchResult, status: Status) => void
        ): void;
      }

      type PlacesSearchResult = Array<{
        place_name: string;
        y: string;
        x: string;
      }>;

      enum Status {
        OK = "OK",
        ZERO_RESULT = "ZERO_RESULT",
        ERROR = "ERROR",
      }
    }
  }
}
