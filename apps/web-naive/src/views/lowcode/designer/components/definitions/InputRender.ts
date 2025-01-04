import { h, defineComponent, computed } from 'vue';
import type { PropType } from 'vue';
import { NInput } from 'naive-ui';
import type { ComponentRelation } from '#/types/lowcode';

export const InputRender = defineComponent({
  name: 'InputRender',
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
    // 使用computed来响应式地处理props
    const inputProps = computed(() => {
      const {
        placeholder = '请输入',
        type = 'text',
        disabled = false,
        clearable = true,
        style = {},
        ...restProps
      } = props.node.props || {};

      // 从style中移除width，因为我们希望输入框总是填满wrapper
      const { width: _, ...otherStyles } = style;

      // 返回符合 NInput 要求的属性
      return {
        value: restProps.value || '',
        placeholder,
        type,
        disabled: props.isPreview ? true : disabled,
        clearable: props.isPreview ? false : clearable,
        readonly: props.isPreview,
        style: {
          height: '32px',
          width: '100%', // 总是使用100%来填满wrapper
          ...otherStyles,
          minWidth: 'unset',
        },
      };
    });

    return () => {
      console.log('Rendering input with computed props:', inputProps.value);
      // @ts-ignore
      return h(NInput, inputProps.value);
    };
  },
}); 
