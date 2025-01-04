import type { Component } from '#/types/lowcode';
import { CarouselRender } from './CarouselRender';
import CarouselProps from './CarouselProps.vue';

export const Carousel: Component = {
  componentName: '轮播图',
  componentCode: 'Carousel',
  componentType: 'DISPLAY',
  category: '展示组件',
  isContainer: false,
  status: 1,

  // 使用自定义属性编辑器
  propEditor: CarouselProps,

  // 默认属性值
  defaultProps: {
    autoplay: true,
    interval: 3000,
    effect: 'slide',
    dotType: 'dot',
    dotPlacement: 'bottom',
    showArrow: 'hover',
    style: {
      width: '100%',
      height: '240px',
    },
    image1: {
      url: 'https://naive-ui.oss-cn-beijing.aliyuncs.com/carousel-img/carousel1.jpeg',
      title: '图片1',
      description: '',
      linkType: 'none',
      link: '',
      target: '_self',
    },
    image2: {
      url: '',
      title: '图片2',
      description: '',
      linkType: 'none',
      link: '',
      target: '_self',
    },
    image3: {
      url: '',
      title: '图片3',
      description: '',
      linkType: 'none',
      link: '',
      target: '_self',
    },
  },

  // 渲染器配置
  render: CarouselRender,
}; 
