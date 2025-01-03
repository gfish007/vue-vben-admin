<script setup lang="ts">
import { NCard, NTree } from 'naive-ui';
import { useLowCodeStore } from '#/store/modules/lowcode';
import { computed } from 'vue';

const store = useLowCodeStore();

// 将组件关系转换为树形结构
const treeData = computed(() => {
  const buildTree = (components: any[], parentId: string | null = null) => {
    return components
      .filter(item => item.parentInstanceId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(item => ({
        key: item.componentInstanceId,
        label: `${item.componentCode} - ${item.componentInstanceId}`,
        children: buildTree(components, item.componentInstanceId),
      }));
  };

  return buildTree(store.componentRelations);
});
</script>

<template>
  <NCard title="大纲树" class="h-full">
    <NTree
      :data="treeData"
      block-line
      class="outline-tree"
      :default-expanded-keys="['form_1']"
    />
  </NCard>
</template>

<style scoped>
:deep(.n-card-content) {
  height: calc(100% - 40px);
  overflow: auto;
}

.outline-tree {
  :deep(.n-tree-node-content) {
    padding: 4px 6px;
    transition: all 0.2s;
    
    &:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
  }
}
</style> 
