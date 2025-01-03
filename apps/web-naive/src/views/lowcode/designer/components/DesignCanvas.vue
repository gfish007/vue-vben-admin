<script setup lang="ts">
import { NCard } from 'naive-ui';
import { useLowCodeStore } from '#/store/modules/lowcode';
import { ComponentRenderer } from './ComponentRenderer';
import { computed, defineComponent, h, markRaw } from 'vue';

const store = useLowCodeStore();

// 递归渲染组件，使用 markRaw 优化性能
const RenderNode = markRaw(defineComponent({
  name: 'RenderNode',
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    return () => h(
      ComponentRenderer,
      {
        node: props.node,
        isPreview: false
      },
      {
        default: () => props.node.children?.map(child => 
          h(RenderNode, {
            key: child.componentInstanceId,
            node: child
          })
        )
      }
    );
  }
}));

// 使用 computed 缓存组件树，避免不必要的重渲染
const componentTree = computed(() => store.componentRelations);
</script>

<template>
  <NCard title="设计画布" class="h-full">
    <div class="design-canvas">
      <template v-if="componentTree.length">
        <RenderNode
          v-for="node in componentTree"
          :key="node.componentInstanceId"
          :node="node"
        />
      </template>
      <div v-else class="flex h-full items-center justify-center text-gray-400">
        从左侧拖入组件开始设计
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.design-canvas {
  min-height: 300px;
  height: 100%;
  padding: 16px;
  border: 1px dashed #ccc;
  border-radius: 4px;
  overflow: auto;
  background-color: #fafafa;
}

:deep(.n-card-content) {
  height: calc(100% - 40px);
  overflow: auto;
}
</style> 
