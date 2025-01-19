<script setup lang="ts" name="RecommendData">
import type {
  ComponentInstance,
  DataBinding,
} from '../../../../../types/lowcode';
import type { RecommendItem } from './Recommend';

import { computed, nextTick, ref, watch } from 'vue';

import {
  NAutoComplete,
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NPopconfirm,
  NRadio,
  NRadioGroup,
  NSelect,
  NSpace,
  NUpload,
  type UploadFileInfo,
  useMessage,
} from 'naive-ui';

import { uploadFile } from '#/api/core/file';

import { useLowCodeStore } from '../../../../../store/modules/lowcode';

const props = defineProps<{
  component: ComponentInstance;
}>();

const store = useLowCodeStore();
const message = useMessage();

// 数据模式
const bindingMode = ref<'dynamic' | 'static'>(
  props.component?.dataBinding ? 'dynamic' : 'static',
);

// 静态数据项
const staticItems = ref<RecommendItem[]>(props.component?.props?.items || []);

// 字段绑定配置
interface FieldBinding {
  dsCode: string;
  path: string;
  field: string;
  defaultValue: any;
  required: boolean;
  pathOptions?: { label: string; value: string }[];
}

const fieldBindings = ref<FieldBinding[]>([]);
const previewData = ref<Record<string, any>>({});
const previewError = ref<string>('');
const loading = ref(false);

// 初始化文件列表
const initializeFileList = () => {
  const newFileList: Record<number, UploadFileInfo[]> = {};
  const items = staticItems.value;

  items.forEach((item, index) => {
    if (item.image) {
      const fileName = item.image.split('/').pop() || `image-${index + 1}.jpg`;
      newFileList[index] = [
        {
          file: null,
          id: `recommend-${index}`,
          name: fileName,
          status: 'finished',
          thumbnailUrl: item.image,
          url: item.image,
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

// 更新预览数据
const updatePreview = async () => {
  if (bindingMode.value === 'static') {
    previewData.value = staticItems.value;
    return;
  }

  if (fieldBindings.value.length === 0) {
    previewError.value = '请配置字段绑定';
    return;
  }

  loading.value = true;
  previewError.value = '';

  try {
    const firstBinding = fieldBindings.value[0];
    if (!firstBinding) {
      previewError.value = '未找到字段绑定';
      return;
    }

    const dataSource = store.currentPage?.dataSources?.find(
      (ds) => ds.dsCode === firstBinding.dsCode,
    );

    if (!dataSource) {
      previewError.value = '未找到数据源';
      return;
    }

    let dsData;
    if (dataSource.dsType === 'STATIC') {
      dsData =
        typeof dataSource.config.staticData === 'string'
          ? JSON.parse(dataSource.config.staticData || '{}')
          : dataSource.config.staticData;
    } else {
      dsData = await store.getDataSourceData(firstBinding.dsCode);
    }

    if (dsData) {
      const path = firstBinding.path.split('.');
      let value = dsData;

      for (const key of path) {
        if (value && typeof value === 'object') {
          value = value[key];
        } else {
          value = undefined;
          break;
        }
      }

      if (Array.isArray(value)) {
        previewData.value = value;
      } else {
        previewError.value = '数据格式不正确，应为数组';
      }
    } else {
      previewError.value = '未获取到数据';
    }
  } catch {
    previewError.value = '预览失败';
  } finally {
    loading.value = false;
  }
};

// 初始化字段绑定
const initFieldBindings = () => {
  const bindings = props.component?.dataBinding?.bindings || [];
  fieldBindings.value = bindings.map((binding: any) => ({
    defaultValue: binding.defaultValue || '',
    dsCode: binding.dsCode || '',
    field: binding.field || '',
    path: binding.path || '',
    required: true,
  }));
  updatePreview();
};

// 监听组件变化
watch(
  () => props.component,
  (newComponent) => {
    if (newComponent) {
      // 初始化字段绑定
      initFieldBindings();
      // 更新静态数据
      const newItems = newComponent.props?.items || [];
      if (JSON.stringify(staticItems.value) !== JSON.stringify(newItems)) {
        staticItems.value = newItems;
        // 重新初始化文件列表
        itemsFileLists.value = initializeFileList();
      }
    }
  },
  { immediate: true },
);

// 计算数据源选项
const dataSourceOptions = computed(() => {
  const pageSources = store.currentPage?.dataSources || [];
  return pageSources.map((ds) => ({
    label: `${ds.dsName} (${ds.dsCode})`,
    value: ds.dsCode,
  }));
});

// 智能路径提示
const getPathSuggestions = async (dsCode: string) => {
  if (!dsCode) return [];

  try {
    const dataSource = store.currentPage?.dataSources?.find(
      (ds) => ds.dsCode === dsCode,
    );

    if (!dataSource) return [];

    let dsData;
    if (dataSource.dsType === 'STATIC') {
      dsData =
        typeof dataSource.config.staticData === 'string'
          ? JSON.parse(dataSource.config.staticData || '{}')
          : dataSource.config.staticData;
    } else {
      dsData = await store.getDataSourceData(dsCode);
    }

    if (dsData) {
      const paths: string[] = [];
      const traverse = (obj: any, path: string[] = []) => {
        if (Array.isArray(obj)) {
          if (obj.length > 0) {
            traverse(obj[0], path);
          }
        } else if (obj && typeof obj === 'object') {
          Object.keys(obj).forEach((key) => {
            const newPath = [...path, key];
            paths.push(newPath.join('.'));
            traverse(obj[key], newPath);
          });
        }
      };

      traverse(dsData);
      return paths.map((p) => ({ label: p, value: p }));
    }

    return [];
  } catch {
    return [];
  }
};

// 更新数据绑定
const updateDataBinding = () => {
  if (bindingMode.value === 'static') {
    console.log('更新组件前的数据:', JSON.stringify(staticItems.value));
    store.updateComponent(props.component.componentInstanceId, {
      dataBinding: null,
      props: {
        ...props.component.props,
        items: staticItems.value,
      },
    });
    console.log('已调用更新组件');
    return;
  }

  const firstBinding = fieldBindings.value[0];
  if (!firstBinding?.dsCode || !firstBinding?.path) return;

  const dataBinding: DataBinding = {
    dsCode: firstBinding.dsCode,
    path: firstBinding.path,
  };

  store.updateComponent(props.component.componentInstanceId, {
    dataBinding,
    props: {
      ...props.component.props,
      items: [], // 清除静态数据
    },
  });
};

// 处理模式切换
const handleModeChange = (mode: 'dynamic' | 'static') => {
  bindingMode.value = mode;

  if (mode === 'static') {
    fieldBindings.value = [];
    store.updateComponent(props.component.componentInstanceId, {
      dataBinding: null,
      props: {
        ...props.component.props,
        items: staticItems.value,
      },
    });
  } else {
    if (props.component.dataBinding) {
      initFieldBindings();
    } else {
      fieldBindings.value = [
        {
          defaultValue: [],
          dsCode: '',
          field: 'items',
          path: '',
          required: true,
        },
      ];
    }
  }
};

// 添加静态数据项
const addStaticItem = () => {
  staticItems.value.push({
    badge: {
      text: 'NEW',
      type: 'primary',
    },
    id: String(Date.now()),
    image: '',
    link: {
      type: 'none',
      value: '',
    },
    price: {
      current: 0,
      prefix: '¥',
    },
    title: '新商品',
  });
  updateDataBinding();
};

// 删除静态数据项
const removeStaticItem = (index: number) => {
  staticItems.value.splice(index, 1);
  updateDataBinding();
};

// 更新静态数据项
const updateStaticItem = (index: number, field: string, value: any) => {
  if (staticItems.value[index]) {
    console.log('更新前的数据:', JSON.stringify(staticItems.value[index]));
    // 创建新的对象以触发响应式更新
    const updatedItem = { ...staticItems.value[index] };
    const paths = field.split('.');
    let target = updatedItem;

    // 遍历路径直到倒数第二层
    for (let i = 0; i < paths.length - 1; i++) {
      const key = paths[i];
      if (!target[key]) {
        target[key] = {};
      }
      target = target[key];
    }

    // 设置最后一层的值
    const lastKey = paths[paths.length - 1];
    target[lastKey] = value;

    console.log('更新后的数据:', JSON.stringify(updatedItem));

    // 更新数组
    staticItems.value = [
      ...staticItems.value.slice(0, index),
      updatedItem,
      ...staticItems.value.slice(index + 1),
    ];

    console.log('更新后的完整数组:', JSON.stringify(staticItems.value));

    // 更新组件状态
    updateDataBinding();
  }
};

// 处理图片上传
const handleImageUpload = async (
  index: number,
  options: { file: UploadFileInfo },
) => {
  const { file } = options;
  console.log('uploadFile');
  if (file.file) {
    try {
      const formData = new FormData();
      formData.append('file', file.file);
      const result = await uploadFile(formData);

      if (staticItems.value[index]) {
        // 使用 updateStaticItem 来更新图片
        updateStaticItem(index, 'image', result.fileUrl);

        // 更新文件列表
        itemsFileLists.value[index] = [
          {
            id: `recommend-${index}`,
            name: file.file.name,
            status: 'finished',
            thumbnailUrl: result.fileUrl,
            url: result.fileUrl,
          },
        ];

        message.success('上传成功');
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
  if (options.fileList.length === 0 && staticItems.value[index]) {
    // 使用 updateStaticItem 来更新图片
    updateStaticItem(index, 'image', '');
    // 更新文件列表
    itemsFileLists.value[index] = [];
  }
};

// 监听字段绑定变化
watch(
  fieldBindings,
  () => {
    updatePreview();
    nextTick(() => {
      updateDataBinding();
    });
  },
  { deep: true },
);

// 监听数据源变化
watch(
  () => store.currentPage?.dataSources,
  () => {
    updatePreview();
  },
  { deep: true },
);

// 监听组件变化，初始化字段绑定
watch(
  () => props.component?.props?.items,
  (newItems) => {
    if (newItems) {
      // 只在items真正变化时更新
      const currentItems = JSON.stringify(staticItems.value);
      const newItemsStr = JSON.stringify(newItems);

      if (currentItems !== newItemsStr) {
        staticItems.value = newItems;
        itemsFileLists.value = initializeFileList();
      }
    }
  },
  { deep: true },
);

// 监听静态数据变化，更新组件
watch(
  staticItems,
  () => {
    if (bindingMode.value === 'static') {
      updateDataBinding();
    }
  },
  { deep: true },
);
</script>

<template>
  <NForm label-placement="left" label-width="100">
    <NSpace vertical>
      <!-- 数据模式选择 -->
      <NCard size="small" title="数据模式">
        <NFormItem>
          <NRadioGroup :value="bindingMode" @update:value="handleModeChange">
            <NRadio value="static">静态数据</NRadio>
            <NRadio value="dynamic">动态数据</NRadio>
          </NRadioGroup>
        </NFormItem>
      </NCard>

      <!-- 静态数据配置 -->
      <template v-if="bindingMode === 'static'">
        <NCard size="small" title="静态数据">
          <NSpace vertical>
            <!-- 数据项列表 -->
            <div
              v-for="(item, index) in staticItems"
              :key="item.id"
              class="item-card"
            >
              <NCard :title="`商品 ${index + 1}`" size="small">
                <template #header-extra>
                  <NPopconfirm
                    negative-text="取消"
                    positive-text="确定"
                    @positive-click="() => removeStaticItem(index)"
                  >
                    <template #trigger>
                      <NButton text type="error">删除</NButton>
                    </template>
                    确定要删除这个商品吗？
                  </NPopconfirm>
                </template>

                <NSpace vertical>
                  <!-- 基本信息 -->
                  <NFormItem label="标题">
                    <NInput
                      :value="item.title"
                      @update:value="
                        (val) => updateStaticItem(index, 'title', val)
                      "
                    />
                  </NFormItem>
                  <NFormItem label="副标题">
                    <NInput
                      :value="item.subtitle"
                      @update:value="
                        (val) => updateStaticItem(index, 'subtitle', val)
                      "
                    />
                  </NFormItem>

                  <!-- 图片上传 -->
                  <NFormItem label="主图">
                    <NUpload
                      v-model:file-list="itemsFileLists[index]"
                      :custom-request="
                        (options) => handleImageUpload(index, options)
                      "
                      :max="1"
                      list-type="image-card"
                      @change="(options) => handleUploadChange(index, options)"
                    >
                      {{ item.image ? '更换图片' : '上传图片' }}
                    </NUpload>
                  </NFormItem>

                  <!-- 价格信息 -->
                  <NFormItem label="当前价格">
                    <NInputNumber
                      :min="0"
                      :precision="2"
                      :value="item.price?.current"
                      @update:value="
                        (val) => updateStaticItem(index, 'price.current', val)
                      "
                    />
                  </NFormItem>
                  <NFormItem label="原价">
                    <NInputNumber
                      :min="0"
                      :precision="2"
                      :value="item.price?.original"
                      @update:value="
                        (val) => updateStaticItem(index, 'price.original', val)
                      "
                    />
                  </NFormItem>

                  <!-- 链接配置 -->
                  <NFormItem label="链接类型">
                    <NSelect
                      :options="[
                        { label: '无', value: 'none' },
                        { label: '页面', value: 'page' },
                        { label: '外链', value: 'url' },
                      ]"
                      :value="item.link.type"
                      @update:value="
                        (val) => updateStaticItem(index, 'link.type', val)
                      "
                    />
                  </NFormItem>
                  <NFormItem v-if="item.link.type !== 'none'" label="链接值">
                    <NInput
                      :value="item.link.value"
                      @update:value="
                        (val) => updateStaticItem(index, 'link.value', val)
                      "
                    />
                  </NFormItem>

                  <!-- 徽标配置 -->
                  <NFormItem label="徽标文本">
                    <NInput
                      :value="item.badge?.text"
                      @update:value="
                        (val) => updateStaticItem(index, 'badge.text', val)
                      "
                    />
                  </NFormItem>
                  <NFormItem label="徽标类型">
                    <NSelect
                      :options="[
                        { label: '主要', value: 'primary' },
                        { label: '成功', value: 'success' },
                        { label: '警告', value: 'warning' },
                        { label: '错误', value: 'error' },
                      ]"
                      :value="item.badge?.type"
                      @update:value="
                        (val) => updateStaticItem(index, 'badge.type', val)
                      "
                    />
                  </NFormItem>

                  <!-- 统计数据 -->
                  <NFormItem label="销量">
                    <NInputNumber
                      :min="0"
                      :value="item.statistics?.sales"
                      @update:value="
                        (val) =>
                          updateStaticItem(index, 'statistics.sales', val)
                      "
                    />
                  </NFormItem>
                  <NFormItem label="浏览量">
                    <NInputNumber
                      :min="0"
                      :value="item.statistics?.views"
                      @update:value="
                        (val) =>
                          updateStaticItem(index, 'statistics.views', val)
                      "
                    />
                  </NFormItem>
                  <NFormItem label="点赞数">
                    <NInputNumber
                      :min="0"
                      :value="item.statistics?.likes"
                      @update:value="
                        (val) =>
                          updateStaticItem(index, 'statistics.likes', val)
                      "
                    />
                  </NFormItem>
                </NSpace>
              </NCard>
            </div>

            <!-- 添加按钮 -->
            <NButton type="primary" @click="addStaticItem">添加商品</NButton>
          </NSpace>
        </NCard>
      </template>

      <!-- 动态数据配置 -->
      <template v-else>
        <NCard size="small" title="数据绑定">
          <NSpace vertical>
            <NFormItem label="数据源">
              <NSelect
                :options="dataSourceOptions"
                :value="fieldBindings[0]?.dsCode"
                @update:value="
                  (val) => {
                    if (fieldBindings[0]) {
                      fieldBindings[0].dsCode = val;
                      fieldBindings[0].path = '';
                    }
                  }
                "
              />
            </NFormItem>
            <NFormItem label="数据路径">
              <NAutoComplete
                :options="
                  fieldBindings[0]?.dsCode
                    ? getPathSuggestions(fieldBindings[0].dsCode)
                    : []
                "
                :value="fieldBindings[0]?.path"
                placeholder="输入路径或选择提示"
                @update:value="
                  (val) => {
                    if (fieldBindings[0]) {
                      fieldBindings[0].path = val;
                    }
                  }
                "
              />
            </NFormItem>
          </NSpace>
        </NCard>

        <!-- 预览区域 -->
        <NCard size="small" title="数据预览">
          <div v-if="loading">加载中...</div>
          <div v-else-if="previewError" style="color: #ff4d4f">
            {{ previewError }}
          </div>
          <div v-else>
            <pre>{{ JSON.stringify(previewData, null, 2) }}</pre>
          </div>
        </NCard>
      </template>
    </NSpace>
  </NForm>
</template>

<style scoped>
.item-card {
  margin-bottom: 16px;
}
</style>
