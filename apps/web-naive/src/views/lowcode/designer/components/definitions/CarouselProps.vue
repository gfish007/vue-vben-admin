<!-- 轮播图属性配置面板 -->
<template>
  <n-tabs type="line" animated>
    <!-- 基础属性配置 -->
    <n-tab-pane name="basic" tab="属性">
      <n-form
        :model="modelValue"
        label-placement="left"
        label-width="100"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="自动播放">
          <n-switch v-model:value="modelValue.autoplay" />
        </n-form-item>
        <n-form-item label="播放间隔">
          <n-input-number
            v-model:value="modelValue.interval"
            :min="1000"
            :max="10000"
            :step="500"
          />
        </n-form-item>
        <n-form-item label="切换效果">
          <n-select
            v-model:value="modelValue.effect"
            :options="[
              { label: '滑动', value: 'slide' },
              { label: '淡入淡出', value: 'fade' },
              { label: '卡片', value: 'card' },
            ]"
          />
        </n-form-item>
        <n-form-item label="指示器类型">
          <n-select
            v-model:value="modelValue.dotType"
            :options="[
              { label: '点', value: 'dot' },
              { label: '线', value: 'line' },
            ]"
          />
        </n-form-item>
        <n-form-item label="指示器位置">
          <n-select
            v-model:value="modelValue.dotPlacement"
            :options="[
              { label: '上', value: 'top' },
              { label: '下', value: 'bottom' },
              { label: '左', value: 'left' },
              { label: '右', value: 'right' },
            ]"
          />
        </n-form-item>
        <n-form-item label="箭头显示">
          <n-select
            v-model:value="modelValue.showArrow"
            :options="[
              { label: '从不', value: 'never' },
              { label: '总是', value: 'always' },
              { label: '悬停', value: 'hover' },
            ]"
          />
        </n-form-item>
      </n-form>
    </n-tab-pane>

    <!-- 样式配置 -->
    <n-tab-pane name="style" tab="样式">
      <n-form
        :model="modelValue.style"
        label-placement="left"
        label-width="100"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="宽度">
          <n-input v-model:value="modelValue.style.width" />
        </n-form-item>
        <n-form-item label="高度">
          <n-input v-model:value="modelValue.style.height" default-value="240px" />
        </n-form-item>
      </n-form>
    </n-tab-pane>

    <!-- 图片管理 -->
    <n-tab-pane name="images" tab="图片管理">
      <n-collapse>
        <!-- 图片1配置 -->
        <n-collapse-item title="图片1" name="image1">
          <n-form
            :model="modelValue.image1"
            label-placement="left"
            label-width="100"
            require-mark-placement="right-hanging"
          >
            <n-form-item label="图片">
              <n-upload
                v-model:file-list="image1Files"
                :max="1"
                :accept="'image/*'"
                @change="handleImage1Upload"
              >
                <n-button>上传图片</n-button>
              </n-upload>
            </n-form-item>
            <n-form-item label="标题">
              <n-input v-model:value="modelValue.image1.title" />
            </n-form-item>
            <n-form-item label="描述">
              <n-input v-model:value="modelValue.image1.description" type="textarea" />
            </n-form-item>
            <n-form-item label="跳转类型">
              <n-select
                v-model:value="modelValue.image1.linkType"
                :options="[
                  { label: '无跳转', value: 'none' },
                  { label: '内部页面', value: 'internal' },
                  { label: '外部链接', value: 'external' },
                ]"
              />
            </n-form-item>
            <template v-if="modelValue.image1.linkType !== 'none'">
              <n-form-item label="跳转地址">
                <n-input v-model:value="modelValue.image1.link" />
              </n-form-item>
              <n-form-item label="打开方式">
                <n-select
                  v-model:value="modelValue.image1.target"
                  :options="[
                    { label: '当前窗口', value: '_self' },
                    { label: '新窗口', value: '_blank' },
                  ]"
                />
              </n-form-item>
            </template>
          </n-form>
        </n-collapse-item>

        <!-- 图片2配置 -->
        <n-collapse-item title="图片2" name="image2">
          <n-form
            :model="modelValue.image2"
            label-placement="left"
            label-width="100"
            require-mark-placement="right-hanging"
          >
            <n-form-item label="图片">
              <n-upload
                v-model:file-list="image2Files"
                :max="1"
                :accept="'image/*'"
                @change="handleImage2Upload"
              >
                <n-button>上传图片</n-button>
              </n-upload>
            </n-form-item>
            <n-form-item label="标题">
              <n-input v-model:value="modelValue.image2.title" />
            </n-form-item>
            <n-form-item label="描述">
              <n-input v-model:value="modelValue.image2.description" type="textarea" />
            </n-form-item>
            <n-form-item label="跳转类型">
              <n-select
                v-model:value="modelValue.image2.linkType"
                :options="[
                  { label: '无跳转', value: 'none' },
                  { label: '内部页面', value: 'internal' },
                  { label: '外部链接', value: 'external' },
                ]"
              />
            </n-form-item>
            <template v-if="modelValue.image2.linkType !== 'none'">
              <n-form-item label="跳转地址">
                <n-input v-model:value="modelValue.image2.link" />
              </n-form-item>
              <n-form-item label="打开方式">
                <n-select
                  v-model:value="modelValue.image2.target"
                  :options="[
                    { label: '当前窗口', value: '_self' },
                    { label: '新窗口', value: '_blank' },
                  ]"
                />
              </n-form-item>
            </template>
          </n-form>
        </n-collapse-item>

        <!-- 图片3配置 -->
        <n-collapse-item title="图片3" name="image3">
          <n-form
            :model="modelValue.image3"
            label-placement="left"
            label-width="100"
            require-mark-placement="right-hanging"
          >
            <n-form-item label="图片">
              <n-upload
                v-model:file-list="image3Files"
                :max="1"
                :accept="'image/*'"
                @change="handleImage3Upload"
              >
                <n-button>上传图片</n-button>
              </n-upload>
            </n-form-item>
            <n-form-item label="标题">
              <n-input v-model:value="modelValue.image3.title" />
            </n-form-item>
            <n-form-item label="描述">
              <n-input v-model:value="modelValue.image3.description" type="textarea" />
            </n-form-item>
            <n-form-item label="跳转类型">
              <n-select
                v-model:value="modelValue.image3.linkType"
                :options="[
                  { label: '无跳转', value: 'none' },
                  { label: '内部页面', value: 'internal' },
                  { label: '外部链接', value: 'external' },
                ]"
              />
            </n-form-item>
            <template v-if="modelValue.image3.linkType !== 'none'">
              <n-form-item label="跳转地址">
                <n-input v-model:value="modelValue.image3.link" />
              </n-form-item>
              <n-form-item label="打开方式">
                <n-select
                  v-model:value="modelValue.image3.target"
                  :options="[
                    { label: '当前窗口', value: '_self' },
                    { label: '新窗口', value: '_blank' },
                  ]"
                />
              </n-form-item>
            </template>
          </n-form>
        </n-collapse-item>
      </n-collapse>
    </n-tab-pane>
  </n-tabs>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import type { UploadFileInfo } from 'naive-ui';
import {
  NTabs,
  NTabPane,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
  NUpload,
  NButton,
  NCollapse,
  NCollapseItem,
} from 'naive-ui';

const props = defineProps<{
  modelValue: {
    autoplay: boolean;
    interval: number;
    effect: string;
    dotType: string;
    dotPlacement: string;
    showArrow: string;
    style: {
      width: string;
      height: string;
    };
    image1: {
      url: string;
      title: string;
      description: string;
      linkType: string;
      link: string;
      target: string;
    };
    image2: {
      url: string;
      title: string;
      description: string;
      linkType: string;
      link: string;
      target: string;
    };
    image3: {
      url: string;
      title: string;
      description: string;
      linkType: string;
      link: string;
      target: string;
    };
  };
}>();

const emit = defineEmits(['update:modelValue']);

// 图片上传相关
const image1Files = ref<UploadFileInfo[]>([]);
const image2Files = ref<UploadFileInfo[]>([]);
const image3Files = ref<UploadFileInfo[]>([]);

// 监听图片文件列表变化，更新预览图
watch([image1Files, image2Files, image3Files], ([files1, files2, files3]) => {
  const newValue = { ...props.modelValue };
  
  // 更新图片1
  if (files1.length > 0 && files1[0].file) {
    newValue.image1.url = URL.createObjectURL(files1[0].file);
  }
  
  // 更新图片2
  if (files2.length > 0 && files2[0].file) {
    newValue.image2.url = URL.createObjectURL(files2[0].file);
  }
  
  // 更新图片3
  if (files3.length > 0 && files3[0].file) {
    newValue.image3.url = URL.createObjectURL(files3[0].file);
  }
  
  emit('update:modelValue', newValue);
});

// 处理图片上传
const handleImage1Upload = (options: { file: UploadFileInfo, fileList: UploadFileInfo[] }) => {
  if (options.file.status === 'finished' && options.file.file) {
    const newValue = { ...props.modelValue };
    newValue.image1.url = URL.createObjectURL(options.file.file);
    emit('update:modelValue', newValue);
  }
};

const handleImage2Upload = (options: { file: UploadFileInfo, fileList: UploadFileInfo[] }) => {
  if (options.file.status === 'finished' && options.file.file) {
    const newValue = { ...props.modelValue };
    newValue.image2.url = URL.createObjectURL(options.file.file);
    emit('update:modelValue', newValue);
  }
};

const handleImage3Upload = (options: { file: UploadFileInfo, fileList: UploadFileInfo[] }) => {
  if (options.file.status === 'finished' && options.file.file) {
    const newValue = { ...props.modelValue };
    newValue.image3.url = URL.createObjectURL(options.file.file);
    emit('update:modelValue', newValue);
  }
};
</script>

<style scoped>
.n-form {
  padding: 16px;
}
.n-collapse-item {
  margin-bottom: 16px;
}
</style> 
