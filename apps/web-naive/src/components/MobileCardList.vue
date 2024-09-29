<script setup lang="ts">
import { NCard, NPagination } from 'naive-ui';

defineProps<{
  items: any[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}>();

const emit = defineEmits<{
  (e: 'page-change', page: number): void;
  (e: 'page-size-change', pageSize: number): void;
}>();
</script>

<template>
  <div class="space-y-4">
    <NCard v-for="item in items" :key="item.id" class="w-full">
      <slot :item="item" name="card-content"></slot>
    </NCard>
    <NPagination
      v-model:page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :item-count="pagination.total"
      @update:page="emit('page-change', $event)"
      @update:page-size="emit('page-size-change', $event)"
    />
  </div>
</template>
