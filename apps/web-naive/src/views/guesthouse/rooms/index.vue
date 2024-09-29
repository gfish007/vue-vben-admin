<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui';

import type { GuesthouseRoomsApi } from '#/api/guesthouse/rooms.types';

import { computed, h, onMounted, reactive, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { useWindowSize } from '@vueuse/core';
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
  deleteGuesthouseRooms,
  publishGuesthouseRoom,
  queryGuesthouseRoomsList,
  rollbackGuesthouseRoom,
} from '#/api/guesthouse/rooms';
import MobileCardList from '#/components/MobileCardList.vue';
import MobileQueryDrawer from '#/components/MobileQueryDrawer.vue';
import ResponsiveLayout from '#/components/ResponsiveLayout.vue';
import { useDynamicHeight } from '#/utils/heightUtils';

import GuesthouseRoomModal from './components/GuesthouseRoomModal.vue';

const { width } = useWindowSize();
const isMobile = computed(() => width.value < 640);

const message = useMessage();

const loading = ref(false);
const rooms = ref<GuesthouseRoomsApi.GuesthouseRoomRecord[]>([]);

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const queryForm = reactive<GuesthouseRoomsApi.QueryParams['queryBody']>({
  booksStatus: undefined,
  enableStatus: undefined,
  regionId: undefined,
  roomNo: '',
  title: '',
});

// 区域选项
const regionOptions = ref([]);

const [Modal, modalApi] = useVbenModal({
  connectedComponent: GuesthouseRoomModal,
  isOpen: false,
  onOpenChange(isOpen) {
    if (!isOpen) {
      const { refresh } = modalApi.getData();
      if (refresh) {
        fetchRooms();
      }
    }
  },
});

const fetchRooms = async () => {
  loading.value = true;
  try {
    const data = await queryGuesthouseRoomsList({
      page: {
        current: pagination.page,
        size: pagination.pageSize,
      },
      queryBody: queryForm,
    });
    rooms.value = data.records;
    pagination.total = data.total;
  } catch (error) {
    console.error('Failed to fetch rooms:', error);
    message.error('获取房间列表失败');
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  fetchRooms();
};

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize;
  pagination.page = 1;
  fetchRooms();
};

const handleSearch = () => {
  pagination.page = 1;
  fetchRooms();
};

const handleReset = () => {
  Object.assign(queryForm, {
    booksStatus: undefined,
    enableStatus: undefined,
    regionId: undefined,
    roomNo: '',
    title: '',
  });
  pagination.page = 1;
  fetchRooms();
};

const handleAdd = () => {
  modalApi.setData({
    id: undefined,
    title: '新增客房',
  });
  modalApi.open();
};

const handleEdit = (row: GuesthouseRoomsApi.GuesthouseRoomRecord) => {
  modalApi.setData({
    id: row.id,
    title: '编辑客房',
  });
  modalApi.open();
};

const handleDelete = async (id: number) => {
  try {
    await deleteGuesthouseRooms([id]);
    message.success('删除成功');
    fetchRooms();
  } catch (error) {
    console.error('Failed to delete room:', error);
    message.error('删除失败');
  }
};

const handlePublishOrRollback = async (
  row: GuesthouseRoomsApi.GuesthouseRoomRecord,
) => {
  try {
    if (row.enableStatus) {
      await rollbackGuesthouseRoom(row.id);
      message.success('撤回成功');
    } else {
      await publishGuesthouseRoom(row.id);
      message.success('发布成功');
    }
    fetchRooms();
  } catch (error) {
    console.error('Failed to publish/rollback room:', error);
    message.error('操作失败');
  }
};

const columns: DataTableColumns<GuesthouseRoomsApi.GuesthouseRoomRecord> = [
  { key: 'title', title: '房间名', width: 150 },
  { key: 'roomNo', title: '房间号', width: 120 },
  { key: 'price', title: '当前价格', width: 120 },
  { key: 'oriPrice', title: '原价', width: 120 },
  {
    key: 'enableStatus',
    render: (row) =>
      h(
        NTag,
        { type: row.enableStatus ? 'success' : 'warning' },
        { default: () => (row.enableStatus ? '已发布' : '待发布') },
      ),
    title: '状态',
    width: 100,
  },
  {
    key: 'facilityDesc',
    render: (row) =>
      h(
        NButton,
        { onClick: () => handleViewContent('设施描述', row.roomAmenities) },
        { default: () => '查看' },
      ),
    title: '设施描述',
    width: 120,
  },
  {
    key: 'roomTypeDesc',
    render: (row) =>
      h(
        NButton,
        { onClick: () => handleViewContent('房型描述', row.roomDesc) },
        { default: () => '查看' },
      ),
    title: '房型描述',
    width: 120,
  },
  {
    key: 'roomPolicy',
    render: (row) =>
      h(
        NButton,
        { onClick: () => handleViewContent('政策和服务', row.policies, true) },
        { default: () => '查看' },
      ),
    title: '政策和服务',
    width: 120,
  },
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
                onClick: () => handleEdit(row),
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
                default: () => '确定要删除吗？',
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
            h(
              NButton,
              {
                onClick: () => handlePublishOrRollback(row),
                size: 'small',
                type: row.enableStatus ? 'warning' : 'info',
              },
              { default: () => (row.enableStatus ? '撤回' : '发布') },
            ),
          ],
        },
      );
    },
    title: '操作',
    width: 250,
  },
];

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
onMounted(() => {
  if (queryCardRef.value) {
    queryCardHeight.value = queryCardRef.value.offsetHeight;
  }
});
onMounted(() => {
  fetchRegionList();
  fetchRooms();
});

const showContentModal = ref(false);
const modalContent = reactive({
  content: '',
  isHtml: false,
  title: '',
});
const handleViewContent = (title: string, content: string, isHtml = false) => {
  console.log('handleViewContent', title, content, isHtml);
  modalContent.title = title;
  modalContent.content = content;
  modalContent.isHtml = isHtml;
  showContentModal.value = true;
};

const showMobileQuery = ref(false);
</script>

<template>
  <Page
    :description="!isMobile ? '管理系统中的客房信息' : ''"
    :title="!isMobile ? '客房管理' : ''"
  >
    <ResponsiveLayout desktop-slot="div" mobile-slot="div">
      <template #default="{ isMobile }">
        <template v-if="isMobile">
          <div class="pt-0">
            <div class="mb-4 flex justify-end">
              <NSpace>
                <NButton type="primary" @click="showMobileQuery = true">
                  查询客房
                </NButton>
                <NButton type="success" @click="handleAdd">新增客房</NButton>
              </NSpace>
            </div>
            <MobileCardList
              :items="rooms"
              :pagination="pagination"
              @page-change="handlePageChange"
              @page-size-change="handlePageSizeChange"
            >
              <template #card-content="{ item: room }">
                <div class="flex flex-col space-y-2">
                  <div class="flex justify-between">
                    <span class="font-bold">{{ room.title }}</span>
                    <span>房间号: {{ room.roomNo }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>当前价格: {{ room.price }}</span>
                    <span>原价: {{ room.oriPrice }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>状态: {{ room.enableStatus ? '已发布' : '待发布' }}</span>
                  </div>
                  <div class="flex justify-end space-x-2">
                    <NButton
                      size="small"
                      type="success"
                      @click="handleEdit(room)"
                    >
                      编辑
                    </NButton>
                    <NPopconfirm @positive-click="handleDelete(room.id)">
                      <template #trigger>
                        <NButton size="small" type="error">删除</NButton>
                      </template>
                      确定要删除吗？
                    </NPopconfirm>
                    <NButton
                      :type="room.enableStatus ? 'warning' : 'info'"
                      size="small"
                      @click="handlePublishOrRollback(room)"
                    >
                      {{ room.enableStatus ? '撤回' : '发布' }}
                    </NButton>
                  </div>
                </div>
              </template>
            </MobileCardList>
          </div>
          <MobileQueryDrawer
            v-model:show="showMobileQuery"
            @reset="handleReset"
            @search="handleSearch"
          >
            <NForm :model="queryForm" class="space-y-4">
              <NFormItem label="房间名">
                <NInput
                  v-model:value="queryForm.title"
                  placeholder="请输入房间名"
                />
              </NFormItem>
              <NFormItem label="房间号">
                <NInput
                  v-model:value="queryForm.roomNo"
                  placeholder="请输入房间号"
                />
              </NFormItem>
              <NFormItem label="关联区域">
                <NSelect
                  v-model:value="queryForm.regionId"
                  :options="regionOptions"
                  clearable
                />
              </NFormItem>
              <NFormItem label="状态">
                <NSelect
                  v-model:value="queryForm.enableStatus"
                  :options="[
                    { label: '已发布', value: true },
                    { label: '待发布', value: false },
                  ]"
                  clearable
                />
              </NFormItem>
            </NForm>
          </MobileQueryDrawer>
        </template>
        <template v-else>
          <!-- Existing desktop layout -->
          <div ref="queryCardRef" class="w-full">
            <NCard class="query-card mb-4 p-2">
              <NForm :model="queryForm" class="flex h-full items-center" inline>
                <NSpace
                  :size="[24, 16]"
                  align="center"
                  item-style="display: flex;"
                >
                  <NFormItem
                    class="!mb-0 flex items-center"
                    label="房间名"
                    label-placement="left"
                  >
                    <NInput
                      v-model:value="queryForm.title"
                      class="w-40"
                      placeholder="请输入房间名"
                    />
                  </NFormItem>
                  <NFormItem
                    class="!mb-0 flex items-center"
                    label="房间号"
                    label-placement="left"
                  >
                    <NInput
                      v-model:value="queryForm.roomNo"
                      class="w-40"
                      placeholder="请输入房间号"
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
                    label="状态"
                    label-placement="left"
                  >
                    <NSelect
                      v-model:value="queryForm.enableStatus"
                      :options="[
                        { label: '已发布', value: true },
                        { label: '待发布', value: false },
                      ]"
                      class="w-32"
                      clearable
                    />
                  </NFormItem>

                  <NSpace :size="[24, 0]" align="center">
                    <NButtonGroup>
                      <NButton type="primary" @click="handleSearch">
                        搜索
                      </NButton>
                      <NButton @click="handleReset">重置</NButton>
                      <NButton type="success" @click="handleAdd">
                        新增客房
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
              :data="rooms"
              :loading="loading"
              :pagination="pagination"
              :scroll-x="1200"
              :style="{ height: `${tableHeight}px` }"
              class="flex-1 overflow-auto"
              flex-height
              striped
              @update:page="handlePageChange"
              @update:page-size="handlePageSizeChange"
            />
          </NCard>
        </template>
      </template>
    </ResponsiveLayout>

    <Modal />
    <NModal
      v-model:show="showContentModal"
      :title="modalContent.title"
      class="w-[600px] max-w-[90%]"
      preset="card"
    >
      <div
        v-if="!modalContent.isHtml"
        class="prose prose-sm max-h-[70vh] max-w-none overflow-y-auto whitespace-pre-wrap break-words rounded-md bg-gray-100 p-4"
      >
        <div>{{ modalContent.content }}</div>
      </div>
      <div
        v-else
        :class="[{ 'prose prose-sm max-w-none': modalContent.isHtml }]"
      >
        <div v-html="modalContent.content"></div>
      </div>
    </NModal>
  </Page>
</template>
