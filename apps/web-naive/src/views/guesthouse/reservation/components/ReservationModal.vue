<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

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

import {
  guesthouseReservationApi,
  type GuesthouseReservationSaveReq,
} from '#/api/guesthouse/reservation';
import { queryGuesthouseRoomsList } from '#/api/guesthouse/rooms';

const message = useMessage();

const formRef = ref();

// 获取当前日期时间的函数
const getCurrentDateTime = (): number => {
  return Date.now();
};

const formData = ref<GuesthouseReservationSaveReq>({
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
  regionId: '0',
  remark: '',
  roomId: '',
});

const dateRange = ref(null);

// 格式化日期为 YYYY-MM-DD HH:mm:ss
const formatDate = (date: Date | number | string): string => {
  const d = new Date(date);
  return d.toISOString().slice(0, 19).replace('T', ' ');
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

const guesthouseReservationInfo = async (id: string) => {
  if (!id) {
    console.error('Invalid id');
    message.error('无效的预订ID');
    return;
  }
  try {
    const dataList = await guesthouseReservationApi.getById(id);
    formData.value = {
      ...dataList,
      dateRange: parseDateRange(dataList.gmtStart, dataList.gmtEnd),
      discountPrice: Number(dataList.discountPrice) || 0,
      oriPrice: Number(dataList.oriPrice) || 0,
      payPrice: Number(dataList.payPrice) || 0,
    };
    console.log('Fetched reservation data:', formData.value); // 添加日志
  } catch (error) {
    console.error('Failed to fetch reservation details:', error);
    message.error('获取预订详情失败');
  }
};

const [Modal, modalApi] = useVbenModal({
  draggable: true,
  onCancel() {
    modalApi.close();
  },
  onConfirm() {
    handleSubmit();
  },
  onOpenChange(isOpen) {
    const { id, title } = modalApi.getData();
    modalApi.setState({ title });
    console.log('id', id);
    if (isOpen) {
      if (id) {
        guesthouseReservationInfo(id);
      } else {
        // Reset form for new reservation
        formData.value = {
          dateRange: [getYesterdayStart(), getCurrentDateTime()],
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
          regionId: '0',
          remark: '',
          roomId: '',
        };
      }
    }
  },
  title: '新增客房',
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
  gmtEnd: { message: '请选择退房时间', required: true, trigger: 'change' },
  gmtStart: { message: '请选择入住时间', required: true, trigger: 'change' },
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

const handleSubmit = () => {
  formRef.value?.validate(async (errors: any) => {
    if (!errors) {
      try {
        const submitData = { ...formData.value };
        if (submitData.dateRange) {
          submitData.gmtStart = formatDate(submitData.dateRange[0]);
          submitData.gmtEnd = formatDate(submitData.dateRange[1]);
        }

        await guesthouseReservationApi.saveOrUpdate(submitData);
        message.success('保存成功');
        modalApi.setData({ refresh: true });
        modalApi.close();
      } catch (error) {
        console.error('Failed to save reservation:', error);
        message.error('保存失败');
      }
    }
  });
};

const roomOptions = ref([]);

// 新增：获取昨天开始时间的函数
const getYesterdayStart = (): number => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(12, 0, 0, 0);
  return yesterday.getTime();
};

onMounted(async () => {
  try {
    const response = await queryGuesthouseRoomsList({
      page: {
        current: 1,
        pageSize: 999,
      },
      queryBody: {},
    });
    roomOptions.value = response.records.map((room) => ({
      label: room.title,
      price: room.price,
      value: room.id.toString(),
    }));
  } catch (error) {
    console.error('Failed to fetch room list:', error);
    message.error('获取房间列表失败');
  }
});

const handleRoomChange = (roomId: string) => {
  const selectedRoom = roomOptions.value.find((room) => room.value === roomId);
  if (selectedRoom) {
    formData.value.oriPrice = Number(selectedRoom.price) || 0;
    formData.value.payPrice = formData.value.oriPrice; // 初始时实付价等于原价
    formData.value.discountPrice = 0; // 初始时折扣价为0
  } else {
    formData.value.oriPrice = 0;
    formData.value.payPrice = 0;
    formData.value.discountPrice = 0;
  }
  console.log('Updated prices:', formData.value); // 添加日志
};

// 添加一个函数来处理实付价的变化
const handlePayPriceChange = (value: number) => {
  formData.value.payPrice = value;
  formData.value.discountPrice = Math.max(formData.value.oriPrice - value, 0);
};

// 添加一个函数来处理折扣价的变化
const handleDiscountPriceChange = (value: number) => {
  formData.value.discountPrice = value;
  formData.value.payPrice = Math.max(formData.value.oriPrice - value, 0);
};
</script>

<template>
  <Modal class="max-h-[90vh] w-4/5 max-w-4xl overflow-y-auto px-2">
    <NForm ref="formRef" :model="formData" :rules="rules">
      <NGrid :cols="24" :x-gap="24">
        <NFormItemGi :span="6" label="房间" path="roomId">
          <NSelect
            v-model:value="formData.roomId"
            :options="roomOptions"
            placeholder="请选择房间"
            @update:value="handleRoomChange"
          />
        </NFormItemGi>
        <NFormItemGi :span="6" label="真实姓名" path="realName">
          <NInput
            v-model:value="formData.realName"
            placeholder="请输入真实姓名"
          />
        </NFormItemGi>
        <NFormItemGi :span="6" label="手机号" path="phone">
          <NInput v-model:value="formData.phone" placeholder="请输入手机号" />
        </NFormItemGi>
        <NFormItemGi :span="6" label="身份证号" path="idCard">
          <NInput
            v-model:value="formData.idCard"
            placeholder="请输入身份证号"
          />
        </NFormItemGi>
        <NFormItemGi :span="12" label="入住和退房时间" path="dateRange">
          <NDatePicker
            v-model:value="formData.dateRange"
            :actions="['clear', 'confirm']"
            :is-date-disabled="(ts: number) => ts < getYesterdayStart()"
            clearable
            type="datetimerange"
          />
        </NFormItemGi>
        <NFormItemGi :span="4" label="原价" path="oriPrice">
          <NInputNumber
            v-model:value="formData.oriPrice"
            :disabled="true"
            placeholder="房间原价"
          />
        </NFormItemGi>
        <NFormItemGi :span="4" label="实付价" path="payPrice" required>
          <NInputNumber
            v-model:value="formData.payPrice"
            :min="0"
            placeholder="请输入实付价"
          />
        </NFormItemGi>
        <NFormItemGi :span="4" label="折扣价" path="discountPrice">
          <NInputNumber
            v-model:value="formData.discountPrice"
            :min="0"
            placeholder="请输入折扣价"
          />
        </NFormItemGi>
        <NFormItemGi :span="12" label="备注" path="remark">
          <NInput
            v-model:value="formData.remark"
            :autosize="{ minRows: 3, maxRows: 5 }"
            placeholder="请输入备注（选填）"
            type="textarea"
          />
        </NFormItemGi>
      </NGrid>
    </NForm>
  </Modal>
</template>
