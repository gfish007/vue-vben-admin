<script setup lang="ts">
import { ref, watch } from 'vue';

import { NButton, NDrawer, NDrawerContent, NSpace } from 'naive-ui';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'reset'): void;
  (e: 'search'): void;
  (e: 'update:show', value: boolean): void;
}>();

const localShow = ref(props.show);

watch(
  () => props.show,
  (newValue) => {
    localShow.value = newValue;
  },
);

const updateShow = (value: boolean) => {
  localShow.value = value;
  emit('update:show', value);
};

const handleSearch = () => {
  emit('search');
  updateShow(false);
};

const handleReset = () => {
  emit('reset');
  updateShow(false);
};
</script>

<template>
  <NDrawer
    v-model:show="localShow"
    :width="300"
    placement="right"
    @update:show="updateShow"
  >
    <NDrawerContent title="查询条件">
      <slot></slot>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="handleReset">重置</NButton>
          <NButton type="primary" @click="handleSearch">搜索</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
