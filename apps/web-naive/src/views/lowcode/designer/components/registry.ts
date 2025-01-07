import type { ComponentDefinition } from '../../../../types/lowcode';

export const componentCategories = [
  {
    code: 'basic',
    name: '基础组件',
    children: [
      { code: 'layout', name: '布局组件' },
      { code: 'form', name: '表单组件' },
      { code: 'display', name: '展示组件' },
      { code: 'feedback', name: '反馈组件' },
    ],
  },
  {
    code: 'business',
    name: '业务组件',
    children: [
      { code: 'table', name: '表格组件' },
      { code: 'chart', name: '图表组件' },
      { code: 'map', name: '地图组件' },
    ],
  },
] as const;

export const components: ComponentDefinition[] = [
  {
    category: 'layout',
    componentCode: 'Container',
    componentName: '容器',
    defaultProps: {
      direction: 'vertical',
      size: 16,
    },
    defaultStyle: {
      backgroundColor: '#fafafa',
      border: '1px dashed #e8e8e8',
      borderRadius: '4px',
      minHeight: '240px',
      padding: '16px',
      width: '100%',
    },
    group: 'basic',
    icon: 'layout',
    propsSchema: {
      direction: {
        defaultValue: 'vertical',
        label: '排列方向',
        options: [
          { label: '垂直', value: 'vertical' },
          { label: '水平', value: 'horizontal' },
        ],
        type: 'select',
      },
      size: {
        defaultValue: 16,
        label: '间距',
        max: 48,
        min: 0,
        type: 'number',
      },
    },
  },
  {
    category: 'form',
    componentCode: 'Input',
    componentName: '输入框',
    defaultProps: {
      clearable: true,
      placeholder: '请输入',
      type: 'text',
      value: '',
    },
    defaultStyle: {
      width: '100%',
    },
    group: 'basic',
    icon: 'text-input',
    propsSchema: {
      clearable: {
        defaultValue: true,
        label: '可清除',
        type: 'switch',
      },
      placeholder: {
        defaultValue: '请输入',
        label: '占位提示',
        type: 'input',
      },
      type: {
        defaultValue: 'text',
        label: '输入类型',
        options: [
          { label: '文本', value: 'text' },
          { label: '密码', value: 'password' },
          { label: '数字', value: 'number' },
        ],
        type: 'select',
      },
      value: {
        defaultValue: '',
        label: '默认值',
        type: 'input',
      },
    },
  },
  {
    category: 'form',
    componentCode: 'Select',
    componentName: '选择框',
    defaultProps: {
      clearable: true,
      options: [
        { label: '选项1', value: '1' },
        { label: '选项2', value: '2' },
        { label: '选项3', value: '3' },
      ],
      placeholder: '请选择',
      value: null,
    },
    defaultStyle: {
      width: '100%',
    },
    group: 'basic',
    icon: 'select',
    propsSchema: {
      clearable: {
        defaultValue: true,
        label: '可清除',
        type: 'switch',
      },
      options: {
        defaultValue: [],
        label: '选项',
        type: 'input',
      },
      placeholder: {
        defaultValue: '请选择',
        label: '占位提示',
        type: 'input',
      },
      value: {
        defaultValue: null,
        label: '默认值',
        type: 'input',
      },
    },
  },
  {
    category: 'form',
    componentCode: 'Switch',
    componentName: '开关',
    defaultProps: {
      value: false,
    },
    defaultStyle: {
      width: 'auto',
    },
    group: 'basic',
    icon: 'switch',
    propsSchema: {
      value: {
        defaultValue: false,
        label: '默认值',
        type: 'switch',
      },
    },
  },
  {
    category: 'display',
    componentCode: 'Text',
    componentName: '文本',
    defaultProps: {
      content: '文本内容',
      type: 'default',
    },
    defaultStyle: {
      color: '#333',
      fontSize: '14px',
      lineHeight: '1.5',
      width: '100%',
    },
    group: 'basic',
    icon: 'text',
    propsSchema: {
      content: {
        defaultValue: '文本内容',
        label: '文本内容',
        type: 'input',
      },
      type: {
        defaultValue: 'default',
        label: '文本类型',
        options: [
          { label: '默认', value: 'default' },
          { label: '主要', value: 'primary' },
          { label: '成功', value: 'success' },
          { label: '警告', value: 'warning' },
          { label: '错误', value: 'error' },
        ],
        type: 'select',
      },
    },
  },
];
