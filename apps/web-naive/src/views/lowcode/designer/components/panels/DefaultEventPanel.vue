# 默认事件面板组件
<script setup lang="ts">
import type {
  ComponentInstance,
  EventConfig,
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

// 事件类型选项
const eventTypeOptions = [
  { label: 'API 调用', value: 'api' },
  { label: '自定义函数', value: 'function' },
];

// 当前事件配置
const currentEvent = ref<EventConfig>({
  api: {
    dataHandler: '',
    method: 'GET',
    params: {},
    url: '',
  },
  type: 'api',
});

// HTTP 方法选项
const httpMethodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
];

// 更新事件配置
const handleEventUpdate = (field: string, value: unknown) => {
  console.log('[DefaultEventPanel] 更新事件配置:', { field, value });
  store.updateComponent(props.component.componentInstanceId, {
    events: currentEvent.value,
  });
};

// 测试事件
const handleTestEvent = () => {
  console.log('[DefaultEventPanel] 测试事件:', currentEvent.value);
  // TODO: 实现事件测试逻辑
};

// 保存事件
const handleSaveEvent = () => {
  console.log('[DefaultEventPanel] 保存事件:', currentEvent.value);
  // TODO: 实现事件保存逻辑
};
</script>

<template>
  <NTabs type="segment">
    <!-- 事件配置 -->
    <NTabPane name="config" tab="事件配置">
      <NForm label-placement="left" label-width="100">
        <NSpace vertical>
          <NCard size="small" title="基础配置">
            <NSpace size="small" vertical>
              <NFormItem label="事件类型">
                <NSelect
                  v-model="currentEvent.type"
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
                <NFormItem label="请求地址">
                  <NInput
                    v-model="currentEvent.api!.url"
                    placeholder="请输入请求地址"
                  />
                </NFormItem>
                <NFormItem label="请求方法">
                  <NSelect
                    v-model="currentEvent.api!.method"
                    :options="httpMethodOptions"
                    placeholder="请选择请求方法"
                  />
                </NFormItem>
                <NFormItem label="请求参数">
                  <NInput
                    v-model="currentEvent.api!.params"
                    :autosize="{ minRows: 2, maxRows: 5 }"
                    placeholder="请输入请求参数（JSON 格式）"
                    type="textarea"
                  />
                </NFormItem>
                <NFormItem label="数据处理函数">
                  <NInput
                    v-model="currentEvent.api!.dataHandler"
                    :autosize="{ minRows: 2, maxRows: 5 }"
                    placeholder="请输入数据处理函数"
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
                <NFormItem label="函数内容">
                  <NInput
                    v-model="currentEvent.function"
                    :autosize="{ minRows: 3, maxRows: 10 }"
                    placeholder="请输入函数内容"
                    type="textarea"
                  />
                </NFormItem>
              </NSpace>
            </NCard>
          </template>

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
      <NForm label-placement="left" label-width="100">
        <NSpace vertical>
          <NCard size="small" title="已配置事件">
            <NSpace size="small" vertical>
              <!-- TODO: 实现事件列表 -->
              <div>暂无事件</div>
            </NSpace>
          </NCard>
        </NSpace>
      </NForm>
    </NTabPane>
  </NTabs>
</template>
