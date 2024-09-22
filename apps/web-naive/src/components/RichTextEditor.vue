<script setup lang="ts">
import { onBeforeUnmount, shallowRef } from 'vue';

import { Editor, Toolbar } from '@wangeditor/editor-for-vue';

import '@wangeditor/editor/dist/css/style.css';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const editorRef = shallowRef();

const editorConfig = {
  placeholder: '请输入内容...',
};

const toolbarConfig = {};

const handleCreated = (editor: any) => {
  editorRef.value = editor;
  editor.setHtml(props.modelValue);
};

const handleChange = (editor: any) => {
  emit('update:modelValue', editor.getHtml());
};

onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor === null) return;
  editor.destroy();
});
</script>

<template>
  <div style="border: 1px solid #ccc">
    <Toolbar
      :default-config="toolbarConfig"
      :editor="editorRef"
      mode="default"
      style="border-bottom: 1px solid #ccc"
    />
    <Editor
      :default-config="editorConfig"
      :model-value="modelValue"
      mode="default"
      style="height: 500px; overflow-y: hidden"
      @change="handleChange"
      @on-created="handleCreated"
    />
  </div>
</template>
