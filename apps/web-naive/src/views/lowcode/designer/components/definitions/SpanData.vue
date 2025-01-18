<script setup lang="ts" name="SpanData">
import type { ComponentInstance } from '../../../../../types/lowcode';

import { computed, nextTick, ref, watch } from 'vue';

import {
  NAutoComplete,
  NButton,
  NCard,
  NCheckbox,
  NForm,
  NFormItem,
  NInput,
  NPopconfirm,
  NRadio,
  NRadioGroup,
  NSelect,
  NSpace,
} from 'naive-ui';

import { useLowCodeStore } from '../../../../../store/modules/lowcode';

const props = defineProps<{
  component: ComponentInstance;
}>();

const store = useLowCodeStore();

// 字段绑定配置
interface FieldBinding {
  dsCode: string;
  path: string;
  field: string;
  defaultValue: any;
  required: boolean;
  pathOptions?: { label: string; value: string }[];
}

const fieldBindings = ref<FieldBinding[]>([]);
const previewData = ref<Record<string, any>>({});
const previewError = ref<string>('');
const loading = ref(false);

// 数据模式
const bindingMode = ref<'dynamic' | 'static'>(
  props.component?.dataBinding ? 'dynamic' : 'static',
);

// 监听组件变化，更新数据模式
watch(
  () => props.component?.dataBinding,
  (newVal) => {
    bindingMode.value = newVal ? 'dynamic' : 'static';
  },
);

// 数据预览功能
const updatePreview = async () => {
  if (fieldBindings.value.length === 0) {
    previewData.value = {};
    return;
  }

  try {
    previewError.value = '';
    const previewValues: Record<string, any> = {};

    for (const binding of fieldBindings.value) {
      if (!binding.dsCode) continue;

      try {
        // 获取数据源数据
        const dataSource = store.currentPage?.dataSources?.find(
          (ds) => ds.dsCode === binding.dsCode,
        );

        if (!dataSource) {
          previewValues[binding.field] = binding.defaultValue;
          continue;
        }

        let dsData;
        if (dataSource.dsType === 'STATIC') {
          // 如果是静态数据源，直接使用 config.data
          dsData =
            typeof dataSource.config.data === 'string'
              ? JSON.parse(dataSource.config.data || '{}')
              : dataSource.config.data;
        } else {
          // 其他类型的数据源
          dsData = await store.getDataSourceData(binding.dsCode);
        }

        if (!dsData) {
          previewValues[binding.field] = binding.defaultValue;
          continue;
        }

        // 使用路径获取值
        let value = dsData;
        if (binding.path) {
          try {
            // 移除类型信息 (string) 等
            const cleanPath = binding.path.replace(/\s*\([^)]*\)\s*$/, '');
            const keys = cleanPath.split('.');
            for (const key of keys) {
              if (value === undefined || value === null) break;
              value = value[key];
            }
          } catch (error) {
            console.error('获取路径数据失败:', error);
            value = undefined;
          }
        }

        previewValues[binding.field] = value ?? binding.defaultValue;
      } catch (error) {
        console.error('获取预览数据失败:', error);
        previewValues[binding.field] = binding.defaultValue;
      }
    }

    previewData.value = previewValues;
  } catch (error: any) {
    console.error('预览更新失败:', error);
    previewError.value = error.message || '预览失败';
  }
};

// 初始化字段绑定
const initFieldBindings = () => {
  if (!props.component?.dataBinding) {
    fieldBindings.value = [];
    return;
  }

  // 处理数组或单个对象的情况
  const bindings = Array.isArray(props.component.dataBinding)
    ? props.component.dataBinding
    : [props.component.dataBinding];

  // 使用现有的数据绑定初始化
  fieldBindings.value = bindings.map((binding) => ({
    defaultValue: binding.defaultValue || '',
    dsCode: binding.dsCode || '',
    field: binding.field || 'content',
    path: binding.path || '',
    required: true,
  }));

  // 初始化后更新预览
  updatePreview();
};

// 监听组件变化，初始化字段绑定
watch(() => props.component, initFieldBindings, { immediate: true });

// 计算数据源选项
const dataSourceOptions = computed(() => {
  const pageSources = store.currentPage?.dataSources || [];
  return pageSources.map((ds) => ({
    label: `${ds.dsName} (${ds.dsCode})`,
    value: ds.dsCode,
  }));
});

// 智能路径提示
const getPathSuggestions = async (dsCode: string) => {
  try {
    // 获取数据源
    const dataSource = store.currentPage?.dataSources?.find(
      (ds) => ds.dsCode === dsCode,
    );

    if (!dataSource) return [];

    let dsData;
    if (dataSource.dsType === 'STATIC') {
      // 如果是静态数据源，直接使用 config.data
      dsData =
        typeof dataSource.config.data === 'string'
          ? JSON.parse(dataSource.config.data || '{}')
          : dataSource.config.data;
    } else {
      // 其他类型的数据源
      dsData = await store.getDataSourceData(dsCode);
    }

    return generatePathOptions(dsData);
  } catch (error) {
    console.error('获取路径建议失败:', error);
    return [];
  }
};

// 递归生成路径选项
const generatePathOptions = (data: any) => {
  const options: { label: string; value: string }[] = [];

  const addOption = (path: string, value: any) => {
    options.push({
      label: `${path} (${typeof value})`,
      value: path,
    });
  };

  const traverse = (obj: any, path = '') => {
    if (!obj || typeof obj !== 'object') return;

    Object.entries(obj).forEach(([key, value]) => {
      const currentPath = path ? `${path}.${key}` : key;
      addOption(currentPath, value);

      if (value && typeof value === 'object') {
        traverse(value, currentPath);
      }
    });
  };

  traverse(data);
  return options;
};

// 添加字段绑定
const addFieldBinding = () => {
  fieldBindings.value.push({
    defaultValue: '',
    dsCode: '',
    field: `field${fieldBindings.value.length + 1}`,
    path: '',
    required: false,
  });
};

// 更新数据绑定
const updateDataBinding = () => {
  if (!props.component?.componentInstanceId || fieldBindings.value.length === 0)
    return;

  // 只使用第一个字段绑定
  const firstBinding = fieldBindings.value[0];

  console.log('更新数据绑定:', {
    binding: firstBinding,
    componentId: props.component.componentInstanceId,
  });

  // 更新组件
  store.updateComponent(props.component.componentInstanceId, {
    dataBinding: {
      dsCode: firstBinding.dsCode,
      path: firstBinding.path,
    },
    props: {
      ...props.component.props,
      content: null, // 清除静态内容
    },
  });

  // 强制更新预览
  nextTick(() => {
    updatePreview();
  });
};

// 处理静态内容更新
const handleContentUpdate = (content: string) => {
  if (!props.component?.componentInstanceId) return;

  store.updateComponent(props.component.componentInstanceId, {
    dataBinding: null,
    props: {
      ...props.component.props,
      content,
    },
  });
};

// 生成转换函数
const generateTransform = () => {
  const fields = fieldBindings.value
    .map(
      (binding) =>
        `const ${binding.field} = DS.${binding.dsCode}${
          binding.path ? `.${binding.path}` : ''
        } ?? ${JSON.stringify(binding.defaultValue)};`,
    )
    .join('\n');

  return `
    ${fields}
    return [${fieldBindings.value.map((b) => b.field).join(', ')}].join('-');
  `;
};

// 处理模式切换
const handleModeChange = (mode: 'dynamic' | 'static') => {
  if (!props.component?.componentInstanceId) return;
  bindingMode.value = mode;

  if (mode === 'static') {
    fieldBindings.value = [];
    store.updateComponent(props.component.componentInstanceId, {
      dataBinding: null,
      props: {
        ...props.component.props,
        content: '',
      },
    });
  } else {
    // 如果有现有的数据绑定，初始化字段
    if (props.component.dataBinding) {
      initFieldBindings();
    } else {
      // 否则添加一个空的字段绑定
      fieldBindings.value = [
        {
          defaultValue: '',
          dsCode: '',
          field: 'content',
          path: '',
          required: true,
        },
      ];
    }
  }
};

// 删除字段绑定
const removeFieldBinding = (index: number) => {
  fieldBindings.value.splice(index, 1);
  if (fieldBindings.value.length === 0) {
    // 如果删除后没有字段，切换回静态模式
    handleModeChange('static');
  }
};

// 监听字段绑定变化，更新预览和数据绑定
watch(
  fieldBindings,
  () => {
    updatePreview();
    // 延迟更新数据绑定，避免预览闪烁
    setTimeout(() => {
      updateDataBinding();
    }, 0);
  },
  { deep: true },
);

// 监听数据源变化，更新预览
watch(
  () => store.currentPage?.dataSources,
  () => {
    updatePreview();
  },
  { deep: true },
);
</script>

<script lang="ts">
export default {
  name: 'SpanData',
};
</script>

<template>
  <NCard size="small" title="数据配置">
    <NForm label-placement="left" label-width="80">
      <NFormItem label="数据模式">
        <NRadioGroup
          v-model:value="bindingMode"
          @update:value="handleModeChange"
        >
          <NRadio value="static">静态文本</NRadio>
          <NRadio value="dynamic">动态数据</NRadio>
        </NRadioGroup>
      </NFormItem>

      <!-- 静态文本输入 -->
      <NFormItem v-if="bindingMode === 'static'" label="文本内容">
        <NInput
          :autosize="{
            minRows: 3,
            maxRows: 5,
          }"
          :value="props.component?.props?.content"
          placeholder="请输入静态文本"
          type="textarea"
          @update:value="handleContentUpdate"
        />
      </NFormItem>

      <!-- 动态数据配置 -->
      <template v-else>
        <div v-for="(binding, index) in fieldBindings" :key="index">
          <NCard :title="`字段 ${index + 1}`" class="mb-4" size="small">
            <template #header-extra>
              <NPopconfirm
                v-if="fieldBindings.length > 1"
                @positive-click="removeFieldBinding(index)"
              >
                <template #trigger>
                  <NButton text type="error"> 删除 </NButton>
                </template>
                确定要删除该字段吗？
              </NPopconfirm>
            </template>
            <NSpace vertical>
              <NFormItem label="数据源">
                <NSelect
                  v-model:value="binding.dsCode"
                  :options="dataSourceOptions"
                  placeholder="选择数据源"
                />
              </NFormItem>

              <NFormItem label="数据路径">
                <NAutoComplete
                  v-model:value="binding.path"
                  :loading="loading"
                  :options="binding.pathOptions || []"
                  placeholder="输入或选择数据路径"
                  @focus="
                    async () => {
                      if (binding.dsCode) {
                        loading = true;
                        try {
                          const options = await getPathSuggestions(
                            binding.dsCode,
                          );
                          binding.pathOptions = options;
                        } finally {
                          loading = false;
                        }
                      }
                    }
                  "
                />
              </NFormItem>

              <NFormItem label="字段名称">
                <NInput
                  v-model:value="binding.field"
                  :disabled="index === 0"
                  placeholder="输入字段名称"
                />
              </NFormItem>

              <NFormItem label="默认值">
                <NInput
                  v-model:value="binding.defaultValue"
                  placeholder="输入默认值"
                />
              </NFormItem>

              <NFormItem>
                <NCheckbox v-model:value="binding.required">
                  必填字段
                </NCheckbox>
              </NFormItem>
            </NSpace>
          </NCard>
        </div>

        <NButton class="mb-4" @click="addFieldBinding"> 添加字段 </NButton>

        <!-- 数据预览 -->
        <NCard size="small" title="数据预览">
          <template v-if="!previewError">
            <div
              v-for="(value, field) in previewData"
              :key="field"
              class="preview-field"
            >
              <span class="field-name">{{ field }}:</span>
              <span class="field-value">
                {{ typeof value === 'object' ? JSON.stringify(value) : value }}
              </span>
            </div>
          </template>
          <template v-else>
            <div class="preview-error">
              {{ previewError }}
            </div>
          </template>
        </NCard>
      </template>
    </NForm>
  </NCard>
</template>

<style scoped>
.preview-field {
  display: flex;
  gap: 8px;
  padding: 4px 0;
}

.field-name {
  font-weight: bold;
  color: #666;
}

.preview-error {
  padding: 8px;
  color: #f00;
  background: #fff2f0;
  border-radius: 4px;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>
