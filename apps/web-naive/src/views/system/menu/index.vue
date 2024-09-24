<script setup lang="ts">
import type { FormInst, FormRules, TreeOption } from 'naive-ui';

import { h, nextTick, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NButtonGroup,
  NCard,
  NConfigProvider,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPopconfirm,
  NSpace,
  NTree,
  useMessage,
} from 'naive-ui';

import {
  getMenuDetail,
  getMenuList,
  removeMenu,
  saveOrUpdateMenu,
} from '#/api/system/menu';
import { useDynamicHeight } from '#/utils/heightUtils';

const message = useMessage();

// 添加一个计算属性来动态计算表格高度
const queryCardRef = ref<HTMLElement | null>(null);
const { queryCardHeight, tableHeight } = useDynamicHeight(queryCardRef);
onMounted(() => {
  if (queryCardRef.value) {
    queryCardHeight.value = queryCardRef.value.offsetHeight;
  }
});

// 查询条件
const queryForm = reactive({
  name: '',
});

// 树形数据
const treeData = ref<TreeOption[]>([]);
const loading = ref(false);

// 模态框相关
const showModal = ref(false);
const modalTitle = ref('');
const editingRecord = ref({
  component: '',
  id: null,
  meta: JSON.stringify({
    icon: 'ic:baseline-view-in-ar',
    keepAlive: true,
    order: 1000,
    title: 'page.demos.title',
  }),
  metaInfo: {
    icon: 'ic:baseline-view-in-ar',
    keepAlive: true,
    order: 1000,
    title: 'page.demos.title',
  },
  name: '',
  parentId: '',
  path: '',
  redirect: '',
  sortNo: 0,
});

// 表单规则
const rules: FormRules = {
  component: { message: '请输入组件路径', required: true, trigger: 'blur' },
  name: { message: '请输入菜单名称', required: true, trigger: 'blur' },
  path: { message: '请输入路径', required: true, trigger: 'blur' },
};

const formRef = ref<FormInst | null>(null);

// 添加新的 loading 状态
const editLoading = ref(false);
const deleteLoading = ref(false);
const saveLoading = ref(false);

// 修改 handleEdit 函数
const handleEdit = async (node: TreeOption) => {
  editLoading.value = true;
  try {
    modalTitle.value = '编辑菜单';
    const detail = await getMenuDetail(node.option.id);
    editingRecord.value = { ...detail };
    showModal.value = true;
  } catch (error) {
    console.error('获取详情失败:', error);
    message.error('获取详情失败');
  } finally {
    editLoading.value = false;
  }
};

// 修改 handleDelete 函数
const handleDelete = async (node: TreeOption) => {
  if (node.option.children && node.option.children.length > 0) {
    message.error('该菜单下有子菜单，无法删除');
    return;
  }
  deleteLoading.value = true;
  try {
    await removeMenu([node.option.id]);
    message.success('删除成功');
    // 直接从树中移除节点
    removeNodeFromTree(treeData.value, node.option.id);
  } catch {
    message.error('删除失败');
  } finally {
    deleteLoading.value = false;
  }
};

// 新增：从树中移除节点的函数
const removeNodeFromTree = (tree: TreeOption[], id: number | string) => {
  for (let i = 0; i < tree.length; i++) {
    if (tree[i].key === id) {
      tree.splice(i, 1);
      return true;
    }
    if (tree[i].children && removeNodeFromTree(tree[i].children, id)) {
      return true;
    }
  }
  return false;
};

// 修改 handleSave 函数
const handleSave = async () => {
  if (!formRef.value) return;
  saveLoading.value = true;
  try {
    await formRef.value.validate();
    await saveOrUpdateMenu(editingRecord.value);
    message.success(editingRecord.value.id ? '编辑成功' : '新增成功');
    showModal.value = false;
    await fetchData();
  } catch (error) {
    console.error('保存失败:', error);
    message.error('保存失败，请检查表单');
  } finally {
    saveLoading.value = false;
  }
};

// 将列表数据转换为树形结构
const convertToTree = (list: any[]): TreeOption[] => {
  const map = new Map();
  const tree: TreeOption[] = [];

  // 创建根节点
  const rootNode = {
    id: null,
    key: 'root',
    label: '根菜单',
    path: '',
    title: '根菜单',
    children: [],
  };
  tree.push(rootNode);

  // 按 sortNo 排序
  list.sort((a, b) => a.sortNo - b.sortNo);

  list.forEach((item) => {
    map.set(item.id, {
      id: item.id,
      key: item.id,
      label: item.name,
      path: item.path,
      rawData: item,
      title: item.title,
      children: [],
    });
  });

  list.forEach((item) => {
    const node = map.get(item.id);
    if (item.parentId && map.has(item.parentId)) {
      const parent = map.get(item.parentId);
      parent.children.push(node);
    } else {
      rootNode.children.push(node);
    }
  });

  return tree;
};

// 修改 fetchData 函数
const fetchData = async () => {
  loading.value = true;
  try {
    const result = await getMenuList({
      page: {
        current: 1,
        size: 1000, // 假设菜单数量不会超过1000
      },
      queryBody: {
        name: queryForm.name,
      },
    });
    treeData.value = convertToTree(result.records);
  } catch {
    message.error('获取数据失败');
  } finally {
    loading.value = false;
  }
};

// 处理查询
const handleSearch = () => {
  fetchData();
};

// 处理新增
const handleAdd = (parentNode?: TreeOption) => {
  modalTitle.value = parentNode
    ? `新增 '${parentNode.option.title}' 子菜单`
    : '新增根菜单';
  editingRecord.value = {
    component: '',
    id: null,
    meta: JSON.stringify({
      icon: 'ic:baseline-view-in-ar',
      keepAlive: true,
      order: 1000,
      title: 'page.demos.title',
    }),
    metaInfo: {
      icon: 'ic:baseline-view-in-ar',
      keepAlive: true,
      order: 1000,
      title: 'page.demos.title',
    },
    name: '',
    parentId: parentNode ? (parentNode.option.id as string) : null,
    path: '',
    redirect: '',
    sortNo: 0,
  };
  showModal.value = true;
};

// 渲染树节点
const renderTreeNode = (node: TreeOption) => {
  const rawData = node.option.rawData as any;
  const isRoot = node.option.key === 'root';
  const hasChildren = node.children && node.children.length > 0;
  return h(
    NSpace,
    { align: 'center', justify: 'space-between' },
    {
      default: () => [
        h(
          NSpace,
          { align: 'center' },
          {
            default: () => [
              h('span', null, node.option.title),
              !isRoot &&
                h(
                  'span',
                  { style: 'color: #999; margin-left: 8px;' },
                  `(${node.option?.path || ''})`,
                ),
            ],
          },
        ),
        h(
          NButtonGroup,
          { size: 'small' },
          {
            default: () => [
              h(
                NButton,
                {
                  onClick: () => handleAdd(node),
                },
                { default: () => '添加子菜单' },
              ),
              !isRoot &&
                h(
                  NButton,
                  {
                    onClick: () => handleEdit(node),
                  },
                  { default: () => '编辑' },
                ),
              !isRoot &&
                h(
                  NPopconfirm,
                  {
                    onPositiveClick: () => handleDelete(node),
                  },
                  {
                    default: () => '确定要删除此菜单吗？',
                    trigger: () =>
                      h(
                        NButton,
                        {
                          disabled: hasChildren,
                        },
                        { default: () => '删除' },
                      ),
                  },
                ),
            ],
          },
        ),
      ],
    },
  );
};

// 添加一个紫色主题配置
const purpleTheme = {
  common: {
    primaryColor: '#8a2be2',
    primaryColorHover: '#9f3ff3',
    primaryColorPressed: '#7a1dd1',
  },
};

// 初始加载数据
nextTick(() => {
  fetchData();
});
</script>

<template>
  <Page
    description="管理系统中的菜单信息(icon获取地址：https://iconify.design/)"
    title="菜单管理"
  >
    <NCard ref="queryCardRef" class="query-card">
      <NForm :model="queryForm" inline>
        <NSpace
          :size="[24, 0]"
          align="center"
          justify="space-between"
          style="width: 100%"
        >
          <NSpace :size="24" align="center">
            <NFormItem label="菜单名" label-placement="left">
              <NInput v-model:value="queryForm.name" style="width: 200px" />
            </NFormItem>
          </NSpace>
          <NSpace>
            <NConfigProvider :theme="purpleTheme">
              <NButton type="primary" @click="handleSearch">搜索</NButton>
            </NConfigProvider>
          </NSpace>
        </NSpace>
      </NForm>
    </NCard>

    <NCard>
      <div :style="{ height: `${tableHeight}px` }">
        <NTree
          :data="treeData"
          :default-expanded-keys="['root']"
          :loading="loading"
          :render-label="renderTreeNode"
        />
      </div>
    </NCard>

    <NModal
      v-model:show="showModal"
      :title="modalTitle"
      preset="card"
      style="width: 600px"
    >
      <NForm
        ref="formRef"
        :model="editingRecord"
        :rules="rules"
        label-placement="left"
        label-width="100px"
        require-mark-placement="right-hanging"
      >
        <NSpace :wrap="false">
          <NFormItem label="菜单标题" path="editingRecord.title">
            <NInput v-model:value="editingRecord.title" />
          </NFormItem>
          <NFormItem label="菜单名称" path="name">
            <NInput v-model:value="editingRecord.name" />
          </NFormItem>
        </NSpace>
        <NSpace :wrap="false">
          <NFormItem label="访问路径" path="path">
            <NInput v-model:value="editingRecord.path" />
          </NFormItem>
          <NFormItem label="排序" path="sortNo">
            <NInput v-model:value="editingRecord.sortNo" type="number" />
          </NFormItem>
        </NSpace>
        <NFormItem label="页面路径" path="component">
          <NInput v-model:value="editingRecord.component" />
        </NFormItem>
        <NFormItem label="重定向地址" path="redirect">
          <NInput v-model:value="editingRecord.redirect" />
        </NFormItem>
        <!-- <NFormItem label="父级菜单" path="parentId">
          <NInput v-model:value="editingRecord.parentId" :disabled="true" />
        </NFormItem> -->
        <NFormItem label="元数据" path="meta">
          <NInput
            v-model:value="editingRecord.meta"
            :autosize="{ minRows: 3, maxRows: 5 }"
            placeholder="请输入菜单元数据（JSON格式）"
            type="textarea"
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
}

.n-data-table {
  flex: 1;
}
</style>
