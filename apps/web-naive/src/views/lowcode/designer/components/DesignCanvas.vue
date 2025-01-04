<script setup lang="ts">
import { ref, computed } from 'vue';
import { NSelect } from 'naive-ui';
import { useLowCodeStore } from '#/store/modules/lowcode';
import ComponentRenderer from './ComponentRenderer.vue';
import { baseComponents } from './registry';
import type { Component } from '#/types/lowcode';

interface Device {
  id: string;
  name: string;
  width: number;
  height: number;
  scale: number;
}

const store = useLowCodeStore();
const isDragOver = ref(false);
const activeDevice = ref<string>('iphone-se');

// 设备配置
const devices = [
  {
    id: 'iphone-se',
    name: 'iPhone SE',
    width: 375,
    height: 667,
    scale: 0.75,
  },
  {
    id: 'iphone-12',
    name: 'iPhone 12',
    width: 390,
    height: 844,
    scale: 0.75,
  },
  {
    id: 'iphone-12-pro-max',
    name: 'iPhone 12 Pro Max',
    width: 428,
    height: 926,
    scale: 0.75,
  },
] as const;

// 设备选项
const deviceOptions = devices.map(device => ({
  label: device.name,
  value: device.id,
}));

// 获取当前设备
const currentDevice = computed(() => {
  return devices.find(d => d.id === activeDevice.value) || devices[0];
});

// 计算设备样式
const deviceStyle = computed(() => {
  const device = currentDevice.value;
  return {
    width: `${device.width * device.scale}px`,
    height: `${device.height * device.scale}px`,
  };
});

// 处理拖拽进入
const handleDragEnter = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = true;
};

// 处理拖拽离开
const handleDragLeave = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;
};

// 处理拖拽悬停
const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy';
  }
};

// 处理放置
const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;

  if (!event.dataTransfer) return;

  try {
    const componentData = JSON.parse(event.dataTransfer.getData('componentInstance'));
    console.log('Dropped component data:', componentData);

    // 获取组件定义
    const componentDef = baseComponents.find((comp: Component) => comp.componentCode === componentData.componentCode);
    if (!componentDef) {
      console.error('Component definition not found:', componentData.componentCode);
      return;
    }

    console.log('Found component definition:', componentDef);

    // 创建新的组件实例
    const newComponent = {
      id: 0,
      tenantId: 'default',
      pageCode: store.currentPage?.pageCode || '',
      version: store.currentPage?.version || '1.0.0',
      componentInstanceId: componentData.componentInstanceId,
      componentCode: componentData.componentCode,
      componentName: componentData.componentName,
      props: componentDef.defaultProps || {},
      sortOrder: store.componentRelations.length,
      children: [],
    };

    console.log('Created new component:', newComponent);
    console.log('Current component relations:', store.componentRelations);

    // 添加到组件关系中
    store.addComponent(newComponent);
    
    // 选中新添加的组件
    store.setSelectedComponent(newComponent.componentInstanceId);

    console.log('Updated component relations:', store.componentRelations);
  } catch (error) {
    console.error('Failed to parse dropped component:', error);
  }
};
</script>

<template>
  <div class="design-canvas">
    <!-- 设备选择器 -->
    <div class="device-selector">
      <NSelect
        v-model:value="activeDevice"
        :options="deviceOptions"
        size="small"
      />
    </div>

    <!-- 设计画布 -->
    <div
      class="canvas-container"
      :class="{ 'drag-over': isDragOver }"
      @dragover.prevent
      @dragenter="isDragOver = true"
      @dragleave="isDragOver = false"
      @drop="handleDrop"
    >
      <div
        class="device-frame"
        :style="{
          width: `${currentDevice.width}px`,
          height: `${currentDevice.height}px`,
          transform: `scale(${currentDevice.scale})`,
        }"
      >
        <!-- 渲染组件 -->
        <ComponentRenderer
          v-for="component in store.componentRelations"
          :key="component.componentInstanceId"
          :node="component"
        />
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.design-canvas {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
  padding: 16px;
}

.device-selector {
  display: flex;
  justify-content: center;
  padding: 0 16px;

  :deep(.n-select) {
    width: 200px;
  }
}

.canvas-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: radial-gradient(circle, #f5f5f5 0%, #e0e0e0 100%);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);

  &.drag-over {
    background: radial-gradient(circle, #e8f5e9 0%, #c8e6c9 100%);
    box-shadow: inset 0 2px 12px rgba(24, 160, 88, 0.2);
  }
}

.device-frame {
  background-color: #fff;
  border-radius: 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  transform-origin: center center;
  transition: all 0.3s ease;
  overflow: auto;
  padding: 16px;
  position: relative;

  &::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 2px;
  }

  &::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 4px;
    background-color: #e0e0e0;
    border-radius: 2px;
  }
}
</style> 
