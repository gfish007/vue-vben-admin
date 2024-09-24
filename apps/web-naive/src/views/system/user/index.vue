<script setup lang="ts">
import type { FormInst, FormRules, UploadFileInfo } from 'naive-ui';

import { computed, h, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NAvatar,
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
  NTransfer,
  NUpload,
  useMessage,
} from 'naive-ui';

import { uploadFile } from '#/api/core/file';
import { querySysRoleList } from '#/api/system/role';
import {
  deleteSysUsers,
  disableSysUser,
  enableSysUser,
  getSysUserDetail,
  querySysUserList,
  saveOrUpdateSysUser,
} from '#/api/system/user';
import { useDynamicHeight } from '#/utils/heightUtils';
import { purpleTheme } from '#/utils/theme';

const message = useMessage();

// 查询条件
const queryForm = reactive({
  enabled: null,
  phone: '',
});

// 表格数据
const tableData = ref<any[]>([]);
const loading = ref(false);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

// 模态框相关
const showModal = ref(false);
const modalTitle = ref('');
const editingRecord = ref({
  avatar: '',
  description: '',
  email: '',
  enabled: null,
  id: null,
  nickname: '',
  phone: '',
  realName: '',
});

// 表单规则
const rules: FormRules = {
  email: { message: '请输入邮箱', required: true, trigger: 'blur' },
  enabled: { message: '请选择状态', required: true, trigger: 'change' },
  nickname: { message: '请输入昵称', required: true, trigger: 'blur' },
  phone: { message: '请输入手机号', required: true, trigger: 'blur' },
  realName: { message: '请输入真实姓名', required: true, trigger: 'blur' },
};

const formRef = ref<FormInst | null>(null);

// 添加新的 loading 状态
const editLoading = ref(false);
const deleteLoading = ref(false);
const saveLoading = ref(false);
const enableLoading = ref(false); // New loading state for enabling users
const disableLoading = ref(false); // New loading state for disabling users

const roleOptions = ref([]);
const selectedRoleKeys = ref([]);

// 获取角色列表
const fetchRoleList = async () => {
  try {
    const result = await querySysRoleList({
      page: { current: 1, size: 1000 }, // 假设一次性获取所有角色
      queryBody: {},
    });
    roleOptions.value = result.records.map(
      (role: { id: string; name: string }) => ({
        label: role.name,
        value: role.id,
      }),
    );
  } catch {
    message.error('获取角色列表失败');
  }
};

// 查询数据
const fetchData = async () => {
  loading.value = true;
  try {
    const result = await querySysUserList({
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

// 修改 handleEdit 函数
const handleEdit = async (row: any) => {
  editLoading.value = true;
  try {
    modalTitle.value = '编辑用户';
    const detail = await getSysUserDetail(row.id);
    editingRecord.value = { ...detail };
    selectedRoleKeys.value = detail.roleIds || [];
    await fetchRoleList(); // 获取角色列表
    showModal.value = true;
  } catch {
    message.error('获取详情失败');
  } finally {
    editLoading.value = false;
  }
};

// 修改 handleDelete 函数
const handleDelete = async (row: any) => {
  deleteLoading.value = true;
  try {
    await deleteSysUsers([row.id]);
    message.success('删除成功');
    fetchData();
  } catch {
    message.error('删除失败');
  } finally {
    deleteLoading.value = false;
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
      roleIds: selectedRoleKeys.value,
    };
    await saveOrUpdateSysUser(saveData);
    message.success(editingRecord.value.id ? '编辑成功' : '新增成功');
    showModal.value = false;
    fetchData();
  } catch {
    message.error('保存失败，请检查表单');
  } finally {
    saveLoading.value = false;
  }
};

// New functions to enable and disable users with loading states
const handleEnable = async (row: any) => {
  enableLoading.value = true;
  try {
    await enableSysUser(row.id);
    message.success('用户已启用');
    fetchData();
  } catch {
    message.error('启用失败');
  } finally {
    enableLoading.value = false;
  }
};

const handleDisable = async (row: any) => {
  disableLoading.value = true;
  try {
    await disableSysUser(row.id);
    message.success('用户已禁用');
    fetchData();
  } catch {
    message.error('禁用失败');
  } finally {
    disableLoading.value = false;
  }
};

// 表格列定义
const columns = [
  {
    className: 'centered-cell', // Add class for centering
    key: 'avatar',
    render: (row: any) =>
      h(NAvatar, { round: true, size: 'small', src: row.avatar }),
    title: '头像',
    width: 80,
  },
  { className: 'centered-cell', key: 'nickname', title: '昵称', width: 160 },
  {
    className: 'centered-cell',
    key: 'realName',
    title: '真实姓名',
    width: 160,
  },
  { className: 'centered-cell', key: 'phone', title: '手机号', width: 150 },
  { className: 'centered-cell', key: 'email', title: '邮箱', width: 150 },
  { className: 'centered-cell', key: 'description', title: '简介', width: 250 },
  {
    className: 'centered-cell',
    key: 'enabled',
    render: (row: any) =>
      h(
        NTag,
        { type: row.enabled ? 'success' : 'error' },
        { default: () => (row.enabled ? '启用' : '禁用') },
      ),
    title: '状态',
    width: 100,
  },
  {
    className: 'centered-cell',
    key: 'gmtCreate',
    title: '创建时间',
    width: 180,
  },
  {
    className: 'centered-cell',
    key: 'gmtModified',
    title: '更新时间',
    width: 180,
  },
  {
    className: 'centered-cell',
    fixed: 'right' as const,
    key: 'actions',
    render: (row: any) => {
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
                loading: deleteLoading.value,
                onClick: () => handleDelete(row),
                type: 'error',
              },
              { default: () => '删除' },
            ),
            h(
              NButton,
              {
                loading: row.enabled
                  ? disableLoading.value
                  : enableLoading.value,
                onClick: () =>
                  row.enabled ? handleDisable(row) : handleEnable(row),
                type: row.enabled ? 'warning' : 'info',
              },
              { default: () => (row.enabled ? '禁用' : '启用') },
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

// 处理分页变化
const handlePageChange = (page: number) => {
  pagination.page = page;
  fetchData();
};

// 处理新增
const handleAdd = async () => {
  modalTitle.value = '新增用户';
  editingRecord.value = {
    avatar: '',
    description: '',
    email: '',
    enabled: null,
    id: null,
    nickname: '',
    phone: '',
    realName: '',
  };
  selectedRoleKeys.value = [];
  await fetchRoleList(); // 获取角色列表
  showModal.value = true;
};

// 计算属性：头像文件
const avatarFileList = computed<UploadFileInfo[]>(() => {
  return editingRecord.value.avatar
    ? [
        {
          id: 'avatar',
          name: '当前头像',
          status: 'finished',
          url: editingRecord.value.avatar,
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
      editingRecord.value.avatar = result.fileUrl;
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
  editingRecord.value.avatar = '';
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

// 初始加载数据
fetchData();

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
  <Page description="管理系统中的用户信息" title="用户管理">
    <NCard ref="queryCardRef" class="query-card mb-4 p-2">
      <NForm :model="queryForm" class="flex h-full items-center" inline>
        <NSpace
          :size="[24, 0]"
          align="center"
          class="w-full"
          justify="space-between"
        >
          <NSpace :size="24" align="center">
            <NFormItem
              class="mb-0 flex items-center"
              label="手机号"
              label-placement="left"
            >
              <NInput v-model:value="queryForm.phone" class="w-52" />
            </NFormItem>
            <NFormItem
              class="mb-0 flex items-center"
              label="状态"
              label-placement="left"
            >
              <NSelect
                v-model:value="queryForm.enabled"
                :options="[
                  { label: '启用', value: true },
                  { label: '禁用', value: false },
                ]"
                class="w-52"
              />
            </NFormItem>
          </NSpace>
          <NSpace>
            <NConfigProvider :theme="purpleTheme">
              <NButton type="primary" @click="handleSearch">搜索</NButton>
            </NConfigProvider>
            <NButton type="success" @click="handleAdd">新增用户</NButton>
          </NSpace>
        </NSpace>
      </NForm>
    </NCard>

    <NCard class="table-card flex flex-col overflow-hidden">
      <NDataTable
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :scroll-x="900"
        :single-line="false"
        :style="{ height: `${tableHeight}px` }"
        class="flex-1 overflow-auto"
        flex-height
        striped
        @update:page="handlePageChange"
      />
    </NCard>

    <NModal
      v-model:show="showModal"
      :title="modalTitle"
      class="max-h-[90vh] overflow-y-auto"
      preset="card"
      style="width: 800px"
    >
      <NForm
        ref="formRef"
        :model="editingRecord"
        :rules="rules"
        class="w-full"
        label-placement="left"
        label-width="100px"
        require-mark-placement="right-hanging"
      >
        <NSpace direction="vertical" size="large">
          <NSpace>
            <NFormItem label="手机号" path="phone">
              <NInput v-model:value="editingRecord.phone" />
            </NFormItem>
            <NFormItem label="邮箱" path="email">
              <NInput v-model:value="editingRecord.email" />
            </NFormItem>
          </NSpace>
          <NSpace>
            <NFormItem label="昵称" path="nickname">
              <NInput v-model:value="editingRecord.nickname" />
            </NFormItem>
            <NFormItem label="真实姓名" path="realName">
              <NInput v-model:value="editingRecord.realName" />
            </NFormItem>
          </NSpace>
          <NSpace>
            <NFormItem label="头像" path="avatar">
              <NUpload
                :before-upload="beforeUpload"
                :file-list="avatarFileList"
                :max="1"
                list-type="image-card"
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
            </NFormItem>
          </NSpace>
        </NSpace>
        <NFormItem class="w-full" label="简介" path="description">
          <NInput
            v-model:value="editingRecord.description"
            :autosize="{ minRows: 3, maxRows: 5 }"
            class="w-full"
            type="textarea"
          />
        </NFormItem>
        <NFormItem label="角色" path="roleIds">
          <NTransfer
            v-model:value="selectedRoleKeys"
            :options="roleOptions"
            class="h-72 w-full"
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

/* Add styles for centering table cell content */
.centered-cell {
  text-align: center;
}
</style>
