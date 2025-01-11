# 默认样式面板组件
<script setup lang="ts">
import type { ComponentInstance } from '../../../../../types/lowcode';

import { computed } from 'vue';

import {
  NCard,
  NColorPicker,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
} from 'naive-ui';

import { useLowCodeStore } from '../../../../../store/modules/lowcode';

const props = defineProps<{
  component: ComponentInstance;
}>();

const store = useLowCodeStore();

// 更新组件样式
const handleStyleUpdate = (field: string, value: unknown) => {
  console.log('[DefaultStylePanel] 更新样式:', { field, value });
  store.updateComponent(props.component.componentInstanceId, {
    style: {
      ...props.component.style,
      [field]: value,
    },
  });
};

// 处理自定义样式更新
const handleCustomStyleUpdate = (value: string) => {
  console.log('[DefaultStylePanel] 更新自定义样式');
  if (!props.component) return;

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

    store.updateComponent(props.component.componentInstanceId, {
      style: styleObj,
    });
  } catch (error) {
    console.error('[DefaultStylePanel] 解析自定义样式错误:', error);
  }
};

// 自定义样式文本
const customStyle = computed(() => {
  if (!props.component || !props.component.style) return '';
  const style = props.component.style;
  return Object.entries(style)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n');
});
</script>

<template>
  <NForm label-placement="left" label-width="100">
    <NSpace vertical>
      <!-- 布局设置 -->
      <NCard size="small" title="布局">
        <NSpace size="small" vertical>
          <NFormItem label="布局方式">
            <NSelect
              :options="[
                { label: 'Flex 布局', value: 'flex' },
                { label: 'Grid 布局', value: 'grid' },
                { label: 'Float 布局', value: 'float' },
                { label: '定位布局', value: 'position' },
              ]"
              :value="component.style?.display"
              @update:value="(val) => handleStyleUpdate('display', val)"
            />
          </NFormItem>

          <!-- Flex 布局属性 -->
          <template v-if="component.style?.display === 'flex'">
            <NFormItem label="主轴方向">
              <NSelect
                :options="[
                  { label: '垂直排列', value: 'column' },
                  { label: '水平排列', value: 'row' },
                  { label: '垂直反向', value: 'column-reverse' },
                  { label: '水平反向', value: 'row-reverse' },
                ]"
                :value="component.style?.flexDirection"
                @update:value="(val) => handleStyleUpdate('flexDirection', val)"
              />
            </NFormItem>
            <NFormItem label="主轴对齐">
              <NSelect
                :options="[
                  { label: '起点对齐', value: 'flex-start' },
                  { label: '居中对齐', value: 'center' },
                  { label: '终点对齐', value: 'flex-end' },
                  { label: '两端对齐', value: 'space-between' },
                  { label: '环绕对齐', value: 'space-around' },
                  { label: '均匀对齐', value: 'space-evenly' },
                ]"
                :value="component.style?.justifyContent"
                @update:value="
                  (val) => handleStyleUpdate('justifyContent', val)
                "
              />
            </NFormItem>
            <NFormItem label="交叉轴对齐">
              <NSelect
                :options="[
                  { label: '起点对齐', value: 'flex-start' },
                  { label: '居中对齐', value: 'center' },
                  { label: '终点对齐', value: 'flex-end' },
                  { label: '基线对齐', value: 'baseline' },
                  { label: '拉伸对齐', value: 'stretch' },
                ]"
                :value="component.style?.alignItems"
                @update:value="(val) => handleStyleUpdate('alignItems', val)"
              />
            </NFormItem>
            <NFormItem label="换行方式">
              <NSelect
                :options="[
                  { label: '不换行', value: 'nowrap' },
                  { label: '换行', value: 'wrap' },
                  { label: '反向换行', value: 'wrap-reverse' },
                ]"
                :value="component.style?.flexWrap"
                @update:value="(val) => handleStyleUpdate('flexWrap', val)"
              />
            </NFormItem>
          </template>

          <!-- Grid 布局属性 -->
          <template v-if="component.style?.display === 'grid'">
            <NFormItem label="网格列">
              <NInput
                :value="component.style?.gridTemplateColumns"
                placeholder="例如: 100px 100px 100px"
                @update:value="
                  (val) => handleStyleUpdate('gridTemplateColumns', val)
                "
              />
            </NFormItem>
            <NFormItem label="网格行">
              <NInput
                :value="component.style?.gridTemplateRows"
                placeholder="例如: 100px 100px"
                @update:value="
                  (val) => handleStyleUpdate('gridTemplateRows', val)
                "
              />
            </NFormItem>
          </template>

          <!-- Float 布局属性 -->
          <template v-if="component.style?.display === 'float'">
            <NFormItem label="浮动">
              <NSelect
                :options="[
                  { label: '无', value: 'none' },
                  { label: '左浮动', value: 'left' },
                  { label: '右浮动', value: 'right' },
                ]"
                :value="component.style?.float"
                @update:value="(val) => handleStyleUpdate('float', val)"
              />
            </NFormItem>
          </template>

          <!-- Position 布局属性 -->
          <template v-if="component.style?.position">
            <NFormItem label="定位方式">
              <NSelect
                :options="[
                  { label: '相对定位', value: 'relative' },
                  { label: '绝对定位', value: 'absolute' },
                  { label: '固定定位', value: 'fixed' },
                  { label: '粘性定位', value: 'sticky' },
                ]"
                :value="component.style?.position"
                @update:value="(val) => handleStyleUpdate('position', val)"
              />
            </NFormItem>
            <NFormItem label="上边距">
              <NInput
                :value="component.style?.top"
                @update:value="(val) => handleStyleUpdate('top', val)"
              />
            </NFormItem>
            <NFormItem label="右边距">
              <NInput
                :value="component.style?.right"
                @update:value="(val) => handleStyleUpdate('right', val)"
              />
            </NFormItem>
            <NFormItem label="下边距">
              <NInput
                :value="component.style?.bottom"
                @update:value="(val) => handleStyleUpdate('bottom', val)"
              />
            </NFormItem>
            <NFormItem label="左边距">
              <NInput
                :value="component.style?.left"
                @update:value="(val) => handleStyleUpdate('left', val)"
              />
            </NFormItem>
          </template>

          <NFormItem label="间距">
            <NInput
              :value="component.style?.gap"
              @update:value="(val) => handleStyleUpdate('gap', val)"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 尺寸设置 -->
      <NCard size="small" title="尺寸">
        <NSpace size="small" vertical>
          <NFormItem label="宽度">
            <NInput
              :value="component.style?.width"
              clearable
              placeholder="请输入"
              @update:value="(val) => handleStyleUpdate('width', val)"
            />
          </NFormItem>
          <NFormItem label="高度">
            <NInput
              :value="component.style?.height"
              clearable
              placeholder="请输入"
              @update:value="(val) => handleStyleUpdate('height', val)"
            />
          </NFormItem>
          <NFormItem label="最小宽度">
            <NInput
              :value="component.style?.minWidth"
              clearable
              placeholder="请输入"
              @update:value="(val) => handleStyleUpdate('minWidth', val)"
            />
          </NFormItem>
          <NFormItem label="最小高度">
            <NInput
              :value="component.style?.minHeight"
              clearable
              placeholder="请输入"
              @update:value="(val) => handleStyleUpdate('minHeight', val)"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 边距设置 -->
      <NCard size="small" title="边距">
        <NSpace size="small" vertical>
          <NFormItem label="内边距">
            <NInput
              :value="component.style?.padding"
              clearable
              placeholder="请输入"
              @update:value="(val) => handleStyleUpdate('padding', val)"
            />
          </NFormItem>
          <NFormItem label="外边距">
            <NInput
              :value="component.style?.margin"
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
              :value="component.style?.backgroundColor"
              @update:value="(val) => handleStyleUpdate('backgroundColor', val)"
            />
          </NFormItem>
          <NFormItem label="边框">
            <NInput
              :value="component.style?.border"
              clearable
              placeholder="请输入"
              @update:value="(val) => handleStyleUpdate('border', val)"
            />
          </NFormItem>
          <NFormItem label="圆角">
            <NInput
              :value="component.style?.borderRadius"
              clearable
              placeholder="请输入"
              @update:value="(val) => handleStyleUpdate('borderRadius', val)"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 自定义样式 -->
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
</template>
