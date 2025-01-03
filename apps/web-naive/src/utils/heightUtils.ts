import { ref, computed } from 'vue';

export function useDynamicHeight(queryCardRef: any) {
  const queryCardHeight = ref(0);
  const tableHeight = computed(() => {
    const minHeight = 300;
    const windowHeight = window.innerHeight;
    const otherHeight = 300; // 预估其他元素高度（头部、页脚等）
    const height = windowHeight - queryCardHeight.value - otherHeight;
    return Math.max(height, minHeight);
  });

  return {
    queryCardHeight,
    tableHeight,
  };
}
