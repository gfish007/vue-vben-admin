<script setup lang="ts" name="PropertyPanel">
import type { ComponentInstance } from '../../../../types/lowcode';

import { computed, watch } from 'vue';

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
import * as componentRenders from './definitions';

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
    // 强制重新计算
    currentComponent.value;
  },
  { deep: true, immediate: true },
);

// 自定义样式
const customStyle = computed(() => {
  if (!currentComponent.value || !currentComponent.value.style) return '';
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

// 获取自定义属性面板组件
const customPropertyPanel = computed(() => {
  if (!currentComponent.value) {
    console.log('[PropertyPanel] 未选择组件');
    return null;
  }

  // 打印完整的组件信息
  console.log('[PropertyPanel] 当前组件完整信息:', {
    availableComponents: Object.keys(componentRenders),
    availablePanels: Object.keys(componentRenders).filter((key) =>
      key.endsWith('Property'),
    ),
    component: currentComponent.value,
  });

  try {
    // 检查组件是否有自定义属性面板
    if (!currentComponent.value.hasCustomPropertyPanel) {
      console.log(
        '[PropertyPanel] 组件没有自定义面板:',
        currentComponent.value.componentCode,
        '是否有自定义面板:',
        currentComponent.value.hasCustomPropertyPanel,
      );
      return null;
    }

    // 尝试加载自定义属性面板
    const panelName = `${currentComponent.value.componentCode}Property`;
    console.log('[PropertyPanel] 加载尝试:', {
      // 打印所有可用的面板组件
      allPanels: Object.entries(componentRenders).reduce(
        (acc, [key, value]) => {
          acc[key] = typeof value;
          return acc;
        },
        {} as Record<string, string>,
      ),
      availableComponents: Object.keys(componentRenders),
      componentCode: currentComponent.value.componentCode,
      panel: componentRenders[panelName as keyof typeof componentRenders],
      panelName,
    });
    const panel = componentRenders[panelName as keyof typeof componentRenders];

    if (panel) {
      console.log(
        '[PropertyPanel] 成功加载自定义面板:',
        currentComponent.value.componentCode,
        '面板类型:',
        typeof panel,
      );
    } else {
      console.log(
        '[PropertyPanel] 加载自定义面板失败。可用面板:',
        Object.keys(componentRenders).filter((key) => key.endsWith('Property')),
        '尝试加载的面板名称:',
        panelName,
      );
    }

    return panel || null;
  } catch (error) {
    console.error('[PropertyPanel] 加载自定义面板错误:', error);
    return null;
  }
});
</script>

<template>
  <div class="property-panel">
    <template v-if="currentComponent">
      <!-- 使用自定义属性面板或默认属性面板 -->
      <component
        :is="customPropertyPanel"
        v-if="customPropertyPanel"
        :component="currentComponent"
        @mounted="
          () =>
            console.log('自定义属性面板已挂载:', currentComponent.componentCode)
        "
      />
      <NTabs v-else type="segment">
        <NTabPane name="props" tab="属性">
          <NForm label-placement="left" label-width="100">
            <!-- 默认属性面板内容 -->
            <NFormItem
              v-for="(schema, field) in currentComponent.propsSchema"
              :key="field"
              :label="schema.label"
            >
              <!-- 输入框 -->
              <NInput
                v-if="schema.type === 'input'"
                :value="currentComponent.props?.[field]"
                clearable
                placeholder="请输入"
                @update:value="(val) => handlePropUpdate(field, val)"
              />

              <!-- 数字输入框 -->
              <NInputNumber
                v-else-if="schema.type === 'number'"
                :max="schema.max"
                :min="schema.min"
                :value="currentComponent.props?.[field]"
                clearable
                placeholder="请输入"
                @update:value="(val) => handlePropUpdate(field, val)"
              />

              <!-- 选择器 -->
              <NSelect
                v-else-if="schema.type === 'select'"
                :options="schema.options"
                :value="currentComponent.props?.[field]"
                clearable
                placeholder="请选择"
                @update:value="(val) => handlePropUpdate(field, val)"
              />

              <!-- 开关 -->
              <NSwitch
                v-else-if="schema.type === 'switch'"
                :value="currentComponent.props?.[field]"
                @update:value="(val) => handlePropUpdate(field, val)"
              />

              <!-- 单选组 -->
              <NRadioGroup
                v-else-if="schema.type === 'radio'"
                :name="field"
                :options="schema.options"
                :value="currentComponent.props?.[field]"
                @update:value="(val) => handlePropUpdate(field, val)"
              />

              <!-- 多选组 -->
              <NCheckboxGroup
                v-else-if="schema.type === 'checkbox'"
                :options="schema.options"
                :value="currentComponent.props?.[field]"
                @update:value="(val) => handlePropUpdate(field, val)"
              />
            </NFormItem>
          </NForm>
        </NTabPane>

        <NTabPane name="style" tab="样式">
          <NForm label-placement="left" label-width="100">
            <!-- 默认样式面板内容 -->
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
                      :value="currentComponent.style?.display"
                      @update:value="(val) => handleStyleUpdate('display', val)"
                    />
                  </NFormItem>

                  <!-- Flex 布局属性 -->
                  <template v-if="currentComponent.style?.display === 'flex'">
                    <NFormItem label="主轴方向">
                      <NSelect
                        :options="[
                          { label: '垂直排列', value: 'column' },
                          { label: '水平排列', value: 'row' },
                          { label: '垂直反向', value: 'column-reverse' },
                          { label: '水平反向', value: 'row-reverse' },
                        ]"
                        :value="currentComponent.style?.flexDirection"
                        @update:value="
                          (val) => handleStyleUpdate('flexDirection', val)
                        "
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
                        :value="currentComponent.style?.justifyContent"
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
                        :value="currentComponent.style?.alignItems"
                        @update:value="
                          (val) => handleStyleUpdate('alignItems', val)
                        "
                      />
                    </NFormItem>
                    <NFormItem label="换行方式">
                      <NSelect
                        :options="[
                          { label: '不换行', value: 'nowrap' },
                          { label: '换行', value: 'wrap' },
                          { label: '反向换行', value: 'wrap-reverse' },
                        ]"
                        :value="currentComponent.style?.flexWrap"
                        @update:value="
                          (val) => handleStyleUpdate('flexWrap', val)
                        "
                      />
                    </NFormItem>
                    <NFormItem label="多行对齐">
                      <NSelect
                        :options="[
                          { label: '默认', value: 'normal' },
                          { label: '起点对齐', value: 'flex-start' },
                          { label: '居中对齐', value: 'center' },
                          { label: '终点对齐', value: 'flex-end' },
                          { label: '两端对齐', value: 'space-between' },
                          { label: '环绕对齐', value: 'space-around' },
                          { label: '拉伸对齐', value: 'stretch' },
                        ]"
                        :value="currentComponent.style?.alignContent"
                        @update:value="
                          (val) => handleStyleUpdate('alignContent', val)
                        "
                      />
                    </NFormItem>
                  </template>

                  <!-- Grid 布局属性 -->
                  <template v-if="currentComponent.style?.display === 'grid'">
                    <NFormItem label="网格列">
                      <NInput
                        :value="currentComponent.style?.gridTemplateColumns"
                        placeholder="例如: 100px 100px 100px"
                        @update:value="
                          (val) => handleStyleUpdate('gridTemplateColumns', val)
                        "
                      />
                    </NFormItem>
                    <NFormItem label="网格行">
                      <NInput
                        :value="currentComponent.style?.gridTemplateRows"
                        placeholder="例如: 100px 100px"
                        @update:value="
                          (val) => handleStyleUpdate('gridTemplateRows', val)
                        "
                      />
                    </NFormItem>
                  </template>

                  <!-- Float 布局属性 -->
                  <template v-if="currentComponent.style?.display === 'float'">
                    <NFormItem label="浮动">
                      <NSelect
                        :options="[
                          { label: '无', value: 'none' },
                          { label: '左浮动', value: 'left' },
                          { label: '右浮动', value: 'right' },
                        ]"
                        :value="currentComponent.style?.float"
                        @update:value="(val) => handleStyleUpdate('float', val)"
                      />
                    </NFormItem>
                  </template>

                  <!-- Position 布局属性 -->
                  <template v-if="currentComponent.style?.position">
                    <NFormItem label="定位方式">
                      <NSelect
                        :options="[
                          { label: '相对定位', value: 'relative' },
                          { label: '绝对定位', value: 'absolute' },
                          { label: '固定定位', value: 'fixed' },
                          { label: '粘性定位', value: 'sticky' },
                        ]"
                        :value="currentComponent.style?.position"
                        @update:value="
                          (val) => handleStyleUpdate('position', val)
                        "
                      />
                    </NFormItem>
                    <NFormItem label="上边距">
                      <NInput
                        :value="currentComponent.style?.top"
                        @update:value="(val) => handleStyleUpdate('top', val)"
                      />
                    </NFormItem>
                    <NFormItem label="右边距">
                      <NInput
                        :value="currentComponent.style?.right"
                        @update:value="(val) => handleStyleUpdate('right', val)"
                      />
                    </NFormItem>
                    <NFormItem label="下边距">
                      <NInput
                        :value="currentComponent.style?.bottom"
                        @update:value="
                          (val) => handleStyleUpdate('bottom', val)
                        "
                      />
                    </NFormItem>
                    <NFormItem label="左边距">
                      <NInput
                        :value="currentComponent.style?.left"
                        @update:value="(val) => handleStyleUpdate('left', val)"
                      />
                    </NFormItem>
                  </template>

                  <NFormItem label="间距">
                    <NInput
                      :value="currentComponent.style?.gap"
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
                      :value="currentComponent.style?.width"
                      clearable
                      placeholder="请输入"
                      @update:value="(val) => handleStyleUpdate('width', val)"
                    />
                  </NFormItem>
                  <NFormItem label="高度">
                    <NInput
                      :value="currentComponent.style?.height"
                      clearable
                      placeholder="请输入"
                      @update:value="(val) => handleStyleUpdate('height', val)"
                    />
                  </NFormItem>
                  <NFormItem label="最小宽度">
                    <NInput
                      :value="currentComponent.style?.minWidth"
                      clearable
                      placeholder="请输入"
                      @update:value="
                        (val) => handleStyleUpdate('minWidth', val)
                      "
                    />
                  </NFormItem>
                  <NFormItem label="最小高度">
                    <NInput
                      :value="currentComponent.style?.minHeight"
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
                      :value="currentComponent.style?.padding"
                      clearable
                      placeholder="请输入"
                      @update:value="(val) => handleStyleUpdate('padding', val)"
                    />
                  </NFormItem>
                  <NFormItem label="外边距">
                    <NInput
                      :value="currentComponent.style?.margin"
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
                      :value="currentComponent.style?.backgroundColor"
                      @update:value="
                        (val) => handleStyleUpdate('backgroundColor', val)
                      "
                    />
                  </NFormItem>
                  <NFormItem label="边框">
                    <NInput
                      :value="currentComponent.style?.border"
                      clearable
                      placeholder="请输入"
                      @update:value="(val) => handleStyleUpdate('border', val)"
                    />
                  </NFormItem>
                  <NFormItem label="圆角">
                    <NInput
                      :value="currentComponent.style?.borderRadius"
                      clearable
                      placeholder="请输入"
                      @update:value="
                        (val) => handleStyleUpdate('borderRadius', val)
                      "
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

  /* 深度选择器，用于修改子组件样式 */
  :deep(.n-form) {
    .n-form-item {
      margin-bottom: 12px;
    }
  }

  /* 卡片组件样式调整 */
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
