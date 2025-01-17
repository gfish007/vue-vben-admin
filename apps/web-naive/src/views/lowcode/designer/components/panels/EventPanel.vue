<script setup lang="ts" name="EventPanel">
import type { PageEvent, PageEventType } from '../../../../../types/lowcode';

import { computed, onMounted, ref } from 'vue';

import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NList,
  NListItem,
  NModal,
  NRadio,
  NRadioGroup,
  NSelect,
  NSpace,
  NTag,
  useMessage,
} from 'naive-ui';

import { useLowCodeStore } from '../../../../../store/modules/lowcode';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
}>();

// 初始化 store
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

// 数据源范围
const sourceScope = ref<'GLOBAL' | 'PAGE'>('PAGE');

// 获取数据源选项
const dataSourceOptions = computed(() => {
  if (sourceScope.value === 'GLOBAL') {
    return globalDataSources.value.map((ds) => ({
      label: ds.dsName,
      value: ds.dsCode,
    }));
  }
  return pageDataSources.value.map((ds) => ({
    label: ds.dsName,
    value: ds.dsCode,
  }));
});

// 事件表单对话框
const showEventFormModal = ref(false);

// 页面事件列表
const pageEvents = computed(() => store.currentPage?.events || []);

// 事件类型选项
const eventTypeOptions = [
  { label: '页面加载', value: 'onLoad' },
  { label: '页面卸载', value: 'onUnload' },
  { label: '页面显示', value: 'onShow' },
  { label: '页面隐藏', value: 'onHide' },
  { label: '页面滚动', value: 'onPageScroll' },
  { label: '下拉刷新', value: 'onPullDownRefresh' },
  { label: '触底加载', value: 'onReachBottom' },
  { label: '窗口尺寸变化', value: 'onResize' },
  { label: '分享给朋友', value: 'onShareAppMessage' },
  { label: '分享到朋友圈', value: 'onShareTimeline' },
  { label: '点击标签页', value: 'onTabItemTap' },
  { label: '添加到收藏', value: 'onAddToFavorites' },
];

// 当前事件
const currentEvent = ref<PageEvent>({
  handler: {
    dsCode: '',
    function: '',
  },
  handlerType: 'dataSource',
  type: 'onLoad',
});

const isEditingEvent = ref(false);

// 重置事件表单
const resetEventForm = () => {
  currentEvent.value = {
    handler: {
      dsCode: '',
      function: '',
    },
    handlerType: 'dataSource',
    type: 'onLoad',
  };
  isEditingEvent.value = false;
  showEventFormModal.value = false;
};

// 验证事件表单
const validateEventForm = () => {
  if (!currentEvent.value.type) {
    message.error('请选择事件类型');
    return false;
  }
  if (!currentEvent.value.handlerType) {
    message.error('请选择处理器类型');
    return false;
  }
  if (
    currentEvent.value.handlerType === 'dataSource' &&
    !currentEvent.value.handler.dsCode
  ) {
    message.error('请选择数据源');
    return false;
  }
  if (
    currentEvent.value.handlerType === 'function' &&
    !currentEvent.value.handler.function
  ) {
    message.error('请输入自定义函数');
    return false;
  }
  return true;
};

// 添加事件
const handleAddEvent = () => {
  if (!validateEventForm()) return;

  try {
    store.addEvent(currentEvent.value);
    message.success('添加事件成功');
    resetEventForm();
  } catch (error) {
    message.error(error instanceof Error ? error.message : '添加事件失败');
  }
};

// 编辑事件
const handleEditEvent = (event: PageEvent) => {
  currentEvent.value = {
    ...event,
    handler: { ...event.handler },
  };
  isEditingEvent.value = true;
  showEventFormModal.value = true;
};

// 保存事件
const handleSaveEvent = () => {
  if (!validateEventForm()) return;

  try {
    store.updateEvent(currentEvent.value);
    message.success('保存事件成功');
    resetEventForm();
  } catch (error) {
    message.error(error instanceof Error ? error.message : '保存事件失败');
  }
};

// 删除事件
const handleDeleteEvent = (eventType: PageEventType) => {
  try {
    store.deleteEvent(eventType);
    message.success('删除事件成功');
  } catch (error) {
    message.error(error instanceof Error ? error.message : '删除事件失败');
  }
};

// 获取事件类型显示名称
const getEventTypeLabel = (type: PageEventType) => {
  const option = eventTypeOptions.find((opt) => opt.value === type);
  return option ? option.label : type;
};
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    style="width: 800px"
    title="页面事件配置"
    @close="emit('update:show', false)"
  >
    <NSpace vertical>
      <!-- 事件列表 -->
      <NCard title="事件列表">
        <template #header-extra>
          <NButton
            size="small"
            type="primary"
            @click="
              () => {
                resetEventForm();
                showEventFormModal = true;
              }
            "
          >
            添加事件
          </NButton>
        </template>

        <NList>
          <NListItem v-for="event in pageEvents" :key="event.type">
            <NSpace align="center" justify="space-between">
              <div>
                <div class="font-medium">
                  {{ getEventTypeLabel(event.type) }}
                </div>
                <div class="mt-1 text-sm text-gray-500">
                  <NSpace align="center" size="small">
                    <NTag
                      :type="
                        event.handlerType === 'dataSource' ? 'info' : 'success'
                      "
                    >
                      {{
                        event.handlerType === 'dataSource'
                          ? '数据源'
                          : '自定义函数'
                      }}
                    </NTag>
                    <span v-if="event.handlerType === 'dataSource'">
                      数据源: {{ event.handler.dsCode }}
                    </span>
                    <span v-else> 函数: {{ event.handler.function }} </span>
                  </NSpace>
                </div>
              </div>

              <NSpace>
                <NButton size="small" @click="() => handleEditEvent(event)">
                  编辑
                </NButton>
                <NButton
                  size="small"
                  type="error"
                  @click="handleDeleteEvent(event.type)"
                >
                  删除
                </NButton>
              </NSpace>
            </NSpace>
          </NListItem>
        </NList>
      </NCard>
    </NSpace>
  </NModal>

  <!-- 事件表单对话框 -->
  <NModal
    :show="showEventFormModal"
    :title="isEditingEvent ? '编辑事件' : '添加事件'"
    preset="card"
    style="width: 600px"
    @close="resetEventForm"
  >
    <NForm>
      <NFormItem label="事件类型" required>
        <NSelect
          v-model:value="currentEvent.type"
          :disabled="isEditingEvent"
          :options="eventTypeOptions"
          placeholder="请选择事件类型"
        />
      </NFormItem>

      <NFormItem label="处理器类型" required>
        <NSelect
          v-model:value="currentEvent.handlerType"
          :options="[
            { label: '数据源', value: 'dataSource' },
            { label: '自定义函数', value: 'function' },
          ]"
          placeholder="请选择处理器类型"
        />
      </NFormItem>

      <template v-if="currentEvent.handlerType === 'dataSource'">
        <NFormItem label="数据源范围">
          <NRadioGroup v-model:value="sourceScope">
            <NRadio value="GLOBAL">全局数据源</NRadio>
            <NRadio value="PAGE">页面数据源</NRadio>
          </NRadioGroup>
        </NFormItem>
        <NFormItem label="数据源" required>
          <NSelect
            v-model:value="currentEvent.handler.dsCode"
            :options="dataSourceOptions"
            :placeholder="
              sourceScope === 'GLOBAL' ? '请选择全局数据源' : '请选择页面数据源'
            "
          />
        </NFormItem>
      </template>

      <template v-else>
        <NFormItem label="自定义函数" required>
          <NInput
            v-model:value="currentEvent.handler.function"
            :rows="4"
            placeholder="请输入自定义函数"
            type="textarea"
          />
          <template #feedback>
            示例: function(event) { console.log('事件触发:', event); }
          </template>
        </NFormItem>
      </template>

      <NSpace justify="end">
        <NButton @click="resetEventForm">取消</NButton>
        <NButton
          type="primary"
          @click="isEditingEvent ? handleSaveEvent() : handleAddEvent()"
        >
          {{ isEditingEvent ? '保存' : '添加' }}
        </NButton>
      </NSpace>
    </NForm>
  </NModal>
</template>

<style lang="less" scoped>
.event-page {
  padding: 16px;
}

.search-bar {
  margin-bottom: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 0;

  :deep(.n-form-item) {
    flex: 1;
    margin-right: 0;
  }
}

:deep(.n-modal) {
  .n-card-header {
    padding: 16px 24px;
  }

  .n-card__content {
    max-height: calc(100vh - 200px);
    overflow-y: auto;
  }
}
</style>
