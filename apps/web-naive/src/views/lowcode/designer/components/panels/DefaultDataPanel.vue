# 默认数据源面板组件
<script setup lang="ts" name="DefaultDataPanel">
import type { ComponentInstance } from '../../../../../types/lowcode';

import { computed, ref, watch } from 'vue';

import {
  NButton,
  NCard,
  NCode,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPopover,
  NRadio,
  NRadioGroup,
  NSelect,
  NSpace,
  NSwitch,
  NTree,
  useMessage,
} from 'naive-ui';

import { useLowCodeStore } from '../../../../../store/modules/lowcode';

import 'highlight.js/styles/vs2015.css';

const props = defineProps<{
  component: ComponentInstance;
}>();

const store = useLowCodeStore();
const message = useMessage();

// 数据源范围
const sourceScope = ref<'GLOBAL' | 'PAGE'>(
  props.component.props?.dataBinding?.sourceType || 'PAGE',
);

// 全局数据源列表
const globalDataSources = computed(() => store.globalDataSources || []);

// 页面数据源列表
const pageDataSources = computed(() => store.currentPage?.dataSources || []);

// 当前可用的数据源列表
const availableDataSources = computed(() => {
  return sourceScope.value === 'GLOBAL'
    ? globalDataSources.value
    : pageDataSources.value;
});

// 当前选中的数据源
const selectedDataSource = computed(() => {
  const binding = props.component.props?.dataBinding;
  if (!binding) return null;

  return sourceScope.value === 'GLOBAL'
    ? globalDataSources.value.find((ds) => ds.dsCode === binding.sourceCode)
    : pageDataSources.value.find((ds) => ds.dsCode === binding.sourceCode);
});

// 数据源选项
const dataSourceOptions = computed(() => {
  return availableDataSources.value.map((ds) => ({
    label: ds.dsName,
    value: ds.dsCode,
  }));
});

// 数据路径
const dataPath = ref(props.component.props?.dataBinding?.path || '');

// 数据转换配置
const transformConfig = ref({
  code: props.component.props?.dataBinding?.transform || '',
  dependencies: props.component.props?.dataBinding?.dependencies || [],
  enabled: !!props.component.props?.dataBinding?.transform,
});

// 预览数据
const previewData = ref('');

// 数据路径树
const dataPathTree = computed(() => {
  if (!selectedDataSource.value) return [];

  try {
    let data = {};
    if (selectedDataSource.value.dsType === 'STATIC') {
      data = JSON.parse(
        (selectedDataSource.value.config as StaticDataSourceConfig).data ||
          '{}',
      );
    } else if (selectedDataSource.value.dsType === 'API') {
      // 使用示例响应数据结构
      data = {
        code: 200,
        data: {
          total: 2,
          list: [
            { id: 1, name: 'Item 1', status: 'active' },
            { id: 2, name: 'Item 2', status: 'inactive' },
          ],
        },
        message: 'success',
      };
    }

    return convertToTree(data);
  } catch (error) {
    console.error('解析数据结构失败:', error);
    return [];
  }
});

// 将数据对象转换为树形结构
const convertToTree = (data: any, path = '') => {
  if (!data || typeof data !== 'object') return [];

  return Object.entries(data).map(([key, value]) => {
    const currentPath = path ? `${path}.${key}` : key;
    const isObject = value && typeof value === 'object';

    return {
      key: currentPath,
      label: key,
      type: Array.isArray(value) ? 'array' : typeof value,
      children: isObject ? convertToTree(value, currentPath) : undefined,
    };
  });
};

// 获取数据源数据
const getDataSourceData = async (dsCode: string, path?: string) => {
  try {
    const ds = [...globalDataSources.value, ...pageDataSources.value].find(
      (d) => d.dsCode === dsCode,
    );
    if (!ds) {
      throw new Error(`数据源 ${dsCode} 不存在`);
    }

    let data: any;
    if (ds.dsType === 'STATIC') {
      data = JSON.parse((ds.config as StaticDataSourceConfig).data || '{}');
    } else if (ds.dsType === 'API') {
      const config = ds.config as ApiDataSourceConfig;
      const response = await fetch(config.url, {
        body: config.method === 'GET' ? undefined : config.params,
        headers: {
          'Content-Type': 'application/json',
          ...JSON.parse(config.headers || '{}'),
        },
        method: config.method,
      });
      data = await response.json();
    }

    // 应用数据路径
    if (path) {
      const paths = path.split('.');
      for (const p of paths) {
        if (data && typeof data === 'object') {
          data = data[p];
        } else {
          data = undefined;
          break;
        }
      }
    }

    return data;
  } catch (error) {
    console.error('获取数据源数据失败:', error);
    throw error;
  }
};

// 创建数据源代理对象
const createDataSourceProxy = async () => {
  const allDataSources = [...globalDataSources.value, ...pageDataSources.value];
  const proxy = new Proxy(
    {},
    {
      get: (target, prop) => {
        if (typeof prop !== 'string') return undefined;
        const ds = allDataSources.find((d) => d.dsCode === prop);
        if (!ds) return undefined;

        return new Proxy(
          {},
          {
            get: async (_, subProp) => {
              if (typeof subProp !== 'string') return undefined;
              const data = await getDataSourceData(ds.dsCode);
              return data?.[subProp];
            },
          },
        );
      },
    },
  );
  return proxy;
};

// 更新预览数据
const updatePreview = async () => {
  try {
    if (!selectedDataSource.value) {
      previewData.value = '请选择数据源';
      return;
    }

    let data: any;
    if (selectedDataSource.value.dsType === 'STATIC') {
      data = JSON.parse(
        (selectedDataSource.value.config as StaticDataSourceConfig).data ||
          '{}',
      );
    } else if (selectedDataSource.value.dsType === 'API') {
      const config = selectedDataSource.value.config as ApiDataSourceConfig;
      const response = await fetch(config.url, {
        body: config.method === 'GET' ? undefined : config.params,
        headers: {
          'Content-Type': 'application/json',
          ...JSON.parse(config.headers || '{}'),
        },
        method: config.method,
      });
      data = await response.json();
    }

    // 应用数据路径
    if (dataPath.value) {
      const paths = dataPath.value.split('.');
      for (const path of paths) {
        if (data && typeof data === 'object') {
          data = data[path];
        } else {
          data = undefined;
          break;
        }
      }
    }

    // 应用数据转换
    if (transformConfig.value.enabled && transformConfig.value.code) {
      const DS = await createDataSourceProxy();
      const context = {
        data,
        DS,
        async getDataSourceData(dsCode: string, path?: string) {
          return getDataSourceData(dsCode, path);
        },
      };

      const transformFn = new Function(
        'context',
        `
        const { data, DS, getDataSourceData } = context;
        try {
          ${transformConfig.value.code}
        } catch (error) {
          console.error('数据转换失败:', error);
          return data;
        }
      `,
      );

      data = await transformFn(context);
    }

    previewData.value = JSON.stringify(data, null, 2);
  } catch (error) {
    previewData.value = `预览失败: ${error instanceof Error ? error.message : String(error)}`;
  }
};

// 更新数据绑定配置
const updateDataBinding = (newSourceCode?: string) => {
  const binding = {
    dependencies: transformConfig.value.dependencies,
    path: dataPath.value,
    sourceCode: newSourceCode || selectedDataSource.value?.dsCode,
    sourceType: sourceScope.value,
    transform: transformConfig.value.enabled
      ? transformConfig.value.code
      : undefined,
  };

  store.updateComponent(props.component.componentInstanceId, {
    props: {
      ...props.component.props,
      dataBinding: binding,
    },
  });

  updatePreview();
};

// 监听数据源变化
watch(selectedDataSource, updatePreview, { immediate: true });

// 选择数据路径
const handlePathSelect = (keys: string[]) => {
  if (keys.length > 0) {
    dataPath.value = keys[0];
    updateDataBinding();
  }
};

// 验证转换代码
const validateTransformCode = (code: string) => {
  try {
    new Function('data', code);
    return true;
  } catch {
    return false;
  }
};

// 教程弹窗控制
const showTutorial = ref(false);

// 文本内容配置
const textConfig = ref({
  dynamicValue: props.component.props?.textConfig?.dynamicValue || null,
  mode: props.component.props?.textConfig?.mode || 'static', // static 或 dynamic
  staticValue: props.component.props?.textConfig?.staticValue || '',
});

// 更新文本配置
const updateTextConfig = () => {
  store.updateComponent(props.component.componentInstanceId, {
    props: {
      ...props.component.props,
      textConfig: {
        dynamicValue: textConfig.value.dynamicValue,
        mode: textConfig.value.mode,
        staticValue: textConfig.value.staticValue,
      },
    },
  });
};
</script>

<template>
  <NForm class="data-panel-form" label-placement="left" label-width="100">
    <NSpace vertical>
      <!-- 教程按钮 -->
      <NSpace justify="end">
        <NButton quaternary type="primary" @click="showTutorial = true">
          使用教程
        </NButton>
      </NSpace>

      <!-- 教程弹窗 -->
      <NModal
        v-model:show="showTutorial"
        preset="card"
        style="width: 600px"
        title="数据配置使用教程"
      >
        <NSpace vertical>
          <div class="tutorial-section">
            <div class="tutorial-title">1. 数据源配置</div>
            <div class="tutorial-content">
              - 选择数据范围：全局数据源或页面数据源<br />
              - 选择具体的数据源：如用户列表(USER_LIST)
            </div>
          </div>
          <div class="tutorial-section">
            <div class="tutorial-title">2. 数据路径配置</div>
            <div class="tutorial-content">
              - 通过树形结构选择数据路径<br />
              - 或直接输入路径，如：data.list
            </div>
          </div>
          <div class="tutorial-section">
            <div class="tutorial-title">3. 数据转换配置</div>
            <div class="tutorial-content">
              <div>基础语法：</div>
              <NCode
                code="// 1. 使用DS语法访问数据源（推荐）
const name = await DS.USER_LIST.name;

// 2. 使用函数访问数据源
const data = await getDataSourceData(
  'USER_LIST',  // 数据源编码
  'data.list'   // 数据路径
);"
                language="typescript"
              />
            </div>
          </div>
          <div class="tutorial-section">
            <div class="tutorial-title">4. 常见用例</div>
            <div class="tutorial-content">
              <div class="use-case">
                <strong>数据过滤：</strong>
                <NCode
                  code="// 过滤活跃用户
return data.filter(item => item.status === 'active');"
                  language="typescript"
                />
              </div>
              <div class="use-case">
                <strong>数据关联：</strong>
                <NCode
                  code="// 关联部门信息
const deptName = await DS.DEPT_LIST.name;
return { ...data, deptName };"
                  language="typescript"
                />
              </div>
              <div class="use-case">
                <strong>数据聚合：</strong>
                <NCode
                  code="// 计算总金额和收集商品名称
return data.reduce((acc, item) => ({
  total: acc.total + item.amount,
  items: [...acc.items, item.name]
}), { total: 0, items: [] });"
                  language="typescript"
                />
              </div>
            </div>
          </div>
        </NSpace>
      </NModal>

      <!-- 文本内容配置 -->
      <NCard size="small" title="文本内容">
        <NSpace vertical>
          <NFormItem label="内容类型">
            <NRadioGroup
              v-model:value="textConfig.mode"
              @update:value="updateTextConfig"
            >
              <NSpace>
                <NRadio value="static">静态文本</NRadio>
                <NRadio value="dynamic">数据绑定</NRadio>
              </NSpace>
            </NRadioGroup>
          </NFormItem>

          <!-- 静态文本输入 -->
          <NFormItem v-if="textConfig.mode === 'static'" label="静态文本">
            <NInput
              :autosize="{ minRows: 1, maxRows: 5 }"
              :value="textConfig.staticValue"
              placeholder="请输入文本内容"
              type="textarea"
              @update:value="
                (val) => {
                  textConfig.staticValue = val;
                  updateTextConfig();
                }
              "
            />
          </NFormItem>

          <!-- 数据绑定配置 -->
          <template v-if="textConfig.mode === 'dynamic'">
            <!-- 数据源范围选择 -->
            <NCard size="small" title="数据源范围">
              <NSpace vertical>
                <NRadioGroup
                  v-model:value="sourceScope"
                  @update:value="updateDataBinding"
                >
                  <NSpace>
                    <NRadio value="GLOBAL">全局数据源</NRadio>
                    <NRadio value="PAGE">页面数据源</NRadio>
                  </NSpace>
                </NRadioGroup>
              </NSpace>
            </NCard>

            <!-- 数据源选择 -->
            <NCard size="small" title="数据源配置">
              <NSpace vertical>
                <NFormItem label="选择数据源">
            <NSelect
                    :options="dataSourceOptions"
                    :value="selectedDataSource?.dsCode"
                    placeholder="请选择数据源"
                    @update:value="
                      (code) => {
                        if (code) {
                          updateDataBinding(code);
                        }
                      }
                    "
            />
          </NFormItem>
              </NSpace>
            </NCard>

            <!-- 数据路径配置 -->
            <NCard size="small">
              <template #header>
                <NSpace align="center" justify="space-between">
                  <span>数据路径配置</span>
                  <NPopover trigger="hover">
                    <template #trigger>
                      <NButton circle quaternary size="tiny">?</NButton>
                    </template>
                    <div style="max-width: 300px">
                      选择或输入数据访问路径，支持点号访问嵌套数据，例如：data.list
                    </div>
                  </NPopover>
                </NSpace>
              </template>
              <NSpace vertical>
                <NFormItem label="数据路径">
              <NInput
                    :value="dataPath"
                    placeholder="请选择或输入数据路径"
                    @update:value="
                      (val) => {
                        dataPath = val;
                        updateDataBinding();
                      }
                    "
              />
            </NFormItem>
                <NFormItem label="数据结构">
                  <div class="data-tree-wrapper">
                    <NTree
                      :data="dataPathTree"
                      block-line
                      selectable
                      @update:selected-keys="handlePathSelect"
                    />
                  </div>
            </NFormItem>
              </NSpace>
            </NCard>

            <!-- 数据转换配置 -->
            <NCard size="small">
              <template #header>
                <NSpace align="center" justify="space-between">
                  <span>数据转换</span>
                  <NPopover trigger="hover">
                    <template #trigger>
                      <NButton circle quaternary size="tiny">?</NButton>
                    </template>
                    <div style="max-width: 300px">
                      配置数据转换函数，支持以下方式访问数据：<br />
                      1. DS.数据源编码.属性名 - 例如：DS.USER_LIST.name<br />
                      2. getDataSourceData('数据源编码', '数据路径')
                    </div>
                  </NPopover>
                </NSpace>
              </template>
              <NSpace vertical>
                <NFormItem label="启用转换">
                  <NSwitch
                    :value="transformConfig.enabled"
                @update:value="
                      (val) => {
                        transformConfig.enabled = val;
                        updateDataBinding();
                      }
                "
              />
            </NFormItem>
                <div v-if="transformConfig.enabled">
                  <NFormItem label="依赖数据源">
                    <NSelect
                      v-model:value="transformConfig.dependencies"
                      :options="
                        [...globalDataSources, ...pageDataSources].map(
                          (ds) => ({
                            label: ds.dsName,
                            value: ds.dsCode,
                          }),
                        )
                      "
                      multiple
                      placeholder="选择依赖的其他数据源"
                    />
                  </NFormItem>
              <NInput
                    :autosize="{ minRows: 3, maxRows: 10 }"
                    :value="transformConfig.code"
                    placeholder="请输入数据转换代码，可以使用 getDataSourceData 函数获取其他数据源数据"
                type="textarea"
                @update:value="
                      (val) => {
                        if (validateTransformCode(val)) {
                          transformConfig.code = val;
                          updateDataBinding();
                        } else {
                          message.error('转换代码格式错误');
                        }
                      }
                    "
                  />
                  <div class="mt-2">
                    <NSpace>
                      <NButton
                        size="small"
                        @click="
                          () => {
                            transformConfig.code = `// 使用DS语法示例
const userName = await DS.USER_LIST.name;
const userAge = await DS.USER_LIST.age;
return {
  name: userName,
  age: userAge,
  isAdult: userAge >= 18
};`;
                            updateDataBinding();
                          }
                        "
                      >
                        属性访问
                      </NButton>
                      <NButton
                        size="small"
                        @click="
                          () => {
                            transformConfig.code = `// 多数据源组合示例
const userName = await DS.USER_LIST.name;
const deptName = await DS.DEPT_LIST.name;
return {
  userName,
  deptName,
  fullTitle: \`\${deptName} - \${userName}\`
};`;
                            updateDataBinding();
                          }
                        "
                      >
                        数据组合
                      </NButton>
                      <NButton
                        size="small"
                        @click="
                          () => {
                            transformConfig.code = `// 关联部门数据示例
const deptList = await getDataSourceData('DEPT_LIST', 'data.list');
return data.map(user => {
  const dept = deptList.find(dept => dept.id === user.deptId);
  return {
    ...user,
    deptName: dept?.name || '未知部门'
  };
});`;
                            updateDataBinding();
                          }
                        "
                      >
                        数据关联
                      </NButton>
                      <NButton
                        size="small"
                        @click="
                          () => {
                            transformConfig.code = `// 数据过滤转换
return data.filter(item => item.status === 'active');`;
                            updateDataBinding();
                          }
                        "
                      >
                        数据过滤
                      </NButton>
                      <NButton
                        size="small"
                        @click="
                          () => {
                            transformConfig.code = `// 数据聚合转换
return data.reduce((acc, item) => {
  acc.total += item.amount;
  acc.items.push(item.name);
  return acc;
}, { total: 0, items: [] });`;
                            updateDataBinding();
                          }
                        "
                      >
                        数据聚合
                      </NButton>
          </NSpace>
                  </div>
                </div>
        </NSpace>
      </NCard>

            <!-- 数据预览 -->
            <NCard size="small">
              <template #header>
                <NSpace align="center" justify="space-between">
                  <span>数据预览</span>
                  <NPopover trigger="hover">
                    <template #trigger>
                      <NButton circle quaternary size="tiny">?</NButton>
                    </template>
                    <div style="max-width: 300px">
                      显示当前数据源的数据，包含数据路径和转换后的结果
                    </div>
                  </NPopover>
                </NSpace>
              </template>
        <NSpace vertical>
                <NCode
                  :code="previewData"
                  language="json"
                  show-line-numbers
                  word-wrap
                />
              </NSpace>
            </NCard>
          </template>
        </NSpace>
      </NCard>
    </NSpace>
  </NForm>
</template>

<style scoped>
.data-panel-form {
  width: 100%;
  min-width: 400px;
  padding: 16px;
}

.mt-2 {
  margin-top: 8px;
}

.data-tree-wrapper {
  max-height: 300px;
  padding: 8px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 3px;
}

:deep(.n-card-header) {
  padding: 8px 16px !important;
}

:deep(.n-card__content) {
  padding: 16px !important;
}

:deep(.n-form-item:last-child) {
  margin-bottom: 0;
}

.tutorial-section {
  padding: 8px 0;
}

.tutorial-title {
  margin-bottom: 4px;
  font-weight: bold;
  color: var(--primary-color);
}

.tutorial-content {
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-color-2);
}

.use-case {
  margin-top: 8px;
}

.use-case strong {
  display: block;
  margin-bottom: 4px;
  color: var(--text-color-1);
}

:deep(.n-code) {
  margin: 4px 0;
  font-size: 12px !important;
}
</style>
