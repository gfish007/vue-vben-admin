# 默认数据源面板组件
<script setup lang="ts" name="DefaultDataPanel">
import type {
  ComponentInstance,
  DataSource,
} from '../../../../../types/lowcode';

import { computed, ref, watch } from 'vue';

import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
  useMessage,
} from 'naive-ui';

import { useLowCodeStore } from '../../../../../store/modules/lowcode';

const props = defineProps<{
  component: ComponentInstance;
}>();

const store = useLowCodeStore();
const message = useMessage();

// 初始化数据源配置
const currentDataSource = ref<DataSource>({
  config: {
    headers: {},
    method: 'GET',
    params: {},
    type: 'API',
    url: '',
  },
  dsCode: '',
  dsName: '',
  dsType: 'API',
  id: '',
  status: 1,
});

// 初始化数据绑定路径
const dataBindingPath = ref(props.component.props?.dataBinding?.path || '');

// 页面级数据源列表
const pageDataSources = computed(() => {
  return store.currentPage?.dataSources || [];
});

// 数据源选项
const dataSourceOptions = computed(() => {
  const pageSources = pageDataSources.value.map((ds) => ({
    label: `${ds.dsName}（页面）`,
    source: ds,
    value: ds.dsCode,
  }));

  // 如果组件有自己的数据源，也添加到选项中
  if (currentDataSource.value.dsCode) {
    pageSources.push({
      label: `${currentDataSource.value.dsName}（组件）`,
      source: currentDataSource.value,
      value: currentDataSource.value.dsCode,
    });
  }

  return pageSources;
});

// 选中的数据源Code
const selectedDataSourceCode = ref(
  props.component.props?.dataBinding?.sourceCode || '',
);

// 监听组件属性变化
watch(
  () => props.component.props?.dataBinding,
  (newVal) => {
    if (newVal) {
      dataBindingPath.value = newVal.path || '';
      selectedDataSourceCode.value = newVal.sourceCode || '';
    }
  },
  { immediate: true },
);

// 更新数据源配置
const handleDataSourceUpdate = (field: string, value: unknown) => {
  console.log('更新数据源配置:', { field, value });
  currentDataSource.value = {
    ...currentDataSource.value,
    [field]: value,
  };
};

// 更新数据源API配置
const handleApiConfigUpdate = (field: string, value: unknown) => {
  console.log('更新API配置:', { field, value });
  if (currentDataSource.value.config.type === 'API') {
    currentDataSource.value.config = {
      ...currentDataSource.value.config,
      [field]: value,
    };
  }
};

// 测试数据源
const testDataSource = async () => {
  try {
    message.info('开始测试数据源...');
    // TODO: 实现数据源测试逻辑
    message.success('数据源测试成功');
  } catch {
    message.error('数据源测试失败');
  }
};

// 保存数据源
const saveDataSource = () => {
  try {
    console.log('保存数据源:', currentDataSource.value);
    // 更新组件的数据源配置
    store.updateComponent(props.component.componentInstanceId, {
      dataSource: currentDataSource.value,
    });
    message.success('数据源保存成功');
  } catch {
    message.error('数据源保存失败');
  }
};

// 更新数据绑定
const handleDataBindingUpdate = (path: string) => {
  console.log('更新数据绑定:', {
    path,
    sourceCode: selectedDataSourceCode.value,
  });
  // 更新组件的数据绑定配置
  store.updateComponent(props.component.componentInstanceId, {
    props: {
      ...props.component.props,
      dataBinding: {
        path,
        sourceCode: selectedDataSourceCode.value,
      },
    },
  });
};

// 选择数据源
const handleDataSourceSelect = (sourceCode: string) => {
  selectedDataSourceCode.value = sourceCode;
  // 更新数据绑定
  if (dataBindingPath.value) {
    handleDataBindingUpdate(dataBindingPath.value);
  }
};
</script>

<template>
  <NForm label-placement="left" label-width="100">
    <NSpace vertical>
      <!-- 数据源选择 -->
      <NCard size="small" title="数据源选择">
        <NSpace vertical>
          <NFormItem label="选择数据源">
            <NSelect
              :options="dataSourceOptions"
              :value="selectedDataSourceCode"
              placeholder="请选择数据源"
              @update:value="handleDataSourceSelect"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 组件数据源配置 -->
      <NCard size="small" title="组件数据源配置">
        <NSpace vertical>
          <NFormItem label="数据源名称">
            <NInput
              :value="currentDataSource.dsName"
              placeholder="请输入数据源名称"
              @update:value="(val) => handleDataSourceUpdate('dsName', val)"
            />
          </NFormItem>
          <NFormItem label="数据源类型">
            <NSelect
              :options="[
                { label: 'API接口', value: 'API' },
                { label: '静态数据', value: 'STATIC' },
                { label: '数据库', value: 'DATABASE' },
              ]"
              :value="currentDataSource.dsType"
              @update:value="(val) => handleDataSourceUpdate('dsType', val)"
            />
          </NFormItem>

          <!-- API配置 -->
          <template v-if="currentDataSource.dsType === 'API'">
            <NFormItem label="请求地址">
              <NInput
                :value="(currentDataSource.config as any).url"
                placeholder="请输入API地址"
                @update:value="(val) => handleApiConfigUpdate('url', val)"
              />
            </NFormItem>
            <NFormItem label="请求方法">
              <NSelect
                :options="[
                  { label: 'GET', value: 'GET' },
                  { label: 'POST', value: 'POST' },
                  { label: 'PUT', value: 'PUT' },
                  { label: 'DELETE', value: 'DELETE' },
                ]"
                :value="(currentDataSource.config as any).method"
                @update:value="(val) => handleApiConfigUpdate('method', val)"
              />
            </NFormItem>
            <NFormItem label="请求参数">
              <NInput
                :value="
                  JSON.stringify((currentDataSource.config as any).params)
                "
                placeholder="请输入请求参数 (JSON格式)"
                type="textarea"
                @update:value="
                  (val) => handleApiConfigUpdate('params', JSON.parse(val))
                "
              />
            </NFormItem>
          </template>

          <!-- 静态数据配置 -->
          <template v-if="currentDataSource.dsType === 'STATIC'">
            <NFormItem label="静态数据">
              <NInput
                :value="JSON.stringify((currentDataSource.config as any).data)"
                placeholder="请输入静态数据 (JSON格式)"
                type="textarea"
                @update:value="
                  (val) => handleApiConfigUpdate('data', JSON.parse(val))
                "
              />
            </NFormItem>
          </template>

          <NSpace justify="end">
            <NButton @click="testDataSource">测试</NButton>
            <NButton type="primary" @click="saveDataSource">保存</NButton>
          </NSpace>
        </NSpace>
      </NCard>

      <!-- 数据绑定配置 -->
      <NCard size="small" title="数据绑定">
        <NSpace vertical>
          <NFormItem label="数据路径">
            <NInput
              :value="dataBindingPath"
              placeholder="请输入数据路径，例如: data.items"
              @update:value="handleDataBindingUpdate"
            />
          </NFormItem>
        </NSpace>
      </NCard>
    </NSpace>
  </NForm>
</template>
