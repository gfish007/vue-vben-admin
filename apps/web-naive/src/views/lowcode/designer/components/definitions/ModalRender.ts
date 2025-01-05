import { h } from 'vue';

import { NModal } from 'naive-ui';

export const ModalRender = (props: any) => {
  const {
    closable = true,
    maskClosable = true,
    preset = 'dialog',
    style = {},
    title = '对话框标题',
    visible = false,
    width = '520px',
  } = props;

  return h(
    NModal,
    {
      closable,
      maskClosable,
      preset,
      show: visible,
      style: {
        ...style,
      },
      title,
      width,
    },
    {
      default: () => h('div', { class: 'modal-content' }, '对话框内容'),
    },
  );
};
