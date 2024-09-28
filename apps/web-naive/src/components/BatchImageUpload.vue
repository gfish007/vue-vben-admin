<script setup lang="ts">
import type { UploadFileInfo } from 'naive-ui';

import { computed, ref } from 'vue';

import { NUpload, useMessage } from 'naive-ui';

import { uploadFile } from '#/api/core/file';

interface OssFileInfo {
  fileName: string;
  fileUrl: string;
  videoFlag: boolean;
  height: number;
  width: number;
}

const props = defineProps<{
  max?: number;
  modelValue: OssFileInfo[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: OssFileInfo[]): void;
}>();

const message = useMessage();

const uploadProgress = ref(0);
const isUploading = ref(false);

const fileList = computed<UploadFileInfo[]>(() => {
  return props.modelValue.map((file, index) => ({
    id: `image-${index}`,
    name: file.fileName,
    status: 'finished',
    url: file.fileUrl,
  }));
});

const getImageDimensions = (
  url: string,
): Promise<{ height: number; width: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () =>
      resolve({ height: img.height, width: img.width }),
    );
    img.onerror = reject;
    img.src = url;
  });
};

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

        const { height, width } = await getImageDimensions(result.fileUrl);

        const newFileInfo: OssFileInfo = {
          fileName: result.fileName,
          fileUrl: result.fileUrl,
          height,
          videoFlag: false,
          width,
        };

        emit('update:modelValue', [...props.modelValue, newFileInfo]);
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

const handleFileRemove = (options: {
  file: UploadFileInfo;
  fileList: UploadFileInfo[];
}) => {
  const { file } = options;
  const index = props.modelValue.findIndex((f) => f.fileUrl === file.url);
  if (index !== -1) {
    const newList = [...props.modelValue];
    newList.splice(index, 1);
    emit('update:modelValue', newList);
  }
};

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
  if (props.max && fileList.length > props.max) {
    message.error(`最多只能上传${props.max}张图片`);
    return false;
  }
  return true;
};
</script>

<template>
  <div class="relative w-full">
    <NUpload
      :before-upload="beforeUpload"
      :file-list="fileList"
      :max="max"
      class="w-full"
      list-type="image-card"
      multiple
      @change="handleFileUpload"
      @remove="handleFileRemove"
    >
      <template #default>
        <div
          class="relative flex h-full w-full flex-col items-center justify-center overflow-hidden"
        >
          <span>上传图片</span>
          <div
            v-if="isUploading"
            class="absolute inset-x-0 bottom-0 h-1.5 w-full"
          >
            <div
              :style="{ width: `${uploadProgress}%` }"
              class="bg-primary-500 h-full transition-all duration-300 ease-in-out"
            ></div>
          </div>
        </div>
      </template>
    </NUpload>
  </div>
</template>

<style scoped>
:deep(.n-upload-trigger) {
  @apply relative overflow-hidden;
}
</style>
