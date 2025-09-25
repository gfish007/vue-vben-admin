<script setup lang="ts">
import type { FormInst, UploadFileInfo } from 'naive-ui';

import type { SvcApi } from '#/api/core/svc.types';

import { computed, h, nextTick, onMounted, reactive, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  NButton,
  NDynamicInput,
  NDynamicTags,
  NForm,
  NFormItemGi,
  NGrid,
  NIcon,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NUpload,
  useMessage,
} from 'naive-ui';

import { uploadFile } from '#/api/core/file';
import { queryRegionList } from '#/api/core/region';
import {
  getSvcDetail,
  saveOrUpdateSvc,
} from '#/api/core/svc';
import TEditor from '#/components/TEditor.vue';
import LocationMap from '#/components/LocationMap.vue';

interface OssFileInfo {
  fileName: string;
  fileUrl: string;
  videoFlag: boolean;
  height: null | number;
  width: null | number;
}

const message = useMessage();
const formRef = ref<FormInst | null>(null);
const editingRecord = ref<SvcApi.SvcSaveReq>({
  contactInfo: [{ key: '手机号', value: '135XXXXXXXX' }],
  content: '',
  id: undefined,
  imageList: [],
  priceInfo: {
    oriPrice: null,
    payFlag: false,
    price: null,
  },
  regionId: undefined,
  regionName: '',
  sortNo: 0,
  svcType: 0, // 默认为正常类型
  tags: [],
  title: '',
  location: '',
  locationInfo: {},
});

// svcType选项
const svcTypeOptions = [
  { label: '正常', value: 0 },
  { label: '预约', value: 1 },
  { label: '票据', value: 2 },
];

const rules = computed(() => ({
  contactInfo: {
    message: '请至少输入一种联系方式',
    required: true,
    trigger: 'submit',
    type: 'array',
    validator: (rule, value) => {
      return value && value.length > 0;
    },
  },
  content: { message: '请输入服务内容', required: true, trigger: 'change' },
  'imageList': {
    message: '请至少上传一张图片',
    required: true,
    trigger: 'submit',
    type: 'array',
    validator: (rule, value) => {
      return value && value.length > 0;
    },
  },
  'priceInfo.oriPrice': {
    required: editingRecord.value.priceInfo.payFlag,
    trigger: ['blur', 'change'],
    validator: (rule, value) => {
      if (
        editingRecord.value.priceInfo.payFlag &&
        (value === null || value === undefined)
      ) {
        return new Error('请输入原价');
      }
      return true;
    },
  },
  'priceInfo.payFlag': {
    message: '请选择是否付费',
    required: true,
    trigger: 'change',
    validator: (rule, value) => {
      return value !== null && value !== undefined;
    },
  },
  'priceInfo.price': {
    required: editingRecord.value.priceInfo.payFlag,
    trigger: ['blur', 'change'],
    validator: (rule, value) => {
      if (
        editingRecord.value.priceInfo.payFlag &&
        (value === null || value === undefined)
      ) {
        return new Error('请输入售价');
      }
      return true;
    },
  },
  regionId: { message: '请选择关联区域', required: true, trigger: 'change' },
  title: { message: '请输入标题', required: true, trigger: 'blur' },
}));

const regionOptions = ref([]);

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
  } catch (error) {
    console.error('获取区域列表失败:', error);
  }
};

const fetchDetail = async (id: number) => {
  try {
    const detail = await getSvcDetail(id);
    // 处理locationInfo，确保正确显示在位置搜索栏中
    const locationInfo =
      typeof detail.locationInfo === 'string'
        ? JSON.parse(detail.locationInfo)
        : detail.locationInfo || {};

    const location = locationInfo.address?.formattedAddress || detail.location || '';

    editingRecord.value = {
      ...detail,
      contactInfo: detail.contactInfo || [
        { key: '手机号', value: '135XXXXXXXX' },
      ],
      imageList: detail.imageList || [],
      priceInfo: {
        oriPrice: detail.priceInfo?.oriPrice
          ? Number(detail.priceInfo.oriPrice)
          : null,
        payFlag: detail.priceInfo?.payFlag ?? false,
        price: detail.priceInfo?.price ? Number(detail.priceInfo.price) : null,
      },
      sortNo:
        typeof detail.sortNo === 'string'
          ? Number.parseInt(detail.sortNo, 10) || 0
          : detail.sortNo || 0,
      svcType: typeof detail.svcType === 'string' ? parseInt(detail.svcType, 10) : (detail.svcType ?? 0), // 添加svcType字段，默认为0
      tags: detail.tags || [],
      location: location, // 使用formattedAddress作为位置搜索栏的值
      locationInfo: locationInfo,
    };
  } catch (error) {
    console.error('获取详情失败:', error);
    message.error('获取详情失败');
  }
};

const [Modal, modalApi] = useVbenModal({
  draggable: true,
  onOpenChange(isOpen) {
    console.info('onOpenChange', isOpen);
    editingRecord.value.id = null;
    const { id, title } = modalApi.getData();
    modalApi.setState({ title });
    if (isOpen && id) {
      fetchDetail(id);
    } else if (isOpen) {
      // 重置位置搜索文本
      editingRecord.value.location = '';
      editingRecord.value.locationInfo = {};
    }
  },
  title: '新增 SVC 服务',
});

const handleSave = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    const submitData = {
      ...editingRecord.value,
      contactInfo: editingRecord.value.contactInfo,
      imageList: editingRecord.value.imageList,
      sortNo: Number.parseInt(String(editingRecord.value.sortNo), 10) || 0,
      locationInfo:
        typeof editingRecord.value.locationInfo === 'string'
          ? JSON.parse(editingRecord.value.locationInfo)
          : editingRecord.value.locationInfo,
    };
    await saveOrUpdateSvc(submitData);
    message.success('保存成功');
    modalApi.setData({ refresh: true });
    modalApi.close();
  } catch (error) {
    console.error('保存失败:', error);
    message.error('保存失败');
  }
};

const fileList = ref<UploadFileInfo[]>([]);

const computedSortNo = computed({
  get: () => editingRecord.value.sortNo,
  set: (value: number | string) => {
    editingRecord.value.sortNo =
      typeof value === 'string' ? Number.parseInt(value, 10) || 0 : value;
  },
});

// 添加服务图列表的文件上传处理
const activityImagesList = ref<UploadFileInfo[]>([]);

const handleActivityImagesUpload = async (options: {
  file: UploadFileInfo;
}) => {
  const { file } = options;
  if (file.file) {
    try {
      const formData = new FormData();
      formData.append('file', file.file);
      const result = await uploadFile(formData);

      const newImage: OssFileInfo = {
        fileName: file.name,
        fileUrl: result.fileUrl,
        height: null,
        videoFlag: false,
        width: null,
      };

      editingRecord.value.imageList.push(newImage); // 使用 imageList

      // Calculate image dimensions
      const img = new Image();
      img.addEventListener('load', () => {
        newImage.width = img.width;
        newImage.height = img.height;
      });
      img.src = result.fileUrl;

      // Update activityImagesList without pushing a new item
      const existingIndex = activityImagesList.value.findIndex(
        (item) => item.id === result.fileUrl,
      );
      if (existingIndex === -1) {
        activityImagesList.value.push({
          id: result.fileUrl,
          name: file.name,
          status: 'finished',
          url: result.fileUrl,
        });
      }
    } catch (error) {
      console.error('服务图上传失败:', error);
    }
  }
};

const handleActivityImagesRemove = (file: UploadFileInfo) => {
  const index = editingRecord.value.imageList.findIndex(
    // 使用 imageList
    (img) => img.fileUrl === file.url,
  );
  if (index > -1) {
    editingRecord.value.imageList.splice(index, 1); // 使用 imageList
  }
};

// 添加图标组件
const renderIcon = (icon: Component) => {
  return () => h(NIcon, null, { default: () => h(icon) });
};

onMounted(() => {
  fetchRegionList();
});

// Update the watch effect
watch(
  () => editingRecord.value.imageList, // 使用 imageList
  (newImages) => {
    activityImagesList.value = newImages.map((img) => ({
      id: img.fileUrl,
      name: img.fileName,
      status: 'finished',
      url: img.fileUrl,
    }));
  },
  { deep: true, immediate: true },
);

const payFlagOptions = [
  { label: '免费', value: false },
  { label: '付费', value: true },
];

// 添加这个函数来手动触发表单验证
const validateForm = () => {
  if (formRef.value) {
    formRef.value.validate((errors) => {
      if (errors) {
        console.log('验证失败', errors);
      } else {
        console.log('验证成功');
      }
    });
  }
};

// 监听 payFlag 的变化
watch(
  () => editingRecord.value.priceInfo.payFlag,
  (newValue) => {
    // 如果切换为不付费，清空价格字段
    if (!newValue) {
      editingRecord.value.priceInfo.oriPrice = null;
      editingRecord.value.priceInfo.price = null;
    }
    // 手动触发表单验证
    nextTick(validateForm);
  },
);

// 计算属性，用于处理位置信息
// 已移除，直接使用editingRecord.locationInfo

// 添加位置搜索文本的计算属性
// 已移除，直接使用editingRecord.address
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
          />
        </NFormItemGi>
        <NFormItemGi :span="12" label="标题" path="title">
          <NInput v-model:value="editingRecord.title" />
        </NFormItemGi>
        <NFormItemGi :span="6" label="排序值" path="sortNo">
          <NInputNumber v-model:value="computedSortNo" />
        </NFormItemGi>
        <NFormItemGi :span="6" label="服务类型" path="svcType">
          <NSelect
            v-model:value="editingRecord.svcType"
            :options="svcTypeOptions"
          />
        </NFormItemGi>

        <NFormItemGi
          :span="12"
          class="mt-0"
          label="联系方式"
          path="contactInfo"
        >
          <NDynamicInput
            v-model:value="editingRecord.contactInfo"
            :on-create="() => ({ key: '', value: '' })"
            key-field="key"
            value-field="value"
          >
            <template #default="{ value }">
              <NInput
                v-model:value="value.key"
                placeholder="联系方式类型"
                style="width: 40%; margin-right: 4px"
              />
              <NInput
                v-model:value="value.value"
                placeholder="联系方式内容"
                style="width: 60%"
              />
            </template>
          </NDynamicInput>
        </NFormItemGi>

        <NFormItemGi :span="12" label="服务标签" path="tags">
          <NDynamicTags v-model:value="editingRecord.tags" />
        </NFormItemGi>
        <NFormItemGi :span="4" label="是否付费" path="priceInfo.payFlag">
          <NSelect
            v-model:value="editingRecord.priceInfo.payFlag"
            :options="payFlagOptions"
            placeholder="请选择是否付费"
          />
        </NFormItemGi>

        <NFormItemGi :span="4" label="原价" path="priceInfo.oriPrice">
          <NInputNumber
            v-model:value="editingRecord.priceInfo.oriPrice"
            :disabled="!editingRecord.priceInfo.payFlag"
            :min="0"
            :precision="2"
            placeholder="请输入原价"
          />
        </NFormItemGi>

        <NFormItemGi :span="4" label="售价" path="priceInfo.price">
          <NInputNumber
            v-model:value="editingRecord.priceInfo.price"
            :disabled="!editingRecord.priceInfo.payFlag"
            :min="0"
            :precision="2"
            placeholder="请输入售价"
          />
        </NFormItemGi>
        <NFormItemGi :span="24" label="服务图列表" path="imageList">
          <NUpload
            v-model:file-list="activityImagesList"
            :custom-request="handleActivityImagesUpload"
            :max="8"
            list-type="image-card"
            multiple
            @remove="handleActivityImagesRemove"
          />
        </NFormItemGi>

        <NFormItemGi :span="24" label="服务内容" path="content">
          <TEditor v-model="editingRecord.content" />
        </NFormItemGi>

        <NFormItemGi :span="24" label="位置信息">
          <LocationMap
            v-model:location="editingRecord.location"
            v-model:location-info="editingRecord.locationInfo"
          />
        </NFormItemGi>
      </NGrid>
    </NForm>
    <template #footer>
      <div class="flex justify-end w-full">
        <NSpace>
          <NButton @click="modalApi.close">取消</NButton>
          <NButton type="primary" @click="handleSave">保存</NButton>
        </NSpace>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.flex-col-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
