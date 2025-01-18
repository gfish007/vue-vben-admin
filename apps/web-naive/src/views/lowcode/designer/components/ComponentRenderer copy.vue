<script setup lang="ts">
import type { ComponentInstance } from '../../../../types/lowcode';

import { computed, markRaw, ref } from 'vue';

import { CloseCircle } from '@vicons/ionicons5';
import { NButton, NIcon, useMessage } from 'naive-ui';
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
  const renderKey =
    `${props.node.componentCode}Render` as keyof typeof componentRenders;
  const render = componentRenders[renderKey];

  console.log('【组件渲染器】获取渲染器:', {
    是否找到渲染器: !!render,
    是否预览模式: props.isPreview,
    渲染器Key: renderKey,
    组件ID: props.node.componentInstanceId,
    组件代码: props.node.componentCode,
    组件属性: props.node.props,
    组件数据绑定: props.node.dataBinding,
    组件样式: props.node.style,
  });

  if (!render) {
    console.warn(
      `【组件渲染器】未找到组件 ${props.node.componentCode} 的渲染器`,
    );
    return null;
  }

  return markRaw(render);
});

// 计算包装器样式
const wrapperStyle = computed(() => {
  console.log('【组件样式】计算样式:', {
    原始样式: props.node.style,
    组件ID: props.node.componentInstanceId,
  });

  const style = props.node.style || {};
  const baseStyle: Record<string, number | string> = {
    boxSizing: 'border-box',
    display: style.display || 'block',
    height: style.height || 'auto',
    maxHeight: style.maxHeight,
    maxWidth: style.maxWidth,
    minHeight: style.minHeight || '32px',
    minWidth: style.minWidth,
    position: style.position || 'relative',
    width: style.width || '100%',
  };

  const layoutStyles = {
    ...baseStyle,
    alignItems: style.alignItems,
    display: style.display,
    flexDirection: style.flexDirection,
    flexWrap: style.flexWrap,
    gap: style.gap,
    justifyContent: style.justifyContent,
  };

  return Object.fromEntries(
    Object.entries(layoutStyles).filter(([_, value]) => value !== undefined),
  );
});

// 处理组件点击
const handleClick = (event: MouseEvent) => {
  console.log('【组件点击】处理点击事件:', {
    当前选中组件: store.currentComponentId,
    是否预览: props.isPreview,
    组件ID: props.node.componentInstanceId,
  });

  event.stopPropagation();
  if (props.isPreview) return;
  store.setCurrentComponentId(props.node.componentInstanceId);
};

// 处理删除
const handleDelete = (event: MouseEvent) => {
  console.log('【组件删除】处理删除事件:', {
    组件ID: props.node.componentInstanceId,
  });

  event.stopPropagation();
  emit('delete', props.node.componentInstanceId);
};

// 处理拖拽开始
const handleDragStart = (event: DragEvent) => {
  console.log('【组件拖拽】开始拖拽:', {
    是否预览: props.isPreview,
    组件ID: props.node.componentInstanceId,
    组件类型: props.node.componentCode,
  });

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
  console.log('【组件拖拽】进入目标区域:', {
    是否容器: props.node.componentCode === 'Container',
    组件ID: props.node.componentInstanceId,
    组件类型: props.node.componentCode,
  });

  event.preventDefault();
  event.stopPropagation();
  if (props.isPreview) return;

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

  if (!target.contains(relatedTarget)) {
    target.classList.remove('drag-over');
  }
};

// 处理拖拽悬停
const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
};

// 处理拖拽放置
const handleDrop = (event: DragEvent) => {
  console.log('【组件拖拽】放置组件:', {
    是否预览: props.isPreview,
    目标组件ID: props.node.componentInstanceId,
    目标组件类型: props.node.componentCode,
  });

  event.preventDefault();
  event.stopPropagation();
  if (props.isPreview) return;

  const el = event.currentTarget as HTMLElement;
  el.classList.remove('drag-over');

  if (props.node.componentCode !== 'Container') {
    console.log('【组件拖拽】目标不是容器，忽略放置操作');
    return;
  }

  const dragData = event.dataTransfer?.getData('component-drag');
  const componentData = event.dataTransfer?.getData('component');

  console.log('【组件拖拽】解析拖拽数据:', {
    新组件数据: componentData,
    移动数据: dragData,
  });

  if (dragData) {
    try {
      const data = JSON.parse(dragData);
      console.log('【组件拖拽】处理组件移动:', data);

      if (data.type === 'move') {
        const success = store.moveComponent(
          data.componentId,
          props.node.componentInstanceId,
        );
        console.log('【组件拖拽】移动结果:', {
          成功: success,
          源组件: data.componentId,
          目标容器: props.node.componentInstanceId,
        });

        if (success) {
          message.success('移动到容器成功');
        } else {
          message.error('移动组件失败');
        }
      }
    } catch (error) {
      console.error('【组件拖拽】解析移动数据失败:', error);
      message.error('解析组件数据失败');
    }
  } else if (componentData) {
    try {
      const component = JSON.parse(componentData);
      console.log('【组件拖拽】新组件数据:', component);

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

      console.log('【组件拖拽】创建组件实例:', {
        数据绑定: componentInstance.dataBinding,
        组件ID: componentInstance.componentInstanceId,
        组件代码: componentInstance.componentCode,
        组件属性: componentInstance.props,
        组件样式: componentInstance.style,
      });

      const success = store.addComponent(
        componentInstance,
        props.node.componentInstanceId,
      );

      console.log('【组件拖拽】添加结果:', {
        成功: success,
        父容器ID: props.node.componentInstanceId,
        组件ID: componentInstance.componentInstanceId,
      });

      if (success) {
        message.success('添加到容器成功');
      } else {
        message.error('添加组件失败');
      }
    } catch (error) {
      console.error('【组件拖拽】解析组件数据失败:', error);
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
      { 'is-selected': isSelected && !props.isPreview },
      { 'is-hovered': isHovered && !props.isPreview },
    ]"
    :style="wrapperStyle"
    class="component-wrapper"
    draggable="true"
    @click="handleClick"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @dragover="handleDragOver"
    @dragstart="handleDragStart"
    @drop="handleDrop"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 渲染实际组件 -->
    <component
      :is="componentRender"
      v-if="componentRender"
      :is-preview="props.isPreview"
      :node="props.node"
    />

    <!-- 操作按钮 -->
    <div v-if="!props.isPreview" class="component-actions">
      <NButton
        circle
        class="delete-btn"
        size="tiny"
        type="error"
        @click="handleDelete"
      >
        <template #icon>
          <NIcon>
            <CloseCircle />
          </NIcon>
        </template>
      </NButton>
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

.component-actions {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 9;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;

  .component-wrapper:hover > & {
    opacity: 1;
    visibility: visible;
  }
}

.delete-btn {
  width: 16px;
  height: 16px;
  padding: 2px;

  &:hover {
    transform: scale(1.1);
  }
}
</style>
