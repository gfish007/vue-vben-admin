<script setup lang="ts" name="DataSourcePanel">
import type { DataSource } from '../../../../../types/lowcode';

import { computed, onMounted, ref } from 'vue';

import {
  NAlert,
  NButton,
  NCard,
  NCode,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NList,
  NListItem,
  NModal,
  NPopover,
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

// 数据源表单对话框
const showDataSourceFormModal = ref(false);
// 全局数据源选择对话框
const showGlobalDataSourceModal = ref(false);

// 页面数据源列表
const pageDataSources = computed(() => store.currentPage?.dataSources || []);

// 数据源来源类型
const sourceTypeOptions = [
  { label: '全局引用', value: 'GLOBAL_REF' },
  { label: '页面私有', value: 'PAGE_PRIVATE' },
];

// 当前数据源配置
const currentDataSource = ref<DataSource>({
  config: {
    headers: '{}',
    method: 'GET',
    params: '{}',
    type: 'API',
    url: '',
  },
  dsCode: '',
  dsName: '',
  dsType: 'API',
  id: '',
  scope: 'PAGE',
  sourceType: 'PAGE_PRIVATE',
  status: 1,
});

// 加载全局数据源
onMounted(async () => {
  try {
    await store.loadGlobalDataSources();
  } catch {
    message.error('加载全局数据源失败');
  }
});

// 全局数据源列表
const globalDataSources = computed(() => store.globalDataSources || []);

// 引用全局数据源
const handleReferenceGlobalDataSource = async (dsCode: string) => {
  try {
    await store.referenceGlobalDataSource(dsCode);
    message.success('引用全局数据源成功');
    showGlobalDataSourceModal.value = false;
  } catch (error) {
    console.error('引用全局数据源失败:', error);
    message.error(
      `引用全局数据源失败: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
};

const isEditingDataSource = ref(false);

// 获取格式化的JSON字符串
const getFormattedJson = (obj: any) => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return '{}';
  }
};

// 重置数据源表单
const resetDataSourceForm = () => {
  resetDataSource();
  isEditingDataSource.value = false;
};

// 获取默认的静态数据
const getDefaultStaticData = () => {
  return {
    code: 200,
    data: {
      total: 2,
      list: [
        {
          createTime: '2024-01-01 12:00:00',
          id: 1,
          name: '示例数据1',
          status: 'active',
        },
        {
          createTime: '2024-01-02 12:00:00',
          id: 2,
          name: '示例数据2',
          status: 'inactive',
        },
      ],
    },
    message: 'success',
  };
};

// 文本域配置
const textareaConfig = {
  maxRows: 10,
  minRows: 3,
};

// 重置数据源配置
const resetDataSource = () => {
  currentDataSource.value = {
    config: {
      headers: JSON.stringify(
        {
          'Content-Type': 'application/json',
        },
        null,
        2,
      ),
      method: 'GET',
      params: JSON.stringify(
        {
          pageNum: 1,
          pageSize: 10,
          sortField: 'createTime',
          sortOrder: 'desc',
        },
        null,
        2,
      ),
      type: 'API',
      url: '',
    },
    dsCode: '',
    dsName: '',
    dsType: 'API',
    id: '',
    scope: 'PAGE',
    sourceType: 'PAGE_PRIVATE',
    status: 1,
  };
  testResult.value = null;
};

// 验证数据源表单
const validateDataSourceForm = () => {
  if (!currentDataSource.value.dsName) {
    message.error('请输入数据源名称');
    return false;
  }
  if (!currentDataSource.value.dsCode) {
    message.error('请输入数据源编码');
    return false;
  }
  // 验证编码格式：只允许大写字母、数字和下划线
  if (!/^[A-Z0-9_]+$/.test(currentDataSource.value.dsCode)) {
    message.error('数据源编码只能包含大写字母、数字和下划线');
    return false;
  }

  // 验证JSON格式
  try {
    if (currentDataSource.value.dsType === 'API') {
      if (!currentDataSource.value.config.url) {
        message.error('请输入API地址');
        return false;
      }
      if (!currentDataSource.value.config.method) {
        message.error('请选择请求方法');
        return false;
      }
      // 验证params和headers的JSON格式
      const config = currentDataSource.value.config as any;
      try {
        // 确保params和headers始终是字符串
        if (typeof config.params === 'object') {
          config.params = JSON.stringify(config.params, null, 2);
        }
        if (typeof config.headers === 'object') {
          config.headers = JSON.stringify(config.headers, null, 2);
        }
        // 验证JSON格式
        JSON.parse(config.params || '{}');
        JSON.parse(config.headers || '{}');
      } catch {
        message.error('请求参数或请求头的JSON格式错误');
        return false;
      }
    } else if (currentDataSource.value.dsType === 'STATIC') {
      const config = currentDataSource.value.config as any;
      try {
        // 确保data始终是字符串
        if (typeof config.data === 'object') {
          config.data = JSON.stringify(config.data, null, 2);
        }
        // 验证JSON格式
        JSON.parse(config.data || '{}');
      } catch {
        message.error('静态数据的JSON格式错误');
        return false;
      }
    }
  } catch (error) {
    console.error('validateDataSourceForm error:', error);
    message.error('表单验证失败');
    return false;
  }

  return true;
};

// 添加数据源
const handleAddDataSource = () => {
  if (!validateDataSourceForm()) return;

  try {
    store.addDataSource(currentDataSource.value);
    message.success('添加数据源成功');
    resetDataSourceForm();
  } catch (error) {
    message.error(error instanceof Error ? error.message : '添加数据源失败');
  }
};

// 编辑数据源
const handleEditDataSource = (ds: DataSource) => {
  try {
    // 创建一个深拷贝，避免使用structuredClone
    const clonedDs = JSON.parse(JSON.stringify(ds));

    if (clonedDs.dsType === 'API') {
      const config = clonedDs.config as any;
      // 将对象转换为格式化的JSON字符串
      config.headers =
        typeof config.headers === 'object'
          ? JSON.stringify(config.headers || {}, null, 2)
          : config.headers;
      config.params =
        typeof config.params === 'object'
          ? JSON.stringify(config.params || {}, null, 2)
          : config.params;
    } else if (clonedDs.dsType === 'STATIC') {
      const config = clonedDs.config as any;
      config.data =
        typeof config.data === 'object'
          ? JSON.stringify(config.data || {}, null, 2)
          : config.data;
    }

    currentDataSource.value = clonedDs;
    isEditingDataSource.value = true;
    showDataSourceFormModal.value = true;
  } catch (error) {
    console.error('编辑数据源失败:', error);
    message.error('编辑数据源失败');
  }
};

// 保存数据源
const handleSaveDataSource = async () => {
  try {
    if (!validateDataSourceForm()) return;

    // 如果是全局引用，只保存引用信息
    if (currentDataSource.value.sourceType === 'GLOBAL_REF') {
      await store.updatePageDataSource({
        ...currentDataSource.value,
        config: {}, // 不保存配置，使用全局数据源的配置
      });
      message.success('保存数据源成功');
      showDataSourceFormModal.value = false;
      return;
    }

    // 如果是全局数据源，先调用后端接口
    if (currentDataSource.value.scope === 'GLOBAL') {
      await store.updateDataSource(
        currentDataSource.value.id,
        currentDataSource.value,
      );
      message.success('保存数据源成功');
      showDataSourceFormModal.value = false;
      return;
    }

    // 如果是页面私有数据源，保存到页面配置
    await store.updatePageDataSource(currentDataSource.value);
    message.success('保存数据源成功');
    showDataSourceFormModal.value = false;
  } catch (error) {
    console.error('保存数据源失败:', error);
    message.error('保存数据源失败');
  }
};

// 删除数据源
const handleDeleteDataSource = (dsCode: string) => {
  try {
    store.deleteDataSource(dsCode);
    message.success('删除数据源成功');
  } catch (error) {
    message.error(error instanceof Error ? error.message : '删除数据源失败');
  }
};

// 测试数据源
const handleTestDataSource = async () => {
  try {
    message.info('开始测试数据源...');
    const loadingMessage = message.loading('正在测试...', { duration: 0 });

    // 记录开始时间
    const startTime = Date.now();

    try {
      let result;
      if (currentDataSource.value.dsType === 'API') {
        const config = currentDataSource.value.config as any;
        // 发送测试请求
        const response = await fetch(config.url, {
          body: config.method === 'GET' ? undefined : config.params,
          headers: {
            'Content-Type': 'application/json',
            ...JSON.parse(config.headers || '{}'),
          },
          method: config.method,
        });
        result = await response.json();
      } else if (currentDataSource.value.dsType === 'STATIC') {
        result = JSON.parse((currentDataSource.value.config as any).data);
      }

      // 计算响应时间
      const responseTime = Date.now() - startTime;

      // 关闭加载提示
      loadingMessage.destroy();

      // 显示测试结果
      testResult.value = {
        data: result,
        responseTime,
        status: 'success',
        timestamp: new Date().toISOString(),
      };

      message.success('数据源测试成功');
    } catch (error) {
      // 关闭加载提示
      loadingMessage.destroy();
      testResult.value = {
        error: error instanceof Error ? error.message : String(error),
        status: 'error',
        timestamp: new Date().toISOString(),
      };
      throw error;
    }
  } catch (error) {
    message.error(
      `数据源测试失败: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

// 测试结果
const testResult = ref<{
  data?: any;
  error?: string;
  responseTime?: number;
  status: 'error' | 'success';
  timestamp: string;
} | null>(null);

// 处理数据源表单对话框关闭
const handleDataSourceFormModalClose = (show: boolean) => {
  if (!show) {
    resetDataSource();
  }
  showDataSourceFormModal.value = show;
};
</script>

<template>
  <NModal
    :show="props.show"
    preset="dialog"
    style="width: 900px"
    title="数据源管理"
    @update:show="emit('update:show', $event)"
  >
    <NSpace vertical>
      <NSpace justify="end">
        <NButton @click="showDataSourceFormModal = true">新增数据源</NButton>
        <NButton type="primary" @click="showGlobalDataSourceModal = true">
          引用全局数据源
        </NButton>
      </NSpace>

      <!-- 数据源列表 -->
      <NList>
        <NListItem v-for="ds in pageDataSources" :key="ds.dsCode">
          <NSpace :size="8" vertical>
            <NSpace align="center" justify="space-between">
              <NSpace :size="4" vertical>
                <span class="font-medium">{{ ds.dsName }}</span>
                <NSpace :size="8">
                  <NTag
                    :type="ds.dsType === 'API' ? 'success' : 'warning'"
                    size="small"
                  >
                    {{ ds.dsType }}
                  </NTag>
                  <NTag
                    v-if="ds.sourceType === 'GLOBAL_REF'"
                    size="small"
                    type="info"
                  >
                    全局引用
                  </NTag>
                  <span class="text-sm text-gray-500">编码：{{ ds.dsCode }}</span>
                </NSpace>
              </NSpace>
              <NSpace>
                <NButton size="small" @click="handleEditDataSource(ds)">
                  编辑
                </NButton>
                <NButton
                  size="small"
                  type="error"
                  @click="handleDeleteDataSource(ds.dsCode)"
                >
                  删除
                </NButton>
              </NSpace>
            </NSpace>
          </NSpace>
        </NListItem>
      </NList>
    </NSpace>
  </NModal>

  <!-- 全局数据源选择对话框 -->
  <NModal
    :show="showGlobalDataSourceModal"
    preset="dialog"
    style="width: 800px"
    title="选择全局数据源"
    @close="showGlobalDataSourceModal = false"
    @update:show="(show) => (showGlobalDataSourceModal = show)"
  >
    <NSpace vertical>
      <NList>
        <NListItem v-for="ds in globalDataSources" :key="ds.dsCode">
          <NSpace :size="8" vertical>
            <NSpace align="center" justify="space-between">
              <NSpace :size="4" vertical>
                <span class="font-medium">{{ ds.dsName }}</span>
                <NSpace :size="8">
                  <NTag
                    :type="ds.dsType === 'API' ? 'success' : 'warning'"
                    size="small"
                  >
                    {{ ds.dsType }}
                  </NTag>
                  <span class="text-sm text-gray-500">编码：{{ ds.dsCode }}</span>
                </NSpace>
              </NSpace>
              <NButton
                size="small"
                type="primary"
                @click="handleReferenceGlobalDataSource(ds.dsCode)"
              >
                引用
              </NButton>
            </NSpace>
          </NSpace>
        </NListItem>
      </NList>
    </NSpace>
  </NModal>

  <!-- 数据源表单对话框 -->
  <NModal
    :show="showDataSourceFormModal"
    :title="currentDataSource.id ? '编辑数据源' : '新增数据源'"
    preset="dialog"
    style="width: 1000px"
    @update:show="handleDataSourceFormModalClose"
  >
    <NForm
      ref="formRef"
      :model="currentDataSource"
      label-placement="left"
      label-width="100"
    >
      <NSpace :size="24" vertical>
        <!-- 基本信息 -->
        <NCard size="small" title="基本信息">
          <NGrid :cols="3" :x-gap="24">
            <NGridItem>
              <NFormItem label="数据源名称" required>
                <NInput
                  v-model:value="currentDataSource.dsName"
                  placeholder="请输入数据源名称"
                />
                <template #feedback>建议使用有意义的业务名称</template>
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="数据源编码" required>
                <NInput
                  v-model:value="currentDataSource.dsCode"
                  :disabled="isEditingDataSource"
                  placeholder="请输入数据源编码"
                />
                <template #feedback>只能包含大写字母、数字和下划线</template>
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="数据源类型" required>
                <NSelect
                  v-model:value="currentDataSource.dsType"
                  :options="[
                    { label: 'API接口', value: 'API' },
                    { label: '静态数据', value: 'STATIC' },
                    { label: '数据库', value: 'DATABASE' },
                  ]"
                />
                <template #feedback>
                  {{
                    currentDataSource.dsType === 'API'
                      ? 'HTTP接口请求'
                      : currentDataSource.dsType === 'STATIC'
                        ? '本地静态数据'
                        : '数据库查询'
                  }}
                </template>
              </NFormItem>
            </NGridItem>
          </NGrid>
        </NCard>

        <!-- API配置 -->
        <NCard
          v-if="currentDataSource.dsType === 'API'"
          size="small"
          title="API配置"
        >
          <NGrid :cols="2" :x-gap="24">
            <NGridItem>
              <NFormItem label="请求地址" required>
                <NInput
                  v-model:value="currentDataSource.config.url"
                  placeholder="请输入API地址，支持变量 ${变量名}"
                />
                <template #feedback>支持使用 ${变量名} 格式的变量</template>
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="请求方法" required>
                <NSelect
                  v-model:value="currentDataSource.config.method"
                  :options="[
                    { label: 'GET', value: 'GET' },
                    { label: 'POST', value: 'POST' },
                    { label: 'PUT', value: 'PUT' },
                    { label: 'DELETE', value: 'DELETE' },
                    { label: 'PATCH', value: 'PATCH' },
                  ]"
                />
                <template #feedback>选择合适的HTTP请求方法</template>
              </NFormItem>
            </NGridItem>
          </NGrid>
          <NGrid :cols="2" :x-gap="24">
            <NGridItem>
              <NFormItem label="请求参数">
                <NInput
                  v-model:value="currentDataSource.config.params"
                  :autosize="textareaConfig"
                  placeholder="请输入请求参数 (JSON格式)"
                  type="textarea"
                />
                <template #feedback>GET请求参数会自动拼接到URL</template>
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="请求头">
                <NInput
                  v-model:value="currentDataSource.config.headers"
                  :autosize="textareaConfig"
                  placeholder="请输入请求头 (JSON格式)"
                  type="textarea"
                />
                <template #feedback>默认已包含Content-Type</template>
              </NFormItem>
            </NGridItem>
          </NGrid>
        </NCard>

        <!-- 静态数据配置 -->
        <NCard
          v-if="currentDataSource.dsType === 'STATIC'"
          size="small"
          title="静态数据配置"
        >
          <NFormItem label="静态数据" required>
            <NInput
              v-model:value="currentDataSource.config.data"
              :autosize="{ minRows: 5, maxRows: 15 }"
              placeholder="请输入静态数据 (JSON格式)"
              type="textarea"
            />
            <template #feedback>
              <NButton
                text
                type="primary"
                @click="
                  currentDataSource.config.data = JSON.stringify(
                    getDefaultStaticData(),
                    null,
                    2,
                  )
                "
              >
                使用示例数据
              </NButton>
            </template>
          </NFormItem>
        </NCard>

        <!-- 数据库配置 -->
        <NCard
          v-if="currentDataSource.dsType === 'DATABASE'"
          size="small"
          title="数据库配置"
        >
          <NAlert title="功能开发中" type="info">
            数据库配置功能正在开发中，敬请期待
          </NAlert>
        </NCard>

        <!-- 操作按钮 -->
        <NSpace justify="end">
          <NPopover trigger="hover">
            <template #trigger>
              <NButton @click="handleTestDataSource">测试数据源</NButton>
            </template>
            测试数据源配置是否正确
          </NPopover>
          <NButton type="primary" @click="handleSaveDataSource">保存</NButton>
        </NSpace>

        <!-- 测试结果 -->
        <NCard v-if="testResult" size="small" title="测试结果">
          <NSpace vertical>
            <NGrid :cols="3" :x-gap="12">
              <NGridItem>
                <NSpace align="center">
                  <span>状态：</span>
                  <NTag
                    :type="
                      testResult.status === 'success' ? 'success' : 'error'
                    "
                  >
                    {{ testResult.status === 'success' ? '成功' : '失败' }}
                  </NTag>
                </NSpace>
              </NGridItem>
              <NGridItem v-if="testResult.responseTime">
                <NSpace align="center">
                  <span>响应时间：</span>
                  <NTag
                    :type="
                      testResult.responseTime < 1000 ? 'success' : 'warning'
                    "
                  >
                    {{ testResult.responseTime }}ms
                  </NTag>
                </NSpace>
              </NGridItem>
              <NGridItem>
                <div>
                  时间：{{ new Date(testResult.timestamp).toLocaleString() }}
                </div>
              </NGridItem>
            </NGrid>
            <div v-if="testResult.error" class="text-error">
              错误信息：{{ testResult.error }}
            </div>
            <div v-if="testResult.data">
              <div class="mb-2">响应数据：</div>
              <NCode
                :code="JSON.stringify(testResult.data, null, 2)"
                language="json"
                show-line-numbers
                word-wrap
              />
            </div>
          </NSpace>
        </NCard>
      </NSpace>
    </NForm>
  </NModal>
</template>

<style scoped>
.font-medium {
  font-weight: 500;
}

.text-gray-500 {
  color: #6b7280;
}

.text-sm {
  font-size: 0.875rem;
}

.text-error {
  color: #d03050;
}

.mb-2 {
  margin-bottom: 8px;
}
</style>
