<script setup lang="ts">
import type { ComponentInstance } from '../../../../types/lowcode';

import { defineComponent, h, PropType, ref, watch } from 'vue';

import { NModal, NSpin, useMessage } from 'naive-ui';

import { useLowCodeStore } from '../../../../../store/modules/lowcode';
import ComponentRenderer from './ComponentRenderer.vue';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits(['update:show']);

const store = useLowCodeStore();
const message = useMessage();
const loading = ref(false);

// 预加载数据源数据
const preloadDataSources = async () => {
  console.log('【预览】开始预加载数据源');

  if (!store.currentPage?.dataSources) {
    console.log('【预览】没有找到数据源配置');
    return;
  }

  try {
    loading.value = true;
    console.log(
      '【预览】数据源配置:',
      store.currentPage.dataSources.map((ds) => ({
        数据源名称: ds.dsName,
        数据源类型: ds.dsType,
        数据源编码: ds.dsCode,
        数据源配置: ds.config,
      })),
    );

    // 获取所有数据源的数据
    const promises = store.currentPage.dataSources.map(async (ds) => {
      try {
        if (ds.dsType === 'STATIC') {
          console.log(`【预览】处理静态数据源 ${ds.dsCode}:`, {
            原始数据: ds.config.data,
            配置类型: ds.config.type,
          });

          if (ds.config.type === 'STATIC') {
            const data =
              typeof ds.config.data === 'string'
                ? JSON.parse(ds.config.data || '{}')
                : ds.config.data;
            store.componentDataCache.set(ds.dsCode, data);
            console.log(`【预览】静态数据源 ${ds.dsCode} 数据已缓存:`, data);
            return data;
          }
        } else {
          console.log(`【预览】加载动态数据源 ${ds.dsCode}:`, {
            配置: ds.config,
          });
          const data = await store.getDataSourceData(ds.dsCode);
          store.componentDataCache.set(ds.dsCode, data);
          console.log(`【预览】动态数据源 ${ds.dsCode} 加载完成:`, data);
          return data;
        }
      } catch (error) {
        console.error(`【预览】加载数据源 ${ds.dsCode} 失败:`, error);
        return null;
      }
    });

    const results = await Promise.all(promises);
    console.log(
      '【预览】数据源加载结果:',
      results.map((data, index) => ({
        加载状态: data ? '成功' : '失败',
        数据: data,
        数据源编码: store.currentPage?.dataSources[index].dsCode,
      })),
    );

    // 打印缓存状态
    console.log('【预览】数据源缓存状态:', {
      缓存内容: [...store.componentDataCache.entries()].map(([key, value]) => ({
        数据: value,
        数据源编码: key,
      })),
      缓存大小: store.componentDataCache.size,
    });
  } catch (error) {
    console.error('【预览】预加载数据源失败:', error);
    message.error('加载数据源数据失败');
  } finally {
    loading.value = false;
  }
};

// 监听预览窗口显示状态
watch(
  () => props.show,
  async (newVal) => {
    console.log('【预览】预览窗口状态变化:', {
      当前组件列表: store.components,
      数据源配置: store.currentPage?.dataSources,
      显示: newVal,
    });

    if (newVal) {
      await preloadDataSources();
    } else {
      console.log('【预览】清除数据源缓存');
      store.componentDataCache.clear();
    }
  },
);

// 递归渲染组件
const RenderNode = defineComponent({
  name: 'RenderNode',
  props: {
    node: {
      required: true,
      type: Object as PropType<ComponentInstance>,
    },
  },
  setup(props) {
    console.log('【预览】渲染节点:', {
      数据绑定: props.node?.dataBinding,
      节点ID: props.node?.componentInstanceId,
      节点属性: props.node?.props,
      节点样式: props.node?.style,
      节点类型: props.node?.componentCode,
    });

    return () =>
      h(
        ComponentRenderer,
        {
          isPreview: true,
          node: props.node,
        },
        {
          default: () => {
            if (!props.node.children?.length) {
              console.log(
                `【预览】节点 ${props.node.componentInstanceId} 没有子节点`,
              );
              return null;
            }

            console.log(
              `【预览】渲染节点 ${props.node.componentInstanceId} 的子节点:`,
              props.node.children.map((child) => ({
                子节点ID: child.componentInstanceId,
                子节点类型: child.componentCode,
              })),
            );

            return props.node.children?.map((child) =>
              h(RenderNode, {
                key: child.componentInstanceId,
                node: child,
              }),
            );
          },
        },
      );
  },
});
</script>

<template>
  <NModal
    v-model:show="show"
    preset="card"
    size="huge"
    title="预览"
    @update:show="emit('update:show', $event)"
  >
    <NSpin :show="loading">
      <div class="preview-content">
        <template v-if="store.components && store.components.length > 0">
          <RenderNode
            v-for="node in store.components"
            :key="node.componentInstanceId"
            :node="node"
          />
        </template>
        <div v-else class="empty-tip">暂无组件</div>
      </div>
    </NSpin>
  </NModal>
</template>

<style lang="less" scoped>
.preview-content {
  min-height: 400px;
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 20px;
}
</style>
