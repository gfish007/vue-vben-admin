<script setup lang="ts">
import type { FormInst, FormRules } from 'naive-ui';

import type { LiveSchedulingApi } from '#/api/core/liveScheduling.types';

import { h, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NButtonGroup,
  NCard,
  NConfigProvider,
  NDataTable,
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSelect,
  NSpace,
  NTimePicker,
  useMessage,
  NTag,
} from 'naive-ui';

import { queryLiveMemberList } from '#/api/core/liveMember';
import {
  deleteLiveSchedulings,
  getLiveAccountList,
  getLiveLocationList,
  getLiveSchedulingDetail,
  queryLiveSchedulingList,
  saveOrUpdateLiveScheduling,
} from '#/api/core/liveScheduling';
import { useDynamicHeight } from '#/utils/heightUtils';
import { purpleTheme } from '#/utils/theme';

const message = useMessage();

// 账号和位置选项
const accountOptions = ref<Array<{ label: string; value: number }>>([]);
const locationOptions = ref<Array<{ label: string; value: number }>>([]);

// 无人直播选项
const nobodyOptions = [
  { label: '是', value: 'Y' },
  { label: '否', value: 'N' },
];

// 角色选项
const roleOptions = [
  { label: '直播', value: 'ZB' },
  { label: '场控', value: 'CK' },
  { label: '主播', value: 'ZB' },
  { label: '助播', value: 'ZB_HELPER' },
  { label: '运营', value: 'OPERATION' },
];

// 查询条件
const queryForm = reactive<LiveSchedulingApi.QueryParams['queryBody']>({
  dateRange: null,
  gmtEnd: null,
  gmtStart: null,
  liveAccountId: undefined,
  memberId: undefined,
  nobodyFlag: undefined,
});

// 表格数据
const tableData = ref<LiveSchedulingApi.LiveSchedulingRecord[]>([]);
const loading = ref(false);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

// 模态框相关
const showModal = ref(false);
const modalTitle = ref('');
const editingRecord = ref<LiveSchedulingApi.LiveSchedulingRecord>({
  gmtEnd: null,
  gmtPlay: null,
  gmtStart: null,
  id: null,
  liveAccountId: undefined,
  liveLocationId: undefined,
  nobodyFlag: 'N',
  schedulingMembers: [],
});

// 成员选择模态框
const showMemberModal = ref(false);
const memberLoading = ref(false);
const memberList = ref<any[]>([]);
const selectedMembers = ref<any[]>([]);

// 表单规则
const rules: FormRules = {
  gmtEnd: {
    message: '请选择结束时间',
    required: true,
    trigger: ['blur', 'change'],
    type: 'number',
  },
  gmtPlay: {
    message: '请选择开播日期',
    required: true,
    trigger: ['blur', 'change'],
    type: 'number',
  },

  gmtStart: {
    message: '请选择开始时间',
    required: true,
    trigger: ['blur', 'change'],
    type: 'number',
  },
  liveAccountId: {
    message: '请选择直播账号',
    required: true,
    trigger: ['blur', 'change'],
  },
  liveLocationId: {
    message: '请选择直播位置',
    required: true,
    trigger: ['blur', 'change'],
  },
  nobodyFlag: {
    message: '请选择是否无人直播',
    required: true,
    trigger: ['blur', 'change'],
  },
};

const formRef = ref<FormInst | null>(null);

// 状态管理
const editLoading = ref(false);
const deleteLoading = ref(false);
const saveLoading = ref(false);

// 成员查询条件
const memberQuery = reactive({
  department: '',
  name: '',
  role: undefined,
});

// 加载账号和位置选项
const loadOptions = async () => {
  try {
    const [accountRes, locationRes] = await Promise.all([
      getLiveAccountList(),
      getLiveLocationList(),
    ]);

    accountOptions.value = accountRes.records.map((item) => ({
      label: item.accountName,
      value: item.id,
    }));

    locationOptions.value = locationRes.records.map((item) => ({
      label: item.roomName,
      value: item.id,
    }));
  } catch (error) {
    console.error('加载选项失败:', error);
    message.error('加载选项失败');
  }
};

// 加载成员列表
const loadMembers = async () => {
  memberLoading.value = true;
  try {
    const result = await queryLiveMemberList({
      page: { current: 1, size: 99_999 },
      queryBody: {
        department: memberQuery.department || undefined,
        name: memberQuery.name || undefined,
        role: memberQuery.role,
      },
    });
    // 确保每个成员都有必要的字段
    memberList.value = result.records.map((member) => ({
      ...member,
      role: member.role || 'ZB', // 如果没有角色则默认为'ZB'
      memberName: member.name, // 添加 memberName 字段
    }));
  } catch (error) {
    console.error('加载成员失败:', error);
    message.error('加载成员失败');
  } finally {
    memberLoading.value = false;
  }
};

// 修改 handleEdit 函数
const handleEdit = async (row: LiveSchedulingApi.LiveSchedulingRecord) => {
  editLoading.value = true;
  try {
    modalTitle.value = '编辑直播排班';
    const detail = await getLiveSchedulingDetail(row.id);
    
    // 格式化时间数据
    const formattedDetail = {
      ...detail,
      gmtPlay: detail.gmtPlay ? new Date(detail.gmtPlay).getTime() : null,
      gmtStart: detail.gmtStart ? new Date(detail.gmtStart).getTime() : null,
      gmtEnd: detail.gmtEnd ? new Date(detail.gmtEnd).getTime() : null,
      schedulingMembers: detail.schedulingMembers?.map(member => ({
        ...member,
        gmtStart: member.gmtStart ? new Date(member.gmtStart).getTime() : null,
        gmtEnd: member.gmtEnd ? new Date(member.gmtEnd).getTime() : null,
        memberName: member.memberName || '', // 确保 memberName 字段存在
      })) || []
    };

    editingRecord.value = formattedDetail;
    showModal.value = true;
  } catch (error) {
    console.error('获取详情失败:', error);
    message.error('获取详情失败');
  } finally {
    editLoading.value = false;
  }
};

// 修改 handleDelete 函数
const handleDelete = async (row: LiveSchedulingApi.LiveSchedulingRecord) => {
  deleteLoading.value = true;
  try {
    await deleteLiveSchedulings([row.id]);
    message.success('删除成功');
    fetchData();
  } catch {
    message.error('删除失败');
  } finally {
    deleteLoading.value = false;
  }
};

// 添加时间格式化工具函数
const formatDateTime = (date: string | number | null, includeTime = true): string | null => {
  if (!date) return null;
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;
  
  if (!includeTime) return dateStr;
  
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${dateStr} ${hh}:${mm}:${ss}`;
};

// 添加时间范围验证函数
const validateMemberTime = (memberTime: number | null, type: 'start' | 'end'): { valid: boolean; message?: string } => {
  if (!memberTime) return { valid: false, message: '请选择时间' };
  if (!editingRecord.value.gmtStart || !editingRecord.value.gmtEnd) {
    return { valid: false, message: '请先设置排班计划的时间范围' };
  }

  const planStart = editingRecord.value.gmtStart;
  const planEnd = editingRecord.value.gmtEnd;

  if (type === 'start' && (memberTime < planStart || memberTime > planEnd)) {
    return { valid: false, message: '开始时间必须在排班计划时间范围内' };
  }

  if (type === 'end' && (memberTime < planStart || memberTime > planEnd)) {
    return { valid: false, message: '结束时间必须在排班计划时间范围内' };
  }

  return { valid: true };
};

// 修改 handleSave 函数
const handleSave = async () => {
  if (!formRef.value) return;
  saveLoading.value = true;
  try {
    await formRef.value.validate();

    // 验证所有成员的时间范围
    const invalidMembers = editingRecord.value.schedulingMembers.filter(member => {
      const startValidation = validateMemberTime(member.gmtStart, 'start');
      const endValidation = validateMemberTime(member.gmtEnd, 'end');
      return !startValidation.valid || !endValidation.valid;
    });

    if (invalidMembers.length > 0) {
      message.error('存在成员时间范围超出排班计划时间范围，请检查');
      return;
    }
    
    // 创建数据副本进行格式化
    const formattedRecord = {
      ...editingRecord.value,
      gmtPlay: formatDateTime(editingRecord.value.gmtPlay, false),
      gmtStart: formatDateTime(editingRecord.value.gmtStart, true),
      gmtEnd: formatDateTime(editingRecord.value.gmtEnd, true),
      schedulingMembers: editingRecord.value.schedulingMembers.map(member => ({
        ...member,
        gmtStart: formatDateTime(member.gmtStart, true),
        gmtEnd: formatDateTime(member.gmtEnd, true),
        memberName: memberList.value.find(m => m.id === member.memberId)?.memberName || ''
      }))
    };

    console.log('Formatted data to save:', formattedRecord);
    await saveOrUpdateLiveScheduling(formattedRecord);
    
    message.success(editingRecord.value.id ? '编辑成功' : '新增成功');
    showModal.value = false;
    fetchData();
  } catch (error) {
    console.error('保存失败:', error);
    // message.error('保存失败，请检查表单');
  } finally {
    saveLoading.value = false;
  }
};

// 查询数据
const fetchData = async () => {
  loading.value = true;
  try {
    const result = await queryLiveSchedulingList({
      page: {
        current: pagination.page,
        size: pagination.pageSize,
      },
      queryBody: {
        ...queryForm,
        gmtEnd: queryForm.dateRange ? queryForm.dateRange[1] : null,
        gmtStart: queryForm.dateRange ? queryForm.dateRange[0] : null,
      },
    });
    tableData.value = result.records;
    pagination.total = result.total;
  } catch (error) {
    console.error('获取数据失败:', error);
    message.error('获取数据失败');
  } finally {
    loading.value = false;
  }
};

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
};

// 简化的状态判断函数
const getSchedulingStatus = (startTime: string, endTime: string) => {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  if (now < start) return { type: 'info', text: '未开始' };
  if (now > end) return { type: 'error', text: '已结束' };
  return { type: 'success', text: '进行中' };
};

// 表格列定义
const columns = [

  {
    key: 'liveAccountId',
    render: (row: LiveSchedulingApi.LiveSchedulingRecord) => {
      const account = accountOptions.value.find(
        (opt) => opt.value === row.liveAccountId,
      );
      return account?.label || row.liveAccountId;
    },
    title: '直播账号',
    width: 150,
  },
  {
    key: 'liveLocationId',
    render: (row: LiveSchedulingApi.LiveSchedulingRecord) => {
      const location = locationOptions.value.find(
        (opt) => opt.value === row.liveLocationId,
      );
      return location?.label || row.liveLocationId;
    },
    title: '直播位置',
    width: 150,
  },
  {
    key: 'status',
    title: '状态',
    width: 90,
    render: (row) => h(NTag, {
      type: getSchedulingStatus(row.gmtStart, row.gmtEnd).type,
      round: true,
    }, () => getSchedulingStatus(row.gmtStart, row.gmtEnd).text)
  },
  {
    key: 'gmtPlay',
    title: '开播日期',
    width: 120,
  },
  {
    key: 'gmtStart',
    title: '开始时间',
    width: 180,
  },
  {
    key: 'gmtEnd',
    title: '结束时间',
    width: 180,
  },
  {
    key: 'nobodyFlag',
    render: (row: LiveSchedulingApi.LiveSchedulingRecord) => {
      const option = nobodyOptions.find((opt) => opt.value === row.nobodyFlag);
      return option?.label || row.nobodyFlag;
    },
    title: '无人直播',
    width: 100,
  },
  {
    key: 'schedulingMemberName',
    render: (row: LiveSchedulingApi.LiveSchedulingRecord) => {
      return row.schedulingMemberName?.join(', ') || '无';
    },
    title: '排班成员',
    width: 200,
  },
  {
    fixed: 'right',
    key: 'actions',
    render: (row: LiveSchedulingApi.LiveSchedulingRecord) => {
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
const handleAdd = () => {
  modalTitle.value = '新增直播排班';
  editingRecord.value = {
    gmtEnd: null,
    gmtPlay: null,
    gmtStart: null,
    id: null,
    liveAccountId: undefined,
    liveLocationId: undefined,
    nobodyFlag: 'N',
    schedulingMembers: [],
  };
  showModal.value = true;
};

// 处理成员选择
const handleSelectMembers = () => {
  loadMembers();
  showMemberModal.value = true;
};

// 处理成员确认
const handleConfirmMembers = () => {
  // 获取已选成员的ID列表
  const existingMemberIds = new Set(
    editingRecord.value.schedulingMembers.map((m) => m.memberId),
  );

  // 只添加新选择的成员
  const newMembers = selectedMembers.value
    .filter((member) => !existingMemberIds.has(member.id))
    .map((member) => ({
      gmtEnd: editingRecord.value.gmtEnd,
      gmtStart: editingRecord.value.gmtStart,
      memberId: member.id,
      memberName: member.memberName || member.name || '', // 优先使用 memberName，否则使用 name
      role: member.role || 'ZB',
    }));

  editingRecord.value.schedulingMembers.push(...newMembers);
  showMemberModal.value = false;
};

// 处理成员搜索
const handleMemberSearch = () => {
  loadMembers();
};

// 处理成员重置
const handleMemberReset = () => {
  memberQuery.department = '';
  memberQuery.name = '';
  memberQuery.role = undefined;
  loadMembers();
};

// 处理成员选择
const handleMemberSelect = (keys: number[]) => {
  selectedMembers.value = memberList.value.filter((item) =>
    keys.includes(item.id),
  );
};

// 已选择成员列表的列定义
const selectedMemberColumns = [
  {
    key: 'memberName',
    title: '名称',
    width: 100,
    render: (row) => row.memberName || '', // 直接使用 memberName 字段
  },
  {
    key: 'gmtStart',
    render: (row, index) => {
      return h(NDatePicker, {
        clearable: true,
        type: 'datetime',
        value: editingRecord.value.schedulingMembers[index].gmtStart,
        onUpdateValue: (value) => {
          const validation = validateMemberTime(value, 'start');
          if (!validation.valid) {
            message.warning(validation.message);
            return;
          }
          editingRecord.value.schedulingMembers[index].gmtStart = value;
        },
        style: 'width: 200px',
        // 设置可选时间范围
        min: editingRecord.value.gmtStart || undefined,
        max: editingRecord.value.gmtEnd || undefined
      });
    },
    title: '开始时间',
    width: 200,
  },
  {
    key: 'gmtEnd',
    render: (row, index) => {
      return h(NDatePicker, {
        clearable: true,
        type: 'datetime',
        value: editingRecord.value.schedulingMembers[index].gmtEnd,
        onUpdateValue: (value) => {
          const validation = validateMemberTime(value, 'end');
          if (!validation.valid) {
            message.warning(validation.message);
            return;
          }
          editingRecord.value.schedulingMembers[index].gmtEnd = value;
        },
        style: 'width: 200px',
        // 设置可选时间范围
        min: editingRecord.value.gmtStart || undefined,
        max: editingRecord.value.gmtEnd || undefined
      });
    },
    title: '结束时间',
    width: 200,
  },
  {
    key: 'role',
    render: (row, index) => {
      return h(NSelect, {
        clearable: true,
        onUpdateValue: (value) => {
          editingRecord.value.schedulingMembers[index].role = value;
        },
        options: roleOptions,
        placeholder: '请选择角色',
        style: 'width: 120px',
        value: editingRecord.value.schedulingMembers[index].role,
      });
    },
    title: '角色',
    width: 120,
  },
  {
    key: 'actions',
    render: (row, index) => {
      return h(
        NButton,
        {
          onClick: () => {
            editingRecord.value.schedulingMembers.splice(index, 1);
          },
          size: 'small',
          type: 'error',
        },
        { default: () => '删除' },
      );
    },
    title: '操作',
    width: 80,
  },
];

// 初始化
onMounted(() => {
  loadOptions();
  fetchData();
});

// 动态计算表格高度
const queryCardRef = ref<HTMLElement | null>(null);
const { queryCardHeight, tableHeight } = useDynamicHeight(queryCardRef);

onMounted(() => {
  if (queryCardRef.value) {
    queryCardHeight.value = queryCardRef.value.offsetHeight;
  }
});

const handleReset = () => {
  Object.keys(queryForm).forEach((key) => {
    queryForm[key] = undefined;
  });
  queryForm.dateRange = null;
  handleSearch();
};
</script>

<template>
  <Page description="管理系统中的直播排班信息" title="直播排班管理">
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
              <NFormItem label="时间范围" label-placement="left">
                <NDatePicker
                  v-model:value="queryForm.dateRange"
                  clearable
                  end-placeholder="结束时间"
                  start-placeholder="开始时间"
                  style="width: 320px"
                  type="datetimerange"
                />
              </NFormItem>
              <NFormItem label="直播账号" label-placement="left">
                <NSelect
                  v-model:value="queryForm.liveAccountId"
                  :options="accountOptions"
                  clearable
                  style="width: 200px"
                />
              </NFormItem>
              <NFormItem label="无人直播" label-placement="left">
                <NSelect
                  v-model:value="queryForm.nobodyFlag"
                  :options="nobodyOptions"
                  clearable
                  style="width: 120px"
                />
              </NFormItem>
            </NSpace>
            <NSpace>
              <NConfigProvider :theme="purpleTheme">
                <NButton type="primary" @click="handleSearch">搜索</NButton>
              </NConfigProvider>
              <NButton type="success" @click="handleAdd">新增排班</NButton>
            </NSpace>
          </NSpace>
        </NForm>
      </NCard>
    </div>

    <NCard>
      <div v-if="tableData.length === 0" style="margin-bottom: 16px">
        <p>No data available</p>
        <p>Total records: {{ pagination.total }}</p>
      </div>

      <NDataTable
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :max-height="`${tableHeight}px`"
        :min-height="`${tableHeight}px`"
        :pagination="pagination"
        :scroll-x="1100"
        :single-line="false"
        flex-height
        striped
        @update:page="handlePageChange"
      />
    </NCard>

    <NModal
      v-model:show="showModal"
      :title="modalTitle"
      preset="card"
      style="width: 850px"
    >
      <NForm
        ref="formRef"
        :model="editingRecord"
        :rules="rules"
        label-placement="top"
        label-width="100px"
        require-mark-placement="right-hanging"
      >
        <NSpace :size="24">
          <NFormItem label="直播账号" path="liveAccountId">
            <NSelect
              v-model:value="editingRecord.liveAccountId"
              :options="accountOptions"
              required
              style="width: 200px"
            />
          </NFormItem>
          <NFormItem label="直播位置" path="liveLocationId">
            <NSelect
              v-model:value="editingRecord.liveLocationId"
              :options="locationOptions"
              required
              style="width: 200px"
            />
          </NFormItem>
          <NFormItem label="无人直播" path="nobodyFlag">
            <NSelect
              v-model:value="editingRecord.nobodyFlag"
              :options="nobodyOptions"
              required
              style="width: 200px"
            />
          </NFormItem>
        </NSpace>

        <NSpace :size="24">
          <div style="display: flex; gap: 24px; align-items: flex-start">
            <NFormItem label="开播日期" path="gmtPlay">
              <NDatePicker
                v-model:value="editingRecord.gmtPlay"
                clearable
                style="width: 200px"
                type="date"
              />
            </NFormItem>
            <NFormItem label="开始时间" path="gmtStart">
              <NDatePicker
                v-model:value="editingRecord.gmtStart"
                clearable
                style="width: 200px"
                type="datetime"
              />
            </NFormItem>
            <NFormItem label="结束时间" path="gmtEnd">
              <NDatePicker
                v-model:value="editingRecord.gmtEnd"
                clearable
                style="width: 200px"
                type="datetime"
              />
            </NFormItem>
          </div>
        </NSpace>

        <NFormItem label="排班成员">
          <NSpace vertical>
            <NButton @click="handleSelectMembers">选择成员</NButton>
            <div v-if="editingRecord.schedulingMembers.length > 0">
              <NCard>
                <NSpace vertical>
                  <div>已选择成员列表</div>
                  <NDataTable
                    :columns="selectedMemberColumns"
                    :data="
                      editingRecord.schedulingMembers.map((member) => ({
                        ...member,
                        ...memberList.find(
                          (item) => item.id === member.memberId,
                        ),
                      }))
                    "
                    :pagination="false"
                    :scroll-x="740"
                    size="small"
                  />
                </NSpace>
              </NCard>
            </div>
          </NSpace>
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

    <!-- 成员选择模态框 -->
    <NModal
      v-model:show="showMemberModal"
      :loading="memberLoading"
      preset="card"
      style="width: 900px"
      title="选择排班成员"
    >
      <!-- 添加查询表单 -->
      <NCard class="query-card">
        <NForm inline>
          <NFormItem label="姓名">
            <NInput
              v-model:value="memberQuery.name"
              placeholder="请输入姓名"
              style="width: 150px"
            />
          </NFormItem>
          <NFormItem label="部门">
            <NInput
              v-model:value="memberQuery.department"
              placeholder="请输入部门"
              style="width: 150px"
            />
          </NFormItem>
          <NFormItem label="角色">
            <NSelect
              v-model:value="memberQuery.role"
              :options="roleOptions"
              clearable
              placeholder="请选择角色"
              style="width: 150px"
            />
          </NFormItem>
          <NFormItem>
            <NButtonGroup>
              <NButton type="primary" @click="handleMemberSearch">搜索</NButton>
              <NButton @click="handleMemberReset">重置</NButton>
            </NButtonGroup>
          </NFormItem>
        </NForm>
      </NCard>

      <NDataTable
        :columns="[
          { type: 'selection' },
          { key: 'name', title: '名称', width: 150 },
          { key: 'department', title: '部门', width: 150 },
          { key: 'job', title: '岗位', width: 150 },
          { key: 'role', title: '角色', width: 100 },
        ]"
        :data="memberList"
        :max-height="400"
        :pagination="{ page: 1, pageSize: 10 }"
        :row-key="(row) => row.id"
        :scroll-x="600"
        @update:checked-row-keys="handleMemberSelect"
      />
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showMemberModal = false">取消</NButton>
          <NButton type="primary" @click="handleConfirmMembers">确定</NButton>
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
  margin-bottom: 0;
}

.n-data-table {
  flex: 1;
  overflow: auto;
}
</style>
