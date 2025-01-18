import type { CarouselItem } from './Carousel';

import type { ComponentRelation } from '#/types/lowcode';

import { defineComponent, h } from 'vue';

import { NCarousel } from 'naive-ui';

export const CarouselRender = defineComponent({
  name: 'CarouselRender',
  props: {
    isPreview: {
      default: false,
      type: Boolean,
    },
    node: {
      required: true,
      type: Object as () => ComponentRelation,
    },
  },
  setup(props) {
    return () => {
      const { node } = props;
      const {
        autoplay,
        dotPlacement,
        effect,
        interval,
        showArrow,
        showDots,
        items = [],
      } = node.props || {};

      console.log('【渲染追踪】CarouselRender 收到的数据:', {
        其他配置: {
          autoplay,
          dotPlacement,
          effect,
          interval,
          showArrow,
          showDots,
        },
        轮播图总数: items.length,
        轮播图数据: items,
      });

      // 过滤掉没有图片的项
      const validItems = (items as CarouselItem[]).filter(
        (item) => item.fileUrl,
      );

      console.log('【渲染追踪】过滤后的有效轮播图:', {
        有效数据: validItems,
        有效数量: validItems.length,
      });

      // 如果没有有效的轮播项，显示占位图
      if (validItems.length === 0) {
        return h(
          'div',
          {
            style: {
              ...node.props?.style,
              alignItems: 'center',
              backgroundColor: '#f5f5f5',
              color: '#999',
              display: 'flex',
              justifyContent: 'center',
            },
          },
          '请添加轮播图片',
        );
      }

      return h(
        NCarousel,
        {
          autoplay,
          dotPlacement,
          effect,
          interval,
          showArrow,
          showDots,
          style: node.props?.style,
        },
        {
          default: () =>
            validItems.map((item) => {
              const imgStyle = {
                height: '100%',
                objectFit: 'cover' as const,
                width: '100%',
              };

              const content = h('img', {
                src: item.fileUrl,
                style: imgStyle,
              });

              // 如果有链接，则包装一个 a 标签
              if (item.link && item.eventType) {
                return h(
                  'a',
                  {
                    href: item.link,
                    style: {
                      display: 'block',
                      height: '100%',
                      width: '100%',
                    },
                    target: '_blank',
                  },
                  content,
                );
              }

              return content;
            }),
        },
      );
    };
  },
});
