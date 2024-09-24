<script setup lang="ts">
import type { FormInst, FormRules, UploadFileInfo } from 'naive-ui';

import type { AttractionApi } from '#/api/core/attraction.types';

import { computed, ref } from 'vue';

import {
  NButton,
  NConfigProvider,
  NDynamicTags,
  NForm,
  NFormItem,
  NInput,
  NProgress,
  NSelect,
  NSpace,
  NUpload,
  useMessage,
} from 'naive-ui';
import { QuillEditor } from 'vue3-quill';

import { uploadFile } from '#/api/core/file';
import LocationMap from '#/components/LocationMap.vue';

const props = defineProps<{
  editingRecord: AttractionApi.AttractionSaveReq;
  regionOptions: { label: string; value: number }[];
  show: boolean;
  title: string;
}>();

const emit = defineEmits(['update:show', 'save']);

const message = useMessage();

const formRef = ref<FormInst | null>(null);
const saveLoading = ref(false);

// 表单规则
const rules: FormRules = {
  description: { message: '请输入描述', required: true, trigger: 'blur' },
  locationInfo: {
    message: '请在地图上选择位置',
    required: true,
    trigger: 'change',
    validator: (rule, value) =>
      value && value.lnglat && value.lnglat.length > 0,
  },
  regionId: {
    message: '请选择关联区域',
    required: true,
    trigger: ['blur', 'change'],
    type: 'number',
    validator: (rule, value) => value !== null && value !== undefined,
  },
  tagList: {
    message: '请至少添加一个标签',
    min: 1,
    type: 'array',
  },
  title: { message: '请输入标题', required: true, trigger: 'blur' },
};

// 计算属性：封面文件
const coverFileList = computed<UploadFileInfo[]>(() => {
  return props.editingRecord.coverList.map((url, index) => ({
    id: `cover-${index}`,
    name: `封面${index + 1}`,
    status: 'finished',
    url,
  }));
});

// 上传进度状态
const uploadProgress = ref(0);
const isUploading = ref(false);

// 处理文件上传
const handleFileUpload = async (options: { fileList: UploadFileInfo[] }) => {
  const { fileList } = options;
  const newFiles = fileList.filter((file) => file.status === 'pending');

  for (const file of newFiles) {
    if (file.file) {
      try {
        isUploading.value = true;
        uploadProgress.value = 0;
        const formData = new FormData();
        formData.append('file', file.file);
        const result = await uploadFile(formData, (progress) => {
          uploadProgress.value = progress;
        });
        props.editingRecord.coverList.push(result.fileUrl);
      } catch (error) {
        console.error('文件上传失败:', error);
        message.error(`文件 ${file.name} 上传失败`);
      } finally {
        isUploading.value = false;
      }
    }
  }

  if (newFiles.length > 0) {
    message.success('文件上传成功');
  }
};

// 处理文件删除
const handleFileRemove = (file: UploadFileInfo) => {
  const index = props.editingRecord.coverList.indexOf(file.file?.url || '');
  if (index !== -1) {
    props.editingRecord.coverList.splice(index, 1);
  }
};

// 文件上传前的验证
const beforeUpload = (data: {
  file: UploadFileInfo;
  fileList: UploadFileInfo[];
}) => {
  const { file, fileList } = data;
  const isImage = file.type?.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件');
    return false;
  }
  if (fileList.length > 3) {
    message.error('最多只能上传3张封面图');
    return false;
  }
  return true;
};

// 处理保存
const handleSave = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    emit('save', props.editingRecord);
  } catch (error) {
    console.error('表单验证失败:', error);
    message.error('请检查表单填写是否正确');
  }
};

// 紫色主题配置
const purpleTheme = {
  common: {
    primaryColor: '#8a2be2',
    primaryColorHover: '#9f3ff3',
    primaryColorPressed: '#7a1dd1',
  },
};
</script>

<template>
  <NModal
    v-model:show="show"
    :title="title"
    class="max-h-[90vh] w-4/5 max-w-4xl overflow-y-auto"
    preset="card"
    @update:show="$emit('update:show', $event)"
  >
    <NForm
      ref="formRef"
      :model="editingRecord"
      :rules="rules"
      class="w-full"
      label-placement="left"
      label-width="100px"
      require-mark-placement="right-hanging"
    >
      <NSpace :size="24" align="start">
        <NFormItem label="关联区域" path="regionId">
          <NSelect
            v-model:value="editingRecord.regionId"
            :options="regionOptions"
            clearable
            filterable
            placeholder="请选择关联区域"
            style="width: 200px"
          />
        </NFormItem>
        <NFormItem label="标题" path="title">
          <NInput v-model:value="editingRecord.title" style="width: 200px" />
        </NFormItem>
      </NSpace>

      <NFormItem label="标签列表" path="tagList">
        <NDynamicTags v-model:value="editingRecord.tagList" />
      </NFormItem>

      <NFormItem label="封面" path="coverList">
        <div class="relative w-full">
          <NUpload
            :before-upload="beforeUpload"
            :file-list="coverFileList"
            :max="3"
            class="w-full"
            list-type="image-card"
            multiple
            @change="handleFileUpload"
            @remove="handleFileRemove"
          >
            上传图片
            <NProgress
              v-if="isUploading"
              :height="6"
              :percentage="uploadProgress"
              :show-indicator="false"
              class="absolute inset-x-0 bottom-0 z-10"
              processing
            />
          </NUpload>
        </div>
      </NFormItem>
      <NFormItem class="w-full" label="景点概述" path="description">
        <QuillEditor v-model="editingRecord.description" />
      </NFormItem>
      <NFormItem class="w-full" label="位置信息" path="locationInfo">
        <LocationMap
          v-model:location="editingRecord.location"
          v-model:location-info="editingRecord.locationInfo"
        />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="$emit('update:show', false)">取消</NButton>
        <NConfigProvider :theme="purpleTheme">
          <NButton :loading="saveLoading" type="primary" @click="handleSave">
            保存
          </NButton>
        </NConfigProvider>
      </NSpace>
    </template>
  </NModal>
</template>
