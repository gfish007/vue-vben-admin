<script setup lang="ts" name="SpanProperty">
import type { ComponentInstance } from '../../../../../types/lowcode';

import {
  NCard,
  NColorPicker,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
} from 'naive-ui';

import { useLowCodeStore } from '../../../../../store/modules/lowcode';

defineOptions({
  name: 'SpanProperty',
});

const props = defineProps<{
  component: ComponentInstance;
}>();

const store = useLowCodeStore();

// 更新组件属性
const handlePropUpdate = (field: string, value: unknown) => {
  store.updateComponent(props.component.componentInstanceId, {
    props: {
      ...props.component.props,
      [field]: value,
    },
  });
};

// 更新组件样式
const handleStyleUpdate = (field: string, value: unknown) => {
  store.updateComponent(props.component.componentInstanceId, {
    style: {
      ...props.component.style,
      [field]: value,
    },
  });
};
</script>

<template>
  <NForm label-placement="left" label-width="100">
    <NSpace vertical>
      <!-- 文本内容设置 -->
      <NCard size="small" title="文本内容">
        <NSpace size="small" vertical>
          <NFormItem label="内容">
            <NInput
              :autosize="{
                minRows: 2,
                maxRows: 5,
              }"
              :value="component.props?.content"
              type="textarea"
              @update:value="(val) => handlePropUpdate('content', val)"
            />
          </NFormItem>
          <NFormItem label="类型">
            <NSelect
              :options="[
                { label: '默认', value: 'default' },
                { label: '主要', value: 'primary' },
                { label: '成功', value: 'success' },
                { label: '警告', value: 'warning' },
                { label: '错误', value: 'error' },
              ]"
              :value="component.props?.type"
              @update:value="(val) => handlePropUpdate('type', val)"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 文字样式设置 -->
      <NCard size="small" title="文字样式">
        <NSpace size="small" vertical>
          <NFormItem label="字体大小">
            <NInputNumber
              :max="72"
              :min="12"
              :value="
                Number.parseInt(component.style?.fontSize?.toString() || '14')
              "
              @update:value="(val) => handleStyleUpdate('fontSize', `${val}px`)"
            />
          </NFormItem>
          <NFormItem label="行高">
            <NInputNumber
              :max="3"
              :min="1"
              :step="0.1"
              :value="
                Number.parseFloat(
                  component.style?.lineHeight?.toString() || '1.5',
                )
              "
              @update:value="(val) => handleStyleUpdate('lineHeight', val)"
            />
          </NFormItem>
          <NFormItem label="文字颜色">
            <NColorPicker
              :value="component.style?.color"
              @update:value="(val) => handleStyleUpdate('color', val)"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 布局设置 -->
      //
    </NSpace>
  </NForm>
</template>
