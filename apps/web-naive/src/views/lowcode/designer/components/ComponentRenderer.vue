<script setup lang="ts" name="ComponentRenderer">
import type { ComponentInstance } from '../../../../types/lowcode';

import { computed, markRaw, ref, watchEffect } from 'vue';

import { CloseCircle } from '@vicons/ionicons5';
import { NIcon, useMessage } from 'naive-ui';
import { nanoid } from 'nanoid';

import { useLowCodeStore } from '../../../../store/modules/lowcode';
import components from './definitions';

defineOptions({
  name: 'ComponentRenderer',
});

const props = withDefaults(
  defineProps<{
    isPreview?: boolean;
    node: ComponentInstance;
  }>(),
  {
    isPreview: false,
  },
);

const emit = defineEmits<{
  (e: 'delete', componentId: string): void;
}>();

// 默认样式配置
const defaultStyle = {
  background: 'transparent',
  border: 'none',
  height: 'auto',
  margin: '0',
  padding: '0',
  width: '100%',
};

const store = useLowCodeStore();
const message = useMessage();

const isHovered = ref(false);

// 判断是否选中
const isSelected = computed(() => {
  return store.currentComponentId === props.node.componentInstanceId;
});

// 获取组件渲染器
const componentRender = computed(() => {
  const renderPath = `./${props.node.componentCode}Render.ts`;
  console.log('【ComponentRenderer】尝试获取渲染器:', {
    getRender结果: components.getRender(props.node.componentCode),
    可用渲染器列表: Object.keys(components.modules.renders),
    子组件列表: props.node.children?.map((child) => ({
      ID: child.componentInstanceId,
      类型: child.componentCode,
    })),
    渲染器模块: components.modules.renders[renderPath],
    渲染器路径: renderPath,
    组件ID: props.node.componentInstanceId,
    组件代码: props.node.componentCode,
  });
  const render = components.getRender(props.node.componentCode);
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
        const success = store.moveComponent(
          data.componentId,
          props.node.componentInstanceId,
        );
        if (success) {
          message.success('移动到容器成功');
        } else {
          message.error('移动组件失败');
        }
      }
    } catch {
      message.error('解析组件数据失败');
    }
  } else if (componentData) {
    // 处理新组件添加
    try {
      const component = JSON.parse(componentData);

      // 创建组件实例，确保包含所有必要的属性
      const componentInstance: ComponentInstance = {
        componentCode: component.componentCode,
        componentInstanceId: nanoid(),
        dataBinding: component.dataBinding
          ? structuredClone(component.dataBinding)
          : undefined,
        events: component.events
          ? structuredClone(component.events)
          : undefined,
        props: structuredClone(component.defaultProps || {}),
        style: structuredClone({ ...defaultStyle, ...component.defaultStyle }),
      };

      const success = store.addComponent(
        componentInstance,
        props.node.componentInstanceId,
      );

      if (success) {
        message.success('添加到容器成功');
      } else {
        message.error('添加组件失败');
      }
    } catch {
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

// Add watchEffect to track isPreview
watchEffect(() => {
  console.log('【ComponentRenderer】isPreview状态:', {
    isPreview: props.isPreview,
    组件ID: props.node?.componentInstanceId,
    组件类型: props.node?.componentCode,
  });
});
</script>

<script lang="ts">
export default {
  name: 'ComponentRenderer',
};
</script>

<template>
  <div
    :class="[
      { 'is-selected': isSelected && !props.isPreview },
      { 'is-container': props.node.componentCode === 'Container' },
    ]"
    :data-preview="props.isPreview"
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
        v-bind="{
          ...props.node.props,
          isPreview: props.isPreview,
          node: props.node,
        }"
      >
        <template v-if="props.node.componentCode === 'Container'">
          <div class="container-children">
            <component-renderer
              v-for="child in props.node.children || []"
              :key="child.componentInstanceId"
              :is-preview="props.isPreview"
              :node="child"
              @delete="$emit('delete', $event)"
            />
          </div>
        </template>
      </component>
    </div>
    <div
      v-show="(isSelected || isHovered) && !props.isPreview"
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

  &.is-selected:not([data-preview='true']) {
    outline: 2px dashed #18a058;
    outline-offset: -1px;
    z-index: 2;
  }

  &:not([data-preview='true']):hover {
    &:not(.is-selected):not(:has(.component-wrapper:hover)) {
      background-color: rgba(24, 160, 88, 0.02);
      z-index: 2;
      outline: 1px dashed #18a05880;
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

    &.drag-over:not([data-preview='true']) {
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
