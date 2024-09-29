<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useWindowSize } from '@vueuse/core';
import {
  NDatePicker,
  NForm,
  NFormItemGi,
  NGrid,
  NInput,
  NInputNumber,
  NSelect,
  useMessage,
} from 'naive-ui';

import { guesthouseReservationApi } from '#/api/guesthouse/reservation';
import { queryGuesthouseRoomsList } from '#/api/guesthouse/rooms';

const message = useMessage();

const { width } = useWindowSize();
const isMobile = computed(() => width.value < 640);

const [Modal, modalApi] = useVbenModal({
  draggable: !isMobile.value,
  onCancel() {
    modalApi.close();
  },
  onConfirm() {
    handleSave();
  },
  onOpenChange(isOpen) {
    const { id, title } = modalApi.getData();
    modalApi.setState({ title });
    if (isOpen && id) {
      fetchDetail(id);
    }
  },
  title: '新增预定',
});

const handleRoomChange = (roomId: string) => {
  const selectedRoom = roomOptions.value.find((room) => room.value === roomId);
  if (selectedRoom) {
    editingRecord.value.oriPrice = Number(selectedRoom.price) || 0;
    editingRecord.value.payPrice = editingRecord.value.oriPrice; // 初始时实付价等于原价
    editingRecord.value.discountPrice = 0; // 初始时折扣价为0
  } else {
    editingRecord.value.oriPrice = 0;
    editingRecord.value.payPrice = 0;
    editingRecord.value.discountPrice = 0;
  }
  console.log('Updated prices:', editingRecord.value); // 添加日志
};
const formRef = ref(null);
const editingRecord = ref({
  dateRange: null as [number, number] | null,
  discountPrice: 0,
  gmtEnd: null,
  gmtStart: null,
  guestsId: '0',
  id: null,
  idCard: '',
  oriPrice: 0,
  payPrice: 0,
  phone: '',
  realName: '',
  regionId: null,
  remark: '',
  roomId: null,
});

const rules = {
  dateRange: {
    message: '请选择入住和退房时间',
    required: true,
    trigger: ['blur', 'change'],
    type: 'array',
    validator: (rule: any, value: [number, number] | null) => {
      if (!value || value.length !== 2) {
        return new Error('请选择入住和退房时间');
      }
      return true;
    },
  },
  gmtEnd: {
    message: '请选择退房时间',
    required: true,
    trigger: 'change',
    type: 'number',
  },
  gmtStart: {
    message: '请选择入住时间',
    required: true,
    trigger: 'change',
    type: 'number',
  },
  idCard: {
    message: '请输入身份证号',
    required: true,
    trigger: ['blur', 'change'],
  },
  payPrice: {
    // 新增实付价的验证规则
    message: '请输入实付价',
    required: true,
    trigger: ['blur', 'change'],
    type: 'number',
    validator: (rule: any, value: number) => {
      if (value <= 0) {
        return new Error('实付价必须大于0');
      }
      return true;
    },
  },
  phone: {
    message: '请输入手机号',
    required: true,
    trigger: ['blur', 'change'],
  },
  realName: {
    message: '请输入真实姓名',
    required: true,
    trigger: ['blur', 'change'],
  },
  remark: { message: '请输入备注', required: false, trigger: 'blur' },
  roomId: {
    message: '请选择房间',
    required: true,
    trigger: ['blur', 'change'],
  },
};

const roomOptions = ref([]);

const fetchRoomList = async () => {
  try {
    const response = await queryGuesthouseRoomsList({
      page: {
        current: 1,
        pageSize: 999,
      },
      queryBody: {},
    });
    roomOptions.value = response.records.map((room) => ({
      label: `${room.title} （${room.price}元）`,
      price: room.price,
      value: room.id.toString(),
    }));
  } catch (error) {
    console.error('Failed to fetch room list:', error);
    message.error('获取房间列表失败');
  }
};

// 格式化日期为 YYYY-MM-DD HH:mm:ss
const formatDate = (date: Date | number | string): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 解析日期范围
const parseDateRange = (
  start: null | string,
  end: null | string,
): [number, number] | null => {
  if (start && end) {
    return [new Date(start).getTime(), new Date(end).getTime()];
  }
  return null;
};

const fetchDetail = async (id: string) => {
  try {
    const dataInfo = await guesthouseReservationApi.getById(id);
    editingRecord.value = {
      ...dataInfo,
      dateRange: parseDateRange(dataInfo.gmtStart, dataInfo.gmtEnd),
      discountPrice: Number(dataInfo.discountPrice) || 0,
      gmtEnd: dataInfo.gmtEnd ? new Date(dataInfo.gmtEnd).getTime() : null,
      gmtStart: dataInfo.gmtStart
        ? new Date(dataInfo.gmtStart).getTime()
        : null,
      oriPrice: Number(dataInfo.oriPrice) || 0,
      payPrice: Number(dataInfo.payPrice) || 0,
    };
  } catch (error) {
    console.error('Failed to fetch reservation detail:', error);
    message.error('获取预订详情失败');
  }
};
// 新增：获取昨天开始时间的函数
const getYesterdayStart = (): number => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(12, 0, 0, 0);
  return yesterday.getTime();
};

const handleSave = async () => {
  try {
    await formRef.value?.validate();
    const formData = {
      ...editingRecord.value,
      gmtEnd: editingRecord.value.gmtEnd
        ? formatDate(editingRecord.value.gmtEnd)
        : null,
      gmtStart: editingRecord.value.gmtStart
        ? formatDate(editingRecord.value.gmtStart)
        : null,
    };
    await guesthouseReservationApi.saveOrUpdate(formData);
    modalApi.setData({ refresh: true });
    message.success('保存成功');
    modalApi.close();
  } catch (error) {
    console.error('Failed to save reservation:', error);
    // message.error('保存失败');
  }
};

onMounted(async () => {
  fetchRoomList();
});
</script>

<template>
  <Modal
    :class="
      !isMobile ? 'max-h-[90vh] w-4/5 max-w-4xl overflow-y-auto px-2' : ''
    "
  >
    <NForm
      ref="formRef"
      :label-width="isMobile ? 'auto' : 'auto'"
      :model="editingRecord"
      :rules="rules"
      label-placement="top"
    >
      <NGrid :cols="isMobile ? 4 : 24" :x-gap="24">
        <NFormItemGi :span="isMobile ? 2 : 6" label="预定房间" path="roomId">
          <NSelect
            v-model:value="editingRecord.roomId"
            :options="roomOptions"
            placeholder="请选择预定房间"
            @update:value="handleRoomChange"
          />
        </NFormItemGi>
        <NFormItemGi :span="isMobile ? 2 : 6" label="真实姓名" path="realName">
          <NInput v-model:value="editingRecord.realName" />
        </NFormItemGi>
        <NFormItemGi :span="isMobile ? 2 : 6" label="手机号" path="phone">
          <NInput v-model:value="editingRecord.phone" />
        </NFormItemGi>
        <NFormItemGi :span="isMobile ? 2 : 6" label="身份证号" path="idCard">
          <NInput
            v-model:value="editingRecord.idCard"
            placeholder="请输入身份证号"
          />
        </NFormItemGi>
        <NFormItemGi :span="isMobile ? 2 : 6" label="入住时间" path="gmtStart">
          <NDatePicker
            v-model:value="editingRecord.gmtStart"
            :actions="['clear', 'confirm']"
            :is-date-disabled="(ts: number) => ts < getYesterdayStart()"
            clearable
            type="date"
          />
        </NFormItemGi>
        <NFormItemGi :span="isMobile ? 2 : 6" label="退房时间" path="gmtEnd">
          <NDatePicker
            v-model:value="editingRecord.gmtEnd"
            :actions="['clear', 'confirm']"
            :is-date-disabled="(ts: number) => ts < editingRecord.gmtStart"
            clearable
            type="date"
          />
        </NFormItemGi>

        <NFormItemGi :span="isMobile ? 2 : 4" label="原价" path="oriPrice">
          <NInputNumber
            v-model:value="editingRecord.oriPrice"
            :disabled="true"
          />
        </NFormItemGi>
        <NFormItemGi :span="isMobile ? 2 : 4" label="实付价" path="payPrice">
          <NInputNumber v-model:value="editingRecord.payPrice" />
        </NFormItemGi>
        <NFormItemGi
          :span="isMobile ? 2 : 4"
          label="折扣价"
          path="discountPrice"
        >
          <NInputNumber v-model:value="editingRecord.discountPrice" />
        </NFormItemGi>
        <NFormItemGi :span="isMobile ? 4 : 12" label="备注" path="remark">
          <NInput
            v-model:value="editingRecord.remark"
            :autosize="{ minRows: 3, maxRows: 5 }"
            placeholder="请输入备注（选填）"
            type="textarea"
          />
        </NFormItemGi>
      </NGrid>
    </NForm>
  </Modal>
</template>
