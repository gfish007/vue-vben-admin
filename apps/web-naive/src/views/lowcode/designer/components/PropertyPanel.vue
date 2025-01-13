<script setup lang="ts" name="PropertyPanel">
import type { ComponentInstance } from '../../../../types/lowcode';

import { computed, markRaw, ref, watch } from 'vue';

import { NEmpty, NTabPane, NTabs } from 'naive-ui';

import { useLowCodeStore } from '../../../../store/modules/lowcode';
import * as componentRenders from './definitions';
import DefaultDataPanel from './panels/DefaultDataPanel.vue';
import DefaultEventPanel from './panels/DefaultEventPanel.vue';
import DefaultPropsPanel from './panels/DefaultPropsPanel.vue';
import DefaultStylePanel from './panels/DefaultStylePanel.vue';
import { components } from './registry';

// 记录可用的组件渲染器
console.log('[PropertyPanel] 可用的组件渲染器:', Object.keys(componentRenders));

const store = useLowCodeStore();

// 当前选中的组件
const currentComponent = computed<ComponentInstance | null>(() => {
  if (!store.currentComponentId) return null;

  // 递归查找组件
  const findComponent = (
    components: ComponentInstance[],
  ): ComponentInstance | null => {
    for (const comp of components) {
      if (comp.componentInstanceId === store.currentComponentId) {
        return comp;
      }
      if (comp.children?.length) {
        const found = findComponent(comp.children);
        if (found) return found;
      }
    }
    return null;
  };

  return findComponent(store.components);
});

// 监听组件变化，确保属性面板更新
watch(
  [() => store.currentComponentId, () => store.components],
  () => {
    console.log('[PropertyPanel] 组件变化:', {
      component: currentComponent.value,
      componentId: store.currentComponentId,
    });
  },
  { deep: true, immediate: true },
);

// 获取自定义面板组件
const getPanelComponent = async (type: string) => {
  console.log('Getting panel component for type:', type, {
    currentComponent: currentComponent.value?.componentCode,
    propertyPanel: currentComponent.value?.propertyPanel,
  });

  if (!currentComponent.value) return null;

  // 获取组件定义
  const componentCode = currentComponent.value.componentCode;
  console.log('Looking for component definition:', {
    availableComponents: Object.keys(componentRenders),
    componentCode,
  });

  // 尝试从组件实例或组件定义中获取 propertyPanel 配置
  let propertyPanel = currentComponent.value.propertyPanel;
  console.log('Initial propertyPanel from instance:', propertyPanel);

  if (!propertyPanel) {
    // 如果组件实例中没有配置，尝试从组件定义中获取
    try {
      // 从 registry 中获取组件定义
      const componentDef = components.find(
        (comp) => comp.componentCode === componentCode,
      );
      console.log('Found component definition:', componentDef);

      if (componentDef) {
        propertyPanel = componentDef.propertyPanel;
        console.log('Got propertyPanel from definition:', propertyPanel);
      } else {
        console.warn(`Component definition not found for: ${componentCode}`);
      }
    } catch (error) {
      console.warn('Failed to get component definition:', {
        componentCode,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (propertyPanel?.customPanels) {
    // 尝试获取自定义面板
    const customPanelName = propertyPanel.customPanels[type.toLowerCase()];
    console.log('Custom panel lookup:', {
      customPanels: propertyPanel.customPanels,
      foundPanelName: customPanelName,
      type: type.toLowerCase(),
    });

    if (customPanelName) {
      console.log(
        'Available component renders:',
        Object.keys(componentRenders),
      );
      const customPanel =
        componentRenders[customPanelName as keyof typeof componentRenders];
      console.log('Custom panel lookup result:', {
        found: !!customPanel,
        name: customPanelName,
        panel: customPanel,
      });

      if (customPanel) {
        console.log('Found custom panel:', customPanelName);
        return markRaw(customPanel);
      }
    }
  }

  // 如果没有找到自定义面板，返回默认面板
  console.log('Falling back to default panel for type:', type.toLowerCase());
  switch (type.toLowerCase()) {
    case 'props': {
      return markRaw(DefaultPropsPanel);
    }
    case 'style': {
      return markRaw(DefaultStylePanel);
    }
    case 'data': {
      return markRaw(DefaultDataPanel);
    }
    case 'event': {
      return markRaw(DefaultEventPanel);
    }
    default: {
      return null;
    }
  }
};

// 缓存面板组件
const panelComponents = ref<Record<string, any>>({});

// 加载面板组件
const loadPanelComponent = async (type: string) => {
  const key = type.toLowerCase();
  console.log('Loading panel component:', {
    cached: !!panelComponents.value[key],
    key,
    type,
  });

  if (!panelComponents.value[key]) {
    const panel = await getPanelComponent(type);
    console.log('Loaded panel result:', { key, panel: !!panel, type });
    panelComponents.value[key] = panel;
  }
  return panelComponents.value[key];
};

// 获取启用的标签页
const enabledTabs = computed(() => {
  if (!currentComponent.value) return [];

  // 从组件定义中获取启用的标签页
  const defaultTabs = ['props', 'style'];
  return currentComponent.value.propertyPanel?.enabledTabs || defaultTabs;
});

// 当前选中的标签页
const activeTab = ref('props');

// 预加载所有面板组件
watch(
  currentComponent,
  async () => {
    if (currentComponent.value) {
      console.log('Component changed, reloading panels:', {
        componentCode: currentComponent.value.componentCode,
        enabledTabs: enabledTabs.value,
      });
      // 清空缓存
      panelComponents.value = {};
      // 预加载所有启用的标签页对应的面板组件
      for (const tab of enabledTabs.value) {
        await loadPanelComponent(tab);
      }
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="property-panel">
    <template v-if="currentComponent">
      <NTabs v-model:value="activeTab" type="segment">
        <!-- 属性配置 -->
        <NTabPane v-if="enabledTabs.includes('props')" name="props" tab="属性">
          <component
            :is="panelComponents.props"
            v-if="panelComponents.props"
            :component="currentComponent"
          />
        </NTabPane>

        <!-- 样式配置 -->
        <NTabPane v-if="enabledTabs.includes('style')" name="style" tab="样式">
          <component
            :is="panelComponents.style"
            v-if="panelComponents.style"
            :component="currentComponent"
          />
        </NTabPane>

        <!-- 数据配置 -->
        <NTabPane v-if="enabledTabs.includes('data')" name="data" tab="数据">
          <component
            :is="panelComponents.data"
            v-if="panelComponents.data"
            :component="currentComponent"
          />
        </NTabPane>

        <!-- 事件配置 -->
        <NTabPane v-if="enabledTabs.includes('event')" name="event" tab="事件">
          <component
            :is="panelComponents.event"
            v-if="panelComponents.event"
            :component="currentComponent"
          />
        </NTabPane>
      </NTabs>
    </template>
    <template v-else>
      <NEmpty description="请选择一个组件" />
    </template>
  </div>
</template>

<style lang="less" scoped>
.property-panel {
  height: 100%;
  padding: 16px;
  overflow: auto;
}
</style>
