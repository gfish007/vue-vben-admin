<script setup lang="ts" name="DesignCanvas">
import type { ComponentInstance } from '../../../../types/lowcode';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  EyeOutline,
  ReloadOutline,
  ReturnUpBackOutline,
  SaveOutline,
  ServerOutline,
} from '@vicons/ionicons5';
import {
  NButton,
  NIcon,
  NSelect,
  NSpace,
  useDialog,
  useMessage,
} from 'naive-ui';
import { nanoid } from 'nanoid';

import { useLowCodeStore } from '../../../../store/modules/lowcode';
import ComponentRenderer from './ComponentRenderer.vue';
import * as componentRenders from './definitions';

// 初始化 store
const store = useLowCodeStore();
const message = useMessage();
const isDragOver = ref(false);
const dragPosition = ref({ x: 0, y: 0 });
const activeDevice = ref<string>('iphone-se');

// 设备配置
const devices = [
  {
    height: 667,
    id: 'iphone-se',
    name: 'iPhone SE',
    scale: 0.75,
    width: 375,
  },
  {
    height: 844,
    id: 'iphone-12',
    name: 'iPhone 12',
    scale: 0.75,
    width: 390,
  },
  {
    height: 926,
    id: 'iphone-12-pro-max',
    name: 'iPhone 12 Pro Max',
    scale: 0.75,
    width: 428,
  },
] as const;

// 设备选项
const deviceOptions = devices.map((device) => ({
  label: device.name,
  value: device.id,
}));

// 获取当前设备
const currentDevice = computed(() => {
  return devices.find((d) => d.id === activeDevice.value) || devices[0];
});

// 计算设备样式
const deviceStyle = computed(() => {
  const device = currentDevice.value;
  return {
    height: `${device.height * device.scale}px`,
    width: `${device.width * device.scale}px`,
  };
});

// 处理拖拽
const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  event.dataTransfer!.dropEffect = 'copy';
  isDragOver.value = true;

  // 更新拖拽位置
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  dragPosition.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
};

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault();
  const target = event.currentTarget as HTMLElement;
  const relatedTarget = event.relatedTarget as HTMLElement;
  // 只有当真正离开画布区域时才重置状态
  if (!target.contains(relatedTarget)) {
    isDragOver.value = false;
  }
};

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = true;
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;

  const dragData = event.dataTransfer?.getData('component-drag');
  const componentData = event.dataTransfer?.getData('component');

  if (dragData) {
    // 处理组件移动
    try {
      const data = JSON.parse(dragData);
      if (data.type === 'move') {
        store.moveComponent(data.componentId, 'root');
      }
    } catch (error) {
      console.error('Failed to parse drag data:', error);
    }
    return;
  }

  if (!componentData) {
    message.error('无效的组件数据');
    return;
  }

  try {
    const component = JSON.parse(componentData);

    if (!component.componentCode || !component.componentName) {
      message.error('组件数据不完整');
      return;
    }

    // 根据组件类型设置默认属性
    const defaultProps = { ...component.defaultProps };

    // 设置默认样式
    const defaultStyle: Record<string, string> = {
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: '1px',
      margin: '0',
      minHeight: '32px',
      padding: '0',
      width: '100%',
    };

    // 根据组件类型设置特定样式
    if (component.componentCode === 'Container') {
      defaultStyle.minHeight = '120px';
      defaultStyle.padding = '8px';
    }

    // 合并自定义样式，确保外部传入的样式优先级更高
    const mergedStyle = component.defaultStyle
      ? { ...defaultStyle, ...component.defaultStyle }
      : defaultStyle;

    const componentInstance: ComponentInstance = {
      componentCode: component.componentCode,
      componentInstanceId: nanoid(),
      componentName: component.componentName,
      propertyPanel: component.propertyPanel,
      props: defaultProps,
      propsSchema: component.propsSchema,
      style: mergedStyle,
    };

    // 使用 store 添加组件
    store.addComponent(componentInstance);
    message.success('添加组件成功');
  } catch (error) {
    message.error(
      `添加组件失败: ${error instanceof Error ? error.message : '未知错误'}`,
    );
  }
};

// 获取组件的渲染函数
const getComponentRender = (componentCode: string) => {
  // 根据组件代码获取对应的渲染函数
  const renderKey = `${componentCode}Render` as keyof typeof componentRenders;
  return componentRenders[renderKey] || null;
};

// 组件操作
const handleComponentClick = (component: ComponentInstance) => {
  // 设置当前选中的组件
  store.setCurrentComponentId(component.componentInstanceId);
};

// 使用 store 中的组件列表
const storeComponents = computed(() => store.components);

// 删除组件时也使用 store
const deleteComponent = (componentInstanceId: string) => {
  store.removeComponent(componentInstanceId);
  message.success('删除组件成功');
};

// 处理组件属性更新
const handlePropUpdate = (
  component: ComponentInstance,
  field: string,
  value: unknown,
) => {
  store.updateComponent(component.componentInstanceId, {
    props: {
      ...component.props,
      [field]: value,
    },
  });
};

// Add router instance
const router = useRouter();

// Add dialog instance
const dialog = useDialog();

// Update the data source button click handler
const handleDataSourceClick = () => {
  dialog.warning({
    content: '是否要跳转到数据源管理页面？当前页面的未保存内容可能会丢失。',
    negativeText: '取消',
    onPositiveClick: () => {
      router.push('/lowcode/datasource');
    },
    positiveText: '确定',
    title: '提示',
  });
};
</script>

<template>
  <div class="design-canvas">
    <div class="canvas-header">
      <NSelect
        :options="deviceOptions"
        :value="activeDevice"
        size="small"
        @update:value="(val) => (activeDevice = val)"
      />
      <NSpace>
        <NButton circle quaternary size="small" title="重置" type="default">
          <NIcon><ReloadOutline /></NIcon>
        </NButton>
        <NButton circle quaternary size="small" title="撤销" type="default">
          <NIcon><ReturnUpBackOutline /></NIcon>
        </NButton>
        <NButton circle quaternary size="small" title="保存" type="primary">
          <NIcon><SaveOutline /></NIcon>
        </NButton>
        <NButton circle quaternary size="small" title="预览" type="info">
          <NIcon><EyeOutline /></NIcon>
        </NButton>
        <NButton
          circle
          quaternary
          size="small"
          title="数据源"
          type="warning"
          @click="handleDataSourceClick"
        >
          <NIcon><ServerOutline /></NIcon>
        </NButton>
      </NSpace>
    </div>
    <div :style="deviceStyle" class="canvas-body">
      <div
        :class="[{ 'drag-over': isDragOver && storeComponents.length === 0 }]"
        class="canvas-content"
        @dragenter="handleDragEnter"
        @dragleave="handleDragLeave"
        @dragover="handleDragOver"
        @drop="handleDrop"
      >
        <ComponentRenderer
          v-for="component in storeComponents"
          :key="component.componentInstanceId"
          :is-preview="false"
          :node="component"
          @delete="deleteComponent"
        />
        <div v-if="storeComponents.length === 0" class="empty-tip">
          <div class="tip-icon"></div>
          <span>从左侧拖入组件开始设计</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.design-canvas {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.canvas-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  z-index: 1;
  flex-shrink: 0;

  :deep(.n-select) {
    width: 160px;
  }

  :deep(.n-button) {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }
}

.canvas-body {
  flex: 1;
  margin: 24px auto;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  overflow: auto;
  position: relative;
  transition: all 0.3s ease;
  min-height: 0;

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

.canvas-content {
  padding: 1px;
  min-height: 100%;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1px;

  &.drag-over {
    background-color: rgba(24, 160, 88, 0.05);
    outline: 2px dashed #18a058;
    outline-offset: -1px;
  }
}

.empty-tip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #999;
  font-size: 14px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);

  .tip-icon {
    width: 48px;
    height: 48px;
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23999"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" /></svg>')
      center/contain no-repeat;
    opacity: 0.5;
    transition: all 0.3s ease;
  }

  .drag-over & {
    transform: translate(-50%, -50%) scale(1.1);
    color: #18a058;
    background-color: rgba(24, 160, 88, 0.1);

    .tip-icon {
      opacity: 1;
      transform: rotate(180deg);
    }
  }
}
</style>
