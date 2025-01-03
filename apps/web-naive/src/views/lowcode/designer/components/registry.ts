import { NButton, NInput, NSelect, NSwitch, NForm, NFormItem, NSpace, NGrid, NGridItem } from 'naive-ui';
import type { Component } from '#/types/lowcode';

// 基础组件定义
export const baseComponents: Component[] = [
  // 布局组件
  {
    id: 3,
    tenantId: 'default',
    componentCode: 'NSpace',
    componentName: '间距',
    componentType: 'CONTAINER',
    category: '布局',
    icon: 'mdi:space-invaders',
    isContainer: true,
    status: 1,
    propsSchema: {
      justify: {
        type: 'enum',
        label: '水平对齐',
        options: [
          { label: '开始', value: 'start' },
          { label: '结束', value: 'end' },
          { label: '居中', value: 'center' },
          { label: '两端', value: 'space-between' },
          { label: '环绕', value: 'space-around' },
        ],
      },
      align: {
        type: 'enum',
        label: '垂直对齐',
        options: [
          { label: '开始', value: 'start' },
          { label: '结束', value: 'end' },
          { label: '居中', value: 'center' },
          { label: '基线', value: 'baseline' },
        ],
      },
      size: {
        type: 'enum',
        label: '间距大小',
        options: [
          { label: '小', value: 'small' },
          { label: '中', value: 'medium' },
          { label: '大', value: 'large' },
        ],
      },
      vertical: {
        type: 'boolean',
        label: '垂直排列',
      },
    },
    defaultProps: {
      justify: 'start',
      align: 'start',
      size: 'medium',
      vertical: false,
    },
  },
  {
    id: 4,
    tenantId: 'default',
    componentCode: 'NGrid',
    componentName: '栅格',
    componentType: 'CONTAINER',
    category: '布局',
    icon: 'mdi:grid',
    isContainer: true,
    status: 1,
    propsSchema: {
      cols: {
        type: 'number',
        label: '列数',
      },
      xGap: {
        type: 'number',
        label: '水平间距',
      },
      yGap: {
        type: 'number',
        label: '垂直间距',
      },
    },
    defaultProps: {
      cols: 24,
      xGap: 12,
      yGap: 12,
    },
  },
  {
    id: 5,
    tenantId: 'default',
    componentCode: 'NGridItem',
    componentName: '栅格项',
    componentType: 'CONTAINER',
    category: '布局',
    icon: 'mdi:grid-large',
    isContainer: true,
    status: 1,
    propsSchema: {
      span: {
        type: 'number',
        label: '跨度',
      },
      offset: {
        type: 'number',
        label: '偏移',
      },
    },
    defaultProps: {
      span: 6,
      offset: 0,
    },
  },

  // 表单组件
  {
    id: 6,
    tenantId: 'default',
    componentCode: 'NInput',
    componentName: '输入框',
    componentType: 'FORM',
    category: '表单',
    icon: 'mdi:form-textbox',
    isContainer: false,
    status: 1,
    propsSchema: {
      type: {
        type: 'enum',
        label: '类型',
        options: [
          { label: '文本', value: 'text' },
          { label: '密码', value: 'password' },
          { label: '文本域', value: 'textarea' },
        ],
      },
      placeholder: {
        type: 'string',
        label: '占位提示',
      },
      disabled: {
        type: 'boolean',
        label: '禁用',
      },
      clearable: {
        type: 'boolean',
        label: '可清除',
      },
    },
    defaultProps: {
      type: 'text',
      placeholder: '请输入',
      disabled: false,
      clearable: true,
    },
  },
  {
    id: 7,
    tenantId: 'default',
    componentCode: 'NSelect',
    componentName: '选择器',
    componentType: 'FORM',
    category: '表单',
    icon: 'mdi:form-select',
    isContainer: false,
    status: 1,
    propsSchema: {
      placeholder: {
        type: 'string',
        label: '占位提示',
      },
      disabled: {
        type: 'boolean',
        label: '禁用',
      },
      clearable: {
        type: 'boolean',
        label: '可清除',
      },
      multiple: {
        type: 'boolean',
        label: '多选',
      },
    },
    defaultProps: {
      placeholder: '请选择',
      disabled: false,
      clearable: true,
      multiple: false,
    },
  },
  {
    id: 1,
    tenantId: 'default',
    componentCode: 'NForm',
    componentName: '表单',
    componentType: 'CONTAINER',
    category: '表单',
    icon: 'mdi:form-select',
    isContainer: true,
    propsSchema: {
      labelPlacement: {
        type: 'enum',
        label: '标签位置',
        options: [
          { label: '左侧', value: 'left' },
          { label: '顶部', value: 'top' },
        ],
      },
      labelWidth: {
        type: 'number',
        label: '标签宽度',
      },
    },
    defaultProps: {
      labelPlacement: 'left',
      labelWidth: 100,
    },
  },
  {
    id: 2,
    tenantId: 'default',
    componentCode: 'NFormItem',
    componentName: '表单项',
    componentType: 'CONTAINER',
    category: '表单',
    icon: 'mdi:form-textbox',
    isContainer: true,
    propsSchema: {
      label: {
        type: 'string',
        label: '标签',
      },
      required: {
        type: 'boolean',
        label: '必填',
      },
    },
    defaultProps: {
      label: '表单项',
      required: false,
    },
  },
  // ... 其他组件定义
];

// 组件映射表
export const componentMap = {
  NButton,
  NInput,
  NSelect,
  NSwitch,
  NForm,
  NFormItem,
  NSpace,
  NGrid,
  NGridItem,
};

// 获取组件
export function getComponent(componentCode: string) {
  return componentMap[componentCode as keyof typeof componentMap];
} 
