#
<script setup lang="ts" name="RecommendProperty">
import type { ComponentInstance } from '../../../../../types/lowcode';

import {
  NCard,
  NForm,
  NFormItem,
  NInputNumber,
  NSelect,
  NSpace,
  NSwitch,
} from 'naive-ui';

import { useLowCodeStore } from '../../../../../store/modules/lowcode';

defineOptions({
  name: 'RecommendProperty',
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

// 更新动画配置
const handleAnimationUpdate = (field: string, value: unknown) => {
  store.updateComponent(props.component.componentInstanceId, {
    props: {
      ...props.component.props,
      animation: {
        ...props.component.props?.animation,
        [field]: value,
      },
    },
  });
};
</script>

<template>
  <NForm label-placement="left" label-width="100">
    <NSpace vertical>
      <!-- 基础配置 -->
      <NCard size="small" title="基础配置">
        <NSpace vertical>
          <NFormItem label="展示模式">
            <NSelect
              :options="[
                { label: '卡片', value: 'card' },
                { label: '列表', value: 'list' },
                { label: '瀑布流', value: 'waterfall' },
              ]"
              :value="component.props?.mode"
              @update:value="(val) => handlePropUpdate('mode', val)"
            />
          </NFormItem>
          <NFormItem label="布局方向">
            <NSelect
              :options="[
                { label: '水平', value: 'horizontal' },
                { label: '垂直', value: 'vertical' },
              ]"
              :value="component.props?.layout"
              @update:value="(val) => handlePropUpdate('layout', val)"
            />
          </NFormItem>
          <NFormItem label="每行个数">
            <NInputNumber
              :max="4"
              :min="1"
              :value="component.props?.columnsCount"
              @update:value="(val) => handlePropUpdate('columnsCount', val)"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 图片配置 -->
      <NCard size="small" title="图片配置">
        <NSpace vertical>
          <NFormItem label="图片模式">
            <NSelect
              :options="[
                { label: '单图', value: 'single' },
                { label: '多图', value: 'multiple' },
              ]"
              :value="component.props?.imageMode"
              @update:value="(val) => handlePropUpdate('imageMode', val)"
            />
          </NFormItem>
          <NFormItem
            v-if="component.props?.imageMode === 'multiple'"
            label="图片数量"
          >
            <NInputNumber
              :max="9"
              :min="1"
              :value="component.props?.imageCount"
              @update:value="(val) => handlePropUpdate('imageCount', val)"
            />
          </NFormItem>
          <NFormItem label="图片比例">
            <NSelect
              :options="[
                { label: '1:1', value: '1:1' },
                { label: '4:3', value: '4:3' },
                { label: '16:9', value: '16:9' },
                { label: '3:4', value: '3:4' },
              ]"
              :value="component.props?.aspectRatio"
              @update:value="(val) => handlePropUpdate('aspectRatio', val)"
            />
          </NFormItem>
          <NFormItem label="填充模式">
            <NSelect
              :options="[
                { label: '填充', value: 'fill' },
                { label: '包含', value: 'contain' },
                { label: '覆盖', value: 'cover' },
              ]"
              :value="component.props?.imageFit"
              @update:value="(val) => handlePropUpdate('imageFit', val)"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 显示配置 -->
      <NCard size="small" title="显示配置">
        <NSpace vertical>
          <NFormItem label="显示标题">
            <NSwitch
              :value="component.props?.showTitle"
              @update:value="(val) => handlePropUpdate('showTitle', val)"
            />
          </NFormItem>
          <NFormItem label="显示副标题">
            <NSwitch
              :value="component.props?.showSubtitle"
              @update:value="(val) => handlePropUpdate('showSubtitle', val)"
            />
          </NFormItem>
          <NFormItem label="显示价格">
            <NSwitch
              :value="component.props?.showPrice"
              @update:value="(val) => handlePropUpdate('showPrice', val)"
            />
          </NFormItem>
          <NFormItem label="显示原价">
            <NSwitch
              :value="component.props?.showOriginalPrice"
              @update:value="
                (val) => handlePropUpdate('showOriginalPrice', val)
              "
            />
          </NFormItem>
          <NFormItem label="显示标签">
            <NSwitch
              :value="component.props?.showTags"
              @update:value="(val) => handlePropUpdate('showTags', val)"
            />
          </NFormItem>
          <NFormItem label="显示徽标">
            <NSwitch
              :value="component.props?.showBadge"
              @update:value="(val) => handlePropUpdate('showBadge', val)"
            />
          </NFormItem>
          <NFormItem label="显示统计">
            <NSwitch
              :value="component.props?.showStatistics"
              @update:value="(val) => handlePropUpdate('showStatistics', val)"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 样式配置 -->
      <NCard size="small" title="样式配置">
        <NSpace vertical>
          <NFormItem label="间距">
            <NInputNumber
              :max="48"
              :min="0"
              :value="component.props?.gutter"
              @update:value="(val) => handlePropUpdate('gutter', val)"
            />
          </NFormItem>
          <NFormItem label="圆角">
            <NInputNumber
              :max="24"
              :min="0"
              :value="component.props?.borderRadius"
              @update:value="(val) => handlePropUpdate('borderRadius', val)"
            />
          </NFormItem>
          <NFormItem label="阴影效果">
            <NSwitch
              :value="component.props?.shadow"
              @update:value="(val) => handlePropUpdate('shadow', val)"
            />
          </NFormItem>
          <NFormItem label="悬浮缩放">
            <NInputNumber
              :max="1.2"
              :min="1"
              :precision="2"
              :value="component.props?.hoverScale"
              @update:value="(val) => handlePropUpdate('hoverScale', val)"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 动画配置 -->
      <NCard size="small" title="动画配置">
        <NSpace vertical>
          <NFormItem label="动画类型">
            <NSelect
              :options="[
                { label: '无', value: 'none' },
                { label: '淡入', value: 'fade' },
                { label: '滑入', value: 'slide' },
              ]"
              :value="component.props?.animation?.type"
              @update:value="(val) => handleAnimationUpdate('type', val)"
            />
          </NFormItem>
          <NFormItem label="动画时长">
            <NInputNumber
              :max="1000"
              :min="0"
              :value="component.props?.animation?.duration"
              @update:value="(val) => handleAnimationUpdate('duration', val)"
            />
          </NFormItem>
          <NFormItem label="延迟时间">
            <NInputNumber
              :max="1000"
              :min="0"
              :value="component.props?.animation?.delay"
              @update:value="(val) => handleAnimationUpdate('delay', val)"
            />
          </NFormItem>
        </NSpace>
      </NCard>
    </NSpace>
  </NForm>
</template>
