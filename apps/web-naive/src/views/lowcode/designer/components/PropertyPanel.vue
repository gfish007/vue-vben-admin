<script setup lang="ts">
import type { ComponentInstance } from '../../../../types/lowcode';

import { computed } from 'vue';

import {
  NCard,
  NCheckboxGroup,
  NColorPicker,
  NEmpty,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NRadioGroup,
  NSelect,
  NSpace,
  NSwitch,
  NTabPane,
  NTabs,
} from 'naive-ui';

import { useLowCodeStore } from '../../../../store/modules/lowcode';

const store = useLowCodeStore();

// 当前选中的组件
const currentComponent = computed<ComponentInstance | null>(() => {
  if (!store.currentComponentId) return null;
  return (
    store.components.find(
      (comp) => comp.componentInstanceId === store.currentComponentId,
    ) || null
  );
});

// 自定义样式
const customStyle = computed(() => {
  if (!currentComponent.value) return '';
  const style = currentComponent.value.style;
  return Object.entries(style)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n');
});

// 更新组件属性
const handlePropUpdate = (field: string, value: unknown) => {
  if (!currentComponent.value) return;
  store.updateComponent(currentComponent.value.componentInstanceId, {
    props: {
      ...currentComponent.value.props,
      [field]: value,
    },
  });
};

// 更新组件样式
const handleStyleUpdate = (field: string, value: unknown) => {
  if (!currentComponent.value) return;
  store.updateComponent(currentComponent.value.componentInstanceId, {
    style: {
      ...currentComponent.value.style,
      [field]: value,
    },
  });
};

// 处理自定义样式更新
const handleCustomStyleUpdate = (value: string) => {
  if (!currentComponent.value) return;

  try {
    const styleLines = value.split('\n');
    const styleObj: Record<string, string> = {};

    styleLines.forEach((line) => {
      const [key, value] = line.split(':').map((s) => s.trim());
      if (key && value) {
        // 移除末尾的分号
        styleObj[key] = value.replace(/;$/, '');
      }
    });

    store.updateComponent(currentComponent.value.componentInstanceId, {
      style: styleObj,
    });
  } catch {
    // 忽略解析错误
  }
};
</script>

<template>
  <div class="property-panel">
    <template v-if="currentComponent">
      <NTabs type="segment">
        <NTabPane name="props" tab="属性">
          <NForm label-placement="left" label-width="100">
            <NFormItem
              v-for="(schema, field) in currentComponent.propsSchema"
              :key="field"
              :label="schema.label"
            >
              <!-- 输入框 -->
              <NInput
                v-if="schema.type === 'input'"
                :value="currentComponent.props[field]"
                clearable
                placeholder="请输入"
                @update:value="(val) => handlePropUpdate(field, val)"
              />

              <!-- 数字输入框 -->
              <NInputNumber
                v-else-if="schema.type === 'number'"
                :max="schema.max"
                :min="schema.min"
                :value="currentComponent.props[field]"
                clearable
                placeholder="请输入"
                @update:value="(val) => handlePropUpdate(field, val)"
              />

              <!-- 选择器 -->
              <NSelect
                v-else-if="schema.type === 'select'"
                :options="schema.options"
                :value="currentComponent.props[field]"
                clearable
                placeholder="请选择"
                @update:value="(val) => handlePropUpdate(field, val)"
              />

              <!-- 开关 -->
              <NSwitch
                v-else-if="schema.type === 'switch'"
                :value="currentComponent.props[field]"
                @update:value="(val) => handlePropUpdate(field, val)"
              />

              <!-- 单选组 -->
              <NRadioGroup
                v-else-if="schema.type === 'radio'"
                :name="field"
                :options="schema.options"
                :value="currentComponent.props[field]"
                @update:value="(val) => handlePropUpdate(field, val)"
              />

              <!-- 多选组 -->
              <NCheckboxGroup
                v-else-if="schema.type === 'checkbox'"
                :options="schema.options"
                :value="currentComponent.props[field]"
                @update:value="(val) => handlePropUpdate(field, val)"
              />
            </NFormItem>
          </NForm>
        </NTabPane>

        <NTabPane name="style" tab="样式">
          <NForm label-placement="left" label-width="100">
            <NSpace vertical>
              <!-- 尺寸设置 -->
              <NCard size="small" title="尺寸">
                <NSpace size="small" vertical>
                  <NFormItem label="宽度">
                    <NInput
                      :value="currentComponent.style.width"
                      clearable
                      placeholder="请输入"
                      @update:value="(val) => handleStyleUpdate('width', val)"
                    />
                  </NFormItem>
                  <NFormItem label="高度">
                    <NInput
                      :value="currentComponent.style.height"
                      clearable
                      placeholder="请输入"
                      @update:value="(val) => handleStyleUpdate('height', val)"
                    />
                  </NFormItem>
                  <NFormItem label="最小宽度">
                    <NInput
                      :value="currentComponent.style.minWidth"
                      clearable
                      placeholder="请输入"
                      @update:value="
                        (val) => handleStyleUpdate('minWidth', val)
                      "
                    />
                  </NFormItem>
                  <NFormItem label="最小高度">
                    <NInput
                      :value="currentComponent.style.minHeight"
                      clearable
                      placeholder="请输入"
                      @update:value="
                        (val) => handleStyleUpdate('minHeight', val)
                      "
                    />
                  </NFormItem>
                </NSpace>
              </NCard>

              <!-- 边距设置 -->
              <NCard size="small" title="边距">
                <NSpace size="small" vertical>
                  <NFormItem label="内边距">
                    <NInput
                      :value="currentComponent.style.padding"
                      clearable
                      placeholder="请输入"
                      @update:value="(val) => handleStyleUpdate('padding', val)"
                    />
                  </NFormItem>
                  <NFormItem label="外边距">
                    <NInput
                      :value="currentComponent.style.margin"
                      clearable
                      placeholder="请输入"
                      @update:value="(val) => handleStyleUpdate('margin', val)"
                    />
                  </NFormItem>
                </NSpace>
              </NCard>

              <!-- 外观设置 -->
              <NCard size="small" title="外观">
                <NSpace size="small" vertical>
                  <NFormItem label="背景色">
                    <NColorPicker
                      :value="currentComponent.style.backgroundColor"
                      @update:value="
                        (val) => handleStyleUpdate('backgroundColor', val)
                      "
                    />
                  </NFormItem>
                  <NFormItem label="文字颜色">
                    <NColorPicker
                      :value="currentComponent.style.color"
                      @update:value="(val) => handleStyleUpdate('color', val)"
                    />
                  </NFormItem>
                  <NFormItem label="字体大小">
                    <NInput
                      :value="currentComponent.style.fontSize"
                      clearable
                      placeholder="请输入"
                      @update:value="
                        (val) => handleStyleUpdate('fontSize', val)
                      "
                    />
                  </NFormItem>
                </NSpace>
              </NCard>

              <!-- 布局设置 -->
              <NCard size="small" title="布局">
                <NSpace size="small" vertical>
                  <NFormItem label="显示方式">
                    <NSelect
                      :options="[
                        { label: '块级', value: 'block' },
                        { label: '行内块', value: 'inline-block' },
                        { label: '弹性布局', value: 'flex' },
                        { label: '网格', value: 'grid' },
                      ]"
                      :value="currentComponent.style.display"
                      @update:value="(val) => handleStyleUpdate('display', val)"
                    />
                  </NFormItem>
                  <NFormItem label="定位">
                    <NSelect
                      :options="[
                        { label: '静态', value: 'static' },
                        { label: '相对', value: 'relative' },
                        { label: '绝对', value: 'absolute' },
                        { label: '固定', value: 'fixed' },
                      ]"
                      :value="currentComponent.style.position"
                      @update:value="
                        (val) => handleStyleUpdate('position', val)
                      "
                    />
                  </NFormItem>
                </NSpace>
              </NCard>

              <NCard size="small" title="自定义样式">
                <NSpace size="small" vertical>
                  <NInput
                    :autosize="{ minRows: 3, maxRows: 10 }"
                    :value="customStyle"
                    placeholder="请输入 CSS 样式，每行一个属性，例如：
color: #333;
font-size: 14px;"
                    type="textarea"
                    @update:value="handleCustomStyleUpdate"
                  />
                </NSpace>
              </NCard>
            </NSpace>
          </NForm>
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

  :deep(.n-form) {
    .n-form-item {
      margin-bottom: 12px;
    }
  }

  :deep(.n-card) {
    .n-card-header {
      padding: 8px 12px;
    }
    .n-card__content {
      padding: 8px 12px;
    }
  }
}
</style>
