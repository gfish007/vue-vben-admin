import { h } from 'vue';

import { NAlert } from 'naive-ui';

export const MessageRender = (props: any) => {
  const {
    closable = true,
    content = '这是一条消息',
    duration = 3000,
    showIcon = true,
    style = {},
    type = 'info',
  } = props;

  return h(NAlert, {
    closable,
    showIcon,
    style: {
      width: '100%',
      ...style,
    },
    title: content,
    type,
  });
};
