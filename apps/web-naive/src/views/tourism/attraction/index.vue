<script setup lang="ts">
import type { FormInst, FormRules, UploadFileInfo } from 'naive-ui';

import type { AttractionApi } from '#/api/core/attraction.types';

import { computed, h, nextTick, onMounted, reactive, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import {
  NButton,
  NButtonGroup,
  NCard,
  NDataTable,
  NDynamicTags,
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
import TEditor from '#/components/TEditor.vue';
import { useDynamicHeight } from '#/utils/heightUtils';

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
  tagList: [],
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
  tagList: {
    message: '请至少添加一个标签',
    min: 1,
    type: 'array',
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

// 创建 Vben Admin 模态窗实例
const [Modal, modalApi] = useVbenModal({
  draggable: true,
  onCancel: () => {
    modalApi.close();
  },
  onConfirm() {
    handleSave();
  },
  title: modalTitle.value,
});

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
    modalApi.open();
  } catch (error) {
    console.error('获取详情失败:', error);
    message.error('获取详情失败');
  } finally {
    editLoading.value = false;
  }
};
// 定义 handleSave 函数
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
    modalApi.close();
  } catch (error) {
    console.error('保存失败:', error);
    message.error('保存失败，请检查表单');
  } finally {
    saveLoading.value = false;
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
        ? typeof row.locationInfo === 'string'
          ? JSON.parse(row.locationInfo)
          : row.locationInfo
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
  queryForm.regionId = null;
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
    tagList: [],
    title: '',
  };
  showModal.value = true;
  modalApi.open();
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

// 添加上传进状态
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

// 添加一个计算属性来动态计算表格高度
const queryCardRef = ref(null);
const { queryCardHeight, tableHeight } = useDynamicHeight(queryCardRef);
// Modify the onMounted hook to fetch region list
onMounted(async () => {
  await nextTick();
  // Add this line to fetch region list
  await fetchRegionList();
  if (queryCardRef.value) {
    queryCardHeight.value = queryCardRef.value.offsetHeight;
    console.log('queryCardHeight:', queryCardHeight.value);
  } else {
    console.warn('queryCardRef is not available');
  }
});
</script>

<template>
  <Page description="管理系统中的景点信息" title="景点管理">
    <div ref="queryCardRef" class="w-full">
      <NCard :bordered="true" class="mb-4 p-2">
        <NForm :model="queryForm" class="flex h-full items-center" inline>
          <NSpace :size="[24, 0]" class="w-full items-center justify-between">
            <NSpace :size="24" align="center">
              <NFormItem
                class="mb-0 flex items-center"
                label="关联区域"
                label-placement="left"
              >
                <NSelect
                  v-model:value="queryForm.regionId"
                  :options="regionOptions"
                  class="w-36"
                  clearable
                  filterable
                  placeholder="请选择关联区域"
                />
              </NFormItem>
              <NFormItem
                class="mb-0 flex items-center"
                label="标题"
                label-placement="left"
              >
                <NInput v-model:value="queryForm.title" class="w-36" />
              </NFormItem>
              <NFormItem
                class="mb-0 flex items-center"
                label="发布状态"
                label-placement="left"
              >
                <NSelect
                  v-model:value="queryForm.publishStatus"
                  :options="[
                    { label: '待发布', value: 'PENDING' },
                    { label: '已发布', value: 'PUBLISH' },
                  ]"
                  class="w-28"
                  clearable
                />
              </NFormItem>
              <NFormItem
                class="mb-0 flex items-center"
                label="可用状态"
                label-placement="left"
              >
                <NSelect
                  v-model:value="queryForm.enableStatus"
                  :options="[
                    { label: '可用', value: true },
                    { label: '禁用', value: false },
                  ]"
                  class="w-28"
                  clearable
                />
              </NFormItem>
            </NSpace>
            <NSpace>
              <NButtonGroup>
                <NButton type="primary" @click="handleSearch">搜索</NButton>
                <NButton @click="handleReset">重置</NButton>
                <NButton type="success" @click="handleAdd">新增景点</NButton>
              </NButtonGroup>
            </NSpace>
          </NSpace>
        </NForm>
      </NCard>
    </div>
    <NCard>
      <NDataTable
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :max-height="tableHeight"
        :pagination="pagination"
        :scroll-x="1100"
        striped
        @update:page="handlePageChange"
      />
    </NCard>

    <Modal
      class="max-h-[90vh] w-4/5 max-w-4xl overflow-y-auto"
      title="保存景点信息"
    >
      <div class="flex-col-center">
        <NForm
          ref="formRef"
          :model="editingRecord"
          :rules="rules"
          class="w-full"
          label-placement="left"
          label-width="100px"
          require-mark-placement="right-hanging"
        >
          <NSpace :size="24" align="start">
            <NFormItem label="关联区域" path="regionId">
              <NSelect
                v-model:value="editingRecord.regionId"
                :options="regionOptions"
                clearable
                filterable
                placeholder="请选择关联区域"
                style="width: 200px"
              />
            </NFormItem>
            <NFormItem label="标题" path="title">
              <NInput
                v-model:value="editingRecord.title"
                style="width: 200px"
              />
            </NFormItem>
          </NSpace>

          <NFormItem label="标签列" path="tagList">
            <NDynamicTags v-model:value="editingRecord.tagList" />
          </NFormItem>

          <NFormItem label="封面" path="coverList">
            <div class="relative w-full">
              <NUpload
                :before-upload="beforeUpload"
                :file-list="coverFileList"
                :max="3"
                class="w-full"
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
                  class="absolute inset-x-0 bottom-0 z-10"
                  processing
                />
              </NUpload>
            </div>
          </NFormItem>
          <NFormItem class="w-full" label="景点概述" path="description">
            <TEditor v-model="editingRecord.description" />
          </NFormItem>
          <NFormItem class="w-full" label="位置信息" path="locationInfo">
            <LocationMap
              v-model:location="editingRecord.location"
              v-model:location-info="editingRecord.locationInfo"
            />
          </NFormItem>
        </NForm>
      </div>
    </Modal>

    <NModal
      v-model:show="showDescriptionModal"
      :mask-closable="false"
      class="w-1/2 max-w-md"
      preset="card"
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

<style scoped></style>
