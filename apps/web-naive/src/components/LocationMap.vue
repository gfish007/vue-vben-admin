<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';

import AMapLoader from '@amap/amap-jsapi-loader';
import { NAutoComplete, NButton, NSpace, useMessage } from 'naive-ui';

const props = defineProps<{
  location: String;
  locationInfo: {
    default: '';
    type: String;
  };
}>();

const emit = defineEmits<{
  (e: 'update:location', value: string): void;
  (e: 'update:locationInfo', value: string): void;
}>();

const message = useMessage();
const mapInstance = ref<any>(null);
const searchSuggestions = ref<Array<{ label: string; value: string }>>([]);
let currentMarker: any = null;

const mapKey = '603b1e7f8580ed423a215759fb728f10';
const securityJsCode = '0a594d8e2f81ad21eafe42b6a8f6a443';

const initMap = async () => {
  if (mapInstance.value) {
    return { AMap: (window as any).AMap, map: mapInstance.value };
  }

  try {
    window._AMapSecurityConfig = {
      securityJsCode,
    };
    const AMap = await AMapLoader.load({
      key: mapKey,
      plugins: ['AMap.PlaceSearch', 'AMap.Geocoder', 'AMap.AutoComplete'],
      version: '2.0',
    });
    const mapContainer = document.querySelector('#map-container');
    if (!mapContainer) {
      throw new Error('Map container not found');
    }
    const map = new AMap.Map(mapContainer, {
      center: [116.397_428, 39.909_23],
      viewMode: '3D',
      zoom: 11,
    });
    map.on('click', (e: any) => handleMapClick(e, map, AMap));
    mapInstance.value = map;
    return { AMap, map };
  } catch (error) {
    console.error('Failed to initialize map:', error);
    message.error('地图初始化失败，请刷新页面重试');
    return null;
  }
};

const handleSearchInput = async (value: string) => {
  if (!value) {
    searchSuggestions.value = [];
    return;
  }

  try {
    const { AMap } = (await initMap()) || {};
    if (!AMap) {
      throw new Error('AMap not initialized');
    }

    const autoComplete = new AMap.AutoComplete({
      city: '全国',
    });

    autoComplete.search(value, (status: string, result: any) => {
      searchSuggestions.value =
        status === 'complete' && result.tips
          ? result.tips.map((tip: any) => ({
              adcode: tip.adcode,
              district: tip.district,
              label: tip.name,
              value: tip.name,
            }))
          : [];
    });
  } catch (error) {
    console.error('Failed to get search suggestions:', error);
    message.error('获取搜索建议失败');
  }
};

const searchLocation = async () => {
  const { AMap, map } = (await initMap()) || {};
  if (!map || !AMap) {
    message.error('地图未初始化，请刷新页面重试');
    return;
  }

  const searchValue = props.location;
  if (!searchValue) {
    message.error('请输入位置信息');
    return;
  }

  try {
    const placeSearch = new AMap.PlaceSearch({
      city: '全国',
      pageIndex: 1,
      pageSize: 1,
    });

    placeSearch.search(searchValue, (status: string, result: any) => {
      if (status === 'complete' && result.info === 'OK') {
        if (
          result.poiList &&
          result.poiList.pois &&
          result.poiList.pois.length > 0
        ) {
          const poi = result.poiList.pois[0];
          emit('update:location', poi.name);
          map.setCenter(poi.location);
          map.setZoom(15);
          updateLocationInfo(poi.location);
          addMarker(map, AMap, poi.location);
          message.success('位置搜索成功');
        } else {
          message.warning('未找到匹配的位置');
        }
      } else {
        console.error('PlaceSearch failed:', status, result);
        message.error(`位置搜索失败：${result.info}`);
      }
    });
  } catch (error) {
    console.error('Failed to load or use PlaceSearch:', error);
    message.error('搜索功能加载失败，请刷新页面重试');
  }
};

const addMarker = (map: any, AMap: any, position: any) => {
  if (currentMarker) {
    map.remove(currentMarker);
  }
  currentMarker = new AMap.Marker({
    animation: 'AMAP_ANIMATION_BOUNCE',
    cursor: 'move',
    draggable: true,
    position,
  });
  map.add(currentMarker);
  currentMarker.on('dragend', () => {
    const newPos = currentMarker.getPosition();
    updateLocationInfo(newPos);
  });
};

const updateLocationInfo = async (lnglat: any) => {
  const { AMap } = (await initMap()) || {};
  if (!AMap) {
    message.error('地图未初始化，请刷新页面重试');
    return;
  }

  try {
    const geocoder = new AMap.Geocoder();
    geocoder.getAddress(lnglat, (status: string, result: any) => {
      if (status === 'complete' && result.info === 'OK') {
        const addressComponent = result.regeocode.addressComponent;
        const formattedAddress = {
          city: addressComponent.city || '',
          country: addressComponent.country || '',
          district: addressComponent.district || '',
          formattedAddress: result.regeocode.formattedAddress || '',
          province: addressComponent.province || '',
          street: addressComponent.street || '',
          streetNumber: addressComponent.streetNumber || '',
          township: addressComponent.township || '',
        };

        emit(
          'update:locationInfo',
          JSON.stringify(
            {
              address: formattedAddress,
              lnglat: lnglat.toString(),
            },
            null,
            2,
          ),
        );

        emit('update:location', formattedAddress.formattedAddress);

        message.success('位置信息已更新');
      } else {
        console.error('Geocoder failed:', status, result);
        message.error('获取地址信息失败');
      }
    });
  } catch (error) {
    console.error('Failed to load or use Geocoder:', error);
    message.error('地理编码功能加载失败，请刷新页面重试');
  }
};

const handleMapClick = (e: any, map: any, AMap: any) => {
  const clickedLngLat = e.lnglat;
  updateLocationInfo(clickedLngLat);
  addMarker(map, AMap, clickedLngLat);
};

const handleSelectSuggestion = async (value: string) => {
  emit('update:location', value);
  await searchLocation();
};

onMounted(async () => {
  await initMap();
});

watch(
  () => props.locationInfo,
  async (newValue) => {
    if (newValue) {
      await nextTick();
      const { AMap, map } = (await initMap()) || {};
      if (map && AMap) {
        try {
          const locationInfo = newValue;
          if (locationInfo.lnglat) {
            const [lng, lat] = locationInfo.lnglat.split(',').map(Number);
            map.setCenter([lng, lat]);
            map.setZoom(15);
            addMarker(map, AMap, [lng, lat]);
          }
        } catch (error) {
          console.error('Failed to parse locationInfo:', error);
        }
      }
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="location-map-container">
    <NSpace class="search-container">
      <NAutoComplete
        :options="searchSuggestions"
        :value="location"
        placeholder="输入位置名称"
        style="flex-grow: 1"
        @input="
          (value) => {
            emit('update:location', value);
            handleSearchInput(value);
          }
        "
        @select="handleSelectSuggestion"
      />
      <NButton @click="searchLocation">搜索</NButton>
    </NSpace>
    <div id="map-container"></div>
  </div>
</template>

<style scoped>
.location-map-container {
  width: 100%;
}

.search-container {
  display: flex;
  margin-bottom: 10px;
}

#map-container {
  width: 100%;
  height: 350px; /* 可以根据需要调整这个值 */
}
</style>
