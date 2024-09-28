<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import {
  NButton,
  NButtonGroup,
  NCard,
  NDataTable,
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NPopconfirm,
  NSelect,
  NSpace,
  useMessage,
} from 'naive-ui';

import {
  guesthouseReservationApi,
  type GuesthouseReservationListResp,
  type GuesthouseReservationQuery,
} from '#/api/guesthouse/reservation';
import { queryGuesthouseRoomsList } from '#/api/guesthouse/rooms';
import { useDynamicHeight } from '#/utils/heightUtils';

import ReservationModal from './components/ReservationModal.vue';

const message = useMessage();

const tableLoading = ref(false);
const tableData = ref<GuesthouseReservationListResp[]>([]);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const queryForm = reactive<GuesthouseReservationQuery>({
  dateRange: null,
});

const roomOptions = ref([]);

onMounted(async () => {
  try {
    const response = await queryGuesthouseRoomsList({
      page: {
        current: 1,
        size: 999,
      },
      queryBody: {
        gmtEnd: queryForm.dateRange ? new Date(queryForm.dateRange[1]) : null,
        gmtStart: queryForm.dateRange ? new Date(queryForm.dateRange[0]) : null,
      },
    });
    roomOptions.value = response.records.map((room) => ({
      label: room.title,
      value: room.id,
    }));
  } catch (error) {
    console.error('Failed to fetch room list:', error);
    message.error('获取房间列表失败');
  }
});

const columns = [
  { key: 'roomName', title: '预定房间', width: 120 },
  { key: 'realName', title: '真实姓名', width: 120 },
  { key: 'phone', title: '手机号', width: 120 },
  { key: 'gmtStart', title: '入住时间', width: 170 },
  { key: 'gmtEnd', title: '退房时间', width: 170 },
  { key: 'oriPrice', title: '原价', width: 100 },
  { key: 'payPrice', title: '实付价', width: 100 },
  { key: 'discountPrice', title: '折扣价', width: 100 },
  {
    fixed: 'right',
    key: 'actions',
    render: (row: GuesthouseReservationListResp) => {
      return h(
        NButtonGroup,
        {},
        {
          default: () => [
            h(
              NButton,
              {
                onClick: () => handleEdit(row.id),
                size: 'small',
                type: 'success',
              },
              { default: () => '编辑' },
            ),
            h(
              NPopconfirm,
              {
                onPositiveClick: () => handleDelete(row.id),
              },
              {
                default: () => '确定要删除这条预订记录吗？',
                trigger: () =>
                  h(
                    NButton,
                    {
                      size: 'small',
                      type: 'error',
                    },
                    { default: () => '删除' },
                  ),
              },
            ),
          ],
        },
      );
    },
    title: '操作',
    width: 140,
  },
];

const [Modal, modalApi] = useVbenModal({
  connectedComponent: ReservationModal,
  isOpen: false,
  onOpenChange(isOpen) {
    if (!isOpen) {
      const { refresh } = modalApi.getData();
      if (refresh) {
        fetchData();
      }
    }
  },
});

const fetchData = async () => {
  tableLoading.value = true;
  try {
    const data = await guesthouseReservationApi.list({
      page: {
        current: pagination.page,
        size: pagination.pageSize,
      },
      queryBody: {
        ...queryForm,
        gmtEnd: queryForm.dateRange ? new Date(queryForm.dateRange[1]) : null,
        gmtStart: queryForm.dateRange ? new Date(queryForm.dateRange[0]) : null,
      },
    });
    tableData.value = data.records;
    pagination.total = data.total;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    message.error('获取数据失败');
  } finally {
    tableLoading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  fetchData();
};

const handleReset = () => {
  Object.keys(queryForm).forEach((key) => {
    queryForm[key as keyof GuesthouseReservationQuery] = undefined;
  });
  queryForm.dateRange = null;
  handleSearch();
};

const handleEdit = async (id: number) => {
  modalApi.setData({
    id,
    title: '编辑预订',
  });
  modalApi.open();
};

const handleDelete = async (id: number) => {
  try {
    await guesthouseReservationApi.remove([id]);
    message.success('删除成功');
    fetchData();
  } catch (error) {
    console.error('Failed to delete reservation:', error);
    message.error('删除失败');
  }
};

const handleAdd = () => {
  modalApi.setData({
    data: undefined,
    title: '新增预订',
  });
  modalApi.open();
};

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
  <Page description="管理民宿的房间预订信息" title="房间预订管理">
    <div ref="queryCardRef" class="w-full">
      <NCard class="query-card mb-4 p-2">
        <NForm
          :model="queryForm"
          :show-label="false"
          class="flex h-full items-center"
          inline
          label-placement="left"
          label-width="auto"
          require-mark-placement="right-hanging"
        >
          <NSpace :size="[24, 0]" align="center" item-style="display: flex;">
            <NFormItem class="!mb-0 flex items-center" label="预定日期">
              <NDatePicker
                v-model:value="queryForm.dateRange"
                class="w-25"
                clearable
                type="datetimerange"
              />
            </NFormItem>
            <NFormItem class="!mb-0 flex items-center" label="房间">
              <NSelect
                v-model:value="queryForm.roomId"
                :options="roomOptions"
                clearable
                placeholder="请选择房间"
                style="width: 150px"
              />
            </NFormItem>
            <NFormItem class="!mb-0 flex items-center" label="姓名">
              <NInput
                v-model:value="queryForm.realName"
                placeholder="请输入真实姓名"
                style="width: 150px"
              />
            </NFormItem>
            <NFormItem class="!mb-0 flex items-center" label="手机号">
              <NInput
                v-model:value="queryForm.phone"
                placeholder="请输入手机号"
                style="width: 150px"
              />
            </NFormItem>

            <NFormItem class="!mb-0 flex items-center">
              <NButtonGroup>
                <NButton type="primary" @click="handleSearch">搜索</NButton>
                <NButton @click="handleReset">重置</NButton>
                <NButton type="success" @click="handleAdd">新增预订</NButton>
              </NButtonGroup>
            </NFormItem>
          </NSpace>
        </NForm>
      </NCard>
    </div>
    <NCard class="table-card flex flex-col overflow-hidden">
      <NDataTable
        :columns="columns"
        :data="tableData"
        :loading="tableLoading"
        :pagination="pagination"
        :scroll-x="1200"
        :style="{ height: `${tableHeight}px` }"
        class="flex-1 overflow-auto"
        flex-height
        striped
        @update:page="
          (page) => {
            pagination.page = page;
            fetchData();
          }
        "
        @update:page-size="
          (pageSize) => {
            pagination.pageSize = pageSize;
            fetchData();
          }
        "
      />
    </NCard>

    <Modal />
  </Page>
</template>
