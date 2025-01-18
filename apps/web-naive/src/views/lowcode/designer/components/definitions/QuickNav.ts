import type { ComponentDefinition } from '#/types/lowcode';

export interface QuickNavItem {
  id: string;
  iconType: 'icon' | 'image';
  icon: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  badge?: {
    color: string;
    content: string;
    show: boolean;
  };
  link: {
    type: 'page' | 'url';
    value: string;
  };
  disabled?: boolean;
  order?: number;
  visible?: boolean;
}

interface ResponsiveConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

const QuickNav: ComponentDefinition = {
  category: 'display',
  componentCode: 'QuickNav',
  componentName: '金刚区',
  defaultProps: {
    activeScale: 1.05,
    animationType: 'scale',
    badgeStyle: {
      backgroundColor: '#f5222d',
      borderRadius: '10px',
      padding: '0 6px',
      textColor: '#ffffff',
    },
    borderRadius: 8,
    columnsCount: 5,
    enableAnimation: true,
    gutter: 16,
    iconSize: 32,
    layout: 'grid',
    responsive: {
      lg: 6,
      md: 5,
      sm: 4,
      xl: 8,
      xs: 3,
    } as ResponsiveConfig,
    showBackground: true,
    showBorder: true,
    showSubtitle: false,
    showTitle: true,
    items: [
      {
        badge: {
          color: '#f5222d',
          content: '',
          show: false,
        },
        disabled: false,
        icon: 'i-carbon:home',
        iconColor: '#1890ff',
        iconType: 'icon',
        id: '1',
        link: {
          type: 'page',
          value: '/home',
        },
        order: 1,
        subtitle: '回到首页',
        title: '首页',
        visible: true,
      },
      {
        badge: {
          color: '#f5222d',
          content: '99+',
          show: true,
        },
        disabled: false,
        icon: 'i-carbon:shopping-cart',
        iconColor: '#52c41a',
        iconType: 'icon',
        id: '2',
        link: {
          type: 'page',
          value: '/cart',
        },
        order: 2,
        title: '购物车',
        visible: true,
      },
    ] as QuickNavItem[],
  },
  defaultStyle: {
    backgroundColor: '#ffffff',
    border: '1px dashed #e8e8e8',
    borderRadius: '4px',
    boxSizing: 'border-box',
    display: 'block',
    minHeight: '120px',
    padding: '16px',
    width: '100%',
  },
  group: 'basic',
  icon: 'i-carbon:grid',
  propertyPanel: {
    customPanels: {
      data: 'QuickNavData',
      props: 'QuickNavProperty',
    },
    enabledTabs: ['props', 'style', 'data'],
  },
  propsSchema: {
    activeScale: {
      defaultValue: 1.05,
      label: '点击缩放',
      max: 1.2,
      min: 1,
      type: 'number',
    },
    animationType: {
      defaultValue: 'scale',
      label: '动画类型',
      options: [
        { label: '缩放', value: 'scale' },
        { label: '淡入淡出', value: 'fade' },
        { label: '无', value: 'none' },
      ],
      type: 'select',
    },
    'badgeStyle.backgroundColor': {
      defaultValue: '#f5222d',
      label: '徽标背景色',
      type: 'input',
    },
    'badgeStyle.borderRadius': {
      defaultValue: '10px',
      label: '徽标圆角',
      type: 'input',
    },
    'badgeStyle.padding': {
      defaultValue: '0 6px',
      label: '徽标内边距',
      type: 'input',
    },
    'badgeStyle.textColor': {
      defaultValue: '#ffffff',
      label: '徽标文字色',
      type: 'input',
    },
    borderRadius: {
      defaultValue: 8,
      label: '圆角',
      max: 24,
      min: 0,
      type: 'number',
    },
    columnsCount: {
      defaultValue: 5,
      label: '每行个数',
      max: 8,
      min: 3,
      type: 'number',
    },
    enableAnimation: {
      defaultValue: true,
      label: '启用动画',
      type: 'switch',
    },
    gutter: {
      defaultValue: 16,
      label: '间距',
      max: 48,
      min: 0,
      type: 'number',
    },
    iconSize: {
      defaultValue: 32,
      label: '图标大小',
      max: 64,
      min: 16,
      type: 'number',
    },
    layout: {
      label: '布局方式',
      options: [
        { label: '网格', value: 'grid' },
        { label: '水平', value: 'horizontal' },
        { label: '垂直', value: 'vertical' },
      ],
      type: 'select',
    },
    'responsive.lg': {
      defaultValue: 6,
      label: '大屏列数',
      max: 8,
      min: 4,
      type: 'number',
    },
    'responsive.md': {
      defaultValue: 5,
      label: '中屏列数',
      max: 8,
      min: 3,
      type: 'number',
    },
    'responsive.sm': {
      defaultValue: 4,
      label: '小屏列数',
      max: 6,
      min: 2,
      type: 'number',
    },
    'responsive.xl': {
      defaultValue: 8,
      label: '超大屏列数',
      max: 10,
      min: 4,
      type: 'number',
    },
    'responsive.xs': {
      defaultValue: 3,
      label: '超小屏列数',
      max: 6,
      min: 2,
      type: 'number',
    },
    showBackground: {
      defaultValue: true,
      label: '显示背景',
      type: 'switch',
    },
    showBorder: {
      defaultValue: true,
      label: '显示边框',
      type: 'switch',
    },
    showSubtitle: {
      defaultValue: false,
      label: '显示副标题',
      type: 'switch',
    },
    showTitle: {
      defaultValue: true,
      label: '显示标题',
      type: 'switch',
    },
  },
};

export default QuickNav;
