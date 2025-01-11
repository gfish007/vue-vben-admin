# 默认数据源面板组件
<script setup lang="ts">
import type {
  ComponentInstance,
  DataSource,
} from '../../../../../types/lowcode';

import { ref } from 'vue';

import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
  NTabPane,
  NTabs,
} from 'naive-ui';

import { useLowCodeStore } from '../../../../../store/modules/lowcode';

const props = defineProps<{
  component: ComponentInstance;
}>();

const store = useLowCodeStore();

// 数据源类型选项
const dataSourceTypeOptions = [
  { label: 'API', value: 'API' },
  { label: '数据库', value: 'DATABASE' },
  { label: '静态数据', value: 'STATIC' },
];

// 请求方法选项
const httpMethodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
];

// 当前数据源
const currentDataSource = ref<DataSource>({
  config: {
    body: {},
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

// 更新数据源配置
const handleDataSourceUpdate = (field: string, value: unknown) => {
  console.log('[DefaultDataPanel] 更新数据源配置:', { field, value });
  store.updateComponent(props.component.componentInstanceId, {
    dataSource: currentDataSource.value,
  });
};

// 测试数据源
const handleTestDataSource = () => {
  console.log('[DefaultDataPanel] 测试数据源:', currentDataSource.value);
  // TODO: 实现数据源测试逻辑
};

// 保存数据源
const handleSaveDataSource = () => {
  console.log('[DefaultDataPanel] 保存数据源:', currentDataSource.value);
  // TODO: 实现数据源保存逻辑
};
</script>

<template>
  <NTabs type="segment">
    <!-- 数据源配置 -->
    <NTabPane name="config" tab="数据源配置">
      <NForm label-placement="left" label-width="100">
        <NSpace vertical>
          <NCard size="small" title="基础配置">
            <NSpace size="small" vertical>
              <NFormItem label="数据源名称">
                <NInput
                  v-model="currentDataSource.dsName"
                  placeholder="请输入数据源名称"
                />
              </NFormItem>
              <NFormItem label="数据源类型">
                <NSelect
                  v-model="currentDataSource.dsType"
                  :options="dataSourceTypeOptions"
                  placeholder="请选择数据源类型"
                />
              </NFormItem>
            </NSpace>
          </NCard>

          <!-- API 数据源配置 -->
          <template v-if="currentDataSource.dsType === 'API'">
            <NCard size="small" title="API 配置">
              <NSpace size="small" vertical>
                <NFormItem label="请求地址">
                  <NInput
                    v-model="(currentDataSource.config as any).url"
                    placeholder="请输入请求地址"
                  />
                </NFormItem>
                <NFormItem label="请求方法">
                  <NSelect
                    v-model="(currentDataSource.config as any).method"
                    :options="httpMethodOptions"
                    placeholder="请选择请求方法"
                  />
                </NFormItem>
                <NFormItem label="请求头">
                  <NInput
                    v-model="(currentDataSource.config as any).headers"
                    :autosize="{ minRows: 2, maxRows: 5 }"
                    placeholder="请输入请求头（JSON 格式）"
                    type="textarea"
                  />
                </NFormItem>
                <NFormItem label="请求参数">
                  <NInput
                    v-model="(currentDataSource.config as any).params"
                    :autosize="{ minRows: 2, maxRows: 5 }"
                    placeholder="请输入请求参数（JSON 格式）"
                    type="textarea"
                  />
                </NFormItem>
                <NFormItem label="请求体">
                  <NInput
                    v-model="(currentDataSource.config as any).body"
                    :autosize="{ minRows: 2, maxRows: 5 }"
                    placeholder="请输入请求体（JSON 格式）"
                    type="textarea"
                  />
                </NFormItem>
              </NSpace>
            </NCard>
          </template>

          <!-- 数据库数据源配置 -->
          <template v-if="currentDataSource.dsType === 'DATABASE'">
            <NCard size="small" title="数据库配置">
              <NSpace size="small" vertical>
                <NFormItem label="主机地址">
                  <NInput
                    v-model="(currentDataSource.config as any).host"
                    placeholder="请输入主机地址"
                  />
                </NFormItem>
                <NFormItem label="端口">
                  <NInput
                    v-model="(currentDataSource.config as any).port"
                    placeholder="请输入端口"
                  />
                </NFormItem>
                <NFormItem label="数据库名">
                  <NInput
                    v-model="(currentDataSource.config as any).database"
                    placeholder="请输入数据库名"
                  />
                </NFormItem>
                <NFormItem label="用户名">
                  <NInput
                    v-model="(currentDataSource.config as any).username"
                    placeholder="请输入用户名"
                  />
                </NFormItem>
                <NFormItem label="密码">
                  <NInput
                    v-model="(currentDataSource.config as any).password"
                    placeholder="请输入密码"
                    type="password"
                  />
                </NFormItem>
                <NFormItem label="SQL 语句">
                  <NInput
                    v-model="(currentDataSource.config as any).sql"
                    :autosize="{ minRows: 2, maxRows: 5 }"
                    placeholder="请输入 SQL 语句"
                    type="textarea"
                  />
                </NFormItem>
              </NSpace>
            </NCard>
          </template>

          <!-- 静态数据源配置 -->
          <template v-if="currentDataSource.dsType === 'STATIC'">
            <NCard size="small" title="静态数据配置">
              <NSpace size="small" vertical>
                <NFormItem label="静态数据">
                  <NInput
                    v-model="(currentDataSource.config as any).data"
                    :autosize="{ minRows: 3, maxRows: 10 }"
                    placeholder="请输入静态数据（JSON 格式）"
                    type="textarea"
                  />
                </NFormItem>
              </NSpace>
            </NCard>
          </template>

          <!-- 操作按钮 -->
          <NSpace justify="end">
            <NButton @click="handleTestDataSource">测试数据源</NButton>
            <NButton type="primary" @click="handleSaveDataSource">
              保存数据源
            </NButton>
          </NSpace>
        </NSpace>
      </NForm>
    </NTabPane>

    <!-- 数据绑定 -->
    <NTabPane name="binding" tab="数据绑定">
      <NForm label-placement="left" label-width="100">
        <NSpace vertical>
          <NCard size="small" title="数据映射">
            <NSpace size="small" vertical>
              <NFormItem label="数据路径">
                <NInput placeholder="请输入数据路径，例如：data.list" />
              </NFormItem>
              <NFormItem label="字段映射">
                <NInput
                  :autosize="{ minRows: 3, maxRows: 10 }"
                  placeholder="请输入字段映射（JSON 格式）"
                  type="textarea"
                />
              </NFormItem>
            </NSpace>
          </NCard>

          <!-- 操作按钮 -->
          <NSpace justify="end">
            <NButton type="primary">保存映射</NButton>
          </NSpace>
        </NSpace>
      </NForm>
    </NTabPane>
  </NTabs>
</template>
