<template>
  <div class="video-player">
    <video
      ref="videoRef"
      :src="props.src"
      :width="props.width"
      :height="props.height"
      :controls="props.controls"
      :autoplay="props.autoplay"
      :muted="props.muted"
      :loop="props.loop"
      :poster="props.poster"
      @play="handlePlay"
      @pause="handlePause"
      @ended="handleEnded"
      @error="handleError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = withDefaults(defineProps<{
  src: string;
  width?: number | string;
  height?: number | string;
  controls?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  poster?: string;
}>(), {
  width: '100%',
  height: 'auto',
  controls: true,
  autoplay: false,
  muted: false,
  loop: false,
  poster: '',
});

const emit = defineEmits<{
  (e: 'play'): void;
  (e: 'pause'): void;
  (e: 'ended'): void;
  (e: 'error', error: Event): void;
}>();

const videoRef = ref<HTMLVideoElement | null>(null);

function handlePlay() {
  emit('play');
}

function handlePause() {
  emit('pause');
}

function handleEnded() {
  emit('ended');
}

function handleError(e: Event) {
  emit('error', e);
}

onMounted(() => {
  // 可以在这里添加其他初始化逻辑
});

onBeforeUnmount(() => {
  if (videoRef.value) {
    videoRef.value.pause();
  }
});

// 暴露一些方法供父组件调用
defineExpose({
  play: () => videoRef.value?.play(),
  pause: () => videoRef.value?.pause(),
  stop: () => {
    if (videoRef.value) {
      videoRef.value.pause();
      videoRef.value.currentTime = 0;
    }
  },
});
</script>

<style scoped>
.video-player {
  width: 100%;
  position: relative;
}

video {
  max-width: 100%;
  display: block;
}
</style> 
