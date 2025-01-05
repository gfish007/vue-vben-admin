import { h } from 'vue';

import { NSwitch } from 'naive-ui';

export const SwitchRender = (props: any) => {
  const {
    disabled = false,
    loading = false,
    style = {},
    value = false,
  } = props;

  return h(NSwitch, {
    disabled,
    loading,
    style: {
      ...style,
    },
    value,
  });
};
