<script setup lang="ts">
import type { ComponentInstance } from '../../../../types/lowcode';

import type { CSSProperties } from 'vue';
import { computed, onMounted } from 'vue';

import { CloseCircle } from '@vicons/ionicons5';
import { NIcon } from 'naive-ui';

import { useLowCodeStore } from '../../../../store/modules/lowcode';
import * as componentRenders from './definitions';

const props = defineProps<{
  isPreview?: boolean;
  node: ComponentInstance;
}>();

const emit = defineEmits<{
  (e: 'delete', componentId: string): void;
}>();

const store = useLowCodeStore();

// 判断是否选中
const isSelected = computed(() => {
  return store.currentComponentId === props.node.componentInstanceId;
});

// 获取组件渲染器
const componentRender = computed(() => {
  const renderKey =
    `${props.node.componentCode}Render` as keyof typeof componentRenders;
  return componentRenders[renderKey];
});

// 计算包装器样式
const wrapperStyle = computed<CSSProperties>(() => {
  const style = props.node.style || {};
  const isContainer = props.node.componentCode === 'Container';

  return {
    boxSizing: 'border-box',
    display: style.display || 'block',
    height: style.height || (isContainer ? style.minHeight : 'auto'),
    margin: '0',
    maxHeight: style.maxHeight,
    maxWidth: style.maxWidth,
    minHeight: style.minHeight || '32px',
    minWidth: style.minWidth,
    padding: '1px',
    position:
      (style.position as 'absolute' | 'relative' | undefined) || 'relative',
    width: style.width || '100%',
  };
});

// 处理组件点击
const handleClick = (event: MouseEvent) => {
  event.stopPropagation();
  if (!props.isPreview) {
    store.setCurrentComponentId(props.node.componentInstanceId);
  }
};

// 组件挂载时自动选中
onMounted(() => {
  if (!props.isPreview) {
    store.setCurrentComponentId(props.node.componentInstanceId);
  }
});
</script>

<template>
  <div
    :class="[
      { 'is-selected': isSelected && !isPreview },
      { 'is-container': node.componentCode === 'Container' },
    ]"
    :style="wrapperStyle"
    class="component-wrapper"
    @click="handleClick"
  >
    <div class="component-inner">
      <component
        :is="componentRender"
        v-if="componentRender"
        v-bind="node.props"
        :is-preview="isPreview"
        :node="node"
        :style="{
          height: node.componentCode === 'Container' ? '100%' : 'auto',
        }"
      />
    </div>
    <div
      v-if="isSelected && !isPreview"
      class="delete-button"
      @click="
        (e) => {
          e.stopPropagation();
          emit('delete', props.node.componentInstanceId);
        }
      "
    >
      <NIcon :size="16">
        <CloseCircle />
      </NIcon>
    </div>
  </div>
</template>

<style lang="less" scoped>
.component-wrapper {
  box-sizing: border-box;
  transition: all 0.2s ease;

  &.is-selected {
    outline: 2px dashed #18a058;
    outline-offset: -1px;
  }

  &:hover {
    &:not(.is-selected):not(:has(.component-wrapper:hover)) {
      outline: 1px dashed #18a05880;
      outline-offset: -1px;
    }
  }

  &.is-container {
    display: flex;
    flex-direction: column;
  }
}

.component-inner {
  height: 100%;
  min-height: inherit;
  display: flex;
  flex-direction: column;

  :deep(.n-input) {
    height: 100%;
    min-height: 32px;
  }

  :deep(.n-select) {
    height: 100%;
    min-height: 32px;
  }

  :deep(.n-button) {
    height: 100%;
    min-height: 32px;
  }
}

.delete-button {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 16px;
  height: 16px;
  background-color: #18a058;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 9;
  transition: all 0.2s ease;
  color: #fff;

  &:hover {
    background-color: #2ba667;
    transform: scale(1.1);
  }
}
</style>
