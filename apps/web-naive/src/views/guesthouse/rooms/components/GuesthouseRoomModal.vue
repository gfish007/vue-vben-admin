<script setup lang="ts">
import type { FormInst, FormRules } from 'naive-ui';

import type { GuesthouseRoomsApi } from '#/api/guesthouse/rooms.types';

import { computed, onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  NDynamicInput,
  NForm,
  NFormItemGi,
  NGrid,
  NInput,
  NInputNumber,
  NSelect,
  useMessage,
} from 'naive-ui';

import { queryRegionList } from '#/api/core/region';
import {
  getGuesthouseRoomDetail,
  saveOrUpdateGuesthouseRoom,
} from '#/api/guesthouse/rooms';
import BatchImageUpload from '#/components/BatchImageUpload.vue';
import TEditor from '#/components/TEditor.vue';

const message = useMessage();
const formRef = ref<FormInst | null>(null);
const editingRecord = ref<GuesthouseRoomsApi.GuesthouseRoomSaveReq>({
  coverList: [],
  enableStatus: true,
  oriPrice: 0,
  policies: '',
  price: 0,
  regionId: null,
  roomAmenities: [], // 这里先保持为空数组
  roomDesc: [],
  roomNo: '',
  sortNo: 0,
  title: '',
});

const rules: FormRules = {
  oriPrice: {
    message: '请输入大于0的原价',
    required: true,
    trigger: ['blur', 'change'],
    type: 'number',
    validator: (rule, value) => value > 0,
  },
  price: {
    message: '请输入大于0的当前价格',
    required: true,
    trigger: ['blur', 'change'],
    type: 'number',
    validator: (rule, value) => value > 0,
  },
  regionId: {
    message: '请选择关联区域',
    required: true,
    trigger: ['blur', 'change'],
    type: 'string',
  },
  roomNo: { message: '请输入房间号', required: true, trigger: 'blur' },
  title: { message: '请输入房间名称', required: true, trigger: 'blur' },
};

const regionOptions = ref([]);

const fetchRegionList = async () => {
  try {
    const result = await queryRegionList({
      page: { current: 1, size: 1000 },
      queryBody: {},
    });
    regionOptions.value = result.records.map((region) => ({
      label: region.title,
      value: String(region.id), // 转换为字符串
    }));
  } catch (error) {
    console.error('获取区域列表失败:', error);
  }
};

const fetchDetail = async (id: number) => {
  try {
    const detail = await getGuesthouseRoomDetail(id);
    // 在这里进行数据格式转换
    editingRecord.value = {
      ...detail,
      oriPrice: detail.oriPrice === null ? 0 : Number(detail.oriPrice),
      price: detail.price === null ? 0 : Number(detail.price),
      regionId: detail.regionId === null ? null : String(detail.regionId), // 转换为字符串
      sortNo: detail.sortNo === null ? 0 : Number(detail.sortNo),
    };
  } catch (error) {
    console.error('获取详情失败:', error);
    message.error('获取详情失败');
  }
};

// 添加预设的房间描述
const presetRoomDesc = ref([
  { key: '房型', value: '豪华大床房' },
  { key: '面积', value: '35平方米' },
  { key: '床型', value: '2米 x 2米特大床' },
  { key: '可住', value: '2人' },
  { key: '楼层', value: '6-18层' },
  { key: '窗户', value: '落地窗，海景房' },
  { key: '卫浴', value: '独立卫浴，24小时热水' },
  { key: '网络', value: '免费WiFi' },
  { key: '空调', value: '中央空调' },
  { key: '电视', value: '55寸4K智能电视' },
  { key: 'minibar', value: '迷你吧台，每日免费饮用水' },
  { key: '衣柜', value: '步入式衣柜' },
  { key: '保险箱', value: '房内保险箱' },
  { key: '特色', value: '免费欢迎水果' },
]);

// 添加预设的政策服务内容
const presetPolicies = ref(`
<h3>入住和退房政策</h3>
<ul>
  <li>入住时间：下午 2:00 后</li>
  <li>退房时间：上午 12:00 前</li>
  <li>24小时前台服务</li>
</ul>

<h3>预订政策</h3>
<ul>
  <li>需要预付全额房费</li>
  <li>入住前 48 小时可免费取消</li>
  <li>48 小时内取消将收取首晚房费</li>
</ul>

<h3>儿童和加床政策</h3>
<ul>
  <li>欢迎儿童入住</li>
  <li>12岁以下儿童免费入住（不含早餐）</li>
  <li>可应要求提供婴儿床，免费</li>
  <li>加床需额外收费，每晚 200 元</li>
</ul>

<h3>宠物政策</h3>
<p>不允许携带宠物</p>

<h3>支付方式</h3>
<p>接受信用卡、储蓄卡和现金支付</p>

<h3>其他服务</h3>
<ul>
  <li>免费Wi-Fi</li>
  <li>每日客房清洁服务</li>
  <li>行李寄存服务</li>
  <li>叫车服务</li>
</ul>
`);

const [Modal, modalApi] = useVbenModal({
  draggable: true,
  onCancel() {
    modalApi.close();
  },
  onConfirm() {
    handleSave();
  },
  onOpenChange(isOpen) {
    const { id, title } = modalApi.getData();
    modalApi.setState({ title });
    if (isOpen) {
      if (id) {
        fetchDetail(id);
      } else {
        // 如果是新增，使用预设的设施描述、房间描述和政策服务
        editingRecord.value = {
          ...editingRecord.value,
          policies: presetPolicies.value, // 使用预设的政策服务内容
          roomAmenities: presetAmenities.value.map((item) => ({
            icon: item.icon,
            key: item.key,
            value: item.value,
          })),
          roomDesc: presetRoomDesc.value.map((item) => ({
            key: item.key,
            value: item.value,
          })),
        };
      }
    } else {
      // 关闭modal时重置editingRecord
      editingRecord.value = {
        coverList: [],
        enableStatus: true,
        oriPrice: 0,
        policies: '',
        price: 0,
        regionId: null,
        roomAmenities: [],
        roomDesc: [],
        roomNo: '',
        sortNo: 0,
        title: '',
      };
    }
  },
  title: '新增客房',
});

const handleSave = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    // 直接使用 editingRecord.value，不需要额外转换
    await saveOrUpdateGuesthouseRoom(editingRecord.value);
    message.success('保存成功');
    modalApi.setData({ refresh: true });
    modalApi.close();
  } catch (error) {
    console.error('保存失败:', error);
    message.error('保存失败');
  }
};

const computedSortNo = computed({
  get: () => editingRecord.value.sortNo,
  set: (value: number | string) => {
    editingRecord.value.sortNo =
      typeof value === 'string' ? Number.parseInt(value, 10) || 0 : value;
  },
});

onMounted(() => {
  fetchRegionList();
});

const presetAmenities = ref([
  { icon: 'icon-[ion--bed-outline]', key: '床', value: '大床' },
  {
    icon: 'icon-[fluent--breakout-room-20-regular]',
    key: '房间面积',
    value: '30平方米',
  },
  { icon: 'icon-[ph--stairs-light]', key: '楼层', value: '3楼' },
  { icon: 'icon-[tdesign--window]', key: '窗户', value: '有窗' },
  { icon: 'icon-[healthicons--smoking-outline]', key: '吸烟', value: '禁烟房' },
  { icon: 'icon-[bi--people]', key: '人数', value: '可住2人' },
  {
    icon: 'icon-[fluent--food-toast-16-regular]',
    key: '早餐',
    value: '含早餐',
  },
  { icon: 'icon-[material-symbols--water-lux]', key: '海景', value: '无海景' },
  { icon: 'icon-[ic--sharp-pool]', key: '游泳池', value: '共享泳池' },
  { icon: 'icon-[fa6-solid--dumbbell]', key: '健身', value: '健身房' },
  { icon: 'icon-[tabler--paw-filled]', key: '宠物', value: '不可携带宠物' },
  { icon: 'icon-[ep--price-tag]', key: '其他', value: '' },
  {
    icon: 'icon-[emojione-monotone--pot-of-food]',
    key: '美食',
    value: '附近有餐厅',
  },
]);

const updateAmenityIcon = (value: {
  icon: string;
  key: string;
  value: string;
}) => {
  const preset = presetAmenities.value.find((item) => item.key === value.key);
  if (preset) {
    value.icon = preset.icon;
    value.key = preset.key;
    value.value = value.value || preset.value;
  } else {
    value.icon = 'ep:price-tag';
    value.value = value.value || '';
  }
};

const validateField = (field: string) => {
  if (formRef.value) {
    formRef.value.validate([field]);
  }
};
</script>

<template>
  <Modal class="max-h-[90vh] w-4/5 max-w-4xl overflow-y-auto px-2">
    <NForm
      ref="formRef"
      :model="editingRecord"
      :rules="rules"
      label-placement="top"
      label-width="100px"
      require-mark-placement="right-hanging"
    >
      <NGrid :cols="24" :x-gap="24">
        <NFormItemGi :span="6" label="关联区域" path="regionId">
          <NSelect
            v-model:value="editingRecord.regionId"
            :options="regionOptions"
            clearable
            @update:value="validateField('regionId')"
          />
        </NFormItemGi>
        <NFormItemGi :span="6" label="房间名称" path="title">
          <NInput v-model:value="editingRecord.title" />
        </NFormItemGi>
        <NFormItemGi :span="6" label="房间号" path="roomNo">
          <NInput v-model:value="editingRecord.roomNo" />
        </NFormItemGi>
        <NFormItemGi :span="6" label="排序值" path="sortNo">
          <NInputNumber v-model:value="computedSortNo" />
        </NFormItemGi>
        <NFormItemGi :span="6" label="当前价格" path="price">
          <NInputNumber
            v-model:value="editingRecord.price"
            :precision="2"
            :step="0.01"
            @blur="() => formRef?.validate(['price'])"
          />
        </NFormItemGi>
        <NFormItemGi :span="6" label="原价" path="oriPrice">
          <NInputNumber
            v-model:value="editingRecord.oriPrice"
            :precision="2"
            :step="0.01"
            @blur="() => formRef?.validate(['oriPrice'])"
          />
        </NFormItemGi>
        <NFormItemGi :span="24" label="封面图" path="coverList">
          <BatchImageUpload v-model="editingRecord.coverList" :max="3" />
        </NFormItemGi>
        <NFormItemGi :span="24" label="设施描述" path="roomAmenities">
          <NDynamicInput
            v-model:value="editingRecord.roomAmenities"
            :on-create="
              () => ({ key: '', value: '', icon: 'icon-[ep--price-tag]' })
            "
            key-field="key"
            value-field="value"
          >
            <template #default="{ value }">
              <div class="flex w-full items-center">
                <div class="mr-2 flex items-center">
                  <span
                    :class="value.icon"
                    class="inline-block h-[30px] w-[30px]"
                  ></span>
                </div>
                <NSelect
                  v-model:value="value.key"
                  :options="
                    presetAmenities.map((item) => ({
                      label: item.key,
                      value: item.key,
                    }))
                  "
                  class="mr-2 w-1/3"
                  filterable
                  placeholder="选择或输入设施"
                  tag
                  @update:value="updateAmenityIcon(value)"
                />
                <NInput
                  v-model:value="value.value"
                  class="mr-2 w-1/2"
                  placeholder="设施描述"
                />
              </div>
            </template>
          </NDynamicInput>
        </NFormItemGi>
        <NFormItemGi :span="24" label="房间描述" path="roomDesc">
          <NDynamicInput
            v-model:value="editingRecord.roomDesc"
            :on-create="() => ({ key: '', value: '' })"
            key-field="key"
            value-field="value"
          >
            <template #default="{ value }">
              <NInput
                v-model:value="value.key"
                placeholder="描述项"
                style="width: 40%; margin-right: 4px"
              />
              <NInput
                v-model:value="value.value"
                placeholder="描述内容"
                style="width: 60%"
              />
            </template>
          </NDynamicInput>
        </NFormItemGi>
        <NFormItemGi :span="24" label="房间政策" path="policies">
          <TEditor v-model="editingRecord.policies" />
        </NFormItemGi>
      </NGrid>
    </NForm>
  </Modal>
</template>
