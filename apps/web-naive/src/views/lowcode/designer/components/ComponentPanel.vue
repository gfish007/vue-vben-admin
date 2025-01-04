<script setup lang="ts">
import { ref } from 'vue';
import { NTabs, NTabPane } from 'naive-ui';
import { v4 as uuidv4 } from 'uuid';
import type { Component } from '#/types/lowcode';
import { baseComponents } from './registry';

const activeTab = ref('base');

// 处理拖拽开始
const handleDragStart = (component: Component, event: DragEvent) => {
  console.log('Drag start:', component);
  const componentInstance = {
    componentInstanceId: uuidv4(),
    componentCode: component.componentCode,
    componentName: component.componentName,
  };
  console.log('Component instance data:', componentInstance);
  if (event.dataTransfer) {
    event.dataTransfer.setData('componentInstance', JSON.stringify(componentInstance));
    event.dataTransfer.effectAllowed = 'copy';
  }
};
</script>

<template>
  <div class="component-panel">
    <NTabs v-model:value="activeTab" size="small" type="segment">
      <NTabPane name="base" tab="基础组件">
        <div class="component-list">
          <div
            v-for="component in baseComponents"
            :key="component.componentCode"
            class="component-item"
            draggable="true"
            @dragstart="(e) => handleDragStart(component, e)"
          >
            <i :class="component.icon" class="component-icon" />
            <span class="component-name">{{ component.componentName }}</span>
          </div>
        </div>
      </NTabPane>
    </NTabs>
  </div>
</template>

<style lang="less" scoped>
.component-panel {
  height: 100%;
  background-color: #fff;
}

.component-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 12px;
}

.component-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80px;
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  cursor: move;
  transition: all 0.2s;
  user-select: none;

  &:hover {
    border-color: #18a058;
    background-color: rgba(24, 160, 88, 0.05);
  }
}

.component-icon {
  font-size: 24px;
  color: #666;
  margin-bottom: 8px;
}

.component-name {
  font-size: 12px;
  color: #666;
}
</style> 
