<script setup lang="ts">
import type { FormInst, FormRules, UploadFileInfo } from 'naive-ui';

import type { PopupApi } from '#/api/marketing/popup.types';
import type { RegionApi } from '#/api/core/region.types';

import { h, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NButtonGroup,
  NCard,
  NCol,
  NDataTable,
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPagination,
  NRow,
  NSelect,
  NSpace,
  NUpload,
  useDialog,
  useMessage,
} from 'naive-ui';

import {
  deletePopups,
  queryPopupList,
  saveOrUpdatePopup,
  updatePopupStatus,
} from '#/api/marketing/popup';
import { uploadFile } from '#/api/core/file';
import { queryRegionList } from '#/api/core/region';
import { useDynamicHeight } from '#/utils/heightUtils';

const message = useMessage();
const dialog = useDialog();

// 区域选项
const regionOptions = ref<Array<{ label: string; value: number }>>([]);

// 查询条件
const queryForm = reactive<PopupApi.QueryParams['queryBody']>({
  title: undefined,
  startTimeBegin: undefined,
  startTimeEnd: undefined,
  status: undefined,
  regionId: undefined,
});

// 表格数据
const tableData = ref<PopupApi.PopupRecord[]>([]);
const loading = ref(false);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
  itemCount: 0,
  showSizePicker: true,
  showQuickJumper: true,
  pageSizes: [10, 20, 50],
});

// 模态框相关
const showModal = ref(false);
const modalTitle = ref('');

// 图片上传相关
const imageFileList = ref<UploadFileInfo[]>([]);
const uploadProgress = ref(0);
const isUploading = ref(false);

const editingRecord = ref<PopupApi.PopupSaveReq & { regionId?: number }>({
  title: '',
  content: '',
  imageUrl: '',
  jumpType: 0,
  jumpUrl: '',
  startTime: null,
  endTime: null,
  priority: 999,
  showFrequency: 1,
  targetUsers: 'all',
  platform: 'all',
  regionId: undefined,
});

// 表单规则
const rules: FormRules = {
  title: { message: '请输入标题', required: true, trigger: 'blur' },
  content: { message: '请输入弹窗内容', required: true, trigger: 'blur' },
  imageUrl: { message: '请上传图片', required: true, trigger: 'blur' },
  jumpType: { message: '请选择跳转类型', required: true, type: 'number', trigger: 'change' },
  startTime: { message: '请选择开始时间', required: true, type: 'date', trigger: 'change' },
  endTime: { message: '请选择结束时间', required: true, type: 'date', trigger: 'change' },
  priority: { message: '请输入优先级', required: true, type: 'number', trigger: 'blur' },
  showFrequency: { message: '请选择展示频率', required: true, type: 'number', trigger: 'change' },
  targetUsers: { message: '请选择目标用户', required: true, trigger: 'change' },
  platform: { message: '请选择平台', required: true, trigger: 'change' },
};

const formRef = ref<FormInst | null>(null);

// 添加新的 loading 状态
const editLoading = ref(false);
const deleteLoading = ref(false);
const saveLoading = ref(false);

// 格式化日期时间
const formatDate = (date: string | number | Date | null): string => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 解析后端返回的时间格式
const parseBackendDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  
  // 将 "2025-01-10 12:12:12" 转换为 "2025-01-10T12:12:12"
  const isoString = dateString.replace(' ', 'T');
  const date = new Date(isoString);
  
  // 检查日期是否有效
  return isNaN(date.getTime()) ? null : date;
};

// 获取区域列表
const fetchRegions = async () => {
  try {
    const result = await queryRegionList({
      page: {
        current: 1,
        size: 1000, // 获取所有区域
      },
      queryBody: {},
    });
    regionOptions.value = result.records.map(region => ({
      label: region.title,
      value: region.id,
    }));
  } catch (error) {
    console.error('获取区域列表失败:', error);
    message.error('获取区域列表失败');
  }
};

// 查询数据
const fetchData = async () => {
  loading.value = true;
  try {
    // 格式化查询时间
    const queryBody = {
      ...queryForm,
      startTimeBegin: queryForm.startTimeBegin ? formatDate(queryForm.startTimeBegin) : undefined,
      startTimeEnd: queryForm.startTimeEnd ? formatDate(queryForm.startTimeEnd) : undefined,
    };
    
    const result = await queryPopupList({
      page: {
        current: pagination.page,
        size: pagination.pageSize,
      },
      queryBody,
    });
    tableData.value = result.records;
    pagination.total = result.total;
    pagination.itemCount = result.total;
    pagination.pageSize = result.size;
    // 确保页码不会超过总页数
    const totalPages = Math.ceil(result.total / pagination.pageSize);
    if (pagination.page > totalPages && totalPages > 0) {
      pagination.page = totalPages;
    }
  } catch {
    message.error('获取数据失败');
  } finally {
    loading.value = false;
  }
};

// 表格列定义
const columns = [
  {
    key: 'title',
    title: '标题',
    width: 150,
  },
  {
    key: 'imageUrl',
    render: (row: PopupApi.PopupRecord) => {
      return h('img', {
        src: row.imageUrl,
        style: {
          width: '80px',
          height: '40px',
          objectFit: 'cover',
        },
        onError: (e: any) => {
          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA4MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0zNi41IDExLjVDMzQuNTQ0NCAxMS41IDMyLjk1IDEzLjA5NDQgMzIuOTUgMTVDMzIuOTUgMTYuOTA1NiAzNC41NDQ0IDE4LjUgMzYuNSAxOC41QzM4LjQ1NTYgMTguNSA0MC4wNSAxNi45MDU2IDQwLjA1IDE1QzQwLjA1IDEzLjA5NDQgMzguNDU1NiAxMS41IDM2LjUgMTEuNVoiIGZpbGw9IiM4QzhDOEMiLz4KPHBhdGggZD0iTTI4LjUgMjQuNUMyOC41IDIzLjY3OTUgMjguODIwNSAyMy4zNTg5IDI5LjI0MjYgMjIuOTM2OEMyOS42NjQ3IDIyLjUxNDcgMzAuMjI0NCAyMi4xOTQxIDMwLjg0NzkgMjIuMTk0MUgzNS4xNTIxQzM1LjczNTYgMjIuMTk0MSAzNi4yOTUzIDIyLjUxNDcgMzYuNzE3NCAyMi45MzY4QzM3LjEzOTUgMjMuMzU4OSAzNy40NiAyMy42Nzk1IDM3LjQ2IDI0LjVDMzcuNDYgMjUuMDMwNCAzNy4yNDkzIDI1LjUzOTEgMzYuODc0MiAyNS45MTQyQzM2LjQ5OTEgMjYuMjg5MyAzNS45OTA0IDI2LjUgMzUuNDYgMjYuNUgzMC41NEMyOS45Njk2IDI2LjUgMjkuNDYwOSAyNi4yODkzIDI5LjA4NTggMjUuOTE0MkMyOC43MTA3IDI1LjUzOTEgMjguNSAyNS4wMzA0IDI4LjUgMjQuNVoiIGZpbGw9IiM4QzhDOEMiLz4KPC9zdmc+';
        }
      });
    },
    title: '图片',
    width: 120,
  },
  {
    key: 'jumpType',
    render: (row: PopupApi.PopupRecord) => {
      const jumpTypeMap = {
        0: '不跳转',
        1: '内部页面',
        2: 'H5链接',
        3: '小程序路径',
      };
      return jumpTypeMap[row.jumpType as keyof typeof jumpTypeMap] || '未知';
    },
    title: '跳转类型',
    width: 120,
  },
  {
    key: 'jumpUrl',
    title: '跳转地址',
    width: 200,
  },
  {
    key: 'startTime',
    title: '开始时间',
    width: 180,
    render: (row: PopupApi.PopupRecord) => {
      return row.startTime || '';
    },
  },
  {
    key: 'endTime',
    title: '结束时间',
    width: 180,
    render: (row: PopupApi.PopupRecord) => {
      return row.endTime || '';
    },
  },
  {
    key: 'priority',
    title: '优先级',
    width: 80,
  },
  {
    key: 'showFrequency',
    render: (row: PopupApi.PopupRecord) => {
      const frequencyMap = {
        1: '每次',
        2: '每日首次',
        3: '仅一次',
      };
      return frequencyMap[row.showFrequency as keyof typeof frequencyMap] || '未知';
    },
    title: '展示频率',
    width: 100,
  },
  {
    key: 'targetUsers',
    render: (row: PopupApi.PopupRecord) => {
      const targetMap = {
        all: '所有用户',
        new: '新用户',
        vip: 'VIP用户',
      };
      return targetMap[row.targetUsers as keyof typeof targetMap] || '未知';
    },
    title: '目标用户',
    width: 100,
  },
  {
    key: 'platform',
    render: (row: PopupApi.PopupRecord) => {
      const platformMap = {
        all: '全平台',
        ios: '仅iOS',
        android: '仅Android',
      };
      return platformMap[row.platform as keyof typeof platformMap] || '未知';
    },
    title: '平台',
    width: 100,
  },
  {
    key: 'status',
    render: (row: PopupApi.PopupRecord) => {
      return row.status === 1 ? '正常' : '下架';
    },
    title: '状态',
    width: 100,
  },
  {
    fixed: 'right',
    key: 'actions',
    render: (row: PopupApi.PopupRecord) => {
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
                loading: deleteLoading.value,
                onClick: () => handleDelete(row),
                type: 'error',
              },
              { default: () => '删除' },
            ),
            h(
              NButton,
              {
                onClick: () => handleToggleStatus(row),
                type: row.status === 1 ? 'warning' : 'success',
              },
              { default: () => (row.status === 1 ? '下架' : '启用') },
            ),
          ],
        },
      );
    },
    title: '操作',
    width: 200,
  },
];

// 处理查询
const handleSearch = () => {
  pagination.page = 1;
  fetchData();
};

// 处理重置
const handleReset = () => {
  queryForm.title = undefined;
  queryForm.startTimeBegin = undefined;
  queryForm.startTimeEnd = undefined;
  queryForm.status = undefined;
  queryForm.regionId = undefined;
  handleSearch();
};

// 处理分页变化
const handlePageChange = (page: number) => {
  pagination.page = page;
  fetchData();
};

// 处理分页大小变化
const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize;
  pagination.page = 1;
  fetchData();
};

// 处理新增
const handleAdd = () => {
  modalTitle.value = '新增弹窗';
  editingRecord.value = {
    title: '',
    content: '',
    imageUrl: '',
    jumpType: 0,
    jumpUrl: '',
    startTime: null,
    endTime: null,
    priority: 999,
    showFrequency: 1,
    targetUsers: 'all',
    platform: 'all',
    regionId: undefined,
  };

  // 重置图片文件列表
  imageFileList.value = [];

  showModal.value = true;
};

// 修改 handleEdit 函数
const handleEdit = async (row: PopupApi.PopupRecord) => {
  editLoading.value = true;
  try {
    modalTitle.value = '编辑弹窗';

    editingRecord.value = {
      id: row.id,
      title: row.title,
      content: row.content,
      imageUrl: row.imageUrl,
      jumpType: row.jumpType,
      jumpUrl: row.jumpUrl,
      startTime: parseBackendDate(row.startTime),
      endTime: parseBackendDate(row.endTime),
      priority: row.priority,
      status: row.status,
      showFrequency: row.showFrequency,
      targetUsers: row.targetUsers,
      platform: row.platform,
      regionId: row.regionId,
    };

    // 设置图片文件列表
    if (row.imageUrl) {
      imageFileList.value = [{
        id: 'popup',
        name: 'popup.jpg',
        status: 'finished',
        url: row.imageUrl,
      }];
    } else {
      imageFileList.value = [];
    }

    showModal.value = true;
  } catch (error) {
    console.error('获取详情失败:', error);
    message.error('获取详情失败');
  } finally {
    editLoading.value = false;
  }
};

// 修改 handleDelete 函数
const handleDelete = async (row: PopupApi.PopupRecord) => {
  // 添加二次确认
  dialog.warning({
    title: '确认删除',
    content: `确定要删除弹窗 "${row.title}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      deleteLoading.value = true;
      try {
        await deletePopups([row.id]);
        message.success('删除成功');
        fetchData();
      } catch {
        message.error('删除失败');
      } finally {
        deleteLoading.value = false;
      }
    },
  });
};

// 处理启用/禁用
const handleToggleStatus = async (row: PopupApi.PopupRecord) => {
  // 添加二次确认
  const action = row.status === 1 ? '下架' : '启用';
  dialog.warning({
    title: `确认${action}`,
    content: `确定要${action}弹窗 "${row.title}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const newStatus = row.status === 1 ? 0 : 1; // 1:正常, 0:下架
        await updatePopupStatus({
          id: row.id,
          status: newStatus,
        });
        message.success(`${newStatus === 1 ? '启用' : '下架'}成功`);
        fetchData();
      } catch {
        message.error('操作失败');
      }
    },
  });
};

// 文件上传前的验证
const beforeUpload = (data: { file: UploadFileInfo }) => {
  const { file } = data;
  const isImage = file.type?.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件');
    return false;
  }
  return true;
};

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

      // 更新图片URL
      editingRecord.value.imageUrl = result.fileUrl;

      // 更新文件列表
      imageFileList.value.splice(0, imageFileList.value.length);
      imageFileList.value.push({
        id: Date.now().toString(),
        name: file.name,
        status: 'finished',
        url: result.fileUrl,
      });

      message.success('文件上传成功');
    } catch (error) {
      console.error('文件上传失败:', error);
      message.error('文件上传失败');
    } finally {
      isUploading.value = false;
    }
  }
};

// 处理文件删除
const handleFileRemove = () => {
  // 清除图片URL
  editingRecord.value.imageUrl = '';
  // 清空文件列表
  imageFileList.value.splice(0, imageFileList.value.length);
  return true;
};

// 修改 handleSave 函数
const handleSave = async () => {
  if (!formRef.value) return;
  saveLoading.value = true;
  try {
    await formRef.value.validate();

    // 确保时间字段格式正确
    const saveData = {
      ...editingRecord.value,
      startTime: editingRecord.value.startTime ? formatDate(editingRecord.value.startTime) : '',
      endTime: editingRecord.value.endTime ? formatDate(editingRecord.value.endTime) : '',
    };

    await saveOrUpdatePopup(saveData);
    message.success(saveData.id ? '编辑成功' : '新增成功');
    showModal.value = false;
    fetchData();
  } catch (error) {
    console.error('保存失败:', error);
    message.error('保存失败，请检查表单');
  } finally {
    saveLoading.value = false;
  }
};

// 初始加载数据
fetchData();

// 添加一个计算属性来动态计算表格高度
const queryCardRef = ref<HTMLElement | null>(null);
const { queryCardHeight, tableHeight } = useDynamicHeight(queryCardRef);

onMounted(() => {
  if (queryCardRef.value) {
    queryCardHeight.value = queryCardRef.value.offsetHeight;
  }
  // 获取区域列表
  fetchRegions();
});
</script>

<template>
  <Page description="管理系统中的弹窗信息" title="弹窗管理">
    <div ref="queryCardRef" class="w-full">
      <NCard class="query-card">
        <NForm :model="queryForm" inline>
          <NSpace
            :size="[24, 0]"
            align="center"
            justify="space-between"
            style="width: 100%"
          >
            <NSpace :size="24" align="center">
              <NFormItem label="标题" label-placement="left">
                <NInput v-model:value="queryForm.title" style="width: 150px" />
              </NFormItem>
              <NFormItem label="有效时间" label-placement="left">
                <NDatePicker
                  v-model:value="queryForm.startTimeBegin"
                  placeholder="开始时间"
                  style="width: 150px"
                  type="datetime"
                  value-format="yyyy-MM-dd HH:mm:ss"
                />
                <span style="margin: 0 8px">-</span>
                <NDatePicker
                  v-model:value="queryForm.startTimeEnd"
                  placeholder="结束时间"
                  style="width: 150px"
                  type="datetime"
                  value-format="yyyy-MM-dd HH:mm:ss"
                />
              </NFormItem>
              <NFormItem label="状态" label-placement="left">
                <NSelect
                  v-model:value="queryForm.status"
                  :options="[
                    { label: '正常', value: 1 },
                    { label: '下架', value: 0 },
                  ]"
                  clearable
                  style="width: 120px"
                />
              </NFormItem>
              <NFormItem label="区域" label-placement="left">
                <NSelect
                  v-model:value="queryForm.regionId"
                  :options="regionOptions"
                  clearable
                  filterable
                  placeholder="请选择区域"
                  style="width: 150px"
                />
              </NFormItem>
            </NSpace>
            <NSpace>
              <NButton type="primary" @click="handleSearch">搜索</NButton>
              <NButton @click="handleReset">重置</NButton>
              <NButton type="success" @click="handleAdd">新增弹窗</NButton>
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
        :max-height="`${tableHeight}px`"
        :min-height="`${tableHeight}px`"
        :scroll-x="2000"
        striped
      />
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
        <div>共 {{ pagination.itemCount }} 条记录</div>
        <NPagination
          v-model:page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :item-count="pagination.itemCount"
          :page-sizes="pagination.pageSizes"
          show-size-picker
          show-quick-jumper
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </div>
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
        <NRow :gutter="24">
          <NCol :span="12">
            <NFormItem label="标题" path="title">
              <NInput v-model:value="editingRecord.title" />
            </NFormItem>
          </NCol>
          <NCol :span="12">
            <NFormItem label="优先级" path="priority">
              <NInput v-model:value="editingRecord.priority" type="number" />
            </NFormItem>
          </NCol>
        </NRow>

        <NRow :gutter="24">
          <NCol :span="24">
            <NFormItem label="弹窗内容" path="content">
              <NInput v-model:value="editingRecord.content" type="textarea" :autosize="{ minRows: 3 }" />
            </NFormItem>
          </NCol>
        </NRow>

        <NRow :gutter="24">
          <NCol :span="12">
            <NFormItem label="区域" path="regionId">
              <NSelect
                v-model:value="editingRecord.regionId"
                :options="regionOptions"
                clearable
                filterable
                placeholder="请选择区域"
              />
            </NFormItem>
          </NCol>
        </NRow>

        <NRow :gutter="24">
          <NCol :span="12">
            <NFormItem label="跳转类型" path="jumpType">
              <NSelect
                v-model:value="editingRecord.jumpType"
                :options="[
                  { label: '不跳转', value: 0 },
                  { label: '内部页面', value: 1 },
                  { label: 'H5链接', value: 2 },
                  { label: '小程序路径', value: 3 },
                ]"
              />
            </NFormItem>
          </NCol>
          <NCol :span="12">
            <NFormItem label="跳转地址" path="jumpUrl">
              <NInput v-model:value="editingRecord.jumpUrl" />
            </NFormItem>
          </NCol>
        </NRow>

        <NRow :gutter="24">
          <NCol :span="12">
            <NFormItem label="开始时间" path="startTime">
              <NDatePicker
                v-model:value="editingRecord.startTime"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
              />
            </NFormItem>
          </NCol>
          <NCol :span="12">
            <NFormItem label="结束时间" path="endTime">
              <NDatePicker
                v-model:value="editingRecord.endTime"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
              />
            </NFormItem>
          </NCol>
        </NRow>

        <NRow :gutter="24">
          <NCol :span="12">
            <NFormItem label="展示频率" path="showFrequency">
              <NSelect
                v-model:value="editingRecord.showFrequency"
                :options="[
                  { label: '每次', value: 1 },
                  { label: '每日首次', value: 2 },
                  { label: '仅一次', value: 3 },
                ]"
              />
            </NFormItem>
          </NCol>
          <NCol :span="12">
            <NFormItem label="目标用户" path="targetUsers">
              <NSelect
                v-model:value="editingRecord.targetUsers"
                :options="[
                  { label: '所有用户', value: 'all' },
                  { label: '新用户', value: 'new' },
                  { label: 'VIP用户', value: 'vip' },
                ]"
              />
            </NFormItem>
          </NCol>
        </NRow>

        <NRow :gutter="24">
          <NCol :span="12">
            <NFormItem label="平台" path="platform">
              <NSelect
                v-model:value="editingRecord.platform"
                :options="[
                  { label: '全平台', value: 'all' },
                  { label: '仅iOS', value: 'ios' },
                  { label: '仅Android', value: 'android' },
                ]"
              />
            </NFormItem>
          </NCol>
        </NRow>

        <NFormItem label="图片" path="imageUrl" style="margin-bottom: 20px;">
          <NUpload
            :before-upload="beforeUpload"
            :file-list="imageFileList"
            :max="1"
            list-type="image-card"
            @change="handleFileUpload"
            @remove="handleFileRemove"
          >
            上传图片
          </NUpload>
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showModal = false">取消</NButton>
          <NButton :loading="saveLoading" type="primary" @click="handleSave">
            保存
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </Page>
</template>

<style scoped>
.query-card {
  padding: 8px 16px;
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

.n-data-table {
  flex: 1;
}
</style>