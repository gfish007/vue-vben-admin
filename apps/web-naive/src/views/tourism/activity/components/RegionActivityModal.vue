<script setup lang="ts">
import type { FormInst, FormRules, UploadFileInfo } from 'naive-ui';

import type { RegionActivityApi } from '#/api/core/regionActivity.types';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  NDatePicker,
  NDynamicInput,
  NDynamicTags,
  NForm,
  NFormItemGi,
  NGrid,
  NInput,
  NInputNumber,
  NSelect,
  NUpload,
  useMessage,
} from 'naive-ui';

import { uploadFile } from '#/api/core/file';
import { queryRegionList } from '#/api/core/region';
import {
  getRegionActivityDetail,
  saveOrUpdateRegionActivity,
} from '#/api/core/regionActivity';
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
const editingRecord = ref<RegionActivityApi.RegionActivitySaveReq>({
  contactInfo: [{ key: '手机号', value: '135XXXXXXXX' }],
  content: '',
  coverInfo: reactive<OssFileInfo>({
    fileName: '',
    fileUrl: '',
    height: null,
    videoFlag: false,
    width: null,
  }),
  gmtEnd: null,
  gmtStart: null,
  id: undefined,
  regionId: undefined,
  regionName: '',
  sortNo: 0,
  tags: [],
  title: '',
});

const rules: FormRules = {
  contactInfo: {
    message: '请至少输入一种联系方式',
    required: true,
    trigger: 'submit',
    type: 'array',
    validator: (rule, value) => {
      return value && value.length > 0;
    },
  },
  content: { message: '请输入活动内容', required: true, trigger: 'change' },
  'coverInfo.fileUrl': {
    message: '请上传封面图',
    required: true,
    trigger: 'change',
    validator: (rule, value) => {
      return value !== '';
    },
  },
  gmtEnd: {
    message: '请选择结束时间',
    required: true,
    trigger: ['change', 'blur'],
    type: 'number',
    validator: (rule, value) => {
      return value !== null && value !== undefined;
    },
  },
  gmtStart: {
    message: '请选择开始时间',
    required: true,
    trigger: ['change', 'blur'],
    type: 'number',
    validator: (rule, value) => {
      return value !== null && value !== undefined;
    },
  },
  regionId: { message: '请选择关联区域', required: true, trigger: 'change' },
  title: { message: '请输入标题', required: true, trigger: 'blur' },
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
      value: region.id,
    }));
  } catch (error) {
    console.error('获取区域列表失败:', error);
  }
};

const fetchDetail = async (id: number) => {
  try {
    const detail = await getRegionActivityDetail(id);
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
      gmtEnd: detail.gmtEnd ? new Date(detail.gmtEnd).getTime() : null,
      gmtStart: detail.gmtStart ? new Date(detail.gmtStart).getTime() : null,
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
  title: '新增区域活动',
});

const handleSave = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    const submitData = {
      ...editingRecord.value,
      contactInfo: editingRecord.value.contactInfo,
      coverInfo: editingRecord.value.coverInfo,
      gmtEnd: formatDate(editingRecord.value.gmtEnd),
      gmtStart: formatDate(editingRecord.value.gmtStart),
      sortNo: Number.parseInt(String(editingRecord.value.sortNo), 10) || 0,
    };
    await saveOrUpdateRegionActivity(submitData);
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

const formatDate = (date: null | number): null | string => {
  if (!date) return null;
  const d = new Date(date);
  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
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
        <NFormItemGi :span="6" label="活动时间" path="gmtStart">
          <NDatePicker
            v-model:value="editingRecord.gmtStart"
            clearable
            type="datetime"
          />
        </NFormItemGi>
        <NFormItemGi :span="6" label="结束时间" path="gmtEnd">
          <NDatePicker
            v-model:value="editingRecord.gmtEnd"
            clearable
            type="datetime"
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

        <NFormItemGi :span="12" label="活动标签" path="tags">
          <NDynamicTags v-model:value="editingRecord.tags" />
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
        <NFormItemGi :span="24" label="活动内容" path="content">
          <TEditor v-model="editingRecord.content" />
        </NFormItemGi>
      </NGrid>
    </NForm>
  </Modal>
</template>

<style scoped></style>
