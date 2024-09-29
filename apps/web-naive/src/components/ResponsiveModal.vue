<script setup lang="ts">
import { computed } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useWindowSize } from '@vueuse/core';

const props = defineProps<{
  showFooter?: boolean;
  title: string;
  width?: number | string;
}>();

const { width } = useWindowSize();
const isMobile = computed(() => width.value < 640);

const modalWidth = computed(() => {
  if (isMobile.value) {
    return '100%';
  }
  return props.width || '50%';
});

const [Modal, modalApi] = useVbenModal({
  draggable: !isMobile.value,
  footer: props.showFooter,
  title: props.title,
  width: modalWidth,
});

// 暴露 modalApi 给父组件使用
defineExpose({ modalApi });
</script>

<template>
  <Modal>
    <slot></slot>
    <template v-if="showFooter" #footer>
      <slot name="footer"></slot>
    </template>
  </Modal>
</template>
