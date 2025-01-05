<script setup lang="ts">
import type { ComponentInstance } from '../../../../types/lowcode';

import { computed, ref } from 'vue';

import {
  EyeOutline,
  ReloadOutline,
  ReturnUpBackOutline,
  SaveOutline,
} from '@vicons/ionicons5';
import { NButton, NIcon, NSelect, NSpace, useMessage } from 'naive-ui';
import { nanoid } from 'nanoid';

import { useLowCodeStore } from '../../../../store/modules/lowcode';
import * as componentRenders from './definitions';

// 初始化 store
const store = useLowCodeStore();
const message = useMessage();
const isDragOver = ref(false);
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

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;

  const componentData = event.dataTransfer?.getData('component');
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
      margin: '0',
      padding: '4px 8px',
    };

    // 根据组件类型设置特定样式
    if (component.componentCode === 'Container') {
      defaultStyle.minHeight = '240px';
    }

    // 合并自定义样式，确保外部传入的样式优先级更高
    const mergedStyle = component.defaultStyle
      ? { ...defaultStyle, ...component.defaultStyle }
      : defaultStyle;

    const componentInstance: ComponentInstance = {
      componentCode: component.componentCode,
      componentInstanceId: nanoid(),
      componentName: component.componentName,
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
</script>

<template>
  <div
    :class="{ 'drag-over': isDragOver }"
    class="design-canvas"
    @dragleave="handleDragLeave"
    @dragover="handleDragOver"
    @drop="handleDrop"
  >
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
      </NSpace>
    </div>
    <div :style="deviceStyle" class="canvas-body">
      <div
        v-for="component in storeComponents"
        :key="component.componentInstanceId"
        class="component-outer"
      >
        <div
          :class="{
            active: store.currentComponentId === component.componentInstanceId,
          }"
          class="component-wrapper"
          @click.stop="handleComponentClick(component)"
        >
          <div class="component-content">
            <component
              :is="getComponentRender(component.componentCode)"
              v-bind="component.props"
              :data-component-id="component.componentInstanceId"
              :style="component.style"
              @click.stop="handleComponentClick(component)"
              @delete="deleteComponent(component.componentInstanceId)"
            >
              <!-- 如果是容器组件，渲染子组件 -->
              <template
                v-if="
                  component.componentCode === 'Container' && component.children
                "
              >
                <div
                  v-for="child in component.children"
                  :key="child.componentInstanceId"
                  class="container-item"
                >
                  <component
                    :is="getComponentRender(child.componentCode)"
                    v-bind="child.props"
                    :data-component-id="child.componentInstanceId"
                    :style="child.style"
                    @update:value="handlePropUpdate(child, 'value', $event)"
                  />
                </div>
              </template>
            </component>
          </div>
        </div>
      </div>
      <div v-if="storeComponents.length === 0" class="empty-tip">
        从左侧拖入组件开始设计
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
}

.canvas-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  z-index: 1;

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
  padding: 24px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  overflow: auto;
  position: relative;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 100%;
  height: 100%;
}

:deep(.drag-over) .canvas-body::after {
  opacity: 1;
}

.component-outer {
  position: relative;
  display: contents;
}

.component-wrapper {
  position: relative;
  display: contents;
}

.component-content {
  position: relative;
  display: inline;

  > :deep(div),
  > :deep(button) {
    position: relative;
    display: inline-block;

    &::before {
      content: '';
      position: absolute;
      top: -1px;
      left: -1px;
      right: -1px;
      bottom: -1px;
      border: 1px dashed transparent;
      border-radius: 2px;
      pointer-events: none;
      transition: all 0.2s ease;
      z-index: 1;
    }

    &::after {
      content: '';
      position: absolute;
      top: -12px;
      right: -12px;
      width: 24px;
      height: 24px;
      opacity: 0;
      transition: opacity 0.2s ease;
      z-index: 100;
      pointer-events: auto;
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23d03050"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>');
      background-size: contain;
      cursor: pointer;
    }
  }
}

.component-wrapper:hover,
.component-wrapper.active {
  .component-content {
    > :deep(div),
    > :deep(button) {
      &::before {
        border-color: #18a058;
        background-color: rgba(24, 160, 88, 0.04);
      }

      &::after {
        opacity: 1;
      }
    }
  }
}

.delete-btn {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.component-content {
  position: relative;
  display: inline-flex;
  min-width: min-content;
}

.empty-tip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #999;
  font-size: 14px;
}

.container-item {
  display: block;
  margin: 0;
  position: relative;
}
</style>
