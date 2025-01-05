import { h } from 'vue';

import { NInput } from 'naive-ui';

export const InputRender = (props: any) => {
  const {
    clearable = true,
    disabled = false,
    placeholder = '请输入',
    style = {},
    type = 'text',
    value = '',
  } = props;

  // 默认样式
  const defaultStyle = {
    minWidth: '120px',
    width: '100%',
  };

  // 合并样式，确保外部传入的样式优先级更高
  const mergedStyle = {
    ...defaultStyle,
    ...style,
  };

  return h(NInput, {
    clearable,
    disabled,
    'onUpdate:value': (val: string) => {
      if (props['onUpdate:value']) {
        props['onUpdate:value'](val);
      }
    },
    placeholder,
    style: mergedStyle,
    type,
    value,
  });
};
