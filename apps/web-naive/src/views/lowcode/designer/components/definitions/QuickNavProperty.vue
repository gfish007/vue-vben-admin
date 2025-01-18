<script setup lang="ts" name="QuickNavProperty">
import type { QuickNavItem } from './QuickNav';

import type { ComponentInstance } from '#/types/lowcode';

import { computed } from 'vue';

import {
  NDivider,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
} from 'naive-ui';

import { useLowCodeStore } from '../../../../../store/modules/lowcode';

const props = defineProps<{
  component: ComponentInstance;
}>();

const store = useLowCodeStore();

// 更新组件属性
const handlePropUpdate = (field: string, value: unknown) => {
  if (props.component.props) {
    props.component.props[field] = value;
  }
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

// 更新徽标样式
const handleBadgeStyleUpdate = (field: string, value: string) => {
  if (props.component.props?.badgeStyle) {
    props.component.props.badgeStyle[field] = value;
  }
};

// 更新响应式配置
const handleResponsiveUpdate = (breakpoint: string, value: number) => {
  if (props.component.props?.responsive) {
    props.component.props.responsive[breakpoint] = value;
  }
};

// 导航项列表
const items = computed(() => props.component.props?.items || []);

// 添加导航项
const handleAddItem = () => {
  const newItem: QuickNavItem = {
    disabled: false,
    icon: 'i-carbon:add',
    iconColor: '#666666',
    id: Date.now().toString(),
    link: {
      type: 'page',
      value: '',
    },
    order: items.value.length + 1,
    title: '新导航项',
    visible: true,
  };

  handlePropUpdate('items', [...items.value, newItem]);
};

// 更新导航项
const handleUpdateItem = (index: number, field: string, value: unknown) => {
  const newItems = [...items.value];
  newItems[index] = {
    ...newItems[index],
    [field]: value,
  };
  handlePropUpdate('items', newItems);
};

// 更新导航项的徽标
const handleUpdateItemBadge = (
  index: number,
  field: string,
  value: unknown,
) => {
  const newItems = [...items.value];
  newItems[index] = {
    ...newItems[index],
    badge: {
      ...newItems[index].badge,
      [field]: value,
    },
  };
  handlePropUpdate('items', newItems);
};

// 更新导航项的链接
const handleUpdateItemLink = (index: number, field: string, value: unknown) => {
  const newItems = [...items.value];
  newItems[index] = {
    ...newItems[index],
    link: {
      ...newItems[index].link,
      [field]: value,
    },
  };
  handlePropUpdate('items', newItems);
};

// 删除导航项
const handleDeleteItem = (index: number) => {
  const newItems = [...items.value];
  newItems.splice(index, 1);
  handlePropUpdate('items', newItems);
};
</script>

<template>
  <div class="quick-nav-property">
    <NForm label-placement="left" label-width="auto">
      <NFormItem label="布局方式">
        <NSelect
          :options="[
            { label: '网格', value: 'grid' },
            { label: '水平', value: 'horizontal' },
            { label: '垂直', value: 'vertical' },
          ]"
          :value="component.props?.layout"
          @update:value="(val) => handlePropUpdate('layout', val)"
        />
      </NFormItem>

      <template v-if="component.props?.layout === 'grid'">
        <NFormItem label="每行个数">
          <NInputNumber
            :max="8"
            :min="3"
            :value="component.props?.columnsCount"
            @update:value="(val) => handlePropUpdate('columnsCount', val)"
          />
        </NFormItem>
      </template>

      <NFormItem label="显示边框">
        <NSwitch
          :value="component.props?.showBorder"
          @update:value="(val) => handlePropUpdate('showBorder', val)"
        />
      </NFormItem>

      <NFormItem label="显示背景">
        <NSwitch
          :value="component.props?.showBackground"
          @update:value="(val) => handlePropUpdate('showBackground', val)"
        />
      </NFormItem>

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

      <NDivider>样式配置</NDivider>

      <NFormItem label="图标大小">
        <NInputNumber
          :max="64"
          :min="16"
          :value="component.props?.iconSize"
          @update:value="(val) => handlePropUpdate('iconSize', val)"
        />
      </NFormItem>

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

      <NFormItem label="点击缩放">
        <NInputNumber
          :max="1.2"
          :min="1"
          :step="0.01"
          :value="component.props?.activeScale"
          @update:value="(val) => handlePropUpdate('activeScale', val)"
        />
      </NFormItem>

      <NDivider>动画配置</NDivider>

      <NFormItem label="启用动画">
        <NSwitch
          :value="component.props?.enableAnimation"
          @update:value="(val) => handlePropUpdate('enableAnimation', val)"
        />
      </NFormItem>

      <NFormItem label="动画类型">
        <NSelect
          :options="[
            { label: '缩放', value: 'scale' },
            { label: '淡入淡出', value: 'fade' },
            { label: '无', value: 'none' },
          ]"
          :value="component.props?.animationType"
          @update:value="(val) => handlePropUpdate('animationType', val)"
        />
      </NFormItem>

      <NDivider>响应式配置</NDivider>

      <NFormItem label="超小屏列数">
        <NInputNumber
          :max="6"
          :min="2"
          :value="component.props?.responsive?.xs"
          @update:value="(val) => handleResponsiveUpdate('xs', val)"
        />
      </NFormItem>

      <NFormItem label="小屏列数">
        <NInputNumber
          :max="6"
          :min="2"
          :value="component.props?.responsive?.sm"
          @update:value="(val) => handleResponsiveUpdate('sm', val)"
        />
      </NFormItem>

      <NFormItem label="中屏列数">
        <NInputNumber
          :max="8"
          :min="3"
          :value="component.props?.responsive?.md"
          @update:value="(val) => handleResponsiveUpdate('md', val)"
        />
      </NFormItem>

      <NFormItem label="大屏列数">
        <NInputNumber
          :max="8"
          :min="4"
          :value="component.props?.responsive?.lg"
          @update:value="(val) => handleResponsiveUpdate('lg', val)"
        />
      </NFormItem>

      <NFormItem label="超大屏列数">
        <NInputNumber
          :max="10"
          :min="4"
          :value="component.props?.responsive?.xl"
          @update:value="(val) => handleResponsiveUpdate('xl', val)"
        />
      </NFormItem>

      <NDivider>徽标样式</NDivider>

      <NFormItem label="背景颜色">
        <NInput
          :value="component.props?.badgeStyle?.backgroundColor"
          @update:value="
            (val) => handleBadgeStyleUpdate('backgroundColor', val)
          "
        />
      </NFormItem>

      <NFormItem label="文字颜色">
        <NInput
          :value="component.props?.badgeStyle?.textColor"
          @update:value="(val) => handleBadgeStyleUpdate('textColor', val)"
        />
      </NFormItem>

      <NFormItem label="圆角">
        <NInput
          :value="component.props?.badgeStyle?.borderRadius"
          @update:value="(val) => handleBadgeStyleUpdate('borderRadius', val)"
        />
      </NFormItem>

      <NFormItem label="内边距">
        <NInput
          :value="component.props?.badgeStyle?.padding"
          @update:value="(val) => handleBadgeStyleUpdate('padding', val)"
        />
      </NFormItem>
    </NForm>
  </div>
</template>

<style scoped>
.quick-nav-property {
  padding: 16px;
}
</style>
