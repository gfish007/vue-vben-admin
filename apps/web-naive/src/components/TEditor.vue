<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';

import Editor from '@tinymce/tinymce-vue';
import tinymce from 'tinymce/tinymce';

import { uploadFile } from '#/api/core/file';

import 'tinymce/icons/default/icons';
import 'tinymce/models/dom';
import 'tinymce/themes/silver';
import 'tinymce/plugins/image';
import 'tinymce/plugins/table';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/wordcount';
import 'tinymce/plugins/preview';
import 'tinymce/plugins/emoticons';
import 'tinymce/plugins/emoticons/js/emojis.js';
import 'tinymce/plugins/code';
import 'tinymce/plugins/link';
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/codesample';
import 'tinymce/plugins/autoresize';
import 'tinymce/plugins/quickbars';
import 'tinymce/plugins/nonbreaking';
import 'tinymce/plugins/searchreplace';
import 'tinymce/plugins/autolink';
import 'tinymce/plugins/directionality';
import 'tinymce/plugins/visualblocks';
import 'tinymce/plugins/visualchars';
import 'tinymce/plugins/charmap';
import 'tinymce/plugins/insertdatetime';
import 'tinymce/plugins/importcss';
import 'tinymce/plugins/accordion';
import 'tinymce/plugins/anchor';
import 'tinymce/plugins/fullscreen'; // Import the uploadFile function

const props = defineProps({
  baseUrl: { default: '', type: String },
  editable_root: { default: true, type: Boolean },
  enabled: { default: true, type: Boolean },
  knwlgId: { default: '', type: String },
  minHeight: { default: 630, type: Number },
  modelValue: { default: '', type: String },
  plugins: {
    default:
      'importcss autoresize searchreplace autolink directionality code visualblocks visualchars fullscreen image link codesample table charmap nonbreaking anchor insertdatetime advlist lists wordcount charmap quickbars emoticons accordion',
    type: [String, Array],
  },
  readonly: { default: false, type: Boolean },
  toolbar: {
    default:
      'undo redo | accordion accordionremove | blocks fontfamily fontsize| bold italic underline strikethrough ltr rtl  | align numlist bullist | link image | table | lineheight outdent indent| forecolor backcolor removeformat | charmap emoticons | anchor codesample',
    type: [String, Array, Boolean],
  },
  value: { default: () => '', type: String },
});
const emits = defineEmits(['update:modelValue', 'setHtml']);
const loading = ref(false);
const tinymceId = ref(
  `vue-tinymce-${Date.now()}${(Math.random() * 1000).toFixed(0)}`,
);

const init = reactive({
  autoresize_bottom_margin: 20,
  branding: false,
  content_css: '/tinymce/skins/content/default/content.css',
  content_style:
    'body { font-family:Helvetica,Arial,sans-serif; font-size:16px }p {margin:3px; line-height:24px;}',
  convert_urls: false,
  editable_root: props.editable_root,
  editimage_cors_hosts: ['picsum.photos'],
  editimage_toolbar:
    'rotateleft rotateright | flipv fliph | editimage imageoptions',
  file_picker_types: 'file',
  font_family_formats:
    'Arial=arial,helvetica,sans-serif; 宋体=SimSun; 微软雅黑=Microsoft Yahei; Impact=impact,chicago;',
  font_size_formats: '11px 12px 14px 16px 18px 24px 36px 48px 64px 72px',
  height: 600,
  image_advtab: true,
  image_caption: true,
  image_dimensions: false,
  images_upload_handler(blobInfo, progress) {
    return new Promise((resolve, reject) => {
      const file = blobInfo.blob();
      if (file.size / 1024 / 1024 > 10) {
        reject({
          message: '上传失败，图片大小请控制在 10M 以内',
          remove: true,
        });
      }
      const formData = new FormData();
      formData.append('file', file);
      uploadFile(formData, (percentCompleted) => {
        progress(percentCompleted);
      })
        .then((res) => {
          resolve(res.fileUrl);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  importcss_append: true,
  language: 'zh_CN',
  language_url: '/tinymce/langs/zh_CN.js',
  link_context_toolbar: true,
  link_default_target: '_blank',
  menubar: 'edit view insert format tools table',
  min_height: props.minHeight,
  nonbreaking_force_tab: false,
  noneditable_class: 'mceNonEditable',
  paste_auto_cleanup_on_paste: false,
  paste_data_images: true,
  paste_merge_formats: true,
  paste_webkit_styles: 'all',
  plugins: props.plugins,
  promotion: false,
  quickbars_image_toolbar:
    'alignleft aligncenter alignright | rotateleft rotateright | imageoptions',
  quickbars_insert_toolbar: 'image codesample table',
  quickbars_selection_toolbar:
    'bold italic | quicklink h2 h3 blockquote quickimage quicktable',
  selector: `#${tinymceId.value}`,
  setup(editor) {
    editor.on('init', () => {
      const toolbar = editor.editorContainer.querySelector('.tox-toolbar');
      const menu = editor.editorContainer.querySelector('.tox-menu');
      if (toolbar) {
        toolbar.style.zIndex = '5000';
      }
      if (menu) {
        menu.style.zIndex = '5001';
      }
      editor.setContent(props.modelValue);
    });
  },
  skin_url: '/tinymce/skins/ui/oxide',
  toolbar: props.toolbar,
  toolbar_mode: 'wrap',
});

const myValue = computed({
  get() {
    return props.modelValue;
  },
  set(val) {
    emits('update:modelValue', val);
  },
});

watch(
  () => myValue.value,
  (newValue) => {
    tinymce.activeEditor.setContent(newValue);
  },
);

watch(
  () => props.readonly,
  (newValue) => {
    nextTick(() => {
      tinymce.activeEditor.mode.set(newValue ? 'readonly' : 'design');
      const iframeDom = document.querySelector('iframe');
      if (iframeDom) {
        iframeDom.contentWindow.document.body.style.margin = newValue
          ? 0
          : '16px';
      }
    });
  },
  { immediate: true },
);

onMounted(() => {
  tinymce.init(init);
});

const handleSetContent = (content) => {
  tinymce.activeEditor.setContent(content);
};

const handleGetContent = () => {
  return tinymce.activeEditor.getContent();
};

defineExpose({
  handleGetContent,
  handleSetContent,
});
</script>

<template>
  <div style="height: 100%; overflow: hidden">
    <Editor :id="tinymceId" v-model="myValue" :enabled="enabled" :init="init" />
  </div>
</template>

<style lang="scss" scoped>
:deep(.tox-tinymce) {
  border: 1px solid #dcdfe6;
  border-radius: 4px;

  .tox-statusbar {
    display: none;
  }
}
</style>
<style>
/* 在el-dialog中tinymce z-index 被太小而被遮挡时要加这两句 */
.tox-tinymce-aux {
  z-index: 99999 !important;
}

.tinymce.ui.FloatPanel {
  z-index: 99;
}
</style>
