<script setup lang="ts">
import { h, defineComponent } from 'vue';
import { NModal } from 'naive-ui';
import { useLowCodeStore } from '#/store/modules/lowcode';
import ComponentRenderer from './ComponentRenderer.vue';

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
    v-model:show="show"
    preset="card"
    title="预览"
    size="huge"
    @update:show="emit('update:show', $event)"
  >
    <div class="preview-content">
      <RenderNode
        v-for="node in store.componentRelations"
        :key="node.componentInstanceId"
        :node="node"
      />
    </div>
  </NModal>
</template>

<style lang="less" scoped>
.preview-content {
  min-height: 400px;
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 4px;
}
</style> 
