<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { useWindowSize } from '@vueuse/core';
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

import { guesthouseReservationApi } from '#/api/guesthouse/reservation';
import { queryGuesthouseRoomsList } from '#/api/guesthouse/rooms';
import MobileCardList from '#/components/MobileCardList.vue';
import MobileQueryDrawer from '#/components/MobileQueryDrawer.vue';
import { useDynamicHeight } from '#/utils/heightUtils';

import ReservationModal from './components/ReservationModal.vue';

const message = useMessage();

const { width } = useWindowSize();
const isMobile = computed(() => width.value < 640);

const tableLoading = ref(false);
const tableData = ref([]);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const queryForm = reactive({
  dateRange: null,
  phone: '',
  realName: '',
  roomId: null,
});

const roomOptions = ref([]);

const [Modal, modalApi] = useVbenModal({
  connectedComponent: ReservationModal,
  draggable: true,
  onOpenChange(isOpen) {
    console.log('isOpen', isOpen);
    if (!isOpen) {
      const { refresh } = modalApi.getData();
      if (refresh) {
        fetchData();
      }
    }
  },

  title: '预订管理',
});

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const columns = [
  { key: 'roomName', title: '预定房间', width: 120 },
  { key: 'realName', title: '真实姓名', width: 120 },
  { key: 'phone', title: '手机号', width: 120 },
  {
    key: 'gmtStart',
    render: (row) => formatDate(row.gmtStart),
    title: '入住时间',
    width: 170,
  },
  {
    key: 'gmtEnd',
    render: (row) => formatDate(row.gmtEnd),
    title: '退房时间',
    width: 170,
  },
  { key: 'oriPrice', title: '原价', width: 100 },
  { key: 'payPrice', title: '实付价', width: 100 },
  { key: 'discountPrice', title: '折扣价', width: 100 },
  {
    fixed: 'right',
    key: 'actions',
    render: (row) => {
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
    queryForm[key] = undefined;
  });
  queryForm.dateRange = null;
  handleSearch();
};

const handleEdit = async (id) => {
  modalApi.setData({
    id,
    title: '编辑预订',
  });
  modalApi.open();
};

const handleDelete = async (id) => {
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

onMounted(async () => {
  fetchData();
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

const showMobileQuery = ref(false);

// 添加一个计算属性来动态计算表格高度
const queryCardRef = ref(null);
const { queryCardHeight, tableHeight } = useDynamicHeight(queryCardRef);

onMounted(() => {
  if (queryCardRef.value) {
    queryCardHeight.value = queryCardRef.value.offsetHeight;
  }
});
</script>

<template>
  <Page
    :description="!isMobile ? '管理民宿的房间预订信息' : ''"
    :title="!isMobile ? '房间预订管理' : ''"
  >
    <div v-if="isMobile">
      <div class="mb-3 flex justify-end">
        <NSpace>
          <NButton type="primary" @click="showMobileQuery = true">
            查询预定
          </NButton>
          <NButton type="success" @click="handleAdd">新增预订</NButton>
        </NSpace>
      </div>
      <MobileCardList
        :items="tableData"
        :pagination="pagination"
        @page-change="
          (page) => {
            pagination.page = page;
            fetchData();
          }
        "
        @page-size-change="
          (pageSize) => {
            pagination.pageSize = pageSize;
            fetchData();
          }
        "
      >
        <template #card-content="{ item }">
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="font-bold">{{ item.roomName }}</span>
              <span>{{ item.realName }}</span>
            </div>
            <div>手机号: {{ item.phone }}</div>
            <div>入住时间: {{ formatDate(item.gmtStart) }}</div>
            <div>退房时间: {{ formatDate(item.gmtEnd) }}</div>
            <div class="flex justify-between">
              <span>原价: {{ item.oriPrice }}</span>
              <span>实付价: {{ item.payPrice }}</span>
            </div>
            <div class="flex justify-end space-x-2">
              <NButton size="small" type="success" @click="handleEdit(item.id)">
                编辑
              </NButton>
              <NPopconfirm @positive-click="() => handleDelete(item.id)">
                <template #trigger>
                  <NButton size="small" type="error">删除</NButton>
                </template>
                确定要删除这条预订记录吗？
              </NPopconfirm>
            </div>
          </div>
        </template>
      </MobileCardList>
      <MobileQueryDrawer
        v-model:show="showMobileQuery"
        @reset="handleReset"
        @search="handleSearch"
      >
        <NForm :model="queryForm" class="space-y-4">
          <NFormItem label="预定日期">
            <NDatePicker
              v-model:value="queryForm.dateRange"
              clearable
              type="datetimerange"
            />
          </NFormItem>
          <NFormItem label="房间">
            <NSelect
              v-model:value="queryForm.roomId"
              :options="roomOptions"
              clearable
              placeholder="请选择房间"
            />
          </NFormItem>
          <NFormItem label="姓名">
            <NInput
              v-model:value="queryForm.realName"
              placeholder="请输入真实姓名"
            />
          </NFormItem>
          <NFormItem label="手机号">
            <NInput
              v-model:value="queryForm.phone"
              placeholder="请输入手机号"
            />
          </NFormItem>
        </NForm>
      </MobileQueryDrawer>
    </div>
    <template v-else>
      <!-- 原有的桌面端布局 -->
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
    </template>

    <Modal />
  </Page>
</template>
