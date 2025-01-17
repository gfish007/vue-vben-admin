<script setup lang="ts" name="DataSourceManagement">
import type { FormInst, FormRules } from 'naive-ui';

import type {
  ApiDataSourceConfig,
  DatabaseDataSourceConfig,
  DataSource,
  DataSourceConfig,
  DataSourceType,
  StaticDataSourceConfig,
} from '../../../types/lowcode';

import { computed, h, onMounted, ref } from 'vue';

import { CodeSlash } from '@vicons/ionicons5';
import {
  NButton,
  NCard,
  NDataTable,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  NSpace,
  useMessage,
} from 'naive-ui';

import { useLowCodeStore } from '../../../store/modules/lowcode';

const store = useLowCodeStore();
const message = useMessage();
const formRef = ref<FormInst | null>(null);

// Add JSON formatting function
const formatJson = (value: string): string => {
  try {
    const parsed = JSON.parse(value.trim() || '{}');
    return JSON.stringify(parsed, null, 2);
  } catch {
    message.error('Invalid JSON format');
    return value;
  }
};

const showModal = ref(false);
const isEditing = ref(false);
const searchName = ref('');
const searchCode = ref('');

// 分页相关
const pagination = computed(() => store.dataSourcePagination);

// 表格列定义
const columns = [
  {
    key: 'dsName',
    title: '数据源名称',
  },
  {
    key: 'dsCode',
    title: '数据源编码',
  },
  {
    key: 'dsType',
    render: (row: DataSource) => {
      switch (row.dsType) {
        case 'API': {
          return 'API接口';
        }
        case 'DATABASE': {
          return '数据库';
        }
        case 'STATIC': {
          return '静态数据';
        }
        default: {
          return '';
        }
      }
    },
    title: '数据源类型',
  },
  {
    key: 'status',
    render: (row: DataSource) => {
      return row.status === 1 ? '启用' : '禁用';
    },
    title: '状态',
  },
  {
    key: 'actions',
    render: (row: DataSource) => {
      return h(
        NSpace,
        {},
        {
          default: () => [
            h(
              NButton,
              {
                onClick: () => handleEdit(row),
                quaternary: true,
                size: 'small',
                type: 'info',
              },
              { default: () => '编辑' },
            ),
            h(
              NButton,
              {
                onClick: () => handleToggleStatus(row),
                quaternary: true,
                size: 'small',
                type: row.status === 1 ? 'warning' : 'success',
              },
              { default: () => (row.status === 1 ? '禁用' : '启用') },
            ),
            h(
              NButton,
              {
                onClick: () => handleDelete(row.id),
                quaternary: true,
                size: 'small',
                type: 'error',
              },
              { default: () => '删除' },
            ),
          ],
        },
      );
    },
    title: '操作',
    width: 200,
  },
];

// Load data sources when component is mounted
onMounted(async () => {
  await loadDataSources();
});

const loadDataSources = async () => {
  try {
    await store.loadDataSources({
      page: {
        current: pagination.value.current,
        size: pagination.value.size,
      },
      queryBody: {
        dsCode: searchCode.value,
        dsName: searchName.value,
      },
    });
  } catch {
    message.error('加载数据源失败');
  }
};

const handlePageChange = (page: number) => {
  store.dataSourcePagination.current = page;
  loadDataSources();
};

const handlePageSizeChange = (pageSize: number) => {
  store.dataSourcePagination.size = pageSize;
  store.dataSourcePagination.current = 1;
  loadDataSources();
};

const handleSearch = () => {
  store.dataSourcePagination.current = 1;
  loadDataSources();
};

// 数据源类型和配置相关
const dataSourceTypes = [
  { label: 'API接口', value: 'API' },
  { label: '数据库', value: 'DATABASE' },
  { label: '静态数据', value: 'STATIC' },
];

const httpMethods = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
];

const getInitialConfig = (type: DataSourceType): DataSourceConfig => {
  switch (type) {
    case 'API': {
      return {
        headers: {},
        method: 'GET',
        params: {},
        type: 'API',
        url: '',
      } as ApiDataSourceConfig;
    }
    case 'DATABASE': {
      return {
        database: '',
        host: 'localhost',
        password: '',
        port: 3306,
        sql: '',
        type: 'DATABASE',
        username: '',
      } as DatabaseDataSourceConfig;
    }
    case 'STATIC': {
      return {
        data: '',
        type: 'STATIC',
      } as StaticDataSourceConfig;
    }
  }
};

const formData = ref<Partial<DataSource>>({
  config: getInitialConfig('STATIC'),
  dsCode: '',
  dsName: '',
  dsType: 'STATIC',
  status: 1,
  variables: {},
});

const apiConfig = computed({
  get: () => {
    const config = formData.value.config as ApiDataSourceConfig;
    return {
      ...config,
      headers:
        typeof config.headers === 'object'
          ? JSON.stringify(config.headers, null, 2)
          : config.headers,
      params:
        typeof config.params === 'object'
          ? JSON.stringify(config.params, null, 2)
          : config.params,
    };
  },
  set: (val: ApiDataSourceConfig) => {
    try {
      const newConfig = {
        ...(formData.value.config as ApiDataSourceConfig),
        ...val,
        headers: val.headers
          ? (typeof val.headers === 'string'
            ? JSON.parse(val.headers)
            : val.headers)
          : {},
        params: val.params
          ? (typeof val.params === 'string'
            ? JSON.parse(val.params)
            : val.params)
          : {},
      };
      formData.value.config = newConfig;
    } catch (error) {
      console.error('Failed to parse JSON:', error);
    }
  },
});

const databaseConfig = computed({
  get: () => formData.value.config as DatabaseDataSourceConfig,
  set: (val: DatabaseDataSourceConfig) => {
    formData.value.config = {
      ...(formData.value.config as DatabaseDataSourceConfig),
      ...val,
    };
  },
});

const handleTypeChange = (type: DataSourceType) => {
  formData.value = {
    ...formData.value,
    config: getInitialConfig(type),
    dsType: type,
  };
};

const handleEdit = (ds: DataSource) => {
  formData.value = { ...ds };
  if (ds.dsType === 'STATIC') {
    const config = formData.value.config as StaticDataSourceConfig;
    config.data = JSON.stringify(config.data, null, 2);
  } else if (ds.dsType === 'API') {
    const config = formData.value.config as ApiDataSourceConfig;
    config.headers = JSON.stringify(config.headers, null, 2);
    config.params = JSON.stringify(config.params, null, 2);
  }
  isEditing.value = true;
  showModal.value = true;
};

const handleDelete = async (id: string) => {
  try {
    await store.removeDataSource(id);
    message.success('删除数据源成功');
    loadDataSources();
  } catch {
    message.error('删除数据源失败');
  }
};

// Add form rules
const rules: FormRules = {
  'config.data': {
    message: '请输入静态数据',
    required: true,
    trigger: 'blur',
    validator: (_rule, value) => {
      if (formData.value.dsType === 'STATIC') {
        if (!value || value.toString().trim() === '') {
          return Promise.reject(new Error('请输入静态数据'));
        }
        try {
          JSON.parse(value.toString());
        } catch {
          return Promise.reject(
            new Error('静态数据格式不正确，请输入有效的 JSON 格式'),
          );
        }
      }
      return Promise.resolve();
    },
  },
  'config.database': {
    message: '请输入数据库名',
    required: true,
    trigger: 'blur',
    validator: (_rule, value) => {
      if (
        formData.value.dsType === 'DATABASE' &&
        (!value || value.trim() === '')
      ) {
        return Promise.reject(new Error('请输入数据库名'));
      }
      return Promise.resolve();
    },
  },
  'config.host': {
    message: '请输入主机地址',
    required: true,
    trigger: 'blur',
    validator: (_rule, value) => {
      if (
        formData.value.dsType === 'DATABASE' &&
        (!value || value.trim() === '')
      ) {
        return Promise.reject(new Error('请输入主机地址'));
      }
      return Promise.resolve();
    },
  },
  'config.method': {
    message: '请选择请求方法',
    required: true,
    trigger: 'change',
    validator: (_rule, value) => {
      if (formData.value.dsType === 'API' && !value) {
        return Promise.reject(new Error('请选择请求方法'));
      }
      return Promise.resolve();
    },
  },
  'config.password': {
    message: '请输入密码',
    required: true,
    trigger: 'blur',
    validator: (_rule, value) => {
      if (
        formData.value.dsType === 'DATABASE' &&
        (!value || value.trim() === '')
      ) {
        return Promise.reject(new Error('请输入密码'));
      }
      return Promise.resolve();
    },
  },
  'config.url': {
    message: '请输入API地址',
    required: true,
    trigger: 'blur',
    validator: (_rule, value) => {
      if (formData.value.dsType === 'API' && (!value || value.trim() === '')) {
        return Promise.reject(new Error('请输入API地址'));
      }
      return Promise.resolve();
    },
  },
  'config.username': {
    message: '请输入用户名',
    required: true,
    trigger: 'blur',
    validator: (_rule, value) => {
      if (
        formData.value.dsType === 'DATABASE' &&
        (!value || value.trim() === '')
      ) {
        return Promise.reject(new Error('请输入用户名'));
      }
      return Promise.resolve();
    },
  },
  dsCode: {
    message: '请输入数据源编码',
    required: true,
    trigger: ['blur', 'change'],
    validator: (_rule, value) => {
      if (!value || value.trim() === '') {
        return Promise.reject(new Error('请输入数据源编码'));
      }
      return Promise.resolve();
    },
  },
  dsName: {
    message: '请输入数据源名称',
    required: true,
    trigger: ['blur', 'change'],
    validator: (_rule, value) => {
      if (!value || value.trim() === '') {
        return Promise.reject(new Error('请输入数据源名称'));
      }
      return Promise.resolve();
    },
  },
  dsType: {
    message: '请选择数据源类型',
    required: true,
    trigger: ['blur', 'change'],
    validator: (_rule, value) => {
      if (!value) {
        return Promise.reject(new Error('请选择数据源类型'));
      }
      return Promise.resolve();
    },
  },
  status: {
    message: '请选择状态',
    required: true,
    trigger: ['blur', 'change'],
    validator: (_rule, value) => {
      if (value === undefined || value === null) {
        return Promise.reject(new Error('请选择状态'));
      }
      return Promise.resolve();
    },
  },
};

const handleAdd = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    const clonedData = JSON.parse(JSON.stringify(formData.value));
    const { id: _id, ...dataSourceData } = clonedData;

    if (dataSourceData.dsType === 'STATIC') {
      const config = dataSourceData.config as StaticDataSourceConfig;
      const staticData = config.data?.toString().trim();
      if (staticData) {
        config.data = JSON.parse(staticData);
      }
    } else if (dataSourceData.dsType === 'API') {
      const config = dataSourceData.config as ApiDataSourceConfig;
      if (typeof config.headers === 'string') {
        config.headers = JSON.parse(config.headers);
      }
      if (typeof config.params === 'string') {
        config.params = JSON.parse(config.params);
      }
    }

    await store.addDataSource(dataSourceData as Omit<DataSource, 'id'>);
    message.success('添加数据源成功');
    showModal.value = false;
    resetForm();
    loadDataSources();
  } catch (error) {
    console.error('Failed to add data source:', error);
    message.error('添加数据源失败');
  }
};

const handleSave = async () => {
  if (!formRef.value || !formData.value.id) return;

  try {
    await formRef.value.validate();
    const dataSourceData = JSON.parse(
      JSON.stringify(formData.value),
    ) as DataSource;

    if (dataSourceData.dsType === 'STATIC') {
      const config = dataSourceData.config as StaticDataSourceConfig;
      const staticData = config.data?.toString().trim();
      if (staticData) {
        config.data = JSON.parse(staticData);
      }
    } else if (dataSourceData.dsType === 'API') {
      const config = dataSourceData.config as ApiDataSourceConfig;
      if (typeof config.headers === 'string') {
        config.headers = JSON.parse(config.headers);
      }
      if (typeof config.params === 'string') {
        config.params = JSON.parse(config.params);
      }
    }

    await store.updateDataSource(dataSourceData.id, dataSourceData);
    message.success('保存成功');
    showModal.value = false;
    isEditing.value = false;
    resetForm();
    loadDataSources();
  } catch (error) {
    console.error('Failed to save data source:', error);
    message.error('保存失败');
  }
};

const resetForm = () => {
  formData.value = {
    config: getInitialConfig('STATIC'),
    dsCode: '',
    dsName: '',
    dsType: 'STATIC',
    status: 1,
    variables: {},
  };
};

const handleToggleStatus = async (ds: DataSource) => {
  try {
    const newStatus = ds.status === 1 ? 0 : 1;
    await store.updateDataSource(ds.id, { ...ds, status: newStatus });
    message.success(newStatus === 1 ? '启用成功' : '禁用成功');
    loadDataSources();
  } catch {
    message.error('操作失败');
  }
};
</script>

<template>
  <div class="datasource-page">
    <NCard title="数据源管理">
      <div class="search-bar">
        <NSpace
          :size="24"
          align="center"
          justify="space-between"
          style="width: 100%"
        >
          <NSpace :size="24" align="center">
            <NFormItem label="名称" label-placement="left">
              <NInput v-model:value="searchName" style="width: 200px" />
            </NFormItem>
            <NFormItem label="编码" label-placement="left">
              <NInput v-model:value="searchCode" style="width: 200px" />
            </NFormItem>
          </NSpace>
          <NSpace>
            <NButton type="primary" @click="handleSearch">搜索</NButton>
            <NButton type="success" @click="showModal = true">
              新增数据源
            </NButton>
          </NSpace>
        </NSpace>
      </div>

      <NDataTable
        :columns="columns"
        :data="store.dataSourceList"
        :loading="false"
        :pagination="{
          page: pagination.current,
          pageSize: pagination.size,
          itemCount: pagination.total,
          pageSizes: [10, 20, 50],
          showQuickJumper: true,
          showSizePicker: true,
          onUpdatePage: handlePageChange,
          onUpdatePageSize: handlePageSizeChange,
        }"
      />
    </NCard>

    <NModal
      v-model:show="showModal"
      :mask-closable="false"
      :title="isEditing ? '编辑数据源' : '新增数据源'"
      preset="card"
      style="width: 600px"
    >
      <NForm ref="formRef" :model="formData" :rules="rules">
        <div class="form-row">
          <NFormItem label="数据源名称" path="dsName" required>
            <NInput
              v-model:value="formData.dsName"
              placeholder="请输入数据源名称"
            />
          </NFormItem>
          <NFormItem label="数据源编码" path="dsCode" required>
            <NInput
              v-model:value="formData.dsCode"
              placeholder="请输入数据源编码"
            />
          </NFormItem>
        </div>

        <div class="form-row">
          <NFormItem label="数据源类型" path="dsType" required>
            <NSelect
              v-model:value="formData.dsType"
              :options="dataSourceTypes"
              placeholder="请选择数据源类型"
              @update:value="handleTypeChange"
            />
          </NFormItem>
          <NFormItem label="状态" path="status" required>
            <NSelect
              v-model:value="formData.status"
              :options="[
                { label: '启用', value: 1 },
                { label: '禁用', value: 0 },
              ]"
              placeholder="请选择状态"
            />
          </NFormItem>
        </div>

        <template v-if="formData.dsType === 'API'">
          <div class="form-row">
            <NFormItem label="请求地址" path="config.url" required>
              <NInput
                v-model:value="apiConfig.url"
                placeholder="请输入API地址"
              />
            </NFormItem>
            <NFormItem label="请求方法" path="config.method" required>
              <NSelect
                v-model:value="apiConfig.method"
                :options="httpMethods"
                placeholder="请选择请求方法"
              />
            </NFormItem>
          </div>
          <NFormItem label="请求参数">
            <div class="input-with-format full-width">
              <NInput
                v-model:value="apiConfig.params"
                :rows="4"
                placeholder="请输入请求参数（JSON格式）"
                type="textarea"
              />
              <NButton
                circle
                class="format-button"
                quaternary
                size="small"
                title="格式化"
                @click="apiConfig.params = formatJson(apiConfig.params || '{}')"
              >
                <NIcon><CodeSlash /></NIcon>
              </NButton>
            </div>
          </NFormItem>
          <NFormItem label="请求头">
            <div class="input-with-format full-width">
              <NInput
                v-model:value="apiConfig.headers"
                :rows="4"
                placeholder="请输入请求头（JSON格式）"
                type="textarea"
              />
              <NButton
                circle
                class="format-button"
                quaternary
                size="small"
                title="格式化"
                @click="
                  apiConfig.headers = formatJson(apiConfig.headers || '{}')
                "
              >
                <NIcon><CodeSlash /></NIcon>
              </NButton>
            </div>
          </NFormItem>
        </template>

        <template v-if="formData.dsType === 'DATABASE'">
          <div class="form-row">
            <NFormItem label="主机地址" path="config.host" required>
              <NInput
                v-model:value="databaseConfig.host"
                placeholder="请输入主机地址"
              />
            </NFormItem>
            <NFormItem label="端口" path="config.port" required>
              <NInputNumber
                v-model:value="databaseConfig.port"
                placeholder="请输入端口号"
              />
            </NFormItem>
          </div>
          <div class="form-row">
            <NFormItem label="数据库名" path="config.database" required>
              <NInput
                v-model:value="databaseConfig.database"
                placeholder="请输入数据库名"
              />
            </NFormItem>
            <NFormItem label="用户名" path="config.username" required>
              <NInput
                v-model:value="databaseConfig.username"
                placeholder="请输入用户名"
              />
            </NFormItem>
          </div>
          <div class="form-row">
            <NFormItem label="密码" path="config.password" required>
              <NInput
                v-model:value="databaseConfig.password"
                placeholder="请输入密码"
                type="password"
              />
            </NFormItem>
          </div>
          <NFormItem label="SQL语句" path="config.sql" required>
            <NInput
              v-model:value="databaseConfig.sql"
              placeholder="请输入SQL语句"
              type="textarea"
            />
          </NFormItem>
        </template>

        <template v-else-if="formData.dsType === 'STATIC'">
          <NFormItem label="静态数据" path="config.data" required>
            <div class="input-with-format full-width">
              <NInput
                v-model:value="formData.config.data"
                :rows="6"
                placeholder="请输入JSON格式的静态数据"
                type="textarea"
              />
              <NButton
                circle
                class="format-button"
                quaternary
                size="small"
                title="格式化"
                @click="
                  formData.config.data = formatJson(
                    formData.config.data || '{}',
                  )
                "
              >
                <NIcon><CodeSlash /></NIcon>
              </NButton>
            </div>
          </NFormItem>
        </template>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showModal = false">取消</NButton>
          <NButton
            type="primary"
            @click="isEditing ? handleSave() : handleAdd()"
          >
            {{ isEditing ? '保存' : '确定' }}
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style lang="less" scoped>
.datasource-page {
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

.input-with-format {
  position: relative;

  &.full-width {
    width: 100%;
    margin: 0;
  }

  :deep(.n-input) {
    width: 100%;
  }

  .format-button {
    position: absolute;
    right: 8px;
    top: 8px;
    width: 24px;
    height: 24px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.6;
    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
    }
  }
}
</style>
