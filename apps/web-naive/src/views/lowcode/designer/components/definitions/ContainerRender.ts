import { h, defineComponent } from 'vue';
import type { PropType } from 'vue';
import type { ComponentRelation } from '#/types/lowcode';
import ComponentRenderer from '../ComponentRenderer.vue';

export const ContainerRender = defineComponent({
  name: 'ContainerRender',
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
    return () => {
      // 提取容器的属性
      const {
        display = 'block',
        flexDirection = 'row',
        justifyContent = 'flex-start',
        alignItems = 'flex-start',
        style = {},
      } = props.node.props || {};

      // 从style中移除width，因为我们希望容器总是填满wrapper
      const { width: _, ...otherStyles } = style;

      // 计算容器样式
      const containerStyle = {
        display,
        flexDirection,
        justifyContent,
        alignItems,
        minHeight: '100px',
        padding: '16px',
        backgroundColor: props.isPreview ? '#ffffff' : '#fafafa',
        border: props.isPreview ? 'none' : '1px dashed #e5e7eb',
        borderRadius: '4px',
        transition: 'all 0.3s ease',
        width: '100%',
        ...otherStyles,
      };

      // 渲染子组件
      const children = props.node.children?.map(child => 
        h(ComponentRenderer, {
          key: child.componentInstanceId,
          node: child,
          isPreview: props.isPreview,
        })
      );

      // 如果没有子组件，显示提示信息
      if (!children?.length && !props.isPreview) {
        return h('div', {
          style: containerStyle,
          class: 'container-component',
        }, [
          h('div', {
            class: 'container-placeholder',
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#999',
              fontSize: '14px',
              fontStyle: 'italic',
            },
          }, [
            h('i', {
              class: 'i-carbon-add',
              style: {
                marginRight: '8px',
                fontSize: '16px',
              },
            }),
            '拖拽组件到这里'
          ])
        ]);
      }

      // 渲染容器
      return h('div', {
        style: containerStyle,
        class: 'container-component',
      }, children || []);
    };
  },
}); 
