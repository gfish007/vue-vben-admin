<script setup lang="ts">
import { h, defineComponent } from 'vue';
import { NModal } from 'naive-ui';
import { useLowCodeStore } from '#/store/modules/lowcode';
import { ComponentRenderer } from './ComponentRenderer';

defineProps<{
  show: boolean;
}>();

const emit = defineEmits(['update:show']);

const store = useLowCodeStore();

// 递归渲染组件
const RenderNode = defineComponent({
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
        isPreview: true
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
});
</script>

<template>
  <NModal
    :show="show"
    class="preview-modal"
    preset="card"
    style="width: 80vw; max-width: 1200px"
    title="预览"
    @update:show="emit('update:show', $event)"
  >
    <div class="min-h-[300px] p-4">
      <template v-if="store.componentTree.length">
        <RenderNode
          v-for="node in store.componentTree"
          :key="node.componentInstanceId"
          :node="node"
        />
      </template>
      <div v-else class="flex h-full items-center justify-center text-gray-400">
        暂无组件
      </div>
    </div>
  </NModal>
</template>

<style>
.preview-modal .component-wrapper,
.preview-modal .component-actions,
.preview-modal .component-selected {
  display: none !important;
}
</style> 
