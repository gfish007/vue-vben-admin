import { defineComponent, h } from 'vue';
import { getComponent } from './registry';
import type { ComponentRelation } from '#/types/lowcode';

export const ComponentRenderer = defineComponent({
  name: 'ComponentRenderer',
  props: {
    node: {
      type: Object as () => ComponentRelation,
      required: true,
    },
    isPreview: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { slots }) {
    return () => {
      const RealComponent = getComponent(props.node.componentCode);
      if (!RealComponent) return null;

      return h(
        RealComponent,
        {
          ...props.node.props,
        },
        slots.default?.(),
      );
    };
  },
}); 
