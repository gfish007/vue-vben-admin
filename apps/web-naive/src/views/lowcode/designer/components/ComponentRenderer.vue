<script setup lang="ts">
import { computed } from 'vue';
import { useLowCodeStore } from '#/store/modules/lowcode';
import type { ComponentRelation } from '#/types/lowcode';
import { baseComponents } from './registry';

const props = defineProps<{
  node: ComponentRelation;
  isPreview?: boolean;
}>();

const store = useLowCodeStore();

// 判断是否选中
const isSelected = computed(() => {
  return store.selectedComponentId === props.node.componentInstanceId;
});

// 获取组件定义
const componentDef = computed(() => {
  return baseComponents.find(comp => comp.componentCode === props.node.componentCode);
});

// 计算包装器样式
const wrapperStyle = computed(() => {
  const style = props.node.props?.style || {};
  return {
    width: style.width || '100%',
  };
});

// 处理组件点击
const handleClick = (event: MouseEvent) => {
  event.stopPropagation();
  store.setSelectedComponent(props.node.componentInstanceId);
};

// 处理删除按钮点击
const handleDelete = (event: MouseEvent) => {
  event.stopPropagation();
  store.removeComponent(props.node.componentInstanceId);
};
</script>

<template>
  <div
    class="component-wrapper"
    :class="{ 'is-selected': isSelected }"
    :style="wrapperStyle"
    @click="handleClick"
  >
    <component
      v-if="componentDef?.render"
      :is="componentDef.render"
      :node="node"
      :is-preview="isPreview"
    />
    <div v-if="isSelected" class="delete-button">
      <i class="i-carbon-close" @click="handleDelete" />
    </div>
  </div>
</template>

<style lang="less" scoped>
.component-wrapper {
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 4px;
  display: inline-block;
  vertical-align: top;
  box-sizing: border-box;

  &.is-selected {
    outline: 2px dashed #18a058;
    outline-offset: 2px;
    z-index: 1;
  }

  &:hover {
    &:not(.is-selected) {
      outline: 1px dashed #18a05880;
      outline-offset: 2px;
    }
  }
}

.delete-button {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 20px;
  height: 20px;
  background-color: #18a058;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  transition: all 0.2s ease;

  i {
    color: #fff;
    font-size: 14px;
  }

  &:hover {
    background-color: #2ba667;
    transform: scale(1.1);
  }
}
</style> 
