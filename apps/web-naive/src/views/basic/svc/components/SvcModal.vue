<script setup lang="ts">
import type { FormInst, UploadFileInfo } from 'naive-ui';

import type { SvcApi } from '#/api/core/svc.types';

import { computed, h, nextTick, onMounted, reactive, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  NDynamicInput,
  NDynamicTags,
  NForm,
  NFormItemGi,
  NGrid,
  NIcon,
  NInput,
  NInputNumber,
  NSelect,
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
  coverInfo: reactive<OssFileInfo>({
    fileName: '',
    fileUrl: '',
    height: null,
    videoFlag: false,
    width: null,
  }),
  id: undefined,
  imageList: [], // 修改这里，从 activityImages 改为 imageList
  priceInfo: {
    oriPrice: null,
    payFlag: false,
    price: null,
  },
  regionId: undefined,
  regionName: '',
  sortNo: 0,
  tags: [],
  title: '',
});

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
  'coverInfo.fileUrl': {
    message: '请上传封面图',
    required: true,
    trigger: 'change',
    validator: (rule, value) => {
      return value !== '';
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
    editingRecord.value = {
      ...detail,
      contactInfo: detail.contactInfo || [
        { key: '手机号', value: '135XXXXXXXX' },
      ],
      coverInfo: {
        fileName: detail.coverInfo?.fileName || '',
        fileUrl: detail.coverInfo?.fileUrl || '',
        height: detail.coverInfo?.height || null,
        videoFlag: detail.coverInfo?.videoFlag || false,
        width: detail.coverInfo?.width || null,
      },
      imageList: detail.imageList || [], // 使用 imageList
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
      tags: detail.tags || [],
    };
  } catch (error) {
    console.error('获取详情失败:', error);
    message.error('获取详情失败');
  }
};

const [Modal, modalApi] = useVbenModal({
  draggable: true,
  onCancel() {
    modalApi.close();
  },
  onConfirm() {
    console.info('onConfirm');
    handleSave();
  },
  onOpenChange(isOpen) {
    console.info('onOpenChange', isOpen);
    editingRecord.value.id = null;
    const { id, title } = modalApi.getData();
    modalApi.setState({ title });
    if (isOpen && id) {
      fetchDetail(id);
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
      coverInfo: editingRecord.value.coverInfo,
      imageList: editingRecord.value.imageList,
      sortNo: Number.parseInt(String(editingRecord.value.sortNo), 10) || 0,
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

// 监听 editingRecord 的变化
watch(
  () => editingRecord.value.coverInfo,
  (newCoverInfo) => {
    fileList.value = newCoverInfo.fileUrl
      ? [
          {
            id: 'cover',
            name: newCoverInfo.fileName || '封面图',
            status: 'finished',
            url: newCoverInfo.fileUrl,
          },
        ]
      : [];
  },
  { deep: true, immediate: true },
);

const handleFileUpload = async (options: { file: UploadFileInfo }) => {
  const { file } = options;
  if (file.file) {
    try {
      const formData = new FormData();
      formData.append('file', file.file);
      const result = await uploadFile(formData);
      editingRecord.value.coverInfo.fileName = file.name;
      editingRecord.value.coverInfo.fileUrl = result.fileUrl;
      editingRecord.value.coverInfo.videoFlag = false;

      // Calculate image dimensions
      const img = new Image();
      img.addEventListener('load', () => {
        editingRecord.value.coverInfo.width = img.width;
        editingRecord.value.coverInfo.height = img.height;
      });
      img.src = result.fileUrl;

      // 在上传成功后，更新 fileList
      fileList.value = [
        {
          id: 'cover',
          name: editingRecord.value.coverInfo.fileName,
          status: 'finished',
          url: editingRecord.value.coverInfo.fileUrl,
        },
      ];
    } catch (error) {
      console.error('文件上传失败:', error);
    }
  }
};

const handleUploadChange = (options: { fileList: UploadFileInfo[] }) => {
  if (options.fileList.length === 0) {
    // 如果用户移除了图片，清空 coverInfo
    editingRecord.value.coverInfo = {
      fileName: '',
      fileUrl: '',
      height: null,
      videoFlag: false,
      width: null,
    };
    fileList.value = [];
  }
};

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
        <NFormItemGi :span="12" label="服务图列表">
          <NUpload
            v-model:file-list="activityImagesList"
            :custom-request="handleActivityImagesUpload"
            :max="8"
            list-type="image-card"
            multiple
            @remove="handleActivityImagesRemove"
          />
        </NFormItemGi>
        <NFormItemGi :span="12" label="封面图" path="coverInfo.fileUrl">
          <NUpload
            v-model:file-list="fileList"
            :custom-request="handleFileUpload"
            :max="1"
            list-type="image-card"
            @change="handleUploadChange"
          >
            点击上传
          </NUpload>
        </NFormItemGi>

        <NFormItemGi :span="24" label="服务内容" path="content">
          <TEditor v-model="editingRecord.content" />
        </NFormItemGi>
      </NGrid>
    </NForm>
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