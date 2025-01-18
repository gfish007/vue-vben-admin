<script setup lang="ts">
import { ref, watch } from 'vue';

import {
  NButton,
  NCard,
  NCollapse,
  NCollapseItem,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NSwitch,
  NTooltip,
  NUpload,
  type UploadFileInfo,
  useMessage,
} from 'naive-ui';

import { uploadFile } from '#/api/core/file';

import { useLowCodeStore } from '../../../../../store/modules/lowcode';

defineOptions({
  name: 'CarouselProperty',
});

const props = defineProps<{
  component: ComponentInstance;
}>();

const store = useLowCodeStore();
const message = useMessage();

// 事件类型选项
const eventTypeOptions = [
  { label: '跳转页面', value: 'page' },
  { label: '打开弹窗', value: 'modal' },
  { label: '跳转外部链接', value: 'external' },
  { label: '跳转小程序', value: 'miniapp' },
  { label: '跳转公众号', value: 'wechat' },
  { label: '跳转H5', value: 'h5' },
];

// 基础配置
const baseConfig = ref({
  autoplay: props.component?.props?.autoplay ?? true,
  direction: props.component?.props?.direction ?? 'horizontal',
  dotPlacement: props.component?.props?.dotPlacement ?? 'bottom',
  dotType: props.component?.props?.dotType ?? 'dot',
  draggable: props.component?.props?.draggable ?? true,
  effect: props.component?.props?.effect ?? 'slide',
  interval: props.component?.props?.interval ?? 3000,
  keyboard: props.component?.props?.keyboard ?? true,
  mousewheel: props.component?.props?.mousewheel ?? false,
  showArrow: props.component?.props?.showArrow ?? true,
  showDots: props.component?.props?.showDots ?? true,
  transitionStyle: props.component?.props?.transitionStyle ?? 'ease',
  transitionTime: props.component?.props?.transitionTime ?? 300,
  trigger: props.component?.props?.trigger ?? 'click',
});

interface CarouselItem {
  eventType: string;
  fileUrl: string;
  link: string;
}

// 初始化轮播图项配置
const defaultItems = [
  {
    eventType: 'page',
    fileUrl:
      'https://naive-ui.oss-cn-beijing.aliyuncs.com/carousel-img/carousel1.jpeg',
    link: '',
  },
  {
    eventType: 'page',
    fileUrl:
      'https://naive-ui.oss-cn-beijing.aliyuncs.com/carousel-img/carousel2.jpeg',
    link: '',
  },
  {
    eventType: 'page',
    fileUrl:
      'https://naive-ui.oss-cn-beijing.aliyuncs.com/carousel-img/carousel3.jpeg',
    link: '',
  },
];

// 初始化轮播图项
const initializeCarouselItems = () => {
  const items = props.component?.props?.items;
  return items && items.length > 0 ? items : defaultItems;
};

const carouselItems = ref<CarouselItem[]>(initializeCarouselItems());

// 初始化文件列表
const initializeFileList = () => {
  const newFileList: Record<number, UploadFileInfo[]> = {};
  const items = carouselItems.value;

  items.forEach((item, index) => {
    if (item.fileUrl) {
      const fileName =
        item.fileUrl.split('/').pop() || `image-${index + 1}.jpg`;
      newFileList[index] = [
        {
          file: null,
          id: `carousel-${index}`,
          name: fileName,
          status: 'finished',
          thumbnailUrl: item.fileUrl,
          url: item.fileUrl,
        },
      ];
    } else {
      newFileList[index] = [];
    }
  });
  return newFileList;
};

// 初始化文件列表
const itemsFileLists =
  ref<Record<number, UploadFileInfo[]>>(initializeFileList());

// 切换效果选项
const effectOptions = [
  { label: '滑动', value: 'slide' },
  { label: '淡入淡出', value: 'fade' },
  {
    disabled: baseConfig.value.direction === 'vertical',
    label: '卡片式 (仅支持水平方向)',
    value: 'card',
  },
  {
    disabled: true,
    label: '3D效果 (暂不支持)',
    value: '3d',
  },
  {
    disabled: true,
    label: '缩放 (暂不支持)',
    value: 'zoom',
  },
];

// 监听方向变化，更新效果选项
watch(
  () => baseConfig.value.direction,
  (newDirection) => {
    if (newDirection === 'vertical' && baseConfig.value.effect === 'card') {
      baseConfig.value.effect = 'slide';
      message.warning('卡片式效果仅支持水平方向，已切换为滑动效果');
    }
  },
);

// 监听组件变化
watch(
  () => props.component,
  (newComponent) => {
    if (newComponent) {
      // 更新基础配置
      baseConfig.value = {
        autoplay: newComponent.props?.autoplay ?? true,
        direction: newComponent.props?.direction ?? 'horizontal',
        dotPlacement: newComponent.props?.dotPlacement ?? 'bottom',
        dotType: newComponent.props?.dotType ?? 'dot',
        draggable: newComponent.props?.draggable ?? true,
        effect: newComponent.props?.effect ?? 'slide',
        interval: newComponent.props?.interval ?? 3000,
        keyboard: newComponent.props?.keyboard ?? true,
        mousewheel: newComponent.props?.mousewheel ?? false,
        showArrow: newComponent.props?.showArrow ?? true,
        showDots: newComponent.props?.showDots ?? true,
        transitionStyle: newComponent.props?.transitionStyle ?? 'ease',
        transitionTime: newComponent.props?.transitionTime ?? 300,
        trigger: newComponent.props?.trigger ?? 'click',
      };

      // 更新轮播图项
      carouselItems.value = initializeCarouselItems();

      // 重新初始化文件列表
      itemsFileLists.value = initializeFileList();
    }
  },
  { deep: true, immediate: true },
);

// 更新组件属性
const updateProps = () => {
  store.updateComponent(props.component.componentInstanceId, {
    props: {
      ...baseConfig.value,
      items: carouselItems.value,
    },
  });
};

// 处理基础配置更新
const handleBaseConfigUpdate = (field: string, value: unknown) => {
  baseConfig.value[field] = value;
  updateProps();
};

// 处理轮播图项更新
const handleCarouselItemUpdate = (
  index: number,
  field: string,
  value: unknown,
) => {
  if (carouselItems.value[index]) {
    carouselItems.value[index] = {
      ...carouselItems.value[index],
      [field]: value,
    };
    updateProps();
  }
};

// 处理图片上传
const handleFileUpload = async (
  index: number,
  options: { file: UploadFileInfo },
) => {
  const { file } = options;
  if (file.file) {
    try {
      const formData = new FormData();
      formData.append('file', file.file);
      const result = await uploadFile(formData);

      if (carouselItems.value[index]) {
        carouselItems.value[index] = {
          ...carouselItems.value[index],
          fileUrl: result.fileUrl,
        };

        // 更新文件列表
        itemsFileLists.value[index] = [
          {
            id: `carousel-${index}`,
            name: file.file.name,
            status: 'finished',
            thumbnailUrl: result.fileUrl,
            url: result.fileUrl,
          },
        ];

        message.success('上传成功');
        updateProps();
      }
    } catch {
      message.error('上传失败');
    }
  }
};

// 处理图片删除
const handleUploadChange = (
  index: number,
  options: { fileList: UploadFileInfo[] },
) => {
  if (options.fileList.length === 0 && carouselItems.value[index]) {
    carouselItems.value[index] = {
      ...carouselItems.value[index],
      fileUrl: '',
    };
    itemsFileLists.value[index] = [];
    updateProps();
  }
};

// 添加轮播图项
const addCarouselItem = () => {
  carouselItems.value.push({
    eventType: 'page',
    fileUrl: '',
    link: '',
  });
  updateProps();
};

// 删除轮播图项
const removeCarouselItem = (index: number) => {
  // 创建新数组以确保响应性
  const newItems = [...carouselItems.value];
  newItems.splice(index, 1);
  carouselItems.value = newItems;

  // 重新初始化文件列表
  itemsFileLists.value = initializeFileList();

  // 立即更新组件
  updateProps();
};
</script>

<template>
  <NSpace vertical>
    <!-- 基础配置 -->
    <NCard :bordered="false" title="基础配置">
      <NForm class="carousel-form" label-placement="left" label-width="100">
        <NFormItem label="自动播放">
          <div class="form-content">
            <NSwitch
              :value="baseConfig.autoplay"
              @update:value="(val) => handleBaseConfigUpdate('autoplay', val)"
            />
          </div>
        </NFormItem>
        <NFormItem label="播放间隔">
          <div class="form-content">
            <NInputNumber
              :max="10000"
              :min="1000"
              :step="500"
              :value="baseConfig.interval"
              @update:value="(val) => handleBaseConfigUpdate('interval', val)"
            />
          </div>
        </NFormItem>
        <NFormItem label="切换效果">
          <div class="form-content">
            <NSelect
              :options="effectOptions"
              :value="baseConfig.effect"
              @update:value="(val) => handleBaseConfigUpdate('effect', val)"
            />
          </div>
        </NFormItem>
        <NFormItem label="过渡动画">
          <div class="form-content">
            <div class="select-with-tooltip">
              <NSelect
                :options="[
                  { label: '线性', value: 'linear' },
                  { label: '平滑', value: 'ease' },
                  { label: '加速', value: 'ease-in' },
                  { label: '减速', value: 'ease-out' },
                  { label: '加速后减速', value: 'ease-in-out' },
                ]"
                :value="baseConfig.transitionStyle"
                @update:value="
                  (val) => handleBaseConfigUpdate('transitionStyle', val)
                "
              />
              <NTooltip trigger="hover">
                <template #trigger>
                  <div class="info-icon">i</div>
                </template>
                过渡动画在卡片式效果下可能不会完全生效
              </NTooltip>
            </div>
          </div>
        </NFormItem>
        <NFormItem label="动画时长">
          <div class="form-content">
            <NInputNumber
              :max="1000"
              :min="100"
              :step="100"
              :value="baseConfig.transitionTime"
              @update:value="
                (val) => handleBaseConfigUpdate('transitionTime', val)
              "
            />
          </div>
        </NFormItem>
        <NFormItem label="指示器位置">
          <div class="form-content">
            <NSelect
              :options="[
                { label: '顶部', value: 'top' },
                { label: '底部', value: 'bottom' },
                { label: '左侧', value: 'left' },
                { label: '右侧', value: 'right' },
              ]"
              :value="baseConfig.dotPlacement"
              @update:value="
                (val) => handleBaseConfigUpdate('dotPlacement', val)
              "
            />
          </div>
        </NFormItem>
        <NFormItem label="指示器类型">
          <div class="form-content">
            <NSelect
              :options="[
                { label: '圆点', value: 'dot' },
                { label: '线条', value: 'line' },
                { label: '方块', value: 'square' },
              ]"
              :value="baseConfig.dotType"
              @update:value="(val) => handleBaseConfigUpdate('dotType', val)"
            />
          </div>
        </NFormItem>
        <NFormItem label="切换方向">
          <div class="form-content">
            <div class="select-with-tooltip">
              <NSelect
                :options="[
                  { label: '水平', value: 'horizontal' },
                  { label: '垂直', value: 'vertical' },
                ]"
                :value="baseConfig.direction"
                @update:value="
                  (val) => handleBaseConfigUpdate('direction', val)
                "
              />
              <NTooltip trigger="hover">
                <template #trigger>
                  <div class="info-icon">i</div>
                </template>
                垂直方向不支持卡片式效果
              </NTooltip>
            </div>
          </div>
        </NFormItem>
        <NFormItem label="触发方式">
          <div class="form-content">
            <NSelect
              :options="[
                { label: '点击', value: 'click' },
                { label: '悬停', value: 'hover' },
              ]"
              :value="baseConfig.trigger"
              @update:value="(val) => handleBaseConfigUpdate('trigger', val)"
            />
          </div>
        </NFormItem>
        <NFormItem label="显示箭头">
          <div class="form-content">
            <NSwitch
              :value="baseConfig.showArrow"
              @update:value="(val) => handleBaseConfigUpdate('showArrow', val)"
            />
          </div>
        </NFormItem>
        <NFormItem label="显示指示器">
          <div class="form-content">
            <NSwitch
              :value="baseConfig.showDots"
              @update:value="(val) => handleBaseConfigUpdate('showDots', val)"
            />
          </div>
        </NFormItem>
        <NFormItem label="允许拖动">
          <div class="form-content">
            <NSwitch
              :value="baseConfig.draggable"
              @update:value="(val) => handleBaseConfigUpdate('draggable', val)"
            />
          </div>
        </NFormItem>
        <NFormItem label="键盘控制">
          <div class="form-content">
            <NSwitch
              :value="baseConfig.keyboard"
              @update:value="(val) => handleBaseConfigUpdate('keyboard', val)"
            />
          </div>
        </NFormItem>
        <NFormItem label="鼠标滚轮">
          <div class="form-content">
            <NSwitch
              :value="baseConfig.mousewheel"
              @update:value="(val) => handleBaseConfigUpdate('mousewheel', val)"
            />
          </div>
        </NFormItem>
      </NForm>
    </NCard>

    <!-- 轮播图项配置 -->
    <NCard :bordered="false" title="轮播图配置">
      <template #header-extra>
        <NButton type="primary" @click="addCarouselItem"> 添加轮播图 </NButton>
      </template>

      <NCollapse>
        <NCollapseItem
          v-for="(item, index) in carouselItems"
          :key="index"
          :title="`轮播图${index + 1}`"
        >
          <template #header-extra>
            <NButton
              size="small"
              type="error"
              @click.stop="removeCarouselItem(index)"
            >
              删除
            </NButton>
          </template>

          <NForm class="carousel-form" label-placement="left" label-width="100">
            <NFormItem label="图片">
              <div class="form-content">
                <NUpload
                  v-model:file-list="itemsFileLists[index]"
                  :custom-request="
                    (options) => handleFileUpload(index, options)
                  "
                  :max="1"
                  list-type="image-card"
                  @change="(options) => handleUploadChange(index, options)"
                >
                  {{ item.fileUrl ? '更换图片' : '上传图片' }}
                </NUpload>
              </div>
            </NFormItem>
            <NFormItem label="事件类型">
              <div class="form-content">
                <NSelect
                  :options="eventTypeOptions"
                  :value="item.eventType"
                  placeholder="请选择事件类型"
                  @update:value="
                    (val) => handleCarouselItemUpdate(index, 'eventType', val)
                  "
                />
              </div>
            </NFormItem>
            <NFormItem label="跳转链接">
              <div class="form-content">
                <NInput
                  :disabled="item.eventType === 'none'"
                  :value="item.link"
                  placeholder="请输入跳转链接"
                  @update:value="
                    (val) => handleCarouselItemUpdate(index, 'link', val)
                  "
                />
              </div>
            </NFormItem>
          </NForm>
        </NCollapseItem>
      </NCollapse>
    </NCard>
  </NSpace>
</template>

<style scoped>
.n-card {
  margin-bottom: 16px;
}

.n-collapse-item {
  margin-bottom: 8px;
}

.carousel-form {
  width: 100%;
  max-width: 600px;
}

.form-content {
  width: 100%;
  max-width: 400px;
}

.form-content :deep(.n-select) {
  width: 100%;
}

.form-content :deep(.n-input) {
  width: 100%;
}

.form-content :deep(.n-input-number) {
  width: 100%;
}

.select-with-tooltip {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.select-with-tooltip .n-select {
  flex: 1;
}

.info-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 12px;
  color: #666;
  cursor: help;
  background-color: #eee;
  border-radius: 50%;
}
</style>
