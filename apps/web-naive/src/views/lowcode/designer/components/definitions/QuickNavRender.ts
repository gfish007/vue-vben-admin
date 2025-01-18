import type { QuickNavItem } from './QuickNav';

import type { ComponentRelation } from '#/types/lowcode';

import { computed, defineComponent, h } from 'vue';

import { NBadge, NGrid, NGridItem, NIcon, NSpace } from 'naive-ui';

export default defineComponent({
  name: 'QuickNavRender',
  props: {
    isPreview: {
      default: false,
      type: Boolean,
    },
    node: {
      required: true,
      type: Object as () => ComponentRelation,
    },
  },
  setup(props) {
    const items = computed<QuickNavItem[]>(() => props.node.props?.items || []);
    const cols = computed(() => props.node.props?.cols || 4);

    const handleClick = (item: QuickNavItem) => {
      if (item.disabled || props.isPreview) return;

      if (item.link?.type === 'page') {
        // 处理页面路由跳转
        console.log('跳转到页面:', item.link.value);
      } else if (item.link?.type === 'url') {
        // 处理外部链接跳转
        window.open(item.link.value, '_blank');
      }
    };

    return () => {
      if (!items.value?.length) {
        return h('div', { class: 'quick-nav-empty' }, '暂无导航项');
      }

      return h(
        NGrid,
        {
          cols: cols.value,
          responsive: 'screen',
          xGap: 12,
          yGap: 12,
        },
        {
          default: () =>
            items.value
              .filter((item) => item.visible)
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((item) => {
                const iconContent =
                  item.iconType === 'image'
                    ? h('img', {
                        src: item.icon,
                        style: {
                          height: '32px',
                          objectFit: 'contain',
                          width: '32px',
                        },
                      })
                    : h(NIcon, {
                        class: item.icon,
                        color: item.iconColor,
                        size: 32,
                      });

                const content = h(
                  'div',
                  {
                    class: [
                      'quick-nav-item',
                      {
                        'quick-nav-item--disabled': item.disabled,
                      },
                    ],
                    onClick: () => handleClick(item),
                  },
                  [
                    h(
                      NSpace,
                      { justify: 'center', vertical: true },
                      {
                        default: () => [
                          iconContent,
                          h(
                            'span',
                            { class: 'quick-nav-item__title' },
                            item.title,
                          ),
                          item.subtitle
                            ? h(
                                'span',
                                { class: 'quick-nav-item__subtitle' },
                                item.subtitle,
                              )
                            : null,
                        ],
                      },
                    ),
                  ],
                );

                return h(
                  NGridItem,
                  null,
                  item.badge?.show
                    ? h(
                        NBadge,
                        {
                          color: item.badge.color,
                          value: item.badge.content,
                        },
                        { default: () => content },
                      )
                    : content,
                );
              }),
        },
      );
    };
  },
});
