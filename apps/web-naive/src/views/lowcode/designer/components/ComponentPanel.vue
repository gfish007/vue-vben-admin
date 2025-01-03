<script setup lang="ts">
import { ref } from 'vue';
import { NCard, NTabs, NTabPane } from 'naive-ui';

const activeTab = ref('base');

// 基础组件
const baseComponents = [
  {
    title: '基础组件',
    items: [
      { type: 'text', icon: 'mdi:text', label: '文本' },
      { type: 'image', icon: 'mdi:image', label: '图片' },
      { type: 'button', icon: 'mdi:button-cursor', label: '按钮' },
    ],
  },
  {
    title: '表单组件',
    items: [
      { type: 'input', icon: 'mdi:form-textbox', label: '输入框' },
      { type: 'select', icon: 'mdi:form-dropdown', label: '下拉选择' },
      { type: 'radio', icon: 'mdi:radiobox-marked', label: '单选框' },
      { type: 'checkbox', icon: 'mdi:checkbox-marked', label: '多选框' },
    ],
  },
  {
    title: '容器组件',
    items: [
      { type: 'view', icon: 'mdi:view-grid', label: '视图容器' },
      { type: 'scroll', icon: 'mdi:gesture-swipe', label: '滚动容器' },
      { type: 'tabs', icon: 'mdi:tab', label: '标签页' },
    ],
  },
];

// 业务组件
const businessComponents = [
  {
    title: '导航组件',
    items: [
      { type: 'navbar', icon: 'mdi:navigation', label: '导航栏' },
      { type: 'tabbar', icon: 'mdi:tab', label: '标签栏' },
    ],
  },
  {
    title: '展示组件',
    items: [
      { type: 'goods-card', icon: 'mdi:cart', label: '商品卡片' },
      { type: 'price', icon: 'mdi:currency-usd', label: '价格' },
    ],
  },
];
</script>

<template>
  <div class="h-full">
    <NTabs v-model:value="activeTab" type="segment" class="px-2 pt-2">
      <NTabPane name="base" tab="基础组件">
        <div class="component-list">
          <div v-for="group in baseComponents" :key="group.title" class="mb-4">
            <div class="group-title mb-2 px-2 text-sm text-gray-500">
              {{ group.title }}
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div
                v-for="item in group.items"
                :key="item.type"
                class="component-item flex cursor-move flex-col items-center rounded border bg-white p-2 hover:border-primary hover:text-primary"
                draggable="true"
              >
                <i :class="item.icon" class="text-xl" />
                <span class="mt-1 text-xs">{{ item.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </NTabPane>
      <NTabPane name="business" tab="业务组件">
        <div class="component-list">
          <div v-for="group in businessComponents" :key="group.title" class="mb-4">
            <div class="group-title mb-2 px-2 text-sm text-gray-500">
              {{ group.title }}
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div
                v-for="item in group.items"
                :key="item.type"
                class="component-item flex cursor-move flex-col items-center rounded border bg-white p-2 hover:border-primary hover:text-primary"
                draggable="true"
              >
                <i :class="item.icon" class="text-xl" />
                <span class="mt-1 text-xs">{{ item.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped>
.component-list {
  height: calc(100vh - 180px);
  overflow-y: auto;
  padding: 12px;
}

.component-item {
  transition: all 0.2s;
}
</style> 
