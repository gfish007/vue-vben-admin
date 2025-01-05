import type { Component } from '#/types/lowcode';

export const Carousel: Component = {
  category: 'data',
  componentCode: 'Carousel',
  componentName: '轮播',
  defaultProps: {
    autoplay: true,
    effect: 'slide',
    interval: 3000,
    items: [
      {
        src: 'https://naive-ui.oss-cn-beijing.aliyuncs.com/carousel-img/carousel1.jpeg',
      },
      {
        src: 'https://naive-ui.oss-cn-beijing.aliyuncs.com/carousel-img/carousel2.jpeg',
      },
      {
        src: 'https://naive-ui.oss-cn-beijing.aliyuncs.com/carousel-img/carousel3.jpeg',
      },
    ],
  },
  icon: 'i-carbon:carousel',
  propsSchema: {
    autoplay: {
      label: '自动播放',
      type: 'boolean',
    },
    effect: {
      label: '切换效果',
      options: [
        { label: '滑动', value: 'slide' },
        { label: '淡入淡出', value: 'fade' },
      ],
      type: 'enum',
    },
    interval: {
      label: '间隔时间(ms)',
      type: 'number',
    },
    style: {
      label: '样式',
      properties: {
        height: {
          defaultValue: '300px',
          label: '高度',
          type: 'string',
        },
        width: {
          defaultValue: '100%',
          label: '宽度',
          type: 'string',
        },
      },
      type: 'object',
    },
    items: {
      label: '轮播项',
      type: 'array',
      items: {
        label: '轮播项',
        properties: {
          src: {
            label: '图片地址',
            type: 'string',
          },
        },
        type: 'object',
      },
    },
  },
};
