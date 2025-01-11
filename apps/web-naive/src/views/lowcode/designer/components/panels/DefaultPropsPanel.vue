# 默认属性面板组件
<script setup lang="ts">
import type { ComponentInstance } from '../../../../../types/lowcode';

import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NSwitch,
} from 'naive-ui';

import { useLowCodeStore } from '../../../../../store/modules/lowcode';

const props = defineProps<{
  component: ComponentInstance;
}>();

const store = useLowCodeStore();

// 更新组件属性
const handlePropUpdate = (field: string, value: unknown) => {
  console.log('[DefaultPropsPanel] 更新属性:', { field, value });
  store.updateComponent(props.component.componentInstanceId, {
    props: {
      ...props.component.props,
      [field]: value,
    },
  });
};
</script>

<template>
  <NForm label-placement="left" label-width="100">
    <NSpace vertical>
      <NCard size="small" title="基础属性">
        <NSpace size="small" vertical>
          <NFormItem
            v-for="(schema, field) in component.propsSchema"
            :key="field"
            :label="schema.label"
          >
            <!-- 输入框 -->
            <NInput
              v-if="schema.type === 'input'"
              :value="component.props?.[field]"
              clearable
              placeholder="请输入"
              @update:value="(val) => handlePropUpdate(field, val)"
            />

            <!-- 数字输入框 -->
            <NInputNumber
              v-else-if="schema.type === 'number'"
              :max="schema.max"
              :min="schema.min"
              :value="component.props?.[field]"
              clearable
              placeholder="请输入"
              @update:value="(val) => handlePropUpdate(field, val)"
            />

            <!-- 选择框 -->
            <NSelect
              v-else-if="schema.type === 'select'"
              :options="schema.options"
              :value="component.props?.[field]"
              clearable
              placeholder="请选择"
              @update:value="(val) => handlePropUpdate(field, val)"
            />

            <!-- 开关 -->
            <NSwitch
              v-else-if="schema.type === 'switch'"
              :value="component.props?.[field]"
              @update:value="(val) => handlePropUpdate(field, val)"
            />
          </NFormItem>
        </NSpace>
      </NCard>
    </NSpace>
  </NForm>
</template>
