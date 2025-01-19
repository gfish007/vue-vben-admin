import type { ComponentDefinition } from '#/types/lowcode';

export interface RecommendItem {
  id: string;
  title: string; // 标题
  subtitle?: string; // 副标题
  image: string; // 主图
  images?: string[]; // 多图模式
  price?: {
    current: number; // 当前价格
    original?: number; // 原价
    prefix?: string; // 价格前缀
    suffix?: string; // 价格后缀
  };
  tags?: Array<{
    // 标签
    backgroundColor?: string;
    color?: string;
    text: string;
  }>;
  badge?: {
    // 徽标
    text: string;
    type: 'error' | 'primary' | 'success' | 'warning';
  };
  link: {
    // 跳转链接
    type: 'none' | 'page' | 'url';
    value: string;
  };
  statistics?: {
    // 统计数据
    likes?: number; // 点赞数
    sales?: number; // 销量
    views?: number; // 浏览量
  };
}

export const Recommend: ComponentDefinition = {
  category: 'display',
  componentCode: 'Recommend',
  componentName: '推荐位',
  defaultProps: {
    // 动画相关
    animation: {
      delay: 0,
      duration: 300,
      type: 'fade', // none/fade/slide
    },
    aspectRatio: '1:1', // 图片宽高比
    borderRadius: 8, // 圆角
    columnsCount: 2, // 每行个数

    // 样式相关
    gutter: 16, // 间距
    hoverScale: 1.02, // 悬浮缩放
    imageCount: 1, // 多图模式下显示数量
    imageFit: 'cover', // fill/contain/cover
    // 图片相关
    imageMode: 'single', // single/multiple
    layout: 'horizontal', // horizontal/vertical
    // 布局相关
    mode: 'card', // card/list/waterfall

    shadow: true, // 阴影效果
    showBadge: true, // 显示徽标
    showOriginalPrice: true, // 显示原价

    showPrice: true, // 显示价格
    showStatistics: false, // 显示统计数据
    showSubtitle: false, // 显示副标题
    showTags: true, // 显示标签

    // 显示控制
    showTitle: true, // 显示标题

    // 测试数据
    items: [
      {
        badge: {
          text: 'HOT',
          type: 'error',
        },
        id: '1',
        image:
          'https://naive-ui.oss-cn-beijing.aliyuncs.com/carousel-img/carousel1.jpeg',
        link: {
          type: 'page',
          value: '/detail/1',
        },
        price: {
          current: 99.9,
          original: 199.9,
          prefix: '¥',
        },
        statistics: {
          likes: 200,
          sales: 1000,
          views: 5000,
        },
        subtitle: '商品副标题',
        tags: [
          { backgroundColor: '#f5222d', color: '#fff', text: '热销' },
          { backgroundColor: '#faad14', color: '#fff', text: '限时' },
        ],
        title: '商品标题1',
      },
    ] as RecommendItem[],
  },

  defaultStyle: {
    backgroundColor: '#ffffff',
    border: '1px dashed #e8e8e8',
    borderRadius: '4px',
    boxSizing: 'border-box',
    display: 'block',
    minHeight: '200px',
    padding: '16px',
    width: '100%',
  },

  group: 'basic',
  icon: 'i-carbon:recommend',

  propertyPanel: {
    customPanels: {
      data: 'RecommendData',
      props: 'RecommendProperty',
    },
    enabledTabs: ['props', 'style', 'data'],
  },

  propsSchema: {
    'animation.delay': {
      label: '延迟时间',
      max: 1000,
      min: 0,
      type: 'number',
    },
    'animation.duration': {
      label: '动画时长',
      max: 1000,
      min: 0,
      type: 'number',
    },
    'animation.type': {
      label: '动画类型',
      options: [
        { label: '无', value: 'none' },
        { label: '淡入', value: 'fade' },
        { label: '滑入', value: 'slide' },
      ],
      type: 'select',
    },
    aspectRatio: {
      label: '图片比例',
      options: [
        { label: '1:1', value: '1:1' },
        { label: '4:3', value: '4:3' },
        { label: '16:9', value: '16:9' },
        { label: '3:4', value: '3:4' },
      ],
      type: 'select',
    },
    borderRadius: {
      defaultValue: 8,
      label: '圆角',
      max: 24,
      min: 0,
      type: 'number',
    },
    columnsCount: {
      defaultValue: 2,
      label: '每行个数',
      max: 4,
      min: 1,
      type: 'number',
    },
    gutter: {
      defaultValue: 16,
      label: '间距',
      max: 48,
      min: 0,
      type: 'number',
    },
    hoverScale: {
      defaultValue: 1.02,
      label: '悬浮缩放',
      max: 1.2,
      min: 1,
      type: 'number',
    },
    imageCount: {
      defaultValue: 1,
      label: '图片数量',
      max: 9,
      min: 1,
      type: 'number',
    },
    imageFit: {
      label: '图片填充',
      options: [
        { label: '填充', value: 'fill' },
        { label: '包含', value: 'contain' },
        { label: '覆盖', value: 'cover' },
      ],
      type: 'select',
    },
    imageMode: {
      label: '图片模式',
      options: [
        { label: '单图', value: 'single' },
        { label: '多图', value: 'multiple' },
      ],
      type: 'select',
    },
    layout: {
      label: '布局方向',
      options: [
        { label: '水平', value: 'horizontal' },
        { label: '垂直', value: 'vertical' },
      ],
      type: 'select',
    },
    mode: {
      label: '展示模式',
      options: [
        { label: '卡片', value: 'card' },
        { label: '列表', value: 'list' },
        { label: '瀑布流', value: 'waterfall' },
      ],
      type: 'select',
    },
    shadow: {
      defaultValue: true,
      label: '阴影效果',
      type: 'switch',
    },
    showBadge: {
      defaultValue: true,
      label: '显示徽标',
      type: 'switch',
    },
    showOriginalPrice: {
      defaultValue: true,
      label: '显示原价',
      type: 'switch',
    },
    showPrice: {
      defaultValue: true,
      label: '显示价格',
      type: 'switch',
    },
    showStatistics: {
      defaultValue: false,
      label: '显示统计',
      type: 'switch',
    },
    showSubtitle: {
      defaultValue: false,
      label: '显示副标题',
      type: 'switch',
    },
    showTags: {
      defaultValue: true,
      label: '显示标签',
      type: 'switch',
    },
    showTitle: {
      defaultValue: true,
      label: '显示标题',
      type: 'switch',
    },
  },
};

export default Recommend;
