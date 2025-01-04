import { h, defineComponent, computed } from 'vue';
import type { PropType } from 'vue';
import { NCarousel } from 'naive-ui';
import type { ComponentRelation } from '#/types/lowcode';

export const CarouselRender = defineComponent({
  name: 'CarouselRender',
  props: {
    node: {
      type: Object as PropType<ComponentRelation>,
      required: true,
    },
    isPreview: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const carouselProps = computed(() => {
      const {
        autoplay = true,
        interval = 3000,
        effect = 'slide',
        dotType = 'dot',
        dotPlacement = 'bottom',
        showArrow = 'hover',
        style = {},
        image1 = {
          url: 'https://naive-ui.oss-cn-beijing.aliyuncs.com/carousel-img/carousel1.jpeg',
          title: '图片1',
          description: '',
          linkType: 'none',
          link: '',
          target: '_self',
        },
        image2 = {
          url: '',
          title: '图片2',
          description: '',
          linkType: 'none',
          link: '',
          target: '_self',
        },
        image3 = {
          url: '',
          title: '图片3',
          description: '',
          linkType: 'none',
          link: '',
          target: '_self',
        },
      } = props.node.props || {};

      // 从style中移除width，因为我们希望轮播图总是填满wrapper
      const { width: _, ...otherStyles } = style;

      // 构建图片列表，只包含有URL的图片
      const images = [image1, image2, image3].filter(img => img.url);

      return {
        autoplay,
        interval,
        effect,
        dotType,
        dotPlacement,
        showArrow,
        style: {
          width: '100%',
          height: '240px',
          ...otherStyles,
        },
        images,
      };
    });

    // 处理图片点击
    const handleImageClick = (image: any) => {
      if (!props.isPreview || image.linkType === 'none') return;

      if (image.linkType === 'external') {
        window.open(image.link, image.target);
      } else if (image.linkType === 'internal') {
        // 处理内部页面跳转
        console.log('Navigate to internal page:', image.link);
        // TODO: 实现内部页面跳转逻辑
      }
    };

    return () => {
      const { images, ...restProps } = carouselProps.value;

      return h(NCarousel, {
        ...restProps,
      }, {
        default: () =>
          images.map((image: any, index: number) => {
            const imgElement = h('img', {
              key: index,
              src: image.url,
              alt: image.title,
              title: image.description || image.title,
              style: {
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                cursor: props.isPreview && image.linkType !== 'none' ? 'pointer' : 'default',
              },
              onClick: () => handleImageClick(image),
            });

            return imgElement;
          }),
      });
    };
  },
}); 
