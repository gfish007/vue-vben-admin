<script setup lang="ts">
import type { UploadFileInfo, UploadInst } from 'naive-ui';

import type { AttractionGalleryAddReq } from '#/api/app/attractionGallery';

import { computed, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  NButton,
  NRadioButton,
  NRadioGroup,
  NSpace,
  NUpload,
  useMessage,
} from 'naive-ui';

import { saveAttractionGallery } from '#/api/app/attractionGallery';
import { uploadFile } from '#/api/core/file';

const props = defineProps<{
  attractionId: number;
}>();

const emit = defineEmits(['uploadSuccess', 'saveSuccess']);

const message = useMessage();
const uploadRef = ref<null | UploadInst>(null);
const fileList = ref<UploadFileInfo[]>([]);
const previewImageList = ref<UploadFileInfo[]>([]);

const type = ref<'picture' | 'video'>('picture');

const [Modal, modalApi] = useVbenModal({
  draggable: true,
  onConfirm() {
    handleSave();
  },
  title: computed(() => (type.value === 'picture' ? '上传图片' : '上传视频')),
  width: 800,
});

// 清除历史记录
watch(
  () => modalApi.isOpen,
  (isOpen) => {
    if (isOpen) {
      fileList.value = [];
      previewImageList.value = [];
    }
  },
);

const handleUpload = async ({ file, onError, onFinish, onProgress }: any) => {
  try {
    const formData = new FormData();
    formData.append('file', file.file);
    const result = await uploadFile(formData, (progress) => {
      onProgress({ percent: progress });
    });

    file.url = result.fileUrl;
    file.name = result.fileName; // Save the fileName returned from the API
    file.status = 'finished';

    if (type.value === 'video' && previewImageList.value.length === 0) {
      // 获取视频第5帧作为预览图
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous'; // 添加这行以解决跨域问题
      video.src = URL.createObjectURL(file.file);
      video.addEventListener('loadeddata', () => {
        video.currentTime = 5; // 设置到第5秒
      });
      video.addEventListener('seeked', async () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        file.height = video.videoHeight;
        file.width = video.videoWidth;
        canvas
          .getContext('2d')
          ?.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 将 canvas 转换为 Blob
        canvas.toBlob(async (blob) => {
          if (blob) {
            const previewFormData = new FormData();
            previewFormData.append('file', blob, 'preview.jpg');

            try {
              const previewFile = {
                id: 'preview',
                name: '预览图',
                percentage: 0,
                status: 'uploading',
              };
              previewImageList.value.push(previewFile);

              const previewResult = await uploadFile(
                previewFormData,
                (progress) => {
                  previewFile.percentage = progress;
                  // 触发视图更新
                  previewImageList.value = [...previewImageList.value];
                },
              );

              // 更新预览图信息
              const index = previewImageList.value.findIndex(
                (item) => item.id === 'preview',
              );
              if (index !== -1) {
                previewImageList.value[index] = {
                  ...previewImageList.value[index],
                  status: 'finished',
                  url: previewResult.fileUrl,
                };
              }

              message.success('预览图上传成功');
            } catch (error) {
              console.error('预览图上传失败:', error);
              message.error('预览图上传失败');
              // 移除失败的预览图
              previewImageList.value = previewImageList.value.filter(
                (item) => item.id !== 'preview',
              );
            }
          }
        }, 'image/jpeg');

        URL.revokeObjectURL(video.src); // 释放内存
      });
    }

    onFinish();
    message.success('上传成功');
    emit('uploadSuccess', result);
  } catch (error) {
    onError();
    console.error('上传失败:', error);
    message.error('上传失败');
  }
};

const beforeUpload = (data: {
  file: UploadFileInfo;
  fileList: UploadFileInfo[];
}) => {
  const { file, fileList } = data;
  if (type.value === 'picture') {
    const isImage = file.file?.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件');
      return false;
    }
    if (fileList.length >= 10) {
      message.error('最多只能上传10张图片');
      return false;
    }
  } else {
    const isVideo = file.file?.type.startsWith('video/');
    if (!isVideo) {
      message.error('只能上传视频文件');
      return false;
    }
    if (fileList.length > 0) {
      message.error('只能上传1个视频文件');
      return false;
    }
  }
  return true;
};

const beforeUploadPreview = (data: {
  file: UploadFileInfo;
  fileList: UploadFileInfo[];
}) => {
  const { file } = data;
  const isImage = file.file?.type.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件作为预览图');
    return false;
  }
  if (previewImageList.value.length > 0) {
    message.error('只能上传1张预览图');
    return false;
  }
  return true;
};

const handleUploadPreview = async ({
  file,
  onError,
  onFinish,
  onProgress,
}: any) => {
  try {
    const formData = new FormData();
    formData.append('file', file.file);
    const result = await uploadFile(formData, (progress) => {
      onProgress({ percent: progress });
    });

    file.url = result.fileUrl;
    file.status = 'finished';

    onFinish();
    const { height, width } = await getImageDimensions(file.url as string);
    file.height = height;
    file.width = width;
    message.success('预览图上传成功');
  } catch (error) {
    onError();
    console.error('预览图上传失败:', error);
    message.error('预览图上传失败');
  }
};

async function handleSave() {
  if (!canSave.value) {
    message.warning('请先上传文件');
    return;
  }

  try {
    console.info('Saving with attractionId:', props.attractionId); // Log attractionId before saving
    const galleries: AttractionGalleryAddReq[] = await Promise.all(
      fileList.value.map(async (file, index) => {
        // const { height, width } = await getImageDimensions(file.url as string);
        return {
          attractionId: props.attractionId,
          fileName: file.name,
          fileType: type.value === 'picture' ? 'PICTURE' : 'VIDEO',
          fileUrl: file.url as string,
          height: file.height,
          mark: '', // 可以添加一个输入框让用户输入标记
          sortNo: index + 1,
          width: file.width,
        };
      }),
    );

    if (type.value === 'video' && previewImageList.value.length > 0) {
      const previewImage = previewImageList.value[0];
      if (galleries[0] && previewImage?.url) {
        (galleries[0] as any).coverUrl = previewImage.url;
      }
    }

    await saveAttractionGallery(galleries);
    message.success('保存成功');
    emit('saveSuccess');
    modalApi.close();
  } catch (error) {
    console.error('保存失败:', error);
    message.error('保存失败');
  }
}

// 获取图片或视频的宽高
function getImageDimensions(
  url: string,
): Promise<{ height: number; width: number }> {
  return new Promise((resolve, reject) => {
    if (type.value === 'picture') {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // 添加这行以解决跨域问题
      img.addEventListener('load', () =>
        resolve({ height: img.height, width: img.width }),
      );
      img.onerror = reject;
      img.src = url;
    } else {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous'; // 添加这行以解决跨域问题
      video.addEventListener('loadedmetadata', () =>
        resolve({ height: video.videoHeight, width: video.videoWidth }),
      );
      video.onerror = reject;
      video.src = url;
    }
  });
}

const openModal = (uploadType: 'picture' | 'video') => {
  console.info('Modal opened with attractionId:', props.attractionId); // Log when modal opens
  type.value = uploadType;
  modalApi.open();
};

const canSave = computed(() => {
  return type.value === 'picture'
    ? fileList.value.length > 0
    : fileList.value.length > 0 && previewImageList.value.length > 0;
});

defineExpose({ openModal });
</script>

<template>
  <Modal>
    <NSpace :size="24" vertical>
      <NRadioGroup v-model:value="type">
        <NRadioButton value="picture">图片</NRadioButton>
        <NRadioButton value="video">视频</NRadioButton>
      </NRadioGroup>

      <NUpload
        ref="uploadRef"
        v-model:file-list="fileList"
        :accept="type === 'picture' ? 'image/*' : 'video/*'"
        :before-upload="beforeUpload"
        :custom-request="handleUpload"
        :max="type === 'picture' ? 10 : 1"
        :multiple="type === 'picture'"
        list-type="image-card"
      >
        <div class="upload-trigger">
          <span class="icon-[mdi--cloud-upload-outline] text-5xl"></span>
          <p>
            {{
              type === 'picture' ? '点击或拖拽上传图片' : '点击或拖拽上传视频'
            }}
          </p>
        </div>
      </NUpload>

      <template v-if="type === 'video'">
        <h3>视频预览图</h3>
        <NUpload
          v-model:file-list="previewImageList"
          :before-upload="beforeUploadPreview"
          :custom-request="handleUploadPreview"
          :max="1"
          :multiple="false"
          accept="image/*"
          list-type="image-card"
        >
          <div class="upload-trigger">
            <span class="icon-[mdi--cloud-upload-outline] text-5xl"></span>
            <p>点击或拖拽上传预览图</p>
          </div>
        </NUpload>
      </template>
    </NSpace>

    <!-- 添加一个插槽来自定义底部按钮 -->
    <template #footer>
      <NButton @click="modalApi.close()">取消</NButton>
      <NButton :disabled="!canSave" type="primary" @click="handleSave">
        确认
      </NButton>
    </template>
  </Modal>
</template>

<style scoped>
.upload-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}
</style>
