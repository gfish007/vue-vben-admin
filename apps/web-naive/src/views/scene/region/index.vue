<script setup lang="ts">
import type { FormInst, FormRules, UploadFileInfo } from 'naive-ui';

import type { RegionApi } from '#/api/core/region.types';

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
  NDynamicInput,
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

import { uploadFile } from '#/api/core/file';
import {
  deleteRegions,
  doTopRegion,
  getRegionDetail,
  queryRegionList,
  saveOrUpdateRegion,
} from '#/api/core/region';
import LocationMap from '#/components/LocationMap.vue';

// Add this type declaration
declare global {
  interface Window {
    _AMapSecurityConfig: {
      securityJsCode: string;
    };
  }
}

const message = useMessage();

// 查询条件
const queryForm = reactive<RegionApi.QueryParams['queryBody']>({
  country: '',
  enable_status: null,
  level: null,
  ncity: '',
  ndistrict: '',
  nprovince: '',
  nstreet: '',
  title: '',
});

// 表格数据
const tableData = ref<RegionApi.RegionRecord[]>([]);
const loading = ref(false);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

// 模态框相关
const showModal = ref(false);
const modalTitle = ref('');
const editingRecord = ref<Omit<RegionApi.RegionSaveReq, 'level'>>({
  coverUrl: '',
  description: '',
  extendContent: [{ key: '', value: '' }],
  location: '',
  locationId: 0,
  locationInfo: {},
  title: '',
});

// 表单规则
const rules: FormRules = {
  coverUrl: { message: '请输入封面URL', required: true, trigger: 'blur' },
  description: { message: '请输入描述', required: true, trigger: 'blur' },
  extendContent: {
    trigger: ['blur', 'change'],
    validator: (rule, value) => {
      if (!Array.isArray(value) || value.length === 0) {
        return new Error('请至少添加一项扩展内容');
      }
      const hasValidItem = value.some(
        (item) => item.key.trim() !== '' && item.value.trim() !== '',
      );
      if (!hasValidItem) {
        return new Error('至少需要一项有效的扩展内容（键和值都不为空）');
      }
      return true;
    },
  },
  location: { message: '请输入位置信息', required: true, trigger: 'blur' },
  locationId: {
    message: '请输入地理位置ID',
    required: true,
    trigger: 'change',
    type: 'number',
  },
  title: { message: '请输入名称', required: true, trigger: 'blur' },
};

const formRef = ref<FormInst | null>(null);

// 添加新的 loading 状态
const editLoading = ref(false);
const topLoading = ref(false);
const deleteLoading = ref(false);
const saveLoading = ref(false);

// 修改 handleEdit 函数
const handleEdit = async (row: RegionApi.RegionRecord) => {
  editLoading.value = true;
  try {
    modalTitle.value = '编辑区域';
    const detail = await getRegionDetail(row.id);
    const { level, ...restDetail } = detail; // 解构并忽略 level 字段
    editingRecord.value = {
      ...restDetail,
      extendContent: Array.isArray(restDetail.extendContent)
        ? restDetail.extendContent
        : [{ key: '', value: '' }],
      id: row.id,
      locationId: restDetail.locationId ?? 0,
      locationInfo:
        typeof restDetail.locationInfo === 'string'
          ? JSON.parse(restDetail.locationInfo)
          : restDetail.locationInfo || {},
    };
    showModal.value = true;
  } catch (error) {
    console.error('获取详情失败:', error);
    message.error('获取详情失败');
  } finally {
    editLoading.value = false;
  }
};

// 修改 handleDelete 函数
const handleDelete = async (row: RegionApi.RegionRecord) => {
  deleteLoading.value = true;
  try {
    await deleteRegions([row.id]);
    message.success('删除成功');
    fetchData();
  } catch {
    message.error('删除失败');
  } finally {
    deleteLoading.value = false;
  }
};

// 修改 handleTop 函数
const handleTop = async (row: RegionApi.RegionRecord) => {
  topLoading.value = true;
  try {
    await doTopRegion(row.id);
    message.success('置顶成功');
    fetchData();
  } catch {
    message.error('置顶失败');
  } finally {
    topLoading.value = false;
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
      extendContent: editingRecord.value.extendContent.filter(
        (item) => item.key.trim() !== '' || item.value.trim() !== '',
      ),
      locationInfo:
        typeof editingRecord.value.locationInfo === 'string'
          ? JSON.parse(editingRecord.value.locationInfo)
          : editingRecord.value.locationInfo,
    };
    await saveOrUpdateRegion(saveData);
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
    const result = await queryRegionList({
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

// 表格列定义
const columns = [
  {
    fixed: 'left',
    key: 'title',
    title: '地点名称',
    width: 180,
  },
  { key: 'location', title: '位置信息', width: 180 },
  {
    key: 'locationInfo',
    render: (row: RegionApi.RegionRecord) => {
      const locationInfo =
        typeof row.locationInfo === 'string'
          ? JSON.parse(row.locationInfo)
          : row.locationInfo;

      return locationInfo?.lnglat || '无经纬度信息';
    },
    title: '经纬度',
    width: 180,
  },
  {
    key: 'extendContent',
    render: (row: RegionApi.RegionRecord) => {
      const content =
        typeof row.extendContent === 'string'
          ? JSON.parse(row.extendContent)
          : row.extendContent;
      if (!Array.isArray(content) || content.length === 0) return '无扩展内容';
      return h(
        'div',
        { class: 'extend-content' },
        content.map((item) => h('div', {}, `${item.key}: ${item.value}`)),
      );
    },
    title: '扩展内容',
    width: 180,
  },
  {
    key: 'level',
    render: (row: RegionApi.RegionRecord) => {
      const levelMap = {
        city: '市',
        country: '国',
        district: '区',
        province: '省',
        street: '街',
      };
      return levelMap[row.level] || '未知';
    },
    title: '级别',
    width: 100,
  },
  {
    key: 'enable_status',
    render: (row: RegionApi.RegionRecord) => {
      return h(
        NTag,
        { type: row.enable_status === 1 ? 'success' : 'error' },
        { default: () => (row.enable_status === 1 ? '可用' : '禁用') },
      );
    },
    title: '状态',
    width: 100,
  },
  {
    fixed: 'right',
    key: 'actions',
    render: (row: RegionApi.RegionRecord) => {
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
                type: 'success',
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
          ],
        },
      );
    },
    title: '操作',
    width: 240,
  },
];

// 处理查询
const handleSearch = () => {
  pagination.page = 1;
  fetchData();
};

// 处理分页变化
const handlePageChange = (page: number) => {
  pagination.page = page;
  fetchData();
};

// 处理新增
const handleAdd = () => {
  modalTitle.value = '新增区域';
  editingRecord.value = {
    coverUrl: '',
    description: '',
    extendContent: [{ key: '', value: '' }],
    location: '',
    locationId: 0,
    locationInfo: {},
    title: '',
  };
  showModal.value = true;
};

// 计算属性：封面文件
const coverFileList = computed<UploadFileInfo[]>(() => {
  return editingRecord.value.coverUrl
    ? [
        {
          id: 'cover',
          name: '当前封面',
          status: 'finished',
          url: editingRecord.value.coverUrl,
        },
      ]
    : [];
});

// 添加上传进度状态
const uploadProgress = ref(0);
const isUploading = ref(false);

// 更新处理文件上传函数
const handleFileUpload = async (options: {
  file: UploadFileInfo;
  fileList: UploadFileInfo[];
}) => {
  const { file } = options;
  if (file.file) {
    try {
      isUploading.value = true;
      uploadProgress.value = 0;
      const formData = new FormData();
      formData.append('file', file.file);
      const result = await uploadFile(formData, (progress) => {
        uploadProgress.value = progress;
      });
      editingRecord.value.coverUrl = result.fileUrl;
      message.success('文件上传成功');
    } catch (error) {
      console.error('文件上传败:', error);
      message.error('文件上传失败');
    } finally {
      isUploading.value = false;
    }
  }
};

// 处理文件删除
const handleFileRemove = () => {
  editingRecord.value.coverUrl = '';
};

// 文件上传前的验证
const beforeUpload = (data: { file: UploadFileInfo }) => {
  const { file } = data;
  const isImage = file.type?.startsWith('image/');
  const isVideo = file.type?.startsWith('video/');
  if (!isImage && !isVideo) {
    message.error('只能上传图片或视频文件');
    return false;
  }
  return true;
};

// 添加一个新的函数来处理添加新项
const handleAddExtendContent = () => {
  return { key: '', value: '' };
};

// 初始加载数据
fetchData();

// 添加一个计算属性来动态计算表格高度
const pageHeight = ref(window.innerHeight);
const tableHeight = computed(() => {
  const systemBarHeight = 50;
  const tabBarHeight = 37;
  const bottomHeight = 32;
  const titleCardHeight = 84; // 区域管理卡片高度
  const cardMargin = 16 * 2 + 20 * 2; // 卡片之间的间距 和表格卡片的内边距
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

onMounted(async () => {
  // 等待下一个 DOM 更新周期
  await nextTick();
  // 获取查询卡片的实际高度
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

  // 清理函数
  onUnmounted(() => {
    window.removeEventListener('resize', updateHeight);
  });
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
  <Page description="管理系统中的区域信息" title="区域管理">
    <NCard ref="queryCardRef" class="query-card">
      <NForm :model="queryForm" inline>
        <NSpace
          :size="[24, 0]"
          align="center"
          justify="space-between"
          style="width: 100%"
        >
          <NSpace :size="24" align="center">
            <NFormItem label="可用状态" label-placement="left">
              <NSelect
                v-model:value="queryForm.enable_status"
                :options="[
                  { label: '可用', value: 1 },
                  { label: '不可用', value: 0 },
                ]"
                clearable
                style="width: 120px"
              />
            </NFormItem>
            <NFormItem label="名称" label-placement="left">
              <NInput v-model:value="queryForm.title" style="width: 200px" />
            </NFormItem>
          </NSpace>
          <NSpace>
            <NConfigProvider :theme="purpleTheme">
              <NButton type="primary" @click="handleSearch">搜索</NButton>
            </NConfigProvider>
            <NButton type="success" @click="handleAdd">新增区域</NButton>
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
        label-placement="left"
        label-width="100px"
        require-mark-placement="right-hanging"
      >
        <NFormItem label="名称" path="title">
          <NInput v-model:value="editingRecord.title" />
        </NFormItem>
        <NFormItem label="封面" path="coverUrl">
          <div class="upload-container">
            <NUpload
              :before-upload="beforeUpload"
              :file-list="coverFileList"
              :max="1"
              list-type="image-card"
              @change="handleFileUpload"
              @remove="handleFileRemove"
            >
              上传图片或视频
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
        <NFormItem label="描述" path="description">
          <NInput
            v-model:value="editingRecord.description"
            :autosize="{ minRows: 4, maxRows: 8 }"
            type="textarea"
          />
        </NFormItem>
        <NFormItem label="扩展内容" path="extendContent">
          <NDynamicInput
            v-model:value="editingRecord.extendContent"
            :on-create="handleAddExtendContent"
          >
            <template #create-button-default> 添加扩展内容 </template>
            <template #default="{ value }">
              <NInput
                v-model:value="value.key"
                placeholder="键"
                style="width: 40%; margin-right: 4%"
              />
              <NInput
                v-model:value="value.value"
                placeholder="值"
                style="width: 56%"
              />
            </template>
          </NDynamicInput>
        </NFormItem>
        <NFormItem label="位置信息" path="location" style="width: 100%">
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
  </Page>
</template>

<style scoped>
.n-form-item {
  margin-bottom: 24px;
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

/* 添加横线效果 */
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

/* 添加新的样式来限制扩展内容的高度并添加滚动条 */
.n-data-table .extend-content {
  max-height: 100px;
  overflow-y: auto;
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

.table-card {
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden; /* 添加这行来防止内容溢出 */
}

.n-data-table {
  flex: 1;
  overflow: auto; /* 添加这行来使表格内容可滚动 */
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
