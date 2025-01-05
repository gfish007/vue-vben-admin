import { h } from 'vue';

import { NList, NListItem } from 'naive-ui';

export const ListRender = (props: any) => {
  const { bordered = true, hoverable = true, style = {}, items = [] } = props;

  return h(
    NList,
    {
      bordered,
      hoverable,
      style: {
        width: '100%',
        ...style,
      },
    },
    {
      default: () =>
        items.map((item: any) =>
          h(
            NListItem,
            {
              key: item.title,
            },
            {
              default: () => [
                h('div', { class: 'list-item-title' }, item.title),
                h('div', { class: 'list-item-description' }, item.description),
              ],
            },
          ),
        ),
    },
  );
};
