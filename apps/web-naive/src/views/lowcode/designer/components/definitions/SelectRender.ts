import { h } from 'vue';

import { NSelect } from 'naive-ui';

export const SelectRender = (props: any) => {
  const {
    clearable = true,
    disabled = false,
    multiple = false,
    value = null,
    options = [
      { label: '选项1', value: '1' },
      { label: '选项2', value: '2' },
      { label: '选项3', value: '3' },
    ],
    placeholder = '请选择',
    style = {},
  } = props;

  return h(NSelect, {
    clearable,
    disabled,
    multiple,
    options,
    placeholder,
    style: {
      minWidth: '200px',
      width: '100%',
      ...style,
    },
    value,
  });
};
