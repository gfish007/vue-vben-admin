<script setup lang="ts">
import { computed } from 'vue';

import { useWindowSize } from '@vueuse/core';

// 使用 640px 作为移动设备的断点

defineProps<{
  desktopSlot: string;
  mobileSlot: string;
}>();
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 640);
</script>

<template>
  <component :is="isMobile ? mobileSlot : desktopSlot">
    <slot :is-mobile="isMobile"></slot>
  </component>
</template>
