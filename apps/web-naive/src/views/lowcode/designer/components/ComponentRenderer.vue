<script setup lang="ts">
import type { ComponentInstance } from '../../../../types/lowcode';

import { computed, markRaw, ref } from 'vue';

import { CloseCircle } from '@vicons/ionicons5';
import { NIcon, useMessage } from 'naive-ui';
import { nanoid } from 'nanoid';

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
const message = useMessage();

const isHovered = ref(false);

// 判断是否选中
const isSelected = computed(() => {
  return store.currentComponentId === props.node.componentInstanceId;
});

// 获取组件渲染器
const componentRender = computed(() => {
  const renderKey =
    `${props.node.componentCode}Render` as keyof typeof componentRenders;
  const render = componentRenders[renderKey];
  return render ? markRaw(render) : null;
});

// 计算包装器样式 - 只包含布局相关的基础样式
const wrapperStyle = computed(() => {
  const style = props.node.style || {};
  // 只保留布局相关的基础样式
  const baseStyle: Record<string, number | string> = {
    boxSizing: 'border-box',
    display: style.display || 'block',
    height: style.height || 'auto',
    // margin: style.margin || '0',
    maxHeight: style.maxHeight,
    maxWidth: style.maxWidth,
    minHeight: style.minHeight || '32px',
    minWidth: style.minWidth,
    position: style.position || 'relative',
    width: style.width || '100%',
  };

  // 只合并布局相关的样式
  const layoutStyles = {
    ...baseStyle,
    alignItems: style.alignItems,
    display: style.display,
    flexDirection: style.flexDirection,
    flexWrap: style.flexWrap,
    gap: style.gap,
    justifyContent: style.justifyContent,
  };

  // 过滤掉 undefined 的值
  return Object.fromEntries(
    Object.entries(layoutStyles).filter(([_, value]) => value !== undefined),
  );
});

// 处理组件点击
const handleClick = (event: MouseEvent) => {
  // 阻止事件冒泡，避免触发父组件的点击事件
  event.stopPropagation();

  // 如果是预览模式，不处理点击事件
  if (props.isPreview) return;

  // 设置当前选中的组件
  store.setCurrentComponentId(props.node.componentInstanceId);
};

// 处理拖拽开始
const handleDragStart = (event: DragEvent) => {
  event.stopPropagation();
  if (props.isPreview) return;

  const data = {
    componentId: props.node.componentInstanceId,
    type: 'move',
  };
  console.log('开始拖拽组件:', data);
  event.dataTransfer?.setData('component-drag', JSON.stringify(data));
};

// 处理拖拽进入
const handleDragEnter = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  if (props.isPreview) return;

  // 只有容器组件才显示拖拽效果
  const el = event.currentTarget as HTMLElement;
  if (props.node.componentCode === 'Container') {
    console.log('拖拽进入容器:', props.node.componentInstanceId);
    el.classList.add('drag-over');
  }
};

// 处理拖拽离开
const handleDragLeave = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  if (props.isPreview) return;

  const target = event.currentTarget as HTMLElement;
  const relatedTarget = event.relatedTarget as HTMLElement;

  // 只有当真正离开容器区域时才移除效果
  if (!target.contains(relatedTarget)) {
    console.log('拖拽离开容器:', props.node.componentInstanceId);
    target.classList.remove('drag-over');
  }
};

// 处理拖拽放置
const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  if (props.isPreview) return;

  const el = event.currentTarget as HTMLElement;
  el.classList.remove('drag-over');

  // 只有容器组件才能接收拖拽
  if (props.node.componentCode !== 'Container') return;

  const dragData = event.dataTransfer?.getData('component-drag');
  const componentData = event.dataTransfer?.getData('component');

  if (dragData) {
    // 处理组件移动
    try {
      const data = JSON.parse(dragData);
      if (data.type === 'move') {
        console.log('正在移动组件:', data);
        const success = store.moveComponent(
          data.componentId,
          props.node.componentInstanceId,
        );
        if (success) {
          console.log(
            '移动组件成功，目标容器:',
            props.node.componentInstanceId,
          );
          message.success('移动到容器成功');
        } else {
          console.warn('移动组件失败');
          message.error('移动组件失败');
        }
      }
    } catch (error) {
      console.error('解析拖拽数据失败:', error);
      message.error('解析组件数据失败');
    }
  } else if (componentData) {
    // 处理新组件添加
    try {
      console.log('正在解析组件数据:', componentData);
      const component = JSON.parse(componentData);
      console.log('组件定义:', component);

      // 创建组件实例，确保包含默认样式
      const componentInstance: ComponentInstance = {
        componentCode: component.componentCode,
        componentInstanceId: nanoid(),
        componentName: component.componentName,
        propertyPanel: component.propertyPanel,
        props: { ...component.defaultProps },
        propsSchema: component.propsSchema,
        style: { ...component.defaultStyle }, // 确保应用默认样式
      };

      console.log('创建的组件实例:', {
        code: componentInstance.componentCode,
        defaultProps: component.defaultProps,
        defaultStyle: component.defaultStyle,
        finalStyle: componentInstance.style,
        id: componentInstance.componentInstanceId,
      });

      // 添加到容器中
      const success = store.addComponent(
        componentInstance,
        props.node.componentInstanceId,
      );

      if (success) {
        console.log('添加组件成功:', {
          componentId: componentInstance.componentInstanceId,
          parentId: props.node.componentInstanceId,
          style: componentInstance.style,
        });
        message.success('添加到容器成功');
      } else {
        console.warn('添加组件失败');
        message.error('添加组件失败');
      }
    } catch (error) {
      console.error('解析组件数据失败:', error);
      message.error('解析组件数据失败');
    }
  }
};

// 处理鼠标进入
const handleMouseEnter = () => {
  if (!props.isPreview) {
    isHovered.value = true;
  }
};

// 处理鼠标离开
const handleMouseLeave = () => {
  isHovered.value = false;
};
</script>

<template>
  <div
    :class="[
      { 'is-selected': isSelected && !isPreview },
      { 'is-container': node.componentCode === 'Container' },
    ]"
    :style="wrapperStyle"
    class="component-wrapper"
    draggable="true"
    @click.stop="handleClick"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @dragover.prevent
    @dragstart="handleDragStart"
    @drop="handleDrop"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="component-inner">
      <component
        :is="componentRender"
        v-if="componentRender"
        v-bind="node.props"
        :is-preview="isPreview"
        :node="node"
      >
        <template v-if="node.componentCode === 'Container'">
          <div class="container-children">
            <component-renderer
              v-for="child in node.children || []"
              :key="child.componentInstanceId"
              :is-preview="isPreview"
              :node="child"
              @delete="$emit('delete', $event)"
            />
          </div>
        </template>
      </component>
    </div>
    <div
      v-show="(isSelected || isHovered) && !isPreview"
      class="delete-button"
      @click.stop="emit('delete', props.node.componentInstanceId)"
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
  position: relative;
  width: 100%;
  z-index: 1;

  &.is-selected {
    outline: 2px dashed #18a058;
    outline-offset: -1px;
    z-index: 2;
  }

  &:hover {
    &:not(.is-selected):not(:has(.component-wrapper:hover)) {
      outline: 1px dashed #18a05880;
      outline-offset: -1px;
      z-index: 2;
    }

    > .delete-button {
      opacity: 1;
      visibility: visible;
    }
  }

  &.is-container {
    display: flex;
    flex-direction: column;
    min-height: 120px;

    &.drag-over {
      background-color: rgba(24, 160, 88, 0.05);
      outline: 2px dashed #18a058;
      outline-offset: -1px;
    }
  }
}

.component-inner {
  height: 100%;
  min-height: inherit;
  display: flex;
  width: 100%;
  position: relative;
}

.container-children {
  display: inherit;
  flex-direction: inherit;
  flex-wrap: inherit;
  gap: inherit;
  justify-content: inherit;
  align-items: inherit;
  width: 100%;
  height: 100%;
  flex: 1;
  position: relative;
  z-index: 1;

  .component-wrapper {
    position: relative;
    z-index: 1;

    &:hover,
    &.is-selected {
      z-index: 2;
    }
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
  opacity: 0;
  visibility: hidden;

  &:hover {
    background-color: #2ba667;
    transform: scale(1.1);
  }
}
</style>
