import type { ComponentDefinition } from '#/types/lowcode';

export interface CarouselItem {
  fileUrl: string;
  eventType: string;
  link: string;
}

const Carousel: ComponentDefinition = {
  category: 'display',
  componentCode: 'Carousel',
  componentName: '轮播图',
  defaultProps: {
    autoplay: true,
    dotPlacement: 'bottom',
    effect: 'slide',
    interval: 3000,
    showArrow: true,
    showDots: true,
    items: [
      {
        eventType: 'page',
        fileUrl:
          'https://naive-ui.oss-cn-beijing.aliyuncs.com/carousel-img/carousel1.jpeg',
        link: '',
      },
      {
        eventType: 'page',
        fileUrl:
          'https://naive-ui.oss-cn-beijing.aliyuncs.com/carousel-img/carousel2.jpeg',
        link: '',
      },
      {
        eventType: 'page',
        fileUrl:
          'https://naive-ui.oss-cn-beijing.aliyuncs.com/carousel-img/carousel3.jpeg',
        link: '',
      },
    ] as CarouselItem[],
  },
  defaultStyle: {
    backgroundColor: '#ffffff',
    border: '1px dashed #e8e8e8',
    borderRadius: '4px',
    boxSizing: 'border-box',
    display: 'block',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '1px',
    height: '200px',
    margin: '0',
    minHeight: '32px',
    padding: '0',
    width: '100%',
  },
  group: 'basic',
  icon: 'i-carbon:carousel-horizontal',
  propertyPanel: {
    customPanels: {
      props: 'CarouselProperty',
    },
    enabledTabs: ['props', 'style'],
  },
  propsSchema: {
    autoplay: {
      defaultValue: true,
      label: '自动播放',
      type: 'switch',
    },
    dotPlacement: {
      defaultValue: 'bottom',
      label: '指示器位置',
      options: [
        { label: '顶部', value: 'top' },
        { label: '底部', value: 'bottom' },
        { label: '左侧', value: 'left' },
        { label: '右侧', value: 'right' },
      ],
      type: 'select',
    },
    effect: {
      defaultValue: 'slide',
      label: '切换效果',
      options: [
        { label: '滑动', value: 'slide' },
        { label: '淡入淡出', value: 'fade' },
      ],
      type: 'select',
    },
    interval: {
      defaultValue: 3000,
      label: '播放间隔',
      max: 10_000,
      min: 1000,
      type: 'number',
    },
    showArrow: {
      defaultValue: true,
      label: '显示箭头',
      type: 'switch',
    },
    showDots: {
      defaultValue: true,
      label: '显示指示点',
      type: 'switch',
    },
  },
};

export default Carousel;
