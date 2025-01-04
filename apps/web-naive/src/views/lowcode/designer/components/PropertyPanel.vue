<template>
  <div class="property-panel">
    <template v-if="currentComponent">
      <!-- 如果存在自定义属性编辑器，则使用自定义编辑器 -->
      <component
        v-if="currentComponent.propEditor"
        :is="currentComponent.propEditor"
        v-model="componentProps"
      />
      <!-- 否则使用默认的属性编辑器 -->
      <template v-else>
        <n-tabs v-model:value="activeTab" type="line" animated>
          <n-tab-pane
            v-for="tab in currentComponent.propPanelTabs"
            :key="tab.name"
            :name="tab.name"
            :tab="tab.label"
          >
            <n-form
              ref="formRef"
              :model="componentProps"
              label-placement="left"
              label-width="auto"
              require-mark-placement="right-hanging"
              :style="{ padding: '16px' }"
            >
              <template v-for="field in tab.fields" :key="field">
                <n-form-item
                  v-if="shouldShowField(field)"
                  :label="getFieldSchema(field).label"
                >
                  <PropertyField
                    :schema="getFieldSchema(field)"
                    :field="field"
                    :value="componentProps[field]"
                    @update:value="(val: any) => updateFieldValue(field, val)"
                  />
                </n-form-item>
              </template>
            </n-form>
          </n-tab-pane>
        </n-tabs>
      </template>
    </template>
    <div v-else class="property-panel-empty">
      <n-empty description="请选择一个组件" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { useLowCodeStore } from '#/store/modules/lowcode';
import { storeToRefs } from 'pinia';
import PropertyField from './definitions/PropertyField.vue';
import type { PropSchema, Component, ComponentRelation } from '#/types/lowcode';
import {
  NTabs,
  NTabPane,
  NForm,
  NFormItem,
  NEmpty,
  type FormInst,
} from 'naive-ui';

// 使用 lodash-es 的 get 函数的简单实现
function get(obj: any, path: string, defaultValue?: any): any {
  if (!path) return obj;
  const travel = (regexp: RegExp) =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);
  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
  return result === undefined || result === obj ? defaultValue : result;
}

// 使用 lodash-es 的 set 函数的简单实现
function set(obj: any, path: string, value: any): any {
  if (!path) return obj;
  const segments = path.split('.');
  let current = obj;
  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i];
    if (segment && !(segment in current)) {
      current[segment] = {};
    }
    if (segment) {
      current = current[segment];
    }
  }
  const lastSegment = segments[segments.length - 1];
  if (lastSegment) {
    current[lastSegment] = value;
  }
  return obj;
}

const store = useLowCodeStore();
const { currentComponent, currentNode } = storeToRefs(store);

// 表单实例
const formRef = ref<FormInst | null>(null);

// 当前激活的标签页
const activeTab = ref('props');

// 组件属性（支持双向绑定）
const componentProps = computed({
  get: () => currentNode.value?.props || {},
  set: (value) => {
    if (currentNode.value) {
      currentNode.value.props = value;
    }
  },
});

// 获取字段的schema
const getFieldSchema = (field: string): PropSchema => {
  // 处理嵌套属性，如 'style.width'
  const schema = get(currentComponent.value?.propsSchema || {}, field);
  if (!schema) {
    console.warn(`Schema not found for field: ${field}`);
    return {
      type: 'string',
      label: field,
    };
  }
  return schema;
};

// 更新字段值
const updateFieldValue = (field: string, value: any) => {
  const newProps = { ...componentProps.value };
  set(newProps, field, value);
  componentProps.value = newProps;
};

// 判断字段是否应该显示（处理条件显示逻辑）
const shouldShowField = (field: string): boolean => {
  const schema = getFieldSchema(field);
  if (!schema.showOn) return true;

  // 检查每个显示条件
  return Object.entries(schema.showOn).every(([key, values]) => {
    const currentValue = get(componentProps.value, key);
    return Array.isArray(values)
      ? values.includes(currentValue)
      : values === currentValue;
  });
};

// 监听组件变化，重置激活的标签页
watch(currentComponent, () => {
  activeTab.value = 'props';
});
</script>

<style lang="less" scoped>
.property-panel {
  height: 100%;
  overflow-y: auto;
  background-color: #fff;

  &-empty {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :deep(.n-form-item) {
    margin-bottom: 16px;
  }
}
</style>
