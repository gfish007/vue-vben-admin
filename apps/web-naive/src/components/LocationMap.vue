<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';

import AMapLoader from '@amap/amap-jsapi-loader';
import { NAutoComplete, NButton, NButtonGroup, NCard, NCol, NForm, NFormItem, NInput, NRow, NSpace, useMessage } from 'naive-ui';

interface LocationInfo {
  address: {
    city: string;
    country: string;
    district: string;
    formattedAddress: string;
    province: string;
    street: string;
    streetNumber: string;
    township: string;
  };
  lnglat: string;
}

interface BackendLocationInfo {
  lat: number | string;
  lng: number | string;
  address?: any;
}

interface DisableRegion {
  northeast: {
    lat: number;
    lng: number;
  };
  southwest: {
    lat: number;
    lng: number;
  };
}

const props = withDefaults(defineProps<{
  location?: string;
  locationInfo?: string | LocationInfo | BackendLocationInfo;
  // 新增props
  showSatelliteToggle?: boolean;
  showBoundsInfo?: boolean;
  disableRegion?: DisableRegion | null;
}>(), {
  location: '',
  locationInfo: '',
  showSatelliteToggle: false,
  showBoundsInfo: false,
  disableRegion: null,
});

const emit = defineEmits<{
  (e: 'update:location', value: string): void;
  (e: 'update:locationInfo', value: string | LocationInfo | BackendLocationInfo): void;
  // 新增emits
  (e: 'update:disableRegion', value: DisableRegion | null): void;
}>();

const message = useMessage();
const mapInstance = ref<any>(null);
const searchSuggestions = ref<Array<{ label: string; value: string }>>([]);
let currentMarker: any = null;
let polygonMarker: any = null; // 用于显示限制区域的多边形

// 新增状态
const isSatelliteMode = ref(false);
const boundsInfo = ref({
  northeast: { lat: 0, lng: 0 },
  southwest: { lat: 0, lng: 0 }
});

// 限制区域输入框的值
const northeastInput = ref({ lat: '', lng: '' });
const southwestInput = ref({ lat: '', lng: '' });

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
      plugins: ['AMap.PlaceSearch', 'AMap.Geocoder', 'AMap.AutoComplete', 'AMap.Polygon'],
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
    map.on('moveend', () => updateBoundsInfo()); // 地图移动时更新边界信息
    map.on('zoomend', () => updateBoundsInfo()); // 地图缩放时更新边界信息
    mapInstance.value = map;
    return { AMap, map };
  } catch (error) {
    console.error('Failed to initialize map:', error);
    message.error('地图初始化失败，请刷新页面重试');
    return null;
  }
};

// 切换地图模式
const toggleMapMode = async () => {
  const { AMap, map } = (await initMap()) || {};
  if (!map || !AMap) {
    message.error('地图未初始化，请刷新页面重试');
    return;
  }

  isSatelliteMode.value = !isSatelliteMode.value;
  if (isSatelliteMode.value) {
    // 切换到卫星地图
    map.setMapStyle('amap://styles/satellite');
  } else {
    // 切换到标准地图
    map.setMapStyle('amap://styles/normal');
  }
};

// 更新地图边界信息
const updateBoundsInfo = async () => {
  const { map } = (await initMap()) || {};
  if (!map) return;

  const bounds = map.getBounds();
  if (bounds) {
    const northeast = bounds.getNorthEast();
    const southwest = bounds.getSouthWest();
    
    boundsInfo.value = {
      northeast: {
        lat: northeast.lat,
        lng: northeast.lng
      },
      southwest: {
        lat: southwest.lat,
        lng: southwest.lng
      }
    };
  }
};

// 更新限制区域
const updateDisableRegion = () => {
  const northeastLat = parseFloat(northeastInput.value.lat);
  const northeastLng = parseFloat(northeastInput.value.lng);
  const southwestLat = parseFloat(southwestInput.value.lat);
  const southwestLng = parseFloat(southwestInput.value.lng);

  if (
    !isNaN(northeastLat) && 
    !isNaN(northeastLng) && 
    !isNaN(southwestLat) && 
    !isNaN(southwestLng)
  ) {
    const disableRegion: DisableRegion = {
      northeast: {
        lat: northeastLat,
        lng: northeastLng
      },
      southwest: {
        lat: southwestLat,
        lng: southwestLng
      }
    };
    emit('update:disableRegion', disableRegion);
    
    // 在地图上显示限制区域
    drawDisableRegion(disableRegion);
  } else {
    emit('update:disableRegion', null);
    clearDisableRegion();
  }
};

// 在地图上绘制限制区域
const drawDisableRegion = async (disableRegion: DisableRegion) => {
  const { AMap, map } = (await initMap()) || {};
  if (!map || !AMap) return;

  // 清除之前的多边形
  clearDisableRegion();

  // 创建多边形表示限制区域
  const polygonPath = [
    [disableRegion.southwest.lng, disableRegion.southwest.lat], // 西南角
    [disableRegion.northeast.lng, disableRegion.southwest.lat], // 西北角
    [disableRegion.northeast.lng, disableRegion.northeast.lat], // 东北角
    [disableRegion.southwest.lng, disableRegion.northeast.lat], // 东南角
    [disableRegion.southwest.lng, disableRegion.southwest.lat]  // 回到西南角
  ];

  polygonMarker = new AMap.Polygon({
    path: polygonPath,
    fillOpacity: 0.3,
    fillColor: '#FF0000',
    strokeColor: '#FF0000',
    strokeWeight: 2
  });

  map.add(polygonMarker);
};

// 清除地图上的限制区域
const clearDisableRegion = () => {
  if (polygonMarker && mapInstance.value) {
    mapInstance.value.remove(polygonMarker);
    polygonMarker = null;
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

        // Emit后端需要的格式 {lat, lng, address}
        const [lng, lat] = lnglat.toString().split(',').map(Number);
        emit(
          'update:locationInfo',
          {
            lat: lat,
            lng: lng,
            address: formattedAddress,
          },
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
  // 初始化时更新边界信息
  updateBoundsInfo();
});

watch(
  () => props.locationInfo,
  async (newValue) => {
    if (newValue) {
      await nextTick();
      const { AMap, map } = (await initMap()) || {};
      if (map && AMap) {
        try {
          // 处理字符串和对象两种格式
          let locationInfo;
          if (typeof newValue === 'string') {
            locationInfo = JSON.parse(newValue);
          } else {
            locationInfo = newValue;
          }
          
          // 检查是否是后端返回的location格式 {lat, lng}
          if (locationInfo.lat !== undefined && locationInfo.lng !== undefined) {
            const lng = typeof locationInfo.lng === 'string' ? parseFloat(locationInfo.lng) : locationInfo.lng;
            const lat = typeof locationInfo.lat === 'string' ? parseFloat(locationInfo.lat) : locationInfo.lat;
            map.setCenter([lng, lat]);
            map.setZoom(15);
            addMarker(map, AMap, [lng, lat]);
          } else if (locationInfo.lnglat) {
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

// 监听disableRegion prop变化
watch(
  () => props.disableRegion,
  (newValue) => {
    if (newValue) {
      northeastInput.value = {
        lat: newValue.northeast.lat.toString(),
        lng: newValue.northeast.lng.toString()
      };
      southwestInput.value = {
        lat: newValue.southwest.lat.toString(),
        lng: newValue.southwest.lng.toString()
      };
      drawDisableRegion(newValue);
    } else {
      northeastInput.value = { lat: '', lng: '' };
      southwestInput.value = { lat: '', lng: '' };
      clearDisableRegion();
    }
  },
  { immediate: true }
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
    
    <!-- 卫星地图切换按钮 -->
    <NSpace v-if="showSatelliteToggle" class="map-controls">
      <NButton @click="toggleMapMode">
        {{ isSatelliteMode ? '标准地图' : '卫星地图' }}
      </NButton>
    </NSpace>
    
    <!-- 地图容器 -->
    <div id="map-container"></div>
    
    <!-- 边界信息显示 -->
    <NCard v-if="showBoundsInfo" class="bounds-info" title="地图边界坐标">
      <NRow :gutter="12">
        <NCol :span="12">
          <NFormItem label="东北角坐标">
            <NInput readonly :value="`${boundsInfo.northeast.lat.toFixed(6)}, ${boundsInfo.northeast.lng.toFixed(6)}`" />
          </NFormItem>
        </NCol>
        <NCol :span="12">
          <NFormItem label="西南角坐标">
            <NInput readonly :value="`${boundsInfo.southwest.lat.toFixed(6)}, ${boundsInfo.southwest.lng.toFixed(6)}`" />
          </NFormItem>
        </NCol>
      </NRow>
    </NCard>
    
    <!-- 限制区域输入框 -->
    <NCard v-if="showBoundsInfo" class="disable-region" title="限制区域设置">
      <NRow :gutter="12">
        <NCol :span="12">
          <NFormItem label="东北角纬度">
            <NInput 
              v-model:value="northeastInput.lat" 
              type="text" 
              @blur="updateDisableRegion"
              placeholder="请输入纬度"
            />
          </NFormItem>
        </NCol>
        <NCol :span="12">
          <NFormItem label="东北角经度">
            <NInput 
              v-model:value="northeastInput.lng" 
              type="text" 
              @blur="updateDisableRegion"
              placeholder="请输入经度"
            />
          </NFormItem>
        </NCol>
      </NRow>
      <NRow :gutter="12">
        <NCol :span="12">
          <NFormItem label="西南角纬度">
            <NInput 
              v-model:value="southwestInput.lat" 
              type="text" 
              @blur="updateDisableRegion"
              placeholder="请输入纬度"
            />
          </NFormItem>
        </NCol>
        <NCol :span="12">
          <NFormItem label="西南角经度">
            <NInput 
              v-model:value="southwestInput.lng" 
              type="text" 
              @blur="updateDisableRegion"
              placeholder="请输入经度"
            />
          </NFormItem>
        </NCol>
      </NRow>
    </NCard>
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

.map-controls {
  margin-bottom: 10px;
}

#map-container {
  width: 100%;
  height: 350px; /* 可以根据需要调整这个值 */
}

.bounds-info,
.disable-region {
  margin-top: 10px;
}

.bounds-info .n-input,
.disable-region .n-input {
  font-family: monospace;
}
</style>
