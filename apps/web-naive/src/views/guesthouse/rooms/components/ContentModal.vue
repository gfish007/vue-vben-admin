<!-- apps/web-naive/src/views/guesthouse/rooms/components/ContentModal.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  content: string;
  isHtml: boolean;
  title: string;
}>();

const modalTitle = ref(props.title);
const modalContent = ref(props.content);
const isHtmlContent = ref(props.isHtml);

watch(
  () => props.title,
  (newVal) => (modalTitle.value = newVal),
);
watch(
  () => props.content,
  (newVal) => (modalContent.value = newVal),
);
watch(
  () => props.isHtml,
  (newVal) => (isHtmlContent.value = newVal),
);
</script>

<template>
  <div>
    <h2>{{ modalTitle }}</h2>
    <div v-if="!isHtmlContent" style="white-space: pre-wrap">
      {{ modalContent }}
    </div>
    <div v-else v-html="modalContent"></div>
  </div>
</template>
