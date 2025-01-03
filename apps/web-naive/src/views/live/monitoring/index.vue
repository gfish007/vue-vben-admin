<template>
  <div class="flex flex-col min-h-full bg-gray-50">
    <!-- 查询条件区域 -->
    <div class="sticky top-0 bg-white shadow-sm z-10">
      <div class="max-w-[1400px] mx-auto">
        <div class="flex items-center gap-3 px-4 py-2.5">
          <n-select
            v-model:value="queryParams.accountId"
            :options="accountOptions"
            placeholder="直播账号"
            clearable
            filterable
            :loading="accountLoading"
            class="w-[200px] [&_.n-base-selection]:!m-0 [&_.n-base-selection]:!py-0 [&_.n-base-selection]:h-7"
          />
          
          <n-select
            v-model:value="queryParams.nobodyFlag"
            :options="[
              { label: '全部', value: '' },
              { label: '是', value: 'Y' },
              { label: '否', value: 'N' }
            ]"
            placeholder="无人直播"
            class="w-[120px] [&_.n-base-selection]:!m-0 [&_.n-base-selection]:!py-0 [&_.n-base-selection]:h-7"
          />

          <div class="flex items-center gap-2">
            <n-button type="primary" 
                     @click="handleSearch" 
                     size="small"
                     class="!h-7 !leading-7">
              查询
            </n-button>
            <n-button @click="handleReset" 
                     size="small"
                     class="!h-7 !leading-7">
              重置
            </n-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/80 z-50">
      <n-spin size="large" />
    </div>

    <!-- 内容区域 - 减小上边距 -->
    <div class="flex-1">
      <div class="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5 mx-4 my-2">
        <div v-for="item in dataList" 
             :key="item.id" 
             class="w-full bg-white rounded-lg overflow-hidden relative shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
          
          <!-- 视频播放器容器 -->
          <div class="video-container">
            <video
              :id="`player-${item.id}`"
              class="video-js vjs-default-skin video-player"
              controls
              preload="auto"
              data-setup="{}"
            >
              <source
                v-if="item.liveVideoUrl"
                :src="item.liveVideoUrl"
                type="application/x-mpegURL"
              />
            </video>
            <div v-if="!item.liveVideoUrl" class="no-video">
              <n-empty description="暂无直播画面" />
            </div>
          </div>

          <!-- 状态标签 -->
          <div class="absolute top-2 left-2 z-10">
            <n-space align="center" :size="8">
              <n-tag v-if="item.nobodyFlag === 'Y'" type="error" size="small" round>
                无人直播
              </n-tag>
            </n-space>
          </div>

          <!-- 平台标签 -->
          <div class="absolute top-2 right-2 z-10 flex items-center gap-1 px-1.5 py-0.5 bg-white/90 rounded shadow-sm">
            <span class="text-[11px] font-medium text-[#ff4d4f]">抖音</span>
            <div class="w-[3px] h-[3px] rounded-full bg-[#ff4d4f]"></div>
          </div>

          <!-- 信息面板 -->
          <div class="p-3 relative">
            <!-- 账号名称和标签 -->
            <div class="flex items-center gap-2 mb-2">
              <div class="flex items-center gap-2 shrink-0">
                <!-- 账号标签 -->
                <div class="flex items-center px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded text-[11px] font-medium">
                  {{ item.liveAccountInfo?.accountName }}
                </div>
                <!-- 店铺标签 -->
                <!-- <div class="flex items-center px-1.5 py-0.5 bg-purple-50 text-purple-600 border border-purple-200 rounded text-[11px] font-medium">
                  {{ item.liveAccountInfo?.shopName }}
                </div> -->
              </div>
            </div>
            
            <!-- 信息内容 -->
            <div class="flex flex-col gap-1.5">
              <!-- 直播位置 -->
              <div class="flex items-center text-xs">
                <span class="text-gray-500 min-w-[60px] shrink-0">直播位置：</span>
                <span class="text-gray-700">{{ item.liveLocationInfo?.roomName || '-' }}</span>
              </div>
              
              <!-- 直播人员 -->
              <div class="flex items-start text-xs">
                <span class="text-gray-500 min-w-[60px] shrink-0 mt-1">直播人员：</span>
                <div class="flex-1">
                  <div class="grid grid-cols-2 gap-2">
                    <template v-if="item.schedulingMembers?.length">
                      <div v-for="member in item.schedulingMembers" 
                           :key="member.id" 
                           class="flex items-center gap-1.5 min-w-0 h-6">
                        <span class="text-gray-700 truncate max-w-[60px]">{{ member.memberName }}</span>
                        <span :class="[
                          'inline-flex items-center justify-center',
                          'px-1 py-0.5 text-[10px] rounded-full border whitespace-nowrap shrink-0',
                          member.role === 'ZB' ? 'bg-green-50 text-green-600 border-green-200' : 
                          member.role === 'CK' ? 'bg-red-50 text-red-600 border-red-200' : 
                          'bg-gray-50 text-gray-600 border-gray-200'
                        ]">
                          {{ getRoleLabel(member.role) }}
                        </span>
                      </div>
                    </template>
                    <span v-else class="text-gray-700">-</span>
                  </div>
                </div>
              </div>
              
              <!-- 开始时间 -->
              <div class="flex items-center text-xs">
                <span class="text-gray-500 min-w-[60px] shrink-0">开始时间：</span>
                <span class="text-gray-700">{{ formatDateTime(item.gmtStart) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="sticky bottom-0 left-0 right-0 bg-white shadow-md mt-auto">
      <div class="max-w-[1400px] mx-auto px-4">
        <div class="flex justify-end py-3">
          <n-pagination
            v-model:page="pagination.current"
            v-model:page-size="pagination.size"
            :item-count="total"
            :page-slot="5"
            show-size-picker
            :page-sizes="[12, 24, 36, 48]"
            @update:page="handlePageChange"
            @update:page-size="handleSizeChange"
          >
            <template #prefix>
              <span class="mr-4">共 {{ total }} 条</span>
            </template>
          </n-pagination>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 只保留必要的视频相关样式 */
.video-container {
  width: 100%;
  padding-top: 177.78%;
  position: relative;
  background-color: #000;
}

.video-player {
  position: absolute !important;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.no-video {
  @apply absolute inset-0 flex items-center justify-center bg-gray-100;
}

/* 视频播放器样式 */
:deep(.video-js) {
  @apply w-full h-full bg-black;
}

:deep(.vjs-tech) {
  @apply object-contain;
}

/* 分页样式 */
:deep(.n-pagination) {
  @apply flex items-center;
}
</style>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { 
  useMessage, 
  NPagination, 
  NSpin, 
  NTag, 
  NForm, 
  NFormItem, 
  NSelect, 
  NButton, 
  NSpace 
} from 'naive-ui';
import 'video.js/dist/video-js.css';
import videojs from 'video.js';
import Hls from 'hls.js';
import { queryLivingList } from '#/api/core/liveScheduling';
import { formatDateTime } from '#/utils/format';
import { queryLiveAccountList } from '#/api/core/liveAccount';

const message = useMessage();
const players = ref<any[]>([]);

// 分页参数
const pagination = ref({
  current: 1,
  size: 12,
});
const total = ref(0);
// 数据列表
const dataList = ref<any[]>([]);

// 添加加载状态
const loading = ref(false);

// 查询参数
const queryParams = ref({
  accountId: null,
  nobodyFlag: null,
});

// 直播账号选项
const accountOptions = ref([]);

// 添加账号加载状态
const accountLoading = ref(false);

// 修改获取直播账号列表方法
async function loadAccountOptions() {
  accountLoading.value = true;
  try {
    const { records } = await queryLiveAccountList({
      pageNo: 1,
      pageSize: 99999,
      queryBody: {}
    });
    
    accountOptions.value = records.map(item => ({
      label: item.accountName,
      value: item.id
    }));
  } catch (error) {
    console.error('获取直播账号列表失败:', error);
    message.error('获取直播账号列表失败');
  } finally {
    accountLoading.value = false;
  }
}

// 添加重试初始化播放器的函数
function initializePlayerWithRetry(id: string | number, url: string, retryCount = 3, delay = 200) {
  const tryInitialize = (attempt: number) => {
    const player = initializePlayer(id, url);
    if (!player && attempt < retryCount) {
      // 如果初始化失败且还有重试次数，则延迟后重试
      setTimeout(() => {
        tryInitialize(attempt + 1);
      }, delay);
    }
  };

  tryInitialize(0);
}

// 修改初始化播放器函数
function initializePlayer(id: string | number, url: string) {
  // 添加元素存在性检查
  const videoElement = document.getElementById(`player-${id}`);
  if (!videoElement) {
    console.warn(`播放器元素 player-${id} 不存在，url: ${url}`);
    return null;
  }

  // 检查是否已经初始化过
  try {
    const existingPlayer = videojs.getPlayer(`player-${id}`);
    if (existingPlayer) {
      existingPlayer.dispose();
    }
  } catch (e) {
    // 忽略错误
  }

  if (Hls.isSupported()) {
    const hls = new Hls({
      debug: false,
      enableWorker: true,
      lowLatencyMode: true,
      startLevel: -1,
      autoStartLoad: true,
      defaultAudioCodec: 'mp4a.40.2'
    });
    
    hls.loadSource(url);
    hls.attachMedia(videoElement as HTMLVideoElement);
    
    hls.on(Hls.Events.MANIFEST_LOADED, () => {
      // 设置静音后再尝试播放
      videoElement.muted = true;
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('自动播放失败，等待用户交互:', err);
          // 添加点击播放的处理
          videoElement.addEventListener('click', () => {
            videoElement.play().catch(e => 
              console.error('播放失败:', e)
            );
          });
        });
      }
    });

    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        console.error('HLS 错误:', data);
        message.error('视频加载失败');
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            // 尝试恢复网络错误
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            // 尝试恢复媒体错误
            hls.recoverMediaError();
            break;
          default:
            // 无法恢复的错误
            hls.destroy();
            break;
        }
      }
    });
  } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
    videoElement.src = url;
    videoElement.addEventListener('loadedmetadata', () => {
      videoElement.muted = true;
      videoElement.play().catch(err => {
        console.warn('Safari 自动播放失败:', err);
        // 添加点击播放的处理
        videoElement.addEventListener('click', () => {
          videoElement.play().catch(e => 
            console.error('播放失败:', e)
          );
        });
      });
    });
  }

  // 使用 try-catch 包裹 videojs 初始化
  try {
    const player = videojs(`player-${id}`, {
      controls: true,
      fluid: true,
      autoplay: 'muted',
      muted: true,
      preload: 'auto',
      html5: {
        vhs: {
          overrideNative: !Hls.isSupported()
        },
        nativeAudioTracks: false,
        nativeVideoTracks: false
      }
    });

    player.on('error', (error) => {
      console.error('播放器错误:', error);
      message.error('视频加载失败');
    });

    players.value.push(player);
    return player;
  } catch (error) {
    console.error(`初始化播放器 player-${id} 失败:`, error);
    return null;
  }
}

// 修改清理函数
function cleanupPlayers() {
  // 先清理 videojs 实例
  players.value.forEach(player => {
    if (player && typeof player.dispose === 'function') {
      try {
        const videoElement = player.el()?.querySelector('video');
        if (videoElement) {
          videoElement.pause();
          videoElement.src = '';
          videoElement.load();
        }
        player.dispose();
      } catch (err) {
        console.error('清理播放器失败:', err);
      }
    }
  });
  
  // 清空数组
  players.value = [];

  // 清理所有可能的残留实例
  document.querySelectorAll('.video-js').forEach(el => {
    const id = el.id;
    try {
      const player = videojs.getPlayer(id);
      if (player) {
        player.dispose();
      }
    } catch (e) {
      // 忽略错误
    }
  });

  // 移除所有相关的 DOM 元素
  document.querySelectorAll('.vjs-tech').forEach(el => {
    el.remove();
  });
}

// 在组件卸载和数据加载时使用新的清理函数
onBeforeUnmount(() => {
  cleanupPlayers();
});

// 查询方法
async function handleSearch() {
  pagination.value.current = 1; // 重置页码
  await loadDataList();
}

// 重置方法
function handleReset() {
  queryParams.value = {
    accountId: null,
    nobodyFlag: '',
  };
  handleSearch();
}

// 修改数据加载方法
async function loadDataList() {
  loading.value = true;
  try {
    const { records, total: totalCount } = await queryLivingList({
      pageNo: pagination.value.current,
      pageSize: pagination.value.size,
      queryBody: {
        accountId: queryParams.value.accountId,
        nobodyFlag: queryParams.value.nobodyFlag || undefined,
      },
    });
    
    // 先清理旧的播放器
    cleanupPlayers();
    
    // 先设置为空数组，触发视图完全更新
    dataList.value = [];
    
    // 等待 DOM 更新完成
    await nextTick();
    
    // 更新数据
    dataList.value = records;
    total.value = totalCount;
    
    // 再次等待 DOM 更新
    await nextTick();
    
    // 使用 Promise 处理播放器初始化
    const initializePlayers = () => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          records.forEach(item => {
            if (item.liveVideoUrl) {
              initializePlayerWithRetry(item.id, item.liveVideoUrl);
            }
          });
          resolve();
        }, 300); // 给予足够的时间让 DOM 完全渲染
      });
    };

    await initializePlayers();

  } catch (error) {
    console.error('加载数据失败:', error);
    message.error('获取直播列表失败');
  } finally {
    loading.value = false;
  }
}

// 分页处理
function handlePageChange(page: number) {
  pagination.value.current = page;
  loadDataList();
}

function handleSizeChange(size: number) {
  pagination.value.size = size;
  pagination.value.current = 1;
  loadDataList();
}

onMounted(() => {
  loadAccountOptions();
  loadDataList();
});

// 添加数字格式化函数
function formatNumber(num: number | undefined): string {
  if (!num) return '0';
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  }
  return num.toLocaleString();
}

// 角色标签文本映射
function getRoleLabel(role: string): string {
  const labelMap: Record<string, string> = {
    'ZB': '播',
    'CK': '控',
  };
  return labelMap[role] || '未知';
}
</script>
 