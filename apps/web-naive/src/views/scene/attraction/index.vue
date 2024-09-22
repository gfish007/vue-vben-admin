<script setup lang="ts">
import type { FormInst, FormRules, UploadFileInfo } from 'naive-ui';

import type { AttractionApi } from '#/api/core/attraction.types';

import {
  computed,
  h,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
} from 'vue';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NButtonGroup,
  NCard,
  NConfigProvider,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NProgress,
  NSelect,
  NSpace,
  NTag,
  NUpload,
  useMessage,
} from 'naive-ui';

import {
  deleteAttractions,
  doTopAttraction,
  getAttractionDetail,
  publishAttraction,
  queryAttractionList,
  saveOrUpdateAttraction,
  unpublishAttraction,
} from '#/api/core/attraction';
import { uploadFile } from '#/api/core/file';
import { queryRegionList } from '#/api/core/region';
import LocationMap from '#/components/LocationMap.vue';
import RichTextEditor from '#/components/RichTextEditor.vue';

const message = useMessage();

// 查询条件
const queryForm = reactive<AttractionApi.QueryParams['queryBody']>({
  enableStatus: null,
  publishStatus: null,
  regionId: undefined,
  title: '',
});

// 表格数据
const tableData = ref<AttractionApi.AttractionRecord[]>([]);
const loading = ref(false);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

// 模态框相关
const showModal = ref(false);
const modalTitle = ref('');
const editingRecord = ref<AttractionApi.AttractionSaveReq>({
  coverList: [],
  description: '',
  extendContent: {},
  id: undefined,
  location: '',
  locationInfo: {},
  regionId: undefined,
  title: '',
});

// 表单规则
const rules: FormRules = {
  description: { message: '请输入描述', required: true, trigger: 'blur' },
  locationInfo: {
    message: '请在地图上选择位置',
    required: true,
    trigger: 'change',
    validator: (rule, value) =>
      value && value.lnglat && value.lnglat.length > 0,
  },
  regionId: {
    message: '请选择关联区域',
    required: true,
    trigger: ['blur', 'change'],
    type: 'number',
    validator: (rule, value) => value !== null && value !== undefined,
  },
  title: { message: '请输入标题', required: true, trigger: 'blur' },
};

const formRef = ref<FormInst | null>(null);

// 添加新的 loading 状态
const editLoading = ref(false);
const topLoading = ref(false);
const deleteLoading = ref(false);
const saveLoading = ref(false);
const publishLoading = ref(false);

// 修改 handleEdit 函数
const handleEdit = async (row: AttractionApi.AttractionRecord) => {
  editLoading.value = true;
  try {
    modalTitle.value = '编辑景点';
    const detail = await getAttractionDetail(row.id);
    editingRecord.value = {
      ...detail,
      locationInfo:
        typeof detail.locationInfo === 'string'
          ? JSON.parse(detail.locationInfo)
          : detail.locationInfo || {},
    };
    showModal.value = true;
    // 等待 DOM 更新后设置编辑器内容
    nextTick(() => {
      if (editorRef.value) {
        editorRef.value.setHtml(editingRecord.value.description);
      }
    });
  } catch (error) {
    console.error('获取详情失败:', error);
    message.error('获取详情失败');
  } finally {
    editLoading.value = false;
  }
};

// 修改 handleDelete 函数
const handleDelete = async (row: AttractionApi.AttractionRecord) => {
  deleteLoading.value = true;
  try {
    await deleteAttractions([row.id]);
    message.success('删除成功');
    fetchData();
  } catch {
    message.error('删除失败');
  } finally {
    deleteLoading.value = false;
  }
};

// 修改 handleTop 函数
const handleTop = async (row: AttractionApi.AttractionRecord) => {
  topLoading.value = true;
  try {
    await doTopAttraction(row.id);
    message.success('置顶成功');
    fetchData();
  } catch {
    message.error('置顶失败');
  } finally {
    topLoading.value = false;
  }
};

// 修改 handlePublish 函数
const handlePublish = async (row: AttractionApi.AttractionRecord) => {
  publishLoading.value = true;
  try {
    if (row.publishStatus === 'PENDING') {
      await publishAttraction(row.id);
      message.success('发布成功');
    } else {
      await unpublishAttraction(row.id);
      message.success('撤回成功');
    }
    await fetchData();
  } catch (error) {
    console.error('操作失败:', error);
    message.error(row.publishStatus === 'PENDING' ? '发布失败' : '撤回失败');
  } finally {
    publishLoading.value = false;
  }
};

// 修改 handleSave 函数
const handleSave = async () => {
  if (!formRef.value) return;
  saveLoading.value = true;
  try {
    await formRef.value.validate();
    const saveData = {
      ...editingRecord.value,
      locationInfo:
        typeof editingRecord.value.locationInfo === 'string'
          ? JSON.parse(editingRecord.value.locationInfo)
          : editingRecord.value.locationInfo,
    };
    await saveOrUpdateAttraction(saveData);
    message.success(editingRecord.value.id ? '编辑成功' : '新增成功');
    showModal.value = false;
    fetchData();
  } catch (error) {
    console.error('保存失败:', error);
    message.error('保存失败，请检查表单');
  } finally {
    saveLoading.value = false;
  }
};

// 查询数据
const fetchData = async () => {
  loading.value = true;
  try {
    const result = await queryAttractionList({
      page: {
        current: pagination.page,
        size: pagination.pageSize,
      },
      queryBody: queryForm,
    });
    tableData.value = result.records;
    pagination.total = result.total;
  } catch {
    message.error('获取数据失败');
  } finally {
    loading.value = false;
  }
};

// 添加一个新的 ref 来控制描述弹窗的显示
const showDescriptionModal = ref(false);
// 添加一个新的 ref 来存储当前查看的描述内容
const currentDescription = ref('');

// 表格列定义
const columns = [
  { key: 'title', title: '景点名', width: 150 },
  { key: 'regionName', title: '所属区域', width: 150 },
  {
    key: 'locationInfo',
    render: (row: AttractionApi.AttractionRecord) => {
      const locationInfo = row.locationInfo
        ? (typeof row.locationInfo === 'string'
          ? JSON.parse(row.locationInfo)
          : row.locationInfo)
        : { lnglat: '' };
      const [longitude, latitude] = locationInfo.lnglat.split(',');
      return h('div', [
        h('div', `经度: ${longitude || '无'}`),
        h('div', `纬度: ${latitude || '无'}`),
      ]);
    },
    title: '经纬度',
    width: 150,
  },
  { key: 'location', title: '位置名', width: 150 },

  {
    key: 'description',
    render: (row: AttractionApi.AttractionRecord) => {
      return h(
        NButton,
        {
          onClick: () => {
            currentDescription.value = row.description;
            showDescriptionModal.value = true;
          },
          size: 'small',
        },
        { default: () => '查看描述' },
      );
    },
    title: '概述',
    width: 100,
  },
  {
    key: 'publishStatus',
    render: (row: AttractionApi.AttractionRecord) => {
      return h(
        NTag,
        { type: row.publishStatus === 'PUBLISH' ? 'success' : 'warning' },
        {
          default: () =>
            row.publishStatus === 'PUBLISH' ? '已发布' : '待发布',
        },
      );
    },
    title: '发布状态',
    width: 100,
  },
  {
    key: 'enableStatus',
    render: (row: AttractionApi.AttractionRecord) => {
      return h(
        NTag,
        { type: row.enableStatus ? 'success' : 'error' },
        { default: () => (row.enableStatus ? '可用' : '禁用') },
      );
    },
    title: '可用状态',
    width: 100,
  },
  {
    key: 'actions',
    render: (row: AttractionApi.AttractionRecord) => {
      return h(
        NButtonGroup,
        { size: 'small' },
        {
          default: () => [
            h(
              NButton,
              {
                loading: editLoading.value,
                onClick: () => handleEdit(row),
                type: 'primary',
              },
              { default: () => '编辑' },
            ),
            h(
              NButton,
              {
                loading: topLoading.value,
                onClick: () => handleTop(row),
                type: 'info',
              },
              { default: () => '置顶' },
            ),
            h(
              NButton,
              {
                loading: deleteLoading.value,
                onClick: () => handleDelete(row),
                type: 'error',
              },
              { default: () => '删除' },
            ),
            row.publishStatus === 'PENDING'
              ? h(
                  NButton,
                  {
                    loading: publishLoading.value,
                    onClick: () => handlePublish(row),
                    type: 'success',
                  },
                  { default: () => '发布' },
                )
              : h(
                  NButton,
                  {
                    loading: publishLoading.value,
                    onClick: () => handlePublish(row),
                    type: 'warning',
                  },
                  { default: () => '撤回' },
                ),
          ],
        },
      );
    },
    title: '操作',
    width: 220,
  },
];

// 处理查询
const handleSearch = () => {
  pagination.page = 1;
  fetchData();
};

// 处理重置
const handleReset = () => {
  queryForm.regionId = undefined;
  queryForm.title = '';
  queryForm.publishStatus = null;
  queryForm.enableStatus = null;
  handleSearch();
};

// 处理分页变化
const handlePageChange = (page: number) => {
  pagination.page = page;
  fetchData();
};

// 修改 handleAdd 函数
const handleAdd = () => {
  modalTitle.value = '新增景点';
  editingRecord.value = {
    coverList: [],
    description: '',
    extendContent: {},
    id: undefined,
    location: '',
    locationInfo: {},
    regionId: undefined,
    title: '',
  };
  showModal.value = true;
};

// 计算属性：封面文件
const coverFileList = computed<UploadFileInfo[]>(() => {
  return editingRecord.value.coverList.map((url, index) => ({
    id: `cover-${index}`,
    name: `封面${index + 1}`,
    status: 'finished',
    url,
  }));
});

// 添加上传进度状态
const uploadProgress = ref(0);
const isUploading = ref(false);

// 更新处理文件上传函数
const handleFileUpload = async (options: { fileList: UploadFileInfo[] }) => {
  const { fileList } = options;
  const newFiles = fileList.filter((file) => file.status === 'pending');

  for (const file of newFiles) {
    if (file.file) {
      try {
        isUploading.value = true;
        uploadProgress.value = 0;
        const formData = new FormData();
        formData.append('file', file.file);
        const result = await uploadFile(formData, (progress) => {
          uploadProgress.value = progress;
        });
        editingRecord.value.coverList.push(result.fileUrl);
      } catch (error) {
        console.error('文件上传失败:', error);
        message.error(`文件 ${file.name} 上传失败`);
      } finally {
        isUploading.value = false;
      }
    }
  }

  if (newFiles.length > 0) {
    message.success('文件上传成功');
  }
};

// 处理文件删除
const handleFileRemove = (file: UploadFileInfo) => {
  console.log('handleFileRemove', file);
  const index = editingRecord.value.coverList.indexOf(file.file.url);
  if (index !== -1) {
    editingRecord.value.coverList.splice(index, 1);
  }
};

// 文件上传前的验证
const beforeUpload = (data: {
  file: UploadFileInfo;
  fileList: UploadFileInfo[];
}) => {
  const { file, fileList } = data;
  const isImage = file.type?.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件');
    return false;
  }
  if (fileList.length > 3) {
    message.error('最多只能上传3张封面图');
    return false;
  }
  return true;
};

// 初始加载数据
fetchData();

// 添加一个计算属性来动态计算表格度
const pageHeight = ref(window.innerHeight);
const tableHeight = computed(() => {
  const systemBarHeight = 50;
  const tabBarHeight = 37;
  const bottomHeight = 32;
  const titleCardHeight = 84;
  const cardMargin = 16 * 2 + 20 * 2;
  return (
    pageHeight.value -
    systemBarHeight -
    tabBarHeight -
    bottomHeight -
    titleCardHeight -
    queryCardHeight.value -
    cardMargin * 2
  );
});

// 添加 ref 来获取卡片元素
const queryCardRef = ref<HTMLElement | null>(null);
const queryCardHeight = ref(0);

// Add this near the top of the script, with other ref declarations
const regionOptions = ref<{ label: string; value: number }[]>([]);

// Add this function to fetch region list
const fetchRegionList = async () => {
  try {
    const result = await queryRegionList({
      page: { current: 1, size: 1000 }, // Adjust size as needed
      queryBody: {},
    });
    regionOptions.value = result.records.map((region) => ({
      label: region.title,
      value: region.id,
    }));
  } catch (error) {
    console.error('获取区域列表失败:', error);
    message.error('获取区域列表失败');
  }
};

// Modify the onMounted hook to fetch region list
onMounted(async () => {
  await nextTick();
  if (queryCardRef.value) {
    queryCardHeight.value = queryCardRef.value.offsetHeight;
  }

  const updateHeight = () => {
    pageHeight.value = window.innerHeight;
    if (queryCardRef.value) {
      queryCardHeight.value = queryCardRef.value.offsetHeight;
    }
  };

  window.addEventListener('resize', updateHeight);

  onUnmounted(() => {
    window.removeEventListener('resize', updateHeight);
  });

  // Add this line to fetch region list
  await fetchRegionList();
});

// 添加一个紫色主题配置
const purpleTheme = {
  common: {
    primaryColor: '#8a2be2',
    primaryColorHover: '#9f3ff3',
    primaryColorPressed: '#7a1dd1',
  },
};
</script>

<template>
  <Page description="管理系统中的景点信息" title="景点管理">
    <NCard ref="queryCardRef" :bordered="true" class="query-card">
      <NForm :model="queryForm" inline>
        <NSpace
          :size="[24, 0]"
          align="center"
          justify="space-between"
          style="width: 100%"
        >
          <NSpace :size="24" align="center">
            <NFormItem label="关联区域" label-placement="left">
              <NSelect
                v-model:value="queryForm.regionId"
                :options="regionOptions"
                clearable
                filterable
                placeholder="请选择关联区域"
                style="width: 150px"
              />
            </NFormItem>
            <NFormItem label="标题" label-placement="left">
              <NInput v-model:value="queryForm.title" style="width: 150px" />
            </NFormItem>
            <NFormItem label="发布状态" label-placement="left">
              <NSelect
                v-model:value="queryForm.publishStatus"
                :options="[
                  { label: '待发布', value: 'PENDING' },
                  { label: '已发布', value: 'PUBLISH' },
                ]"
                clearable
                style="width: 120px"
              />
            </NFormItem>
            <NFormItem label="可用状态" label-placement="left">
              <NSelect
                v-model:value="queryForm.enableStatus"
                :options="[
                  { label: '可用', value: true },
                  { label: '禁用', value: false },
                ]"
                clearable
                style="width: 120px"
              />
            </NFormItem>
          </NSpace>
          <NSpace>
            <NConfigProvider :theme="purpleTheme">
              <NButton type="primary" @click="handleSearch">搜索</NButton>
            </NConfigProvider>
            <NButton @click="handleReset">重置</NButton>
            <NButton type="success" @click="handleAdd">新增景点</NButton>
          </NSpace>
        </NSpace>
      </NForm>
    </NCard>

    <NCard class="table-card">
      <NDataTable
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :scroll-x="1100"
        :style="{ height: `${tableHeight}px` }"
        striped
        @update:page="handlePageChange"
      />
    </NCard>

    <NModal
      v-model:show="showModal"
      :title="modalTitle"
      preset="card"
      style="width: 80vw; max-width: 1000px"
    >
      <NForm
        ref="formRef"
        :model="editingRecord"
        :rules="rules"
        class="modal-form"
        label-placement="left"
        label-width="100px"
        require-mark-placement="right-hanging"
      >
        <NFormItem label="关联区域" path="regionId">
          <NSelect
            v-model:value="editingRecord.regionId"
            :options="regionOptions"
            clearable
            filterable
            placeholder="请选择关联区域"
          />
        </NFormItem>
        <NFormItem label="标题" path="title">
          <NInput v-model:value="editingRecord.title" />
        </NFormItem>
        <NFormItem label="封面" path="coverList">
          <div class="upload-container">
            <NUpload
              :before-upload="beforeUpload"
              :file-list="coverFileList"
              :max="3"
              list-type="image-card"
              multiple
              @change="handleFileUpload"
              @remove="handleFileRemove"
            >
              上传图片
              <NProgress
                v-if="isUploading"
                :height="6"
                :percentage="uploadProgress"
                :show-indicator="false"
                class="upload-progress"
                processing
              />
            </NUpload>
          </div>
        </NFormItem>
        <NFormItem class="description-item" label="景点概述" path="description">
          <RichTextEditor v-model="editingRecord.description" />
        </NFormItem>
        <NFormItem label="位置信息" path="locationInfo" style="width: 100%">
          <LocationMap
            v-model:location="editingRecord.location"
            v-model:location-info="editingRecord.locationInfo"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showModal = false">取消</NButton>
          <NConfigProvider :theme="purpleTheme">
            <NButton :loading="saveLoading" type="primary" @click="handleSave">
              保存
            </NButton>
          </NConfigProvider>
        </NSpace>
      </template>
    </NModal>

    <!-- 添加描述查看弹窗 -->
    <NModal
      v-model:show="showDescriptionModal"
      :mask-closable="false"
      preset="card"
      style="width: min(50%, 400px)"
      title="景点描述"
    >
      <div v-html="currentDescription"></div>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showDescriptionModal = false">关闭</NButton>
        </NSpace>
      </template>
    </NModal>
  </Page>
</template>

<style scoped>
/* 添加移动端响应式样式 */
@media (max-width: 768px) {
  .query-card :deep(.n-form) {
    flex-direction: column;
    align-items: stretch;
  }

  .query-card :deep(.n-form-item) {
    margin-bottom: 8px;
  }

  .query-card :deep(.n-space) {
    flex-direction: column;
  }

  .query-card :deep(.n-select),
  .query-card :deep(.n-input) {
    width: 100% !important;
  }

  .n-data-table {
    font-size: 12px;
  }

  .n-button {
    padding: 4px 8px;
    font-size: 12px;
  }

  .n-modal {
    width: 90vw !important;
    max-width: none !important;
  }

  .editor-container {
    height: 200px;
  }

  .editor-container :deep(.w-e-toolbar) {
    flex-wrap: wrap;
  }

  .editor-container :deep(.w-e-text-container) {
    height: 150px;
  }

  .n-upload {
    width: 100%;
  }

  .n-upload-file-list {
    justify-content: flex-start;
  }
}

/* 优化表格在移动端的显示 */
@media (max-width: 768px) {
  .n-data-table :deep(th),
  .n-data-table :deep(td) {
    padding: 8px 4px;
  }

  .n-data-table :deep(.n-data-table-td__ellipsis) {
    max-width: 100px;
  }

  /* 隐藏一些不太重要的列 */
  .n-data-table :deep(th:nth-child(2)),
  .n-data-table :deep(td:nth-child(2)),
  .n-data-table :deep(th:nth-child(3)),
  .n-data-table :deep(td:nth-child(3)) {
    display: none;
  }
}

.n-form-item {
  margin-bottom: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

.n-input-number {
  width: 100%;
}

.n-modal {
  max-height: 90vh;
  overflow-y: auto;
}

.n-data-table .n-button {
  text-decoration: underline;
}

.n-form {
  width: 100%;
}

.n-space {
  width: 100%;
}

.n-upload {
  width: 100%;
}

.n-upload-trigger {
  width: 100%;
}

.n-upload-file-list {
  justify-content: center;
}

.query-card {
  padding: 8px 16px; /* 添加一些上下内边距 */
  margin-bottom: 16px;
}

.query-card :deep(.n-form) {
  display: flex;
  align-items: center;
  height: 100%;
}

.query-card :deep(.n-form-item) {
  display: flex;
  align-items: center;
  margin-bottom: 0;
}

.query-card :deep(.n-form-item-label) {
  height: auto;
  padding: 0 8px 0 0;
  line-height: normal;
}

.query-card :deep(.n-form-item-blank) {
  display: flex;
  align-items: center;
}

.query-card :deep(.n-button-group) {
  display: flex;
}

.query-card :deep(.n-button-group .n-button) {
  margin-right: 0;
}

.upload-container {
  position: relative;
  width: 100%;
}

.upload-container :deep(.n-upload-trigger) {
  position: relative;
  overflow: hidden;
}

.upload-progress {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
}
</style>
