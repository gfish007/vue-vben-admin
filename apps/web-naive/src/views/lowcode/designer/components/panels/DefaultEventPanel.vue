# 默认事件面板组件
<script setup lang="ts">
import type {
  ComponentInstance,
  EventConfig,
} from '../../../../../types/lowcode';

import { computed, onMounted, ref } from 'vue';

import {
  NButton,
  NCard,
  NCode,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
  NTabPane,
  NTabs,
  useMessage,
} from 'naive-ui';

import { useLowCodeStore } from '../../../../../store/modules/lowcode';

const props = defineProps<{
  component: ComponentInstance;
}>();

const store = useLowCodeStore();
const message = useMessage();

// 加载全局数据源
onMounted(async () => {
  try {
    await store.loadGlobalDataSources();
  } catch (error) {
    console.error('Failed to load global data sources:', error);
    message.error('加载全局数据源失败');
  }
});

// 全局数据源列表
const globalDataSources = computed(() => store.globalDataSources || []);

// 页面数据源列表
const pageDataSources = computed(() => store.currentPage?.dataSources || []);

// 所有可用的数据源列表
const allDataSources = computed(() => {
  const globalDsList = globalDataSources.value.map((ds) => ({
    ...ds,
    label: `【全局】${ds.dsName}`,
    value: ds.dsCode,
  }));

  const pageDsList = pageDataSources.value.map((ds) => ({
    ...ds,
    label: ds.dsName,
    value: ds.dsCode,
  }));

  return [...globalDsList, ...pageDsList];
});

// 事件类型选项
const eventTypeOptions = [
  { label: '数据源操作', value: 'dataSource' },
  { label: 'API 调用', value: 'api' },
  { label: '自定义函数', value: 'function' },
];

// 数据源操作类型
const dataSourceActionTypes = [
  { label: '加载数据', value: 'loadData' },
  { label: '刷新数据', value: 'refreshData' },
  { label: '清除数据', value: 'clearData' },
];

// 当前事件配置
const currentEvent = ref<EventConfig>({
  actions: [
    {
      params: {},
      target: '',
      type: 'loadData',
    },
  ],
  type: 'dataSource',
});

// 已配置的事件列表
const eventList = computed(() => {
  return props.component.events ? [props.component.events] : [];
});

// HTTP 方法选项
const httpMethodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
];

// 格式化 JSON
const formatJSON = (value: any): string => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '{}';
  }
};

// 验证 JSON 格式
const validateJSON = (value: string): boolean => {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

// 验证事件配置
const validateEvent = (): boolean => {
  if (currentEvent.value.type === 'dataSource') {
    const action = currentEvent.value.actions[0];
    if (action.type === 'loadData' && !action.target) {
      message.error('请选择目标数据源');
      return false;
    }
  }
  if (currentEvent.value.type === 'api') {
    const { method, url } = currentEvent.value.api!;
    if (!url) {
      message.error('请求地址不能为空');
      return false;
    }
    if (!method) {
      message.error('请求方法不能为空');
      return false;
    }
  } else if (currentEvent.value.type === 'function') {
    if (!currentEvent.value.function) {
      message.error('函数内容不能为空');
      return false;
    }
    try {
      // 尝试解析函数内容
      new Function(currentEvent.value.function);
    } catch {
      message.error('函数语法错误');
      return false;
    }
  }
  return true;
};

// 测试结果
const testResult = ref('');

// 测试事件
const handleTestEvent = async () => {
  if (!validateEvent()) return;

  try {
    if (currentEvent.value.type === 'api') {
      const { method, params, url } = currentEvent.value.api!;

      // 发送测试请求
      const response = await fetch(url, {
        body: method === 'GET' ? undefined : JSON.stringify(params),
        headers: {
          'Content-Type': 'application/json',
        },
        method,
      });

      const data = await response.json();

      // 如果有数据处理函数，执行它
      if (currentEvent.value.api!.dataHandler) {
        const handler = new Function(
          'data',
          currentEvent.value.api!.dataHandler,
        );
        const result = handler(data);
        testResult.value = formatJSON(result);
      } else {
        testResult.value = formatJSON(data);
      }

      message.success('事件测试成功');
    } else if (currentEvent.value.type === 'function') {
      // 执行自定义函数
      const func = new Function(currentEvent.value.function!);
      const result = func();
      testResult.value = formatJSON(result);
      message.success('函数执行成功');
    }
  } catch (error) {
    message.error(`事件测试失败: ${error.message}`);
  }
};

// 保存事件
const handleSaveEvent = () => {
  if (!validateEvent()) return;

  try {
    store.updateComponent(props.component.componentInstanceId, {
      events: currentEvent.value,
    });
    message.success('事件保存成功');
  } catch (error) {
    message.error(`事件保存失败: ${error.message}`);
  }
};

// 删除事件
const handleDeleteEvent = () => {
  try {
    store.updateComponent(props.component.componentInstanceId, {
      events: undefined,
    });
    message.success('事件删除成功');
  } catch (error) {
    message.error(`事件删除失败: ${error.message}`);
  }
};
</script>

<template>
  <NTabs class="event-panel-tabs" type="segment">
    <!-- 事件配置 -->
    <NTabPane name="config" tab="事件配置">
      <NForm label-placement="left" label-width="100">
        <NSpace vertical>
          <NCard size="small" title="基础配置">
            <NSpace size="small" vertical>
              <NFormItem label="事件类型" required>
                <NSelect
                  v-model:value="currentEvent.type"
                  :options="eventTypeOptions"
                  placeholder="请选择事件类型"
                />
              </NFormItem>
            </NSpace>
          </NCard>

          <!-- API 事件配置 -->
          <template v-if="currentEvent.type === 'api'">
            <NCard size="small" title="API 配置">
              <NSpace size="small" vertical>
                <NFormItem label="请求地址" required>
                  <NInput
                    v-model:value="currentEvent.api!.url"
                    placeholder="请输入请求地址"
                  />
                </NFormItem>
                <NFormItem label="请求方法" required>
                  <NSelect
                    v-model:value="currentEvent.api!.method"
                    :options="httpMethodOptions"
                    placeholder="请选择请求方法"
                  />
                </NFormItem>
                <NFormItem label="请求参数">
                  <NInput
                    :autosize="{ minRows: 2, maxRows: 5 }"
                    :value="formatJSON(currentEvent.api!.params)"
                    placeholder="请输入请求参数（JSON 格式）"
                    type="textarea"
                    @update:value="
                      (val) => {
                        try {
                          currentEvent.api!.params = JSON.parse(val);
                        } catch {
                          message.error('JSON 格式不正确');
                        }
                      }
                    "
                  />
                </NFormItem>
                <NFormItem label="数据处理函数">
                  <NInput
                    v-model:value="currentEvent.api!.dataHandler"
                    :autosize="{ minRows: 2, maxRows: 5 }"
                    placeholder="请输入数据处理函数，例如：return data.items;"
                    type="textarea"
                  />
                </NFormItem>
              </NSpace>
            </NCard>
          </template>

          <!-- 自定义函数配置 -->
          <template v-if="currentEvent.type === 'function'">
            <NCard size="small" title="函数配置">
              <NSpace size="small" vertical>
                <NFormItem label="函数内容" required>
                  <NInput
                    v-model:value="currentEvent.function"
                    :autosize="{ minRows: 3, maxRows: 10 }"
                    placeholder="请输入函数内容，例如：console.log('Hello');"
                    type="textarea"
                  />
                </NFormItem>
              </NSpace>
            </NCard>
          </template>

          <!-- 数据源操作配置 -->
          <template v-if="currentEvent.type === 'dataSource'">
            <NCard size="small" title="数据源操作配置">
              <NSpace size="small" vertical>
                <NFormItem label="操作类型" required>
                  <NSelect
                    v-model:value="currentEvent.actions[0].type"
                    :options="dataSourceActionTypes"
                    placeholder="请选择操作类型"
                  />
                </NFormItem>
                <NFormItem label="目标数据源" required>
                  <NSelect
                    v-model:value="currentEvent.actions[0].target"
                    :options="allDataSources"
                    placeholder="请选择数据源"
                  />
                </NFormItem>
                <NFormItem label="参数配置">
                  <NInput
                    :autosize="{ minRows: 2, maxRows: 5 }"
                    :value="formatJSON(currentEvent.actions[0].params)"
                    placeholder="请输入操作参数（JSON 格式）"
                    type="textarea"
                    @update:value="
                      (val) => {
                        try {
                          currentEvent.actions[0].params = JSON.parse(val);
                        } catch {
                          message.error('JSON 格式不正确');
                        }
                      }
                    "
                  />
                </NFormItem>
              </NSpace>
            </NCard>
          </template>

          <!-- 测试结果 -->
          <NCard v-if="testResult" size="small" title="测试结果">
            <NCode :code="testResult" language="json" />
          </NCard>

          <!-- 操作按钮 -->
          <NSpace justify="end">
            <NButton @click="handleTestEvent">测试事件</NButton>
            <NButton type="primary" @click="handleSaveEvent">保存事件</NButton>
          </NSpace>
        </NSpace>
      </NForm>
    </NTabPane>

    <!-- 事件列表 -->
    <NTabPane name="list" tab="事件列表">
      <NSpace vertical>
        <NCard v-if="eventList.length > 0" size="small" title="已配置事件">
          <NSpace vertical>
            <div v-for="(event, index) in eventList" :key="index">
              <NCard size="small">
                <template #header>
                  <NSpace align="center" justify="space-between">
                    <span>{{
                      event.type === 'api' ? 'API 调用' : '自定义函数'
                    }}</span>
                    <NButton
                      size="small"
                      type="error"
                      @click="handleDeleteEvent"
                    >
                      删除
                    </NButton>
                  </NSpace>
                </template>
                <div v-if="event.type === 'api'">
                  <div>请求地址：{{ event.api?.url }}</div>
                  <div>请求方法：{{ event.api?.method }}</div>
                </div>
                <div v-else>
                  <div>函数内容：{{ event.function }}</div>
                </div>
              </NCard>
            </div>
          </NSpace>
        </NCard>
        <NEmpty v-else description="暂无配置事件" />
      </NSpace>
    </NTabPane>
  </NTabs>
</template>

<style scoped>
.event-panel-tabs {
  position: relative;
  z-index: 100;
}

.event-panel-tabs :deep(.n-card) {
  position: relative;
  z-index: inherit;
  background-color: #fff;
}

.event-panel-tabs :deep(.n-card-header) {
  position: relative;
  z-index: inherit;
  background-color: #fff;
}

.event-panel-tabs :deep(.n-input),
.event-panel-tabs :deep(.n-select) {
  position: relative;
  z-index: inherit;
}

.event-panel-tabs :deep(.n-form-item) {
  margin-bottom: 12px;
}
</style>
