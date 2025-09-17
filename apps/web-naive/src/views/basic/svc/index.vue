<script setup lang="ts">
import type { SvcApi } from '#/api/core/svc.types';

import { h, onMounted, reactive, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import {
  NButton,
  NButtonGroup,
  NCard,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPopconfirm,
  NSelect,
  NSpace,
  NTag,
  useMessage,
} from 'naive-ui';

import { queryRegionList } from '#/api/core/region';
import {
  approveSvc,
  deleteSvcs,
  publishSvc,
  querySvcList,
  rejectSvc,
  rollbackSvc,
} from '#/api/core/svc';
import { useDynamicHeight } from '#/utils/heightUtils';

import SvcModal from './components/SvcModal.vue';

// 创建modal
const [Modal, modalApi] = useVbenModal({
  connectedComponent: SvcModal,
  isOpen: false, // 确保初始状态为关闭
  onOpenChange(isOpen) {
    console.info('onOpenChange', isOpen);
    if (!isOpen) {
      const { refresh } = modalApi.getData();
      if (refresh) {
        handleSearch();
      }
    }
  },
});

const message = useMessage();

// 查询条件
const queryForm = reactive<SvcApi.QueryParams['queryBody']>({
  auditStatus: null,
  publishStatus: null,
  regionId: undefined,
  title: '', // 添加标题查询条件
});

// 表格数据
const tableData = ref<SvcApi.SvcRecord[]>([]);
const loading = ref(false);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

// 区域选项
const regionOptions = ref([]);

// 查询数据
const fetchData = async () => {
  loading.value = true;
  try {
    const result = await querySvcList({
      page: {
        current: pagination.page,
        size: pagination.pageSize,
      },
      queryBody: {
        ...queryForm,
      },
    });
    tableData.value = result.records;
    pagination.total = result.total;
  } catch {
    message.error('获取数据失败');
  } finally {
    loading.value = false;
  }
};

// 添加一个 ref 来控制富文本内容弹窗的显示
const showContentModal = ref(false);
const currentContent = ref('');

// Add these new refs
const showContactModal = ref(false);
const currentContact = ref([]);

// 表格列定义
const columns = [
  { key: 'title', title: '标题', width: 130 },
  { key: 'userName', title: '用户名', width: 110 },
  { key: 'regionName', title: '区域名', width: 120 },
  {
    key: 'content',
    render: (row) =>
      h(
        NButton,
        {
          onClick: () => showContent(row.content),
          secondary: true,
          size: 'small',
          type: 'success',
        },
        { default: () => '查看' },
      ),
    title: '服务内容',
    width: 80,
  },

  {
    key: 'contactInfo',
    render: (row) => {
      if (
        !row.contactInfo ||
        !Array.isArray(row.contactInfo) ||
        row.contactInfo.length === 0
      ) {
        return '无联系人信息';
      }
      return h(
        NButton,
        {
          onClick: () => showContactInfo(row.contactInfo),
          secondary: true,
          size: 'small',
          type: 'warning',
        },
        { default: () => '查看联系人' },
      );
    },
    title: '联系人信息',
    width: 120,
  },
  {
    key: 'tags',
    render: (row) => {
      if (!row.tags || !Array.isArray(row.tags) || row.tags.length === 0) {
        return '无标签';
      }
      return h(
        'div',
        {
          style: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
          },
        },
        row.tags.map((tag) =>
          h(
            NTag,
            {
              size: 'small',
              style: {
                marginBottom: '4px',
              },
              type: 'info',
            },
            { default: () => tag },
          ),
        ),
      );
    },
    title: '标签列表',
    width: 150,
  },
  {
    key: 'publishStatus',
    render: (row) =>
      h(
        NTag,
        { type: row.publishStatus === 'PUBLISH' ? 'success' : 'warning' },
        {
          default: () =>
            row.publishStatus === 'PUBLISH' ? '已发布' : '待发布',
        },
      ),
    title: '发布状态',
    width: 100,
  },
  {
    key: 'auditStatus',
    render: (row) => {
      const statusMap = {
        APPROVED: { text: '已通过', type: 'success' },
        AUDITING: { text: '审核中', type: 'info' },
        PENDING: { text: '待审核', type: 'default' },
        REJECT: { text: '已驳回', type: 'error' },
      };
      const status = statusMap[row.auditStatus] || {
        text: '未知',
        type: 'default',
      };
      return h(NTag, { type: status.type }, { default: () => status.text });
    },
    title: '审核状态',
    width: 100,
  },
  { key: 'gmtCreate', title: '创建时间', width: 170 },
  { key: 'gmtModified', title: '更新时间', width: 170 },
  { key: 'rejectReason', title: '驳回原因' },
  {
    key: 'priceInfo',
    render: (row) => {
      if (!row.priceInfo || !row.priceInfo.payFlag) {
        return h('span', '免费');
      }
      const oriPrice =
        row.priceInfo.oriPrice !== null && row.priceInfo.oriPrice !== undefined
          ? `原价: ¥${Number(row.priceInfo.oriPrice).toFixed(2)}`
          : null;
      const price =
        row.priceInfo.price !== null && row.priceInfo.price !== undefined
          ? `售价: ¥${Number(row.priceInfo.price).toFixed(2)}`
          : null;

      if (oriPrice && price) {
        return h('div', [
          h(
            NTag,
            { style: 'margin-bottom: 4px;', type: 'warning' },
            { default: () => oriPrice },
          ),
          h('br'),
          h(NTag, { type: 'success' }, { default: () => price }),
        ]);
      } else if (oriPrice) {
        return h(NTag, { type: 'warning' }, { default: () => oriPrice });
      } else if (price) {
        return h(NTag, { type: 'success' }, { default: () => price });
      }

      return h('span', '价格信息不完整');
    },
    title: '价格信息',
    width: 150,
  },
  {
    fixed: 'right',
    key: 'actions',
    render: (row) =>
      h(
        NButtonGroup,
        {},
        {
          default: () => [
            h(
              NButton,
              {
                onClick: () => handleEdit(row),
                size: 'small',
                type: 'success',
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
            row.auditStatus !== 'AUDITING' &&
              row.publishStatus !== 'PUBLISH' &&
              h(
                NButton,
                {
                  onClick: () => handlePublishOrRollback(row.id, 'PUBLISH'),
                  size: 'small',
                  type: 'info',
                },
                {
                  default: () => '发布',
                },
              ),
            (row.auditStatus === 'AUDITING' ||
              row.publishStatus === 'PUBLISH') &&
              h(
                NButton,
                {
                  onClick: () => handlePublishOrRollback(row.id, 'ROLLBACK'),
                  size: 'small',
                  type: 'warning',
                },
                {
                  default: () => '撤回',
                },
              ),
            row.auditStatus === 'AUDITING' &&
              h(
                NPopconfirm,
                {
                  onNegativeClick: () => handleAudit(row.id, 'REJECT'),
                  onPositiveClick: () => handleAudit(row.id, 'APPROVED'),
                },
                {
                  action: () =>
                    h(
                      NSpace,
                      {},
                      {
                        default: () => [
                          h(
                            NButton,
                            {
                              onClick: () => handleAudit(row.id, 'APPROVED'),
                              size: 'small',
                              type: 'success',
                            },
                            { default: () => '通过' },
                          ),
                          h(
                            NButton,
                            {
                              onClick: () => handleAudit(row.id, 'REJECT'),
                              size: 'small',
                              type: 'error',
                            },
                            { default: () => '驳回' },
                          ),
                        ],
                      },
                    ),
                  default: () => '确定审核此服务吗？',
                  trigger: () =>
                    h(
                      NButton,
                      {
                        size: 'small',
                        type: 'default',
                      },
                      { default: () => '审核' },
                    ),
                },
              ),
          ],
        },
      ),
    title: '操作',
    width: 220,
  },
];

// 处理编辑
const handleEdit = (row: SvcApi.SvcRecord) => {
  modalApi.setData({
    id: row.id,
    title: '编辑服务',
  });
  modalApi.open(); // 使用 open 方法打开模态框
};

// 处理删除
const handleDelete = async (id: number) => {
  try {
    await deleteSvcs([id]);
    message.success('删除成功');
    fetchData();
  } catch {
    message.error('删除失败');
  }
};

// 处理发布或撤回
const handlePublishOrRollback = async (id, status: 'PUBLISH' | 'ROLLBACK') => {
  try {
    if (status === 'PUBLISH') {
      await publishSvc(id);
      message.success('发布成功');
    } else {
      await rollbackSvc(id);
      message.success('撤回成功');
    }
    fetchData();
  } catch {
    message.error('操作失败');
  }
};

// 替换 showAuditConfirm 函数为 handleAudit 函数
const handleAudit = async (id: number, status: 'APPROVED' | 'REJECT') => {
  try {
    // 这里需要调用您的审核 API
    await (status === 'APPROVED'
      ? approveSvc(id)
      : rejectSvc(id));
    message.success(status === 'APPROVED' ? '审核通过成功' : '驳回成功');
    fetchData();
  } catch {
    message.error('审核操作失败');
  }
};

// 显示内容
const showContent = (content: string) => {
  currentContent.value = content;
  showContentModal.value = true;
};

// Add this new function
const showContactInfo = (contactInfo) => {
  currentContact.value = contactInfo;
  showContactModal.value = true;
};

// 处理查询
const handleSearch = () => {
  pagination.page = 1;
  fetchData();
};

// 处理重置
const handleReset = () => {
  queryForm.regionId = undefined;
  queryForm.publishStatus = null;
  queryForm.auditStatus = null;
  queryForm.title = ''; // 重置标题
  handleSearch();
};

// 处理新增
const handleAdd = () => {
  modalApi.setData({
    id: undefined,
    title: '新增服务',
  });
  modalApi.open(); // 使用 open 方法打开模态框
};

// 获取区域列表
const fetchRegionList = async () => {
  try {
    const result = await queryRegionList({
      page: { current: 1, size: 1000 },
      queryBody: {},
    });
    regionOptions.value = result.records.map((region) => ({
      label: region.title,
      value: region.id,
    }));
  } catch {
    message.error('获取区域列表失败');
  }
};

// 动态高度
const queryCardRef = ref(null);
const { queryCardHeight, tableHeight } = useDynamicHeight(queryCardRef);

onMounted(async () => {
  if (queryCardRef.value) {
    queryCardHeight.value = queryCardRef.value.offsetHeight;
    console.log('queryCardHeight:', queryCardHeight.value);
  }
});

onMounted(() => {
  fetchRegionList();
  fetchData();
});

// Remove this watch block
// watch(
//   () => modalApi.useStore().isOpen,
//   (newVal) => {
//     if (!newVal) {
//       const { refresh } = modalApi.getData();
//       if (refresh) {
//         fetchData();
//       }
//     }
//   },
// );

// Add this instead
// modalApi.onClose(() => {
//   const { refresh } = modalApi.getData();
//   if (refresh) {
//     fetchData();
//   }
// });
</script>

<template>
  <Page description="管理系统中的 SVC 服务信息" title="SVC 服务管理">
    <div ref="queryCardRef" class="w-full">
      <NCard class="query-card mb-4 p-2">
        <NForm :model="queryForm" class="flex h-full items-center" inline>
          <NSpace :size="[24, 16]" align="center" item-style="display: flex;">
            <NFormItem
              class="!mb-0 flex items-center"
              label="标题"
              label-placement="left"
            >
              <NInput
                v-model:value="queryForm.title"
                class="w-40"
                placeholder="请输入标题"
              />
            </NFormItem>
            <NFormItem
              class="!mb-0 flex items-center"
              label="关联区域"
              label-placement="left"
            >
              <NSelect
                v-model:value="queryForm.regionId"
                :options="regionOptions"
                class="w-40"
                clearable
              />
            </NFormItem>
            <NFormItem
              class="!mb-0 flex items-center"
              label="发布状态"
              label-placement="left"
            >
              <NSelect
                v-model:value="queryForm.publishStatus"
                :options="[
                  { label: '待发布', value: 'PENDING' },
                  { label: '已发布', value: 'PUBLISH' },
                ]"
                class="w-32"
                clearable
              />
            </NFormItem>
            <NFormItem
              class="!mb-0 flex items-center"
              label="审核状态"
              label-placement="left"
            >
              <NSelect
                v-model:value="queryForm.auditStatus"
                :options="[
                  { label: '待审核', value: 'PENDING' },
                  { label: '审核中', value: 'AUDITING' },
                  { label: '已通过', value: 'APPROVED' },
                  { label: '已驳回', value: 'REJECT' },
                ]"
                class="w-32"
                clearable
              />
            </NFormItem>

            <NSpace :size="[24, 0]" align="center">
              <NButtonGroup>
                <NButton type="primary" @click="handleSearch">搜索</NButton>
                <NButton @click="handleReset">重置</NButton>
                <NButton type="success" @click="handleAdd">
                  新增服务 {{ tableHeight }}
                </NButton>
              </NButtonGroup>
            </NSpace>
          </NSpace>
        </NForm>
      </NCard>
    </div>
    <NCard class="table-card flex flex-col overflow-hidden">
      <NDataTable
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :max-height="`${tableHeight}px`"
        :min-height="`${tableHeight}px`"
        :pagination="pagination"
        :scroll-x="2200"
        class="flex-1 overflow-auto"
        flex-height
        striped
        @update:page="fetchData"
      />
    </NCard>
    <Modal />

    <NModal v-model:show="showContentModal" style="width: 600px">
      <NCard
        :bordered="false"
        aria-modal="true"
        role="dialog"
        size="huge"
        style="width: 600px"
        title="服务内容"
      >
        <div v-html="currentContent"></div>
      </NCard>
    </NModal>

    <!-- Add this new modal for contact information -->
    <NModal v-model:show="showContactModal" style="width: 400px">
      <NCard
        :bordered="false"
        aria-modal="true"
        role="dialog"
        size="medium"
        style="width: 400px"
        title="联系人信息"
      >
        <NSpace vertical>
          <NTag v-for="info in currentContact" :key="info.key" type="info">
            {{ info.key }}: {{ info.value }}
          </NTag>
        </NSpace>
      </NCard>
    </NModal>
  </Page>
</template>

<style scoped>
.n-form-item {
  @apply mb-4;
}
</style>