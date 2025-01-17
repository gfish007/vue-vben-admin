<script setup lang="ts" name="DesignCanvas">
import type {
  ComponentInstance,
  DataSource,
  PageEvent,
  PageEventType,
} from '../../../../types/lowcode';

import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import {
  FlashOutline,
  ReloadOutline,
  ReturnUpBackOutline,
  ServerOutline,
} from '@vicons/ionicons5';
import {
  NButton,
  NIcon,
  NSelect,
  NSpace,
  useDialog,
  useMessage,
} from 'naive-ui';
import { nanoid } from 'nanoid';

import { useLowCodeStore } from '../../../../store/modules/lowcode';
import ComponentRenderer from './ComponentRenderer.vue';
import * as componentRenders from './definitions';
import DataSourcePanel from './panels/DataSourcePanel.vue';
import EventPanel from './panels/EventPanel.vue';

// 初始化 store
const store = useLowCodeStore();
const message = useMessage();
const isDragOver = ref(false);
const dragPosition = ref({ x: 0, y: 0 });
const activeDevice = ref<string>('iphone-se');

// 设备配置
const devices = [
  {
    height: 667,
    id: 'iphone-se',
    name: 'iPhone SE',
    scale: 0.75,
    width: 375,
  },
  {
    height: 844,
    id: 'iphone-12',
    name: 'iPhone 12',
    scale: 0.75,
    width: 390,
  },
  {
    height: 926,
    id: 'iphone-12-pro-max',
    name: 'iPhone 12 Pro Max',
    scale: 0.75,
    width: 428,
  },
] as const;

// 设备选项
const deviceOptions = devices.map((device) => ({
  label: device.name,
  value: device.id,
}));

// 获取当前设备
const currentDevice = computed(() => {
  return devices.find((d) => d.id === activeDevice.value) || devices[0];
});

// 计算设备样式
const deviceStyle = computed(() => {
  const device = currentDevice.value;
  return {
    height: `${device.height * device.scale}px`,
    width: `${device.width * device.scale}px`,
  };
});

// 处理拖拽
const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  event.dataTransfer!.dropEffect = 'copy';
  isDragOver.value = true;

  // 更新拖拽位置
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  dragPosition.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
};

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault();
  const target = event.currentTarget as HTMLElement;
  const relatedTarget = event.relatedTarget as HTMLElement;
  // 只有当真正离开画布区域时才重置状态
  if (!target.contains(relatedTarget)) {
    isDragOver.value = false;
  }
};

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = true;
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;

  const dragData = event.dataTransfer?.getData('component-drag');
  const componentData = event.dataTransfer?.getData('component');

  if (dragData) {
    // 处理组件移动
    try {
      const data = JSON.parse(dragData);
      if (data.type === 'move') {
        store.moveComponent(data.componentId, 'root');
      }
    } catch (error) {
      console.error('Failed to parse drag data:', error);
    }
    return;
  }

  if (!componentData) {
    message.error('无效的组件数据');
    return;
  }

  try {
    const component = JSON.parse(componentData);

    if (!component.componentCode || !component.componentName) {
      message.error('组件数据不完整');
      return;
    }

    // 根据组件类型设置默认属性
    const defaultProps = { ...component.defaultProps };

    // 设置默认样式
    const defaultStyle: Record<string, string> = {
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: '1px',
      margin: '0',
      minHeight: '32px',
      padding: '0',
      width: '100%',
    };

    // 根据组件类型设置特定样式
    if (component.componentCode === 'Container') {
      defaultStyle.minHeight = '120px';
      defaultStyle.padding = '8px';
    }

    // 合并自定义样式，确保外部传入的样式优先级更高
    const mergedStyle = component.defaultStyle
      ? { ...defaultStyle, ...component.defaultStyle }
      : defaultStyle;

    const componentInstance: ComponentInstance = {
      componentCode: component.componentCode,
      componentInstanceId: nanoid(),
      componentName: component.componentName,
      dataBinding: null,
      events: null,
      propertyPanel: component.propertyPanel,
      props: defaultProps,
      propsSchema: component.propsSchema,
      style: mergedStyle,
    };

    // 使用 store 添加组件
    store.addComponent(componentInstance);
    message.success('添加组件成功');
  } catch (error) {
    message.error(
      `添加组件失败: ${error instanceof Error ? error.message : '未知错误'}`,
    );
  }
};

// 获取组件的渲染函数
const getComponentRender = (componentCode: string) => {
  // 根据组件代码获取对应的渲染函数
  const renderKey = `${componentCode}Render` as keyof typeof componentRenders;
  return componentRenders[renderKey] || null;
};

// 组件操作
const handleComponentClick = (component: ComponentInstance) => {
  // 设置当前选中的组件
  store.setCurrentComponentId(component.componentInstanceId);
};

// 使用 store 中的组件列表
const storeComponents = computed(() => store.components);

// 删除组件时也使用 store
const deleteComponent = (componentInstanceId: string) => {
  store.removeComponent(componentInstanceId);
  message.success('删除组件成功');
};

// 处理组件属性更新
const handlePropUpdate = (
  component: ComponentInstance,
  field: string,
  value: unknown,
) => {
  store.updateComponent(component.componentInstanceId, {
    props: {
      ...component.props,
      [field]: value,
    },
  });
};

// Add router instance
const router = useRouter();

// Add dialog instance
const dialog = useDialog();

// Update the data source button click handler
const handleDataSourceClick = () => {
  dialog.warning({
    content: '是否要跳转到数据源管理页面？当前页面的未保存内容可能会丢失。',
    negativeText: '取消',
    onPositiveClick: () => {
      router.push('/lowcode/datasource');
    },
    positiveText: '确定',
    title: '提示',
  });
};

// 数据源配置对话框
const showDataSourceModal = ref(false);

// 页面数据源列表
const pageDataSources = computed(() => store.currentPage?.dataSources || []);

// 数据源配置
const currentDataSource = ref<DataSource>({
  config: {
    headers: {},
    method: 'GET',
    params: {},
    type: 'API',
    url: '',
  },
  dsCode: '',
  dsName: '',
  dsType: 'API',
  id: '',
  status: 1,
});

const isEditingDataSource = ref(false);

// 重置数据源表单
const resetDataSourceForm = () => {
  currentDataSource.value = {
    config: {
      headers: {},
      method: 'GET',
      params: {},
      type: 'API',
      url: '',
    },
    dsCode: '',
    dsName: '',
    dsType: 'API',
    id: '',
    status: 1,
  };
  isEditingDataSource.value = false;
};

// 更新数据源配置
const handleDataSourceUpdate = (field: string, value: unknown) => {
  currentDataSource.value = {
    ...currentDataSource.value,
    [field]: value,
  };
};

// 更新数据源API配置
const handleApiConfigUpdate = (field: string, value: unknown) => {
  if (currentDataSource.value.config.type === 'API') {
    currentDataSource.value.config = {
      ...currentDataSource.value.config,
      [field]: value,
    };
  }
};

// 更新配置时的处理函数
const handleConfigChange = (field: string, value: string) => {
  try {
    // 如果是空字符串，设置为默认值
    if (!value.trim()) {
      if (currentDataSource.value.dsType === 'API') {
        currentDataSource.value.config[field] = {};
      } else if (currentDataSource.value.dsType === 'STATIC') {
        currentDataSource.value.config = {
          data: {},
          type: 'STATIC',
        };
      }
      return;
    }

    // 尝试解析 JSON
    let parsedValue;
    try {
      parsedValue = JSON.parse(value);
    } catch {
      // 只在完整的 JSON 格式错误时提示
      if (value.trim().startsWith('{') && value.trim().endsWith('}')) {
        message.error('JSON格式错误');
      }
      return;
    }

    if (currentDataSource.value.dsType === 'API') {
      currentDataSource.value.config = {
        ...currentDataSource.value.config,
        [field]: parsedValue,
      };
    } else if (currentDataSource.value.dsType === 'STATIC') {
      currentDataSource.value.config = {
        data: parsedValue,
        type: 'STATIC',
      };
    }
  } catch (error) {
    console.error('handleConfigChange error:', error);
  }
};

// 获取默认的静态数据
const getDefaultStaticData = () => {
  return JSON.stringify(
    {
      code: 200,
      data: {
        total: 2,
        list: [
          {
            id: 1,
            name: '示例数据1',
          },
          {
            id: 2,
            name: '示例数据2',
          },
        ],
      },
      message: 'success',
    },
    null,
    2,
  );
};

// 监听数据源类型变化
watch(
  () => currentDataSource.value.dsType,
  (newType) => {
    if (newType === 'STATIC') {
      // 如果切换到静态数据类型，设置默认的静态数据
      if (!currentDataSource.value.config.data) {
        currentDataSource.value.config = {
          data: JSON.parse(getDefaultStaticData()),
          type: 'STATIC',
        };
      }
    } else if (newType === 'API') {
      // 如果切换到 API 类型，设置默认的 API 配置
      currentDataSource.value.config = {
        headers: {},
        method: 'GET',
        params: {},
        type: 'API',
        url: '',
      };
    }
  },
);

// 验证数据源表单
const validateDataSourceForm = () => {
  if (!currentDataSource.value.dsName) {
    message.error('请输入数据源名称');
    return false;
  }
  if (!currentDataSource.value.dsCode) {
    message.error('请输入数据源编码');
    return false;
  }
  // 验证编码格式：只允许大写字母、数字和下划线
  if (!/^[A-Z0-9_]+$/.test(currentDataSource.value.dsCode)) {
    message.error('数据源编码只能包含大写字母、数字和下划线');
    return false;
  }

  // 验证API类型的必填字段
  if (currentDataSource.value.dsType === 'API') {
    if (!currentDataSource.value.config.url) {
      message.error('请输入API地址');
      return false;
    }
    if (!currentDataSource.value.config.method) {
      message.error('请选择请求方法');
      return false;
    }
  }

  // 验证静态数据类型的必填字段
  if (
    currentDataSource.value.dsType === 'STATIC' &&
    currentDataSource.value.config.data === undefined
  ) {
    message.error('请输入静态数据');
    return false;
  }

  // 验证数据库类型的必填字段
  if (currentDataSource.value.dsType === 'DATABASE') {
    const config = currentDataSource.value.config;
    if (!config.host) {
      message.error('请输入主机地址');
      return false;
    }
    if (!config.port) {
      message.error('请输入端口号');
      return false;
    }
    if (!config.database) {
      message.error('请输入数据库名');
      return false;
    }
    if (!config.username) {
      message.error('请输入用户名');
      return false;
    }
    if (!config.password) {
      message.error('请输入密码');
      return false;
    }
    if (!config.sql) {
      message.error('请输入SQL语句');
      return false;
    }
  }

  return true;
};

// 添加数据源
const handleAddDataSource = () => {
  if (!validateDataSourceForm()) return;

  if (!store.currentPage) {
    store.initPage();
  }

  // 检查编码是否重复
  if (
    pageDataSources.value.some(
      (ds) => ds.dsCode === currentDataSource.value.dsCode,
    )
  ) {
    message.error('数据源编码已存在');
    return;
  }

  // 更新页面数据源
  store.updateCurrentPage({
    ...store.currentPage!,
    dataSources: [...pageDataSources.value, currentDataSource.value],
  });

  message.success('添加数据源成功');
  showDataSourceFormModal.value = false;
  resetDataSourceForm();
};

// 保存数据源
const handleSaveDataSource = () => {
  if (!validateDataSourceForm()) return;
  if (!store.currentPage) return;

  store.updateCurrentPage({
    ...store.currentPage,
    dataSources: pageDataSources.value.map((ds) =>
      ds.dsCode === currentDataSource.value.dsCode
        ? currentDataSource.value
        : ds,
    ),
  });

  message.success('保存数据源成功');
  showDataSourceFormModal.value = false;
  resetDataSourceForm();
};

// 删除数据源
const handleDeleteDataSource = (dsCode: string) => {
  if (!store.currentPage) return;

  store.updateCurrentPage({
    ...store.currentPage,
    dataSources: pageDataSources.value.filter((ds) => ds.dsCode !== dsCode),
  });

  message.success('删除数据源成功');
};

// 更新数据源
const handleUpdateDataSource = (dataSource: DataSource) => {
  if (!store.currentPage) return;

  store.updateCurrentPage({
    ...store.currentPage,
    dataSources: pageDataSources.value.map((ds) =>
      ds.dsCode === dataSource.dsCode ? dataSource : ds,
    ),
  });

  message.success('更新数据源成功');
};

// 页面事件配置对话框
const showEventModal = ref(false);

// 页面事件列表
const pageEvents = computed(() => store.currentPage?.events || []);

// 事件类型选项
const eventTypeOptions = [
  { label: '页面加载', value: 'onLoad' },
  { label: '页面卸载', value: 'onUnload' },
  { label: '页面显示', value: 'onShow' },
  { label: '页面隐藏', value: 'onHide' },
];

// 添加页面事件
const handleAddEvent = (event: PageEvent) => {
  if (!store.currentPage) {
    store.initPage();
  }

  // 检查事件类型是否重复
  if (pageEvents.value.some((e) => e.type === event.type)) {
    message.error('该事件类型已存在');
    return;
  }

  store.updateCurrentPage({
    ...store.currentPage!,
    events: [...pageEvents.value, event],
  });

  message.success('添加事件成功');
};

// 删除页面事件
const handleDeleteEvent = (type: PageEventType) => {
  if (!store.currentPage) return;

  store.updateCurrentPage({
    ...store.currentPage,
    events: pageEvents.value.filter((e) => e.type !== type),
  });

  message.success('删除事件成功');
};

// 更新页面事件
const handleUpdateEvent = (event: PageEvent) => {
  if (!store.currentPage) return;

  store.updateCurrentPage({
    ...store.currentPage,
    events: pageEvents.value.map((e) => (e.type === event.type ? event : e)),
  });

  message.success('更新事件成功');
};

// 编辑数据源
const handleEditDataSource = (ds: DataSource) => {
  currentDataSource.value = { ...ds };
  isEditingDataSource.value = true;
};

// 数据源表单对话框
const showDataSourceFormModal = ref(false);

// 事件表单对话框
const showEventFormModal = ref(false);

// 事件表单
const currentEvent = ref<PageEvent>({ handler: {}, type: 'onLoad' });

// 初始化页面
onMounted(() => {
  if (!store.currentPage) {
    store.initPage();
  }
});

// 重置事件表单
const resetEventForm = () => {
  currentEvent.value = { handler: {}, type: 'onLoad' };
  showEventFormModal.value = false;
};

// 验证事件表单
const validateEventForm = () => {
  if (!currentEvent.value.type) {
    message.error('请选择事件类型');
    return false;
  }

  if (!currentEvent.value.handlerType) {
    message.error('请选择处理器类型');
    return false;
  }

  if (
    currentEvent.value.handlerType === 'dataSource' &&
    !currentEvent.value.handler.dsCode
  ) {
    message.error('请选择数据源');
    return false;
  }

  if (
    currentEvent.value.handlerType === 'function' &&
    !currentEvent.value.handler.function
  ) {
    message.error('请输入自定义函数');
    return false;
  }

  return true;
};
</script>

<template>
  <div class="design-canvas">
    <div class="canvas-header">
      <NSelect
        :options="deviceOptions"
        :value="activeDevice"
        size="small"
        @update:value="(val) => (activeDevice = val)"
      />
      <NSpace>
        <NButton circle quaternary size="small" title="重置" type="default">
          <NIcon><ReloadOutline /></NIcon>
        </NButton>
        <NButton circle quaternary size="small" title="撤销" type="default">
          <NIcon><ReturnUpBackOutline /></NIcon>
        </NButton>
        <NButton
          circle
          quaternary
          size="small"
          title="页面数据源配置"
          type="warning"
          @click="
            () => {
              showDataSourceModal = true;
            }
          "
        >
          <NIcon><ServerOutline /></NIcon>
        </NButton>
        <NButton
          circle
          quaternary
          size="small"
          title="页面事件配置"
          type="info"
          @click="
            () => {
              showEventModal = true;
            }
          "
        >
          <NIcon><FlashOutline /></NIcon>
        </NButton>
      </NSpace>
    </div>
    <div :style="deviceStyle" class="canvas-body">
      <div
        :class="[{ 'drag-over': isDragOver && storeComponents.length === 0 }]"
        class="canvas-content"
        @dragenter="handleDragEnter"
        @dragleave="handleDragLeave"
        @dragover="handleDragOver"
        @drop="handleDrop"
      >
        <ComponentRenderer
          v-for="component in storeComponents"
          :key="component.componentInstanceId"
          :is-preview="false"
          :node="component"
          @delete="deleteComponent"
        />
        <div v-if="storeComponents.length === 0" class="empty-tip">
          <div class="tip-icon"></div>
          <span>从左侧拖入组件开始设计</span>
        </div>
      </div>
    </div>

    <!-- 数据源配置对话框 -->
    <DataSourcePanel v-model:show="showDataSourceModal" />

    <!-- 事件配置对话框 -->
    <EventPanel v-model:show="showEventModal" />
  </div>
</template>

<style lang="less" scoped>
.design-canvas {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.canvas-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  z-index: 1;
  flex-shrink: 0;

  :deep(.n-select) {
    width: 160px;
  }

  :deep(.n-button) {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }
}

.canvas-body {
  flex: 1;
  margin: 24px auto;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  overflow: auto;
  position: relative;
  transition: all 0.3s ease;
  min-height: 0;

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

.canvas-content {
  padding: 1px;
  min-height: 100%;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1px;

  &.drag-over {
    background-color: rgba(24, 160, 88, 0.05);
    outline: 2px dashed #18a058;
    outline-offset: -1px;
  }
}

.empty-tip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #999;
  font-size: 14px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);

  .tip-icon {
    width: 48px;
    height: 48px;
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23999"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" /></svg>')
      center/contain no-repeat;
    opacity: 0.5;
    transition: all 0.3s ease;
  }

  .drag-over & {
    transform: translate(-50%, -50%) scale(1.1);
    color: #18a058;
    background-color: rgba(24, 160, 88, 0.1);

    .tip-icon {
      opacity: 1;
      transform: rotate(180deg);
    }
  }
}
</style>
