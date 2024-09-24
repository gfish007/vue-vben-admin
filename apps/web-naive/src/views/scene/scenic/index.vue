<script setup lang="ts">
import type { UploadCustomRequestOptions, UploadFileInfo } from 'naive-ui';

import { h, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NCard,
  NDataTable,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NInputNumber,
  NModal,
  NPagination,
  NSelect,
  NSpace,
  NUpload,
  useMessage,
} from 'naive-ui';

import { useDynamicHeight } from '#/utils/heightUtils';

interface SceneItem {
  id: number;
  regionId: number;
  regionName: string;
  title: string;
  location: string;
  extendContent: string;
  coverList: string;
  publishStatus: 'PENDING' | 'PUBLISH';
  enableStatus: 0 | 1;
}

interface QueryParams {
  title?: string;
  regionId?: number;
  publishStatus?: 'PENDING' | 'PUBLISH';
  enableStatus?: 0 | 1;
}

const message = useMessage();
const windowHeight = ref(window.innerHeight);

// 添加这些新的响应式变量
const showModal = ref(false);
const formMode = ref<'add' | 'edit'>('add');
const formData = reactive<SceneItem>({
  coverList: '',
  enableStatus: 1,
  extendContent: '',
  id: 0,
  location: '',
  publishStatus: 'PENDING',
  regionId: 0,
  regionName: '',
  title: '',
});

const fileList = ref<UploadFileInfo[]>([]);

const columns = [
  { key: 'id', title: 'ID' },
  { key: 'regionName', title: '区域名' },
  { key: 'title', title: '标题' },
  { key: 'location', title: '位置信息' },
  { key: 'publishStatus', title: '发布状态' },
  {
    key: 'enableStatus',
    render: (row: SceneItem) => (row.enableStatus ? '启用' : '禁用'),
    title: '启用状态',
  },
  {
    key: 'actions',
    render: (row: SceneItem) => {
      return h(
        NSpace,
        {},
        {
          default: () => [
            h(
              NButton,
              {
                onClick: () => handleEdit(row),
                size: 'small',
                type: 'primary',
              },
              { default: () => '编辑' },
            ),
            h(
              NButton,
              {
                onClick: () => handleDelete(row.id),
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
  },
];

const data = ref<SceneItem[]>([]);
const pagination = reactive({
  itemCount: 0,
  page: 1,
  pageSize: 10,
});

const loading = ref(false);

const queryParams = reactive<QueryParams>({});

const loadData = async (page: number, pageSize: number) => {
  loading.value = true;
  try {
    // 构造符合后端接口格式的请求参数
    const requestData = {
      page: {
        current: page,
        size: pageSize,
      },
      queryBody: {
        ...queryParams,
      },
    };

    // 这里应该是实际的API调用
    // const response = await api.getSceneList(requestData);

    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const response = {
      code: 0,
      data: {
        current: page,
        pages: 10,
        records: new Array(pageSize).fill(null).map((_, index) => ({
          coverList: `cover${(page - 1) * pageSize + index + 1}.jpg`,
          enableStatus: Math.random() > 0.3 ? 1 : 0,
          extendContent: `扩展内容${(page - 1) * pageSize + index + 1}`,
          id: (page - 1) * pageSize + index + 1,
          location: `位置${(page - 1) * pageSize + index + 1}`,
          publishStatus: Math.random() > 0.5 ? 'PUBLISH' : 'PENDING',
          regionId: Math.floor(Math.random() * 5) + 1,
          regionName: `区域${Math.floor(Math.random() * 5) + 1}`,
          title: `景点${(page - 1) * pageSize + index + 1}`,
        })),
        size: pageSize,
        total: 100,
      },
      message: 'success',
    };

    if (response.code === 0) {
      data.value = response.data.records;
      pagination.itemCount = response.data.total;
      pagination.page = response.data.current;
      pagination.pageSize = response.data.size;
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    console.error('Failed to load data:', error);
    message.error('加载数据失败');
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  loadData(page, pagination.pageSize);
};

const handleSearch = () => {
  loadData(1, pagination.pageSize);
};

const handleReset = () => {
  Object.keys(queryParams).forEach((key) => {
    queryParams[key] = undefined;
  });
  handleSearch();
};

const handleAdd = () => {
  formMode.value = 'add';
  Object.assign(formData, {
    coverList: '',
    enableStatus: 1,
    extendContent: '',
    id: 0,
    location: '',
    publishStatus: 'PENDING',
    regionId: 0,
    regionName: '',
    title: '',
  });
  showModal.value = true;
};

const handleEdit = (row: SceneItem) => {
  formMode.value = 'edit';
  Object.assign(formData, row);
  fileList.value = row.coverList.split(',').map((url, index) => ({
    id: index.toString(),
    name: `image-${index + 1}`,
    status: 'finished',
    url,
  }));
  showModal.value = true;
};

const handleDelete = async (id: number) => {
  // 实际应该调用API删除数据
  message.success('删除成功');
  // 重新加载当前页数据
  await loadData(pagination.page, pagination.pageSize);
};

const handleSubmit = async () => {
  // 实际应该调用API保存数据
  formData.coverList = fileList.value.map((file) => file.url).join(',');
  if (formMode.value === 'add') {
    // 模拟添加操作
    message.success('添加成功');
  } else {
    // 模拟编辑操作
    message.success('更新成功');
  }
  showModal.value = false;
  // 重新加载当前页数据
  await loadData(pagination.page, pagination.pageSize);
};

const customRequest = ({
  file,
  onError,
  onFinish,
}: UploadCustomRequestOptions) => {
  // 这里应该是实际的上传逻辑
  // 为了演示，我们使用 FileReader 来模拟上传
  const reader = new FileReader();
  reader.readAsDataURL(file.file as Blob);
  reader.addEventListener('load', () => {
    const url = reader.result as string;
    onFinish();
    // 不需要手动更新 fileList，NUpload 组件会自动处理
  });
  reader.onerror = (err) => {
    onError();
    console.error('File reading error', err);
  };
};

const handleUpdateFileList = (newFileList: UploadFileInfo[]) => {
  fileList.value = newFileList;
};

// 添加一个计算属性来动态计算表格高度
const queryCardRef = ref<HTMLElement | null>(null);
const { queryCardHeight, tableHeight } = useDynamicHeight(queryCardRef);

onMounted(() => {
  if (queryCardRef.value) {
    queryCardHeight.value = queryCardRef.value.offsetHeight;
  }
});
</script>

<template>
  <Page description="管理景点信息，包括增加、编辑和删除功能。" title="景点管理">
    <NCard class="search-card mb-4" query-card-ref>
      <NForm :model="queryParams" inline>
        <NGrid :cols="24" :x-gap="16" :y-gap="16">
          <NGridItem :span="6">
            <NFormItem label="标题" label-placement="left">
              <NInput
                v-model:value="queryParams.title"
                placeholder="请输入标题"
              />
            </NFormItem>
          </NGridItem>
          <NGridItem :span="6">
            <NFormItem label="区域" label-placement="left">
              <NSelect
                v-model:value="queryParams.regionId"
                :options="[
                  { label: '区域1', value: 1 },
                  { label: '区域2', value: 2 },
                  { label: '区域3', value: 3 },
                  { label: '区域4', value: 4 },
                  { label: '区域5', value: 5 },
                ]"
                placeholder="请选择区域"
              />
            </NFormItem>
          </NGridItem>
          <NGridItem :span="6">
            <NFormItem label="发布状态" label-placement="left">
              <NSelect
                v-model:value="queryParams.publishStatus"
                :options="[
                  { label: '待发布', value: 'PENDING' },
                  { label: '已发布', value: 'PUBLISH' },
                ]"
                placeholder="选择发布状态"
              />
            </NFormItem>
          </NGridItem>
          <NGridItem :span="6">
            <NFormItem label="启用状态" label-placement="left">
              <NSelect
                v-model:value="queryParams.enableStatus"
                :options="[
                  { label: '启用', value: 1 },
                  { label: '禁用', value: 0 },
                ]"
                placeholder="请选择启用状态"
              />
            </NFormItem>
          </NGridItem>
          <NGridItem :span="24">
            <NSpace :wrap="false" justify="end">
              <NButton type="primary" @click="handleSearch">搜索</NButton>
              <NButton @click="handleReset">重置</NButton>
              <NButton type="success" @click="handleAdd">添加景点</NButton>
            </NSpace>
          </NGridItem>
        </NGrid>
      </NForm>
    </NCard>

    <div class="flex h-full flex-col">
      <div class="flex-grow overflow-hidden">
        <NDataTable
          :columns="columns"
          :data="data"
          :loading="loading"
          :scroll-x="1200"
          :single-line="false"
          :style="{ height: `${tableHeight}px` }"
          flex-height
          striped
        />
      </div>
      <div class="mt-4 flex justify-end">
        <NPagination
          v-model:page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :item-count="pagination.itemCount"
          @update:page="handlePageChange"
        />
      </div>
    </div>

    <NModal
      v-model:show="showModal"
      :title="formMode === 'add' ? '添加景点' : '编辑景点'"
      preset="card"
      style="width: 600px"
    >
      <NForm
        :model="formData"
        label-placement="left"
        label-width="auto"
        require-mark-placement="right-hanging"
      >
        <NFormItem label="区域ID" path="regionId">
          <NInputNumber v-model:value="formData.regionId" />
        </NFormItem>
        <NFormItem label="区域名" path="regionName">
          <NInput v-model:value="formData.regionName" />
        </NFormItem>
        <NFormItem label="标题" path="title">
          <NInput v-model:value="formData.title" />
        </NFormItem>
        <NFormItem label="位置信息" path="location">
          <NInput v-model:value="formData.location" />
        </NFormItem>
        <NFormItem label="扩展内容" path="extendContent">
          <NInput v-model:value="formData.extendContent" type="textarea" />
        </NFormItem>
        <NFormItem label="封面列表" path="coverList">
          <NUpload
            :custom-request="customRequest"
            :default-file-list="fileList"
            list-type="image-card"
            @update:file-list="handleUpdateFileList"
          >
            点击上传
          </NUpload>
        </NFormItem>
        <NFormItem label="发布状态" path="publishStatus">
          <NSelect
            v-model:value="formData.publishStatus"
            :options="[
              { label: '待发布', value: 'PENDING' },
              { label: '已发布', value: 'PUBLISH' },
            ]"
          />
        </NFormItem>
        <NFormItem label="启用状态" path="enableStatus">
          <NSelect
            v-model:value="formData.enableStatus"
            :options="[
              { label: '启用', value: 1 },
              { label: '禁用', value: 0 },
            ]"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showModal = false">取消</NButton>
          <NButton type="primary" @click="handleSubmit">确定</NButton>
        </NSpace>
      </template>
    </NModal>
  </Page>
</template>

<style scoped>
.n-data-table {
  --n-merged-th-color: var(--n-color);
  --n-merged-td-color: var(--n-color);
}

.search-card {
  background-color: #f9f9f9;
  border-radius: 8px;
}

.search-card :deep(.n-form-item-label) {
  font-weight: bold;
}

.search-card :deep(.n-input),
.search-card :deep(.n-select) {
  width: 100%;
}

.search-card :deep(.n-button) {
  min-width: 90px; /* 稍微增加按钮宽度以适应新的按钮 */
}
</style>
