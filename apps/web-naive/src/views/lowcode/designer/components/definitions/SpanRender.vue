<script setup lang="ts" name="SpanRender">
import type { ComponentInstance } from '../../../../../types/lowcode';

import { onMounted, ref, watch } from 'vue';

import { useLowCodeStore } from '../../../../../store/modules/lowcode';

const props = defineProps<{
  component: ComponentInstance;
}>();

const store = useLowCodeStore();
const displayContent = ref<string>('');
const loading = ref(false);

// 创建数据源代理对象
const createDataSourceProxy = () => {
  return new Proxy(
    {},
    {
      get: (_, dsCode: string) => {
        return store.getDataSourceData(dsCode);
      },
    },
  );
};

// 执行转换函数
const executeTransform = async (transform: string) => {
  try {
    const DS = createDataSourceProxy();
    const transformFn = new Function(
      'DS',
      `
      return (async () => {
        ${transform}
      })();
    `,
    );
    return await transformFn(DS);
  } catch (error) {
    console.error('数据转换失败:', error);
    return null;
  }
};

// 更新显示内容
const updateContent = async () => {
  if (!props.component) return;

  const { dataBinding, props: componentProps } = props.component;

  // 如果是静态内容
  if (!dataBinding) {
    displayContent.value = componentProps?.content || '';
    return;
  }

  loading.value = true;
  try {
    // 处理数组或单个对象的情况
    const bindings = Array.isArray(dataBinding) ? dataBinding : [dataBinding];
    const values: string[] = [];

    for (const binding of bindings) {
      if (!binding.dsCode) {
        values.push(binding.defaultValue || '');
        continue;
      }

      // 获取数据源数据
      const dataSource = store.currentPage?.dataSources?.find(
        (ds) => ds.dsCode === binding.dsCode,
      );

      if (!dataSource) {
        values.push(binding.defaultValue || '');
        continue;
      }

      let dsData;
      if (dataSource.dsType === 'STATIC') {
        // 如果是静态数据源，直接使用 config.data
        dsData =
          typeof dataSource.config.data === 'string'
            ? JSON.parse(dataSource.config.data || '{}')
            : dataSource.config.data;
      } else {
        // 其他类型的数据源
        dsData = await store.getDataSourceData(binding.dsCode);
      }

      if (!dsData) {
        values.push(binding.defaultValue || '');
        continue;
      }

      // 获取路径数据
      let value = dsData;
      if (binding.path) {
        try {
          // 移除类型信息 (string) 等
          const cleanPath = binding.path.replace(/\s*\([^)]*\)\s*$/, '');
          const keys = cleanPath.split('.');
          for (const key of keys) {
            if (value === undefined || value === null) break;
            value = value[key];
          }
        } catch (error) {
          console.error('获取路径数据失败:', error);
          value = undefined;
        }
      }

      values.push(value ?? binding.defaultValue ?? '');
    }

    // 组合所有字段的值
    displayContent.value = values.join(' ');
  } catch (error) {
    console.error('更新内容失败:', error);
    displayContent.value = '';
  } finally {
    loading.value = false;
  }
};

// 监听组件变化
watch(() => props.component, updateContent, { deep: true });

// 监听数据源变化
watch(() => store.currentPage?.dataSources, updateContent, { deep: true });

// 组件挂载时更新内容
onMounted(updateContent);
</script>

<template>
  <span :class="{ loading }">{{ displayContent }}</span>
</template>

<style scoped>
.loading {
  cursor: wait;
  opacity: 0.6;
}
</style>
