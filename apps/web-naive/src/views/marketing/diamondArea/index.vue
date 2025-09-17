<script setup lang="ts">
import type { FormInst, FormRules, UploadFileInfo } from 'naive-ui';

import type { DiamondAreaApi } from '#/api/marketing/diamondArea.types';
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
  deleteDiamondAreas,
  queryDiamondAreaList,
  saveOrUpdateDiamondArea,
  updateDiamondAreaStatus,
} from '#/api/marketing/diamondArea';
import { uploadFile } from '#/api/core/file';
import { queryRegionList } from '#/api/core/region';
import { useDynamicHeight } from '#/utils/heightUtils';

const message = useMessage();
const dialog = useDialog();

// 区域选项
const regionOptions = ref<Array<{ label: string; value: number }>>([]);

// 查询条件
const queryForm = reactive<DiamondAreaApi.QueryParams['queryBody']>({
  title: undefined,
  startTimeBegin: undefined,
  startTimeEnd: undefined,
  status: undefined,
  regionId: undefined,
});

// 表格数据
const tableData = ref<DiamondAreaApi.DiamondAreaRecord[]>([]);
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

const editingRecord = ref<DiamondAreaApi.DiamondAreaSaveReq & { regionId?: number }>({
  title: '',
  iconUrl: '',
  jumpType: 0,
  jumpUrl: '',
  sortOrder: 999,
  startTime: null,
  endTime: null,
  status: 1,
  showType: 1, // 默认为背景图
  regionId: undefined,
});

// 表单规则
const rules: FormRules = {
  title: { message: '请输入金刚区名称', required: true, trigger: 'blur' },
  iconUrl: { message: '请输入图标链接', required: true, trigger: 'blur' },
  jumpType: { message: '请选择跳转类型', required: true, type: 'number', trigger: 'change' },
  sortOrder: { message: '请输入排序权重', required: true, type: 'number', trigger: 'blur' },
  startTime: { message: '请选择生效开始时间', required: true, type: 'date', trigger: 'change' },
  endTime: { message: '请选择生效结束时间', required: true, type: 'date', trigger: 'change' },
  showType: { message: '请选择显示方式', required: true, type: 'number', trigger: 'change' },
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
    
    const result = await queryDiamondAreaList({
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
    title: '金刚区名称',
    width: 150,
  },
  {
    key: 'iconUrl',
    render: (row: DiamondAreaApi.DiamondAreaRecord) => {
      return h('img', {
        src: row.iconUrl,
        style: {
          width: '40px',
          height: '40px',
          objectFit: 'cover',
        },
        onError: (e: any) => {
          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0yMCAxMEMxNy4zNTA2IDEwIDE1LjIxOTcgMTEuMDY3IDEzLjM0MzEgMTIuOTQzN0MxMS40NjY1IDE0LjgyMDMgMTAuNCAxNi45NTEzIDEwLjQgMTkuNjAwMUMxMC40IDIyLjI0ODkgMTEuNDY2NSAyNC4zNzk5IDEzLjM0MzEgMjYuMjU2NUMxNS4yMTk3IDI4LjEzMzEgMTcuMzUwNiAyOS4yIDIwIDI5LjJDMjIuNjQ5NCAyOS4yIDI0Ljc4MDMgMjguMTMzMSAyNi42NTY5IDI2LjI1NjVDMjguNTMzNSAyNC4zNzk5IDI5LjYgMjIuMjQ4OSAyOS42IDE5LjYwMDFDMjkuNiAxNi45NTEzIDI4LjUzMzUgMTQuODIwMyAyNi42NTY5IDEyLjk0MzdDMjQuNzgwMyAxMS4wNjcgMjIuNjQ5NCAxMCAyMCAxMFoiIGZpbGw9IiM4QzhDOEMiLz4KPC9zdmc+';
        }
      });
    },
    title: '图标',
    width: 80,
  },
  {
    key: 'showType',
    render: (row: DiamondAreaApi.DiamondAreaRecord) => {
      const showTypeMap = {
        1: '背景图',
        2: 'icon图标',
        3: '远程icon图标',
      };
      return showTypeMap[row.showType as keyof typeof showTypeMap] || '未知';
    },
    title: '显示方式',
    width: 120,
  },
  {
    key: 'jumpType',
    render: (row: DiamondAreaApi.DiamondAreaRecord) => {
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
    key: 'sortOrder',
    title: '排序权重',
    width: 100,
  },
  {
    key: 'startTime',
    title: '生效开始时间',
    width: 180,
    render: (row: DiamondAreaApi.DiamondAreaRecord) => {
      return row.startTime || '';
    },
  },
  {
    key: 'endTime',
    title: '生效结束时间',
    width: 180,
    render: (row: DiamondAreaApi.DiamondAreaRecord) => {
      return row.endTime || '';
    },
  },
  {
    key: 'status',
    render: (row: DiamondAreaApi.DiamondAreaRecord) => {
      return row.status === 1 ? '启用' : '禁用';
    },
    title: '状态',
    width: 100,
  },
  {
    key: 'regionId',
    render: (row: DiamondAreaApi.DiamondAreaRecord) => {
      const region = regionOptions.value.find(r => r.value === row.regionId);
      return region ? region.label : '未指定';
    },
    title: '区域',
    width: 120,
  },
  {
    fixed: 'right',
    key: 'actions',
    render: (row: DiamondAreaApi.DiamondAreaRecord) => {
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
              { default: () => (row.status === 1 ? '禁用' : '启用') },
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
  modalTitle.value = '新增金刚区';
  editingRecord.value = {
    title: '',
    iconUrl: '',
    jumpType: 0,
    jumpUrl: '',
    sortOrder: 999,
    startTime: null,
    endTime: null,
    status: 1,
    showType: 1, // 默认为背景图
    regionId: undefined,
  };

  // 重置图片文件列表
  imageFileList.value = [];

  showModal.value = true;
};

// 修改 handleEdit 函数
const handleEdit = async (row: DiamondAreaApi.DiamondAreaRecord) => {
  editLoading.value = true;
  try {
    modalTitle.value = '编辑金刚区';

    editingRecord.value = {
      id: row.id,
      title: row.title,
      iconUrl: row.iconUrl,
      jumpType: row.jumpType,
      jumpUrl: row.jumpUrl,
      sortOrder: row.sortOrder,
      startTime: parseBackendDate(row.startTime),
      endTime: parseBackendDate(row.endTime),
      status: row.status,
      showType: row.showType,
      regionId: row.regionId,
    };

    // 设置图片文件列表
    if (row.iconUrl) {
      imageFileList.value = [{
        id: 'diamondArea',
        name: 'diamondArea.jpg',
        status: 'finished',
        url: row.iconUrl,
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
const handleDelete = async (row: DiamondAreaApi.DiamondAreaRecord) => {
  // 添加二次确认
  dialog.warning({
    title: '确认删除',
    content: `确定要删除金刚区 "${row.title}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      deleteLoading.value = true;
      try {
        await deleteDiamondAreas([row.id]);
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
const handleToggleStatus = async (row: DiamondAreaApi.DiamondAreaRecord) => {
  // 添加二次确认
  const action = row.status === 1 ? '禁用' : '启用';
  dialog.warning({
    title: `确认${action}`,
    content: `确定要${action}金刚区 "${row.title}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const newStatus = row.status === 1 ? 0 : 1; // 1:启用, 0:禁用
        await updateDiamondAreaStatus({
          id: row.id,
          status: newStatus,
        });
        message.success(`${newStatus === 1 ? '启用' : '禁用'}成功`);
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

      // 更新图标URL
      editingRecord.value.iconUrl = result.fileUrl;

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
  // 清除图标URL
  editingRecord.value.iconUrl = '';
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

    await saveOrUpdateDiamondArea(saveData);
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
  <Page description="管理系统中的金刚区信息" title="金刚区管理">
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
              <NFormItem label="名称" label-placement="left">
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
                    { label: '启用', value: 1 },
                    { label: '禁用', value: 0 },
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
              <NButton type="success" @click="handleAdd">新增金刚区</NButton>
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
        :scroll-x="1900"
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
        label-width="120px"
        require-mark-placement="right-hanging"
      >
        <NRow :gutter="24">
          <NCol :span="12">
            <NFormItem label="金刚区名称" path="title">
              <NInput v-model:value="editingRecord.title" />
            </NFormItem>
          </NCol>
          <NCol :span="12">
            <NFormItem label="排序权重" path="sortOrder">
              <NInput v-model:value="editingRecord.sortOrder" type="number" />
            </NFormItem>
          </NCol>
        </NRow>

        <NRow :gutter="24">
          <NCol :span="12">
            <NFormItem label="显示方式" path="showType">
              <NSelect
                v-model:value="editingRecord.showType"
                :options="[
                  { label: '背景图', value: 1 },
                  { label: 'icon图标', value: 2 },
                  { label: '远程icon图标', value: 3 },
                ]"
              />
            </NFormItem>
          </NCol>
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
            <NFormItem label="生效开始时间" path="startTime">
              <NDatePicker
                v-model:value="editingRecord.startTime"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
              />
            </NFormItem>
          </NCol>
          <NCol :span="12">
            <NFormItem label="生效结束时间" path="endTime">
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
            <NFormItem label="图标链接" path="iconUrl">
              <NInput v-model:value="editingRecord.iconUrl" placeholder="请输入图标链接或上传图片" />
            </NFormItem>
          </NCol>
          <NCol :span="12">
            <NFormItem label="图标上传" style="margin-bottom: 20px;">
              <NUpload
                :before-upload="beforeUpload"
                :file-list="imageFileList"
                :max="1"
                list-type="image-card"
                @change="handleFileUpload"
                @remove="handleFileRemove"
              >
                上传图标
              </NUpload>
            </NFormItem>
          </NCol>
        </NRow>
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