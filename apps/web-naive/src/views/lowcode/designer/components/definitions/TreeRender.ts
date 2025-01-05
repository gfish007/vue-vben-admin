import { h } from 'vue';

import { NTree } from 'naive-ui';

export const TreeRender = (props: any) => {
  const {
    checkable = false,
    data = [],
    expandOnClick = true,
    selectable = true,
    style = {},
  } = props;

  return h(NTree, {
    checkable,
    data,
    expandOnClick,
    selectable,
    style: {
      width: '100%',
      ...style,
    },
  });
};
