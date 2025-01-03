<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSwitch,
  useMessage,
} from 'naive-ui';
import { saveOrUpdatePage } from '#/api/lowcode/page';
import type { PageApi } from '#/api/lowcode/page.types';

const props = defineProps<{
  show: boolean;
  editingRecord: Nullable<PageApi.PageRecord>;
}>();

const emit = defineEmits(['update:show', 'success']);

const message = useMessage();

// 表单数据
const formData = ref<PageApi.PageRecord>({
  pageCode: '',
  pageName: '',
  pageType: 'FORM',
  status: 1,
});

// 页面类型选项
const pageTypeOptions = [
  { label: '表单页面', value: 'FORM' },
  { label: '列表页面', value: 'LIST' },
  { label: '详情页面', value: 'DETAIL' },
];

// 弹窗标题
const modalTitle = computed(() => (props.editingRecord ? '编辑页面' : '新增页面'));

// 监听编辑记录变化
watch(
  () => props.editingRecord,
  (val) => {
    if (val) {
      formData.value = { ...val };
    } else {
      formData.value = {
        pageCode: '',
        pageName: '',
        pageType: 'FORM',
        status: 1,
      };
    }
  },
  { immediate: true },
);

// 处理提交
const handleSubmit = async () => {
  try {
    await saveOrUpdatePage(formData.value);
    message.success('保存成功');
    emit('update:show', false);
    emit('success');
  } catch (err) {
    message.error('保存失败');
  }
};
</script>

<template>
  <NModal
    :show="show"
    :title="modalTitle"
    preset="card"
    style="width: 600px"
    @update:show="$emit('update:show', $event)"
  >
    <NForm :model="formData" label-placement="left" label-width="100">
      <NFormItem label="页面编码" required>
        <NInput
          v-model:value="formData.pageCode"
          placeholder="请输入页面编码"
          :disabled="!!editingRecord"
        />
      </NFormItem>
      <NFormItem label="页面名称" required>
        <NInput v-model:value="formData.pageName" placeholder="请输入页面名称" />
      </NFormItem>
      <NFormItem label="页面类型" required>
        <NSelect
          v-model:value="formData.pageType"
          :options="pageTypeOptions"
          :disabled="!!editingRecord"
        />
      </NFormItem>
      <NFormItem label="状态">
        <NSwitch v-model:value="formData.status" :checked-value="1" :unchecked-value="0">
          <template #checked>启用</template>
          <template #unchecked>禁用</template>
        </NSwitch>
      </NFormItem>
      <NFormItem label="备注">
        <NInput
          v-model:value="formData.remark"
          placeholder="请输入备注"
          type="textarea"
        />
      </NFormItem>
    </NForm>
    <template #footer>
      <div class="flex justify-end gap-2">
        <NButton @click="$emit('update:show', false)">取消</NButton>
        <NButton type="primary" @click="handleSubmit">确定</NButton>
      </div>
    </template>
  </NModal>
</template> 
