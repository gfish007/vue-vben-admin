import { h } from 'vue';

import { NAlert } from 'naive-ui';

export const AlertRender = (props: any) => {
  const {
    closable = false,
    showIcon = true,
    style = {},
    title = '提示',
    type = 'info',
  } = props;

  return h(NAlert, {
    closable,
    showIcon,
    style: {
      width: '100%',
      ...style,
    },
    title,
    type,
  });
};
