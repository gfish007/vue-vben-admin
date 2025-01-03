<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import {
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSwitch,
  NModal,
  NSpace,
  NButton,
  useMessage,
} from 'naive-ui';
import type { FormInst, FormRules } from 'naive-ui';
import type { PageConfig } from '#/types/lowcode';
import { saveOrUpdatePage } from '#/api/lowcode/page';
const props = defineProps<{
  show: boolean;
  editingRecord?: Nullable<PageConfig>;
}>();

const emit = defineEmits(['update:show', 'success']);

const message = useMessage();
const formRef = ref<FormInst | null>(null);
const loading = ref(false);

// 表单数据
const formData = reactive<Partial<PageConfig>>({
  pageCode: '',
  pageName: '',
  pageType: 'FORM',
  status: 1,
  remark: '',
});

// 页面类型选项
const pageTypeOptions = [
  { label: '表单页面', value: 'FORM' },
  { label: '列表页面', value: 'LIST' },
  { label: '详情页面', value: 'DETAIL' },
];

// 表单校验规则
const rules: FormRules = {
  pageCode: [
    { required: true, message: '请输入页面编码' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '页面编码只能包含字母、数字和下划线,且必须以字母开头' },
  ],
  pageName: [
    { required: true, message: '请输入页面名称' },
  ],
  pageType: [
    { required: true, message: '请选择页面类型' },
  ],
};

// 监听编辑记录变化
watch(
  () => props.editingRecord,
  (val) => {
    if (val) {
      Object.assign(formData, val);
    } else {
      Object.assign(formData, {
        pageCode: '',
        pageName: '',
        pageType: 'FORM',
        status: 1,
        remark: '',
      });
    }
  },
  { immediate: true },
);

// 处理取消
const handleCancel = () => {
  emit('update:show', false);
};

// 处理确认
const handleConfirm = async () => {
  try {
    await formRef.value?.validate();
    loading.value = true;
    const isEdit = !!props.editingRecord;
    const api = isEdit ? saveOrUpdatePage : saveOrUpdatePage;
    await api(formData);
    message.success(`${isEdit ? '更新' : '创建'}成功`);
    emit('success');
    handleCancel();
  } catch (err) {
    // 表单校验失败
    if (err instanceof Error) {
      message.error(err.message);
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <NModal
    :show="show"
    :title="editingRecord ? '编辑页面' : '新增页面'"
    preset="dialog"
    @close="handleCancel"
    @update:show="$emit('update:show', $event)"
  >
    <NForm
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-placement="left"
      label-width="100"
      require-mark-placement="right-hanging"
    >
      <NFormItem label="页面编码" path="pageCode">
        <NInput
          v-model:value="formData.pageCode"
          :disabled="!!editingRecord"
          placeholder="请输入页面编码"
        />
      </NFormItem>
      <NFormItem label="页面名称" path="pageName">
        <NInput v-model:value="formData.pageName" placeholder="请输入页面名称" />
      </NFormItem>
      <NFormItem label="页面类型" path="pageType">
        <NSelect
          v-model:value="formData.pageType"
          :options="pageTypeOptions"
          placeholder="请选择页面类型"
        />
      </NFormItem>
      <NFormItem label="状态" path="status">
        <NSwitch
          v-model:value="formData.status"
          :checked-value="1"
          :unchecked-value="0"
        >
          <template #checked>启用</template>
          <template #unchecked>禁用</template>
        </NSwitch>
      </NFormItem>
      <NFormItem label="备注" path="remark">
        <NInput
          v-model:value="formData.remark"
          placeholder="请输入备注"
          type="textarea"
        />
      </NFormItem>
    </NForm>
    <template #action>
      <NSpace>
        <NButton @click="handleCancel">取消</NButton>
        <NButton :loading="loading" type="primary" @click="handleConfirm">
          确定
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template> 
