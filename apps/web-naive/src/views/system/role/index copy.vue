<script setup lang="ts">
import type {
  FormInst,
  FormRules,
  TransferRenderSourceList,
  TransferRenderTargetList,
} from 'naive-ui';

import { h, onMounted, reactive, ref } from 'vue';

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
  NSpace,
  NTransfer,
  NTree,
  useMessage,
} from 'naive-ui';

import {
  deleteSysRoles,
  getSysRoleDetail,
  querySysRoleList,
  saveOrUpdateSysRole,
} from '#/api/core/sysRole';
import { getAllMenuList } from '#/api/system/menu';
import { useDynamicHeight } from '#/utils/heightUtils';
import { purpleTheme } from '#/utils/theme';

const message = useMessage();

// 查询条件
const queryForm = reactive({
  name: '',
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
  description: '',
  id: null,
  name: '',
});

// 表单规则
const rules: FormRules = {
  description: { message: '请输入角色描述', required: true, trigger: 'blur' },
  name: { message: '请输入角色名', required: true, trigger: 'blur' },
};

const formRef = ref<FormInst | null>(null);

// 添加新的 loading 状态
const editLoading = ref(false);
const deleteLoading = ref(false);
const saveLoading = ref(false);

// 添加以下代码
const menuOptions = ref<any[]>([]);
const selectedMenuKeys = ref<(number | string)[]>([]);
const expandedKeys = ref<(number | string)[]>([]); // 用于同步展开的节点

// 将菜单数据转换为树形结构
const buildMenuTree = (menuList: any[]) => {
  const menuMap = new Map<number, any>();
  menuList.forEach((menu) => {
    menuMap.set(menu.id, { ...menu, title: menu.title, children: [] }); // 确保添加 title 属性
  });
  const tree: any[] = [];
  menuMap.forEach((menu) => {
    if (menu.parentId) {
      const parent = menuMap.get(menu.parentId);
      if (parent) {
        parent.children.push(menu);
      }
    } else {
      tree.push(menu);
    }
  });
  return tree;
};

const fetchMenuList = async () => {
  try {
    const result = await getAllMenuList();
    const menuTree = buildMenuTree(result.records);
    menuOptions.value = menuTree;
  } catch {
    message.error('获取菜单列表失败');
  }
};

// 修改 handleEdit 函数
const handleEdit = async (row: any) => {
  editLoading.value = true;
  try {
    modalTitle.value = '编辑角色';
    const detail = await getSysRoleDetail(row.id);
    editingRecord.value = { ...detail };
    selectedMenuKeys.value = detail.allocateMenuIds || [];
    await fetchMenuList(); // 获取菜单列表
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
    await deleteSysRoles([row.id]);
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
      allocateMenuIds: selectedMenuKeys.value,
    };
    await saveOrUpdateSysRole(saveData);
    message.success(editingRecord.value.id ? '编辑成功' : '新增成功');
    showModal.value = false;
    fetchData();
  } catch {
    message.error('保存失败，请检查表单');
  } finally {
    saveLoading.value = false;
  }
};

// 查询数据
const fetchData = async () => {
  loading.value = true;
  try {
    const result = await querySysRoleList({
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
  { key: 'name', title: '角色名', width: 180 },
  { key: 'description', title: '角色描述', width: 200 },
  { key: 'gmtCreate', title: '创建时间', width: 180 },
  { key: 'gmtModified', title: '更新时间', width: 180 },
  {
    fixed: 'right',
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
          ],
        },
      );
    },
    title: '操作',
    width: 150,
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
  modalTitle.value = '新增角色';
  editingRecord.value = {
    description: '',
    id: null,
    name: '',
  };
  selectedMenuKeys.value = [];
  await fetchMenuList(); // 获取菜单列表
  showModal.value = true;
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

// 渲染菜单树
const renderSourceList: TransferRenderSourceList = function ({
  onCheck,
  pattern,
}) {
  return h(NTree, {
    blockLine: true,
    checkable: true,
    checkedKeys: selectedMenuKeys.value,
    checkOnClick: true,
    data: menuOptions.value,
    expandedKeys: expandedKeys.value, // 同步展开的节点
    keyField: 'id',
    labelField: 'title', // 使用 labelField 指定 title 属性
    'onUpdate:expandedKeys': (keys) => {
      expandedKeys.value = keys;
    },
    onUpdateCheckedKeys: (checkedKeys: Array<number | string>) => {
      onCheck(checkedKeys);
    },
    pattern,
    selectable: false,
    style: 'margin: 0 4px; height: 300px;', // 确保高度一致
  });
};

// 渲染目标列表
const renderTargetList: TransferRenderTargetList = function ({
  onCheck,
  pattern,
}) {
  return h(NTree, {
    blockLine: true,
    checkable: true,
    checkedKeys: selectedMenuKeys.value,
    checkOnClick: true,
    data: menuOptions.value,
    expandedKeys: expandedKeys.value, // 同步展开的节点
    keyField: 'id',
    labelField: 'title', // 使用 labelField 指定 title 属性
    'onUpdate:expandedKeys': (keys) => {
      expandedKeys.value = keys;
    },
    onUpdateCheckedKeys: (checkedKeys: Array<number | string>) => {
      onCheck(checkedKeys);
    },
    pattern,
    selectable: false,
    style: 'margin: 0 4px; height: 300px;', // 确保高度一致
  });
};
</script>

<template>
  <Page description="管理系统中的角色信息" title="角色管理">
    <NCard ref="queryCardRef" class="query-card">
      <NForm :model="queryForm" inline>
        <NSpace
          :size="[24, 0]"
          align="center"
          justify="space-between"
          style="width: 100%"
        >
          <NSpace :size="24" align="center">
            <NFormItem label="角色名" label-placement="left">
              <NInput v-model:value="queryForm.name" style="width: 200px" />
            </NFormItem>
          </NSpace>
          <NSpace>
            <NConfigProvider :theme="purpleTheme">
              <NButton type="primary" @click="handleSearch">搜索</NButton>
            </NConfigProvider>
            <NButton type="success" @click="handleAdd">新增角色</NButton>
          </NSpace>
        </NSpace>
      </NForm>
    </NCard>

    <NCard>
      <NDataTable
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :scroll-x="900"
        :style="{ height: `${tableHeight}px` }"
        flex-height
        striped
        @update:page="handlePageChange"
      />
    </NCard>

    <NModal
      v-model:show="showModal"
      :title="modalTitle"
      preset="card"
      style="width: 800px"
    >
      <NForm
        ref="formRef"
        :model="editingRecord"
        :rules="rules"
        label-placement="left"
        label-width="100px"
        require-mark-placement="right-hanging"
      >
        <NFormItem label="角色名" path="name">
          <NInput v-model:value="editingRecord.name" />
        </NFormItem>
        <NFormItem label="角色描述" path="description">
          <NInput
            v-model:value="editingRecord.description"
            :autosize="{ minRows: 3, maxRows: 5 }"
            type="textarea"
          />
        </NFormItem>
        <NFormItem label="菜单权限" path="allocateMenuIds">
          <NTransfer
            v-model:value="selectedMenuKeys"
            :options="menuOptions"
            :render-source-list="renderSourceList"
            :render-target-list="renderTargetList"
            virtual-scroll
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

.n-data-table .n-button {
  text-decoration: underline;
}

.n-form {
  width: 100%;
}

.n-space {
  width: 100%;
}

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

.table-card {
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
}

.n-data-table {
  flex: 1;
  overflow: auto;
}

.n-transfer {
  width: 100%;
  height: 300px;
}
</style>
