import { h } from 'vue';

import { NDataTable } from 'naive-ui';

export const TableRender = (props: any) => {
  const {
    bordered = true,
    columns = [],
    data = [],
    size = 'medium',
    striped = false,
    style = {},
  } = props;

  return h(NDataTable, {
    bordered,
    columns,
    data,
    size,
    striped,
    style: {
      width: '100%',
      ...style,
    },
  });
};
