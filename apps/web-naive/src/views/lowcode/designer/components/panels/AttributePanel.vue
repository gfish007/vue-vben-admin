<script setup lang="ts" name="AttributePanel">
import { computed, ref } from 'vue';

import {
  NButton,
  NCard,
  NCode,
  NForm,
  NFormItem,
  NInput,
  NPopover,
  NSelect,
  NSpace,
  useMessage,
} from 'naive-ui';

import { useLowCodeStore } from '../../../../../store/modules/lowcode';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
}>();

const store = useLowCodeStore();
const message = useMessage();

// 当前选中的组件
const selectedComponent = computed(() => store.selectedComponent);

// 绑定类型选项
const bindingTypeOptions = [
  { label: '静态值', value: 'static' },
  { label: '数据源绑定', value: 'dataSource' },
  { label: '表达式绑定', value: 'expression' },
  { label: '变量绑定', value: 'variable' },
];

// 数据源列表
const dataSources = computed(() => store.currentPage?.dataSources || []);

// 当前属性的绑定配置
const currentBinding = ref({
  dataSource: '',
  expression: '',
  type: 'static',
  value: '',
  variable: '',
});

// 预览值
const previewValue = ref('');

// 更新组件属性
const updateComponentProperty = (prop: string, value: any) => {
  if (!selectedComponent.value) return;

  const component = { ...selectedComponent.value };
  component.props = { ...component.props, [prop]: value };
  store.updateComponent(component);
};

// 处理绑定配置变更
const handleBindingChange = (prop: string) => {
  const binding = currentBinding.value;
  let value: any = null;

  switch (binding.type) {
    case 'static': {
      value = binding.value;
      break;
    }
    case 'dataSource': {
      value = {
        source: binding.dataSource,
        type: 'dataSource',
      };
      break;
    }
    case 'expression': {
      value = {
        expression: binding.expression,
        type: 'expression',
      };
      break;
    }
    case 'variable': {
      value = {
        name: binding.variable,
        type: 'variable',
      };
      break;
    }
  }

  updateComponentProperty(prop, value);
  updatePreview();
};

// 更新预览值
const updatePreview = async () => {
  const binding = currentBinding.value;
  try {
    switch (binding.type) {
      case 'static': {
        previewValue.value = binding.value;
        break;
      }
      case 'dataSource': {
        const ds = dataSources.value.find(
          (d) => d.dsCode === binding.dataSource,
        );
        previewValue.value =
          ds?.dsType === 'STATIC'
            ? JSON.stringify(JSON.parse(ds.config.data), null, 2)
            : '数据源将在运行时获取';
        break;
      }
      case 'expression': {
        // 安全的表达式求值
        const evalResult = new Function(`return ${binding.expression}`)();
        previewValue.value = JSON.stringify(evalResult, null, 2);
        break;
      }
      case 'variable': {
        previewValue.value = '变量将在运行时获取';
        break;
      }
    }
  } catch (error) {
    previewValue.value = `预览失败: ${error instanceof Error ? error.message : String(error)}`;
  }
};

// 渲染属性编辑器
const renderPropertyEditor = (prop: string, config: any) => {
  const binding = currentBinding.value;

  return (
    <NFormItem label={config.label || prop}>
      <NSpace vertical>
        <NSelect
          onChange={() => handleBindingChange(prop)}
          options={bindingTypeOptions}
          v-model:value={binding.type}
        />

        {binding.type === 'static' && (
          <NInput
            onChange={() => handleBindingChange(prop)}
            placeholder="请输入静态值"
            v-model:value={binding.value}
          />
        )}

        {binding.type === 'dataSource' && (
          <NSelect
            onChange={() => handleBindingChange(prop)}
            options={dataSources.value.map((ds) => ({
              label: ds.dsName,
              value: ds.dsCode,
            }))}
            v-model:value={binding.dataSource}
          />
        )}

        {binding.type === 'expression' && (
          <NInput
            onChange={() => handleBindingChange(prop)}
            placeholder="请输入JavaScript表达式"
            type="textarea"
            v-model:value={binding.expression}
          />
        )}

        {binding.type === 'variable' && (
          <NInput
            onChange={() => handleBindingChange(prop)}
            placeholder="请输入变量名"
            v-model:value={binding.variable}
          />
        )}

        <NPopover trigger="hover">
          {{
            default: () => <NCode code={previewValue.value} language="json" />,
            trigger: () => (
              <NButton text type="primary">
                预览绑定值
              </NButton>
            ),
          }}
        </NPopover>
      </NSpace>
    </NFormItem>
  );
};
</script>

<template>
  <NCard v-if="selectedComponent" size="small" title="属性配置">
    <NForm label-placement="left" label-width="100">
      <template v-for="(config, prop) in selectedComponent.props" :key="prop">
        <component :is="renderPropertyEditor(prop, config)" />
      </template>
    </NForm>
  </NCard>
</template>
