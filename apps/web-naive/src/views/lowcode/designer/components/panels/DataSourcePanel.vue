<script setup lang="ts" name="DataSourcePanel">
import type { DataSource } from '../../../../../types/lowcode';

import { computed, ref } from 'vue';

import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NList,
  NListItem,
  NModal,
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

// 页面数据源列表
const pageDataSources = computed(() => store.currentPage?.dataSources || []);

// 数据源配置
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
  status: 1,
});

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
  currentDataSource.value = {
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
    status: 1,
  };
  isEditingDataSource.value = false;
  showDataSourceFormModal.value = false;
};

// 获取默认的静态数据
const getDefaultStaticData = () => {
  return {
    code: 200,
    data: {
      total: 2,
      list: [
        {
          id: 1,
          name: '示例数据1',
        },
        {
          id: 2,
          name: '示例数据2',
        },
      ],
    },
    message: 'success',
  };
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
        config.params = JSON.parse(config.params || '{}');
        config.headers = JSON.parse(config.headers || '{}');
      } catch {
        message.error('请求参数或请求头的JSON格式错误');
        return false;
      }
    } else if (currentDataSource.value.dsType === 'STATIC') {
      const config = currentDataSource.value.config as any;
      try {
        config.data = JSON.parse(config.data || '{}');
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
  const clonedDs = structuredClone(ds);
  if (clonedDs.dsType === 'API') {
    const config = clonedDs.config as any;
    // 将对象转换为格式化的JSON字符串
    config.headers = getFormattedJson(config.headers || {});
    config.params = getFormattedJson(config.params || {});
  } else if (clonedDs.dsType === 'STATIC') {
    const config = clonedDs.config as any;
    config.data = getFormattedJson(config.data || {});
  }
  currentDataSource.value = clonedDs;
  isEditingDataSource.value = true;
  showDataSourceFormModal.value = true;
};

// 保存数据源
const handleSaveDataSource = () => {
  if (!validateDataSourceForm()) return;

  try {
    store.updateDataSource(currentDataSource.value);
    message.success('保存数据源成功');
    resetDataSourceForm();
  } catch (error) {
    message.error(error instanceof Error ? error.message : '保存数据源失败');
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
    if (currentDataSource.value.dsType !== 'API') {
      message.warning('只有API类型的数据源支持测试');
      return;
    }

    const config = currentDataSource.value.config as any;
    if (!config.url) {
      message.error('请输入API地址');
      return;
    }

    // 解析请求参数和请求头
    let headers = {};
    let params = {};
    try {
      headers = JSON.parse(config.headers || '{}');
      params = JSON.parse(config.params || '{}');
    } catch {
      message.error('请求参数或请求头的JSON格式错误');
      return;
    }

    const loadingMessage = message.loading('正在测试接口...', {
      duration: 0,
    });

    try {
      const response = await fetch(config.url, {
        body: config.method === 'GET' ? undefined : JSON.stringify(params),
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        method: config.method,
      });

      loadingMessage.destroy();

      if (response.ok) {
        message.success('接口测试成功');
      } else {
        message.error(
          `接口测试失败: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      loadingMessage.destroy();
      console.error('测试数据源失败:', error);
      message.error(`接口测试失败: ${(error as Error).message}`);
    }
  } catch (error) {
    console.error('测试数据源失败:', error);
    message.error(`接口测试失败: ${(error as Error).message}`);
  }
};
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    style="width: 800px"
    title="页面数据源配置"
    @close="emit('update:show', false)"
  >
    <NSpace vertical>
      <!-- 数据源列表 -->
      <NCard title="数据源列表">
        <template #header-extra>
          <NButton
            size="small"
            type="primary"
            @click="
              () => {
                resetDataSourceForm();
                showDataSourceFormModal = true;
              }
            "
          >
            添加数据源
          </NButton>
        </template>

        <NList>
          <NListItem v-for="ds in pageDataSources" :key="ds.dsCode">
            <NSpace align="center" justify="space-between">
              <div>
                <div class="font-medium">{{ ds.dsName }}</div>
                <div class="mt-1 text-sm text-gray-500">
                  <NSpace align="center" size="small">
                    <NTag :type="ds.dsType === 'API' ? 'info' : 'success'">
                      {{ ds.dsType }}
                    </NTag>
                    <span>编码: {{ ds.dsCode }}</span>
                  </NSpace>
                </div>
              </div>

              <NSpace>
                <NButton size="small" @click="() => handleEditDataSource(ds)">
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
          </NListItem>
        </NList>
      </NCard>
    </NSpace>
  </NModal>

  <!-- 数据源表单对话框 -->
  <NModal
    :show="showDataSourceFormModal"
    :title="isEditingDataSource ? '编辑数据源' : '添加数据源'"
    preset="card"
    style="width: 600px"
    @close="resetDataSourceForm"
  >
    <NForm>
      <NFormItem label="数据源名称" required>
        <NInput
          v-model:value="currentDataSource.dsName"
          placeholder="请输入数据源名称"
        />
      </NFormItem>

      <NFormItem label="数据源编码" required>
        <NInput
          v-model:value="currentDataSource.dsCode"
          :disabled="isEditingDataSource"
          placeholder="请输入数据源编码，如：USER_LIST"
        />
        <template #feedback>只能包含大写字母、数字和下划线</template>
      </NFormItem>

      <NFormItem label="数据源类型">
        <NSelect
          v-model:value="currentDataSource.dsType"
          :options="[
            { label: 'API接口', value: 'API' },
            { label: '静态数据', value: 'STATIC' },
            { label: '数据库', value: 'DATABASE' },
          ]"
          placeholder="请选择数据源类型"
        />
      </NFormItem>

      <!-- API配置 -->
      <template v-if="currentDataSource.dsType === 'API'">
        <NFormItem label="请求地址">
          <NInput
            v-model:value="currentDataSource.config.url"
            placeholder="请输入API地址"
          />
        </NFormItem>

        <NFormItem label="请求方法">
          <NSelect
            v-model:value="currentDataSource.config.method"
            :options="[
              { label: 'GET', value: 'GET' },
              { label: 'POST', value: 'POST' },
              { label: 'PUT', value: 'PUT' },
              { label: 'DELETE', value: 'DELETE' },
            ]"
            placeholder="请选择请求方法"
          />
        </NFormItem>

        <NFormItem label="请求参数">
          <NInput
            v-model:value="currentDataSource.config.params"
            placeholder="请输入请求参数 (JSON格式)"
            type="textarea"
          />
          <template #feedback> 示例: { "page": 1, "pageSize": 10 } </template>
        </NFormItem>

        <NFormItem label="请求头">
          <NInput
            v-model:value="currentDataSource.config.headers"
            placeholder="请输入请求头 (JSON格式)"
            type="textarea"
          />
          <template #feedback>
            示例: { "Authorization": "Bearer token" }
          </template>
        </NFormItem>

        <NFormItem>
          <NButton type="info" @click="handleTestDataSource">测试接口</NButton>
        </NFormItem>
      </template>

      <!-- 静态数据配置 -->
      <template v-if="currentDataSource.dsType === 'STATIC'">
        <NFormItem label="静态数据">
          <NInput
            v-model:value="currentDataSource.config.data"
            :rows="10"
            placeholder="请输入静态数据 (JSON格式)"
            type="textarea"
          />
          <template #feedback>支持任意合法的 JSON 格式数据</template>
        </NFormItem>
      </template>

      <!-- 数据库配置 -->
      <template v-if="currentDataSource.dsType === 'DATABASE'">
        <NFormItem label="主机地址">
          <NInput
            v-model:value="currentDataSource.config.host"
            placeholder="请输入主机地址"
          />
        </NFormItem>

        <NFormItem label="端口">
          <NInputNumber
            v-model:value="currentDataSource.config.port"
            placeholder="请输入端口号"
          />
        </NFormItem>

        <NFormItem label="数据库名">
          <NInput
            v-model:value="currentDataSource.config.database"
            placeholder="请输入数据库名"
          />
        </NFormItem>

        <NFormItem label="用户名">
          <NInput
            v-model:value="currentDataSource.config.username"
            placeholder="请输入用户名"
          />
        </NFormItem>

        <NFormItem label="密码">
          <NInput
            v-model:value="currentDataSource.config.password"
            placeholder="请输入密码"
            type="password"
          />
        </NFormItem>

        <NFormItem label="SQL语句">
          <NInput
            v-model:value="currentDataSource.config.sql"
            placeholder="请输入SQL语句"
            type="textarea"
          />
        </NFormItem>
      </template>

      <NSpace justify="end">
        <NButton @click="resetDataSourceForm">取消</NButton>
        <NButton
          type="primary"
          @click="
            isEditingDataSource ? handleSaveDataSource() : handleAddDataSource()
          "
        >
          {{ isEditingDataSource ? '保存' : '添加' }}
        </NButton>
      </NSpace>
    </NForm>
  </NModal>
</template>
