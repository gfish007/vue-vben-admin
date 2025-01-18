<script setup lang="ts" name="QuickNavData">
import type { QuickNavItem } from './QuickNav';

import type { ComponentInstance } from '#/types/lowcode';

import { computed, ref } from 'vue';

import {
  NButton,
  NCard,
  NCollapse,
  NCollapseItem,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NRadio,
  NRadioGroup,
  NSelect,
  NSpace,
  NSwitch,
  NUpload,
  type UploadFileInfo,
  useMessage,
} from 'naive-ui';

import { uploadFile } from '#/api/core/file';

const props = defineProps<{
  component: ComponentInstance;
}>();

const message = useMessage();

// 预设图标列表
const iconOptions = [
  { label: '首页', value: 'i-carbon:home' },
  { label: '购物车', value: 'i-carbon:shopping-cart' },
  { label: '用户', value: 'i-carbon:user' },
  { label: '设置', value: 'i-carbon:settings' },
  { label: '消息', value: 'i-carbon:notification' },
  { label: '搜索', value: 'i-carbon:search' },
  { label: '订单', value: 'i-carbon:document' },
  { label: '收藏', value: 'i-carbon:favorite' },
  { label: '位置', value: 'i-carbon:location' },
  { label: '分类', value: 'i-carbon:category' },
];

// 导航项列表
const items = computed<QuickNavItem[]>({
  get: () => props.component.props?.items || [],
  set: (value) => {
    if (props.component.props) {
      props.component.props.items = value;
    }
  },
});

// 添加导航项
const handleAddItem = () => {
  const newItem: QuickNavItem = {
    badge: {
      color: '#f5222d',
      content: '',
      show: false,
    },
    disabled: false,
    icon: 'i-carbon:home',
    iconColor: '#1890ff',
    iconType: 'icon',
    id: Date.now().toString(),
    link: {
      type: 'page',
      value: '/',
    },
    order: items.value.length + 1,
    title: '新导航项',
    visible: true,
  };

  items.value = [...items.value, newItem];
};

// 删除导航项
const handleRemoveItem = (index: number) => {
  items.value = items.value.filter((_, i) => i !== index);
};

// 更新导航项
const handleUpdateItem = (
  index: number,
  key: keyof QuickNavItem,
  value: any,
) => {
  const newItems = [...items.value];
  newItems[index] = {
    ...newItems[index],
    [key]: value,
  };
  items.value = newItems;
};

// 更新导航项链接
const handleUpdateItemLink = (
  index: number,
  key: keyof QuickNavItem['link'],
  value: any,
) => {
  const newItems = [...items.value];
  newItems[index] = {
    ...newItems[index],
    link: {
      ...newItems[index].link,
      [key]: value,
    },
  };
  items.value = newItems;
};

// 更新导航项徽标
const handleUpdateItemBadge = (
  index: number,
  key: keyof NonNullable<QuickNavItem['badge']>,
  value: any,
) => {
  const newItems = [...items.value];
  newItems[index] = {
    ...newItems[index],
    badge: {
      ...newItems[index].badge,
      [key]: value,
    },
  };
  items.value = newItems;
};

// 初始化文件列表
const initializeFileList = () => {
  const newFileList: Record<number, UploadFileInfo[]> = {};
  const itemsList = items.value;

  itemsList.forEach((item, index) => {
    if (item.icon && item.iconType === 'image') {
      const fileName = item.icon.split('/').pop() || `image-${index + 1}.jpg`;
      newFileList[index] = [
        {
          file: null,
          id: `quick-nav-${index}`,
          name: fileName,
          status: 'finished',
          thumbnailUrl: item.icon,
          url: item.icon,
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

      // 更新导航项
      handleUpdateItem(index, 'icon', result.fileUrl);
      handleUpdateItem(index, 'iconType', 'image');

      // 更新文件列表
      itemsFileLists.value[index] = [
        {
          id: `quick-nav-${index}`,
          name: file.file.name,
          status: 'finished',
          thumbnailUrl: result.fileUrl,
          url: result.fileUrl,
        },
      ];

      message.success('上传成功');
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
  if (options.fileList.length === 0) {
    handleUpdateItem(index, 'icon', '');
    handleUpdateItem(index, 'iconType', 'icon'); // 重置为图标类型
    itemsFileLists.value[index] = [];
  }
};
</script>

<template>
  <NSpace vertical>
    <NCard :bordered="false" title="导航项配置">
      <template #header-extra>
        <NButton type="primary" @click="handleAddItem">添加导航项</NButton>
      </template>

      <NCollapse>
        <NCollapseItem
          v-for="(item, index) in items"
          :key="item.id"
          :title="`导航项 ${index + 1}`"
        >
          <template #header-extra>
            <NButton
              size="small"
              type="error"
              @click.stop="handleRemoveItem(index)"
            >
              删除
            </NButton>
          </template>

          <NForm>
            <!-- 基础信息 -->
            <NSpace vertical>
              <NCard size="small" title="基础信息">
                <NSpace vertical>
                  <NFormItem label="标题">
                    <NInput
                      :value="item.title"
                      @update:value="
                        (val) => handleUpdateItem(index, 'title', val)
                      "
                    />
                  </NFormItem>

                  <NFormItem label="副标题">
                    <NInput
                      :value="item.subtitle"
                      @update:value="
                        (val) => handleUpdateItem(index, 'subtitle', val)
                      "
                    />
                  </NFormItem>

                  <NFormItem label="排序">
                    <NInputNumber
                      :value="item.order"
                      @update:value="
                        (val) => handleUpdateItem(index, 'order', val)
                      "
                    />
                  </NFormItem>

                  <NSpace>
                    <NFormItem>
                      <NSpace align="center">
                        <span>启用</span>
                        <NSwitch
                          :value="!item.disabled"
                          @update:value="
                            (val) => handleUpdateItem(index, 'disabled', !val)
                          "
                        />
                      </NSpace>
                    </NFormItem>

                    <NFormItem>
                      <NSpace align="center">
                        <span>显示</span>
                        <NSwitch
                          :value="item.visible"
                          @update:value="
                            (val) => handleUpdateItem(index, 'visible', val)
                          "
                        />
                      </NSpace>
                    </NFormItem>
                  </NSpace>
                </NSpace>
              </NCard>

              <!-- 图标配置 -->
              <NCard size="small" title="图标配置">
                <NSpace vertical>
                  <NFormItem label="图标类型">
                    <NRadioGroup
                      :value="item.iconType"
                      @update:value="
                        (val) => handleUpdateItem(index, 'iconType', val)
                      "
                    >
                      <NSpace>
                        <NRadio value="icon">图标</NRadio>
                        <NRadio value="image">图片</NRadio>
                      </NSpace>
                    </NRadioGroup>
                  </NFormItem>

                  <NFormItem v-if="item.iconType === 'icon'" label="图标">
                    <NSelect
                      :options="iconOptions"
                      :value="item.icon"
                      @update:value="
                        (val) => handleUpdateItem(index, 'icon', val)
                      "
                    />
                  </NFormItem>

                  <NFormItem v-else label="图片">
                    <NUpload
                      :custom-request="
                        (options) => handleFileUpload(index, options)
                      "
                      :file-list="itemsFileLists[index]"
                      :max="1"
                      :show-file-list="true"
                      accept="image/*"
                      list-type="image-card"
                      @change="(options) => handleUploadChange(index, options)"
                      @update:file-list="
                        (list) => (itemsFileLists[index] = list)
                      "
                    >
                      <div v-if="!itemsFileLists[index]?.length">
                        <NButton>选择图片</NButton>
                      </div>
                    </NUpload>
                  </NFormItem>
                </NSpace>
              </NCard>

              <!-- 链接配置 -->
              <NCard size="small" title="链接配置">
                <NSpace vertical>
                  <NFormItem label="链接类型">
                    <NSelect
                      :options="[
                        { label: '页面路由', value: 'page' },
                        { label: '外部链接', value: 'url' },
                      ]"
                      :value="item.link.type"
                      @update:value="
                        (val) => handleUpdateItemLink(index, 'type', val)
                      "
                    />
                  </NFormItem>

                  <NFormItem label="链接值">
                    <NInput
                      :value="item.link.value"
                      @update:value="
                        (val) => handleUpdateItemLink(index, 'value', val)
                      "
                    />
                  </NFormItem>
                </NSpace>
              </NCard>

              <!-- 徽标配置 -->
              <NCard size="small" title="徽标配置">
                <NSpace vertical>
                  <NSpace align="center">
                    <span>显示徽标</span>
                    <NSwitch
                      :value="item.badge?.show"
                      @update:value="
                        (val) => handleUpdateItemBadge(index, 'show', val)
                      "
                    />
                  </NSpace>

                  <template v-if="item.badge?.show">
                    <NFormItem label="徽标颜色">
                      <NInput
                        :value="item.badge?.color"
                        @update:value="
                          (val) => handleUpdateItemBadge(index, 'color', val)
                        "
                      />
                    </NFormItem>

                    <NFormItem label="徽标内容">
                      <NInput
                        :value="item.badge?.content"
                        @update:value="
                          (val) => handleUpdateItemBadge(index, 'content', val)
                        "
                      />
                    </NFormItem>
                  </template>
                </NSpace>
              </NCard>
            </NSpace>
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

.n-form {
  width: 100%;
  max-width: 600px;
}

.n-form-item {
  margin-bottom: 12px;
}

.n-form-item:last-child {
  margin-bottom: 0;
}

.n-upload {
  width: 100%;
}
</style>
