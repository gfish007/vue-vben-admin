import type { RecommendItem } from './Recommend';

import type { ComponentInstance } from '#/types/lowcode';

import { computed, defineComponent, h, ref, watchEffect } from 'vue';

import {
  NBadge,
  NCard,
  NGrid,
  NGridItem,
  NImage,
  NList,
  NListItem,
  NSpace,
  NTag,
  NText,
} from 'naive-ui';

import { useLowCodeStore } from '../../../../../store/modules/lowcode';

export default defineComponent({
  name: 'RecommendRender',
  props: {
    isPreview: {
      default: false,
      type: Boolean,
    },
    node: {
      required: true,
      type: Object as () => ComponentInstance,
    },
  },
  setup(props) {
    const store = useLowCodeStore();
    const items = ref<RecommendItem[]>([]);

    // 监听数据变化
    watchEffect(async () => {
      const dataBinding = props.node?.dataBinding;
      const staticItems = props.node?.props?.items;

      // 如果有静态数据，直接使用
      if (staticItems && (!dataBinding || !dataBinding.dsCode)) {
        items.value = staticItems;
        return;
      }

      if (dataBinding && dataBinding.dsCode) {
        try {
          // 获取数据源
          const dataSource = store.currentPage?.dataSources?.find(
            (ds) => ds.dsCode === dataBinding.dsCode,
          );

          if (dataSource) {
            let dsData;

            // 在预览模式下，优先从缓存获取数据
            if (props.isPreview) {
              dsData = store.componentDataCache.get(dataBinding.dsCode);
            }

            // 如果没有缓存数据，则根据数据源类型获取数据
            if (!dsData) {
              if (dataSource.dsType === 'STATIC') {
                // 如果是静态数据源，直接使用 config.data
                dsData =
                  typeof dataSource.config.staticData === 'string'
                    ? JSON.parse(dataSource.config.staticData || '{}')
                    : dataSource.config.staticData;
              } else {
                // 其他类型的数据源
                dsData = await store.getDataSourceData(dataBinding.dsCode);
                // 更新缓存
                if (dsData && props.isPreview) {
                  store.componentDataCache.set(dataBinding.dsCode, dsData);
                }
              }
            }

            if (dsData) {
              // 移除类型信息 (string) 等，并解析数据路径
              const cleanPath = dataBinding.path.replace(
                /\s*\([^)]*\)\s*$/,
                '',
              );
              const path = cleanPath.split('.');
              let value = dsData;

              // 遍历路径获取数据
              for (const key of path) {
                if (value && typeof value === 'object') {
                  value = value[key];
                } else {
                  value = undefined;
                  break;
                }
              }

              // 如果找到数据，更新内容
              items.value = Array.isArray(value) ? value : [];
            } else {
              items.value = [];
            }
          } else {
            items.value = [];
          }
        } catch {
          items.value = [];
        }
      } else {
        // 使用静态数据
        items.value = staticItems || [];
      }
    });

    // 计算图片宽高比
    const imageStyle = computed(() => {
      const ratio = props.node?.props?.aspectRatio || '1:1';
      const [width, height] = ratio.split(':').map(Number);
      return {
        paddingBottom: `${(height / width) * 100}%`,
        position: 'relative' as const,
        width: '100%',
      };
    });

    // 计算卡片样式
    const cardStyle = computed(() => {
      const { borderRadius, hoverScale, shadow } = props.node?.props || {};
      return {
        '&:hover': {
          transform: `scale(${hoverScale || 1})`,
        },
        borderRadius: `${borderRadius || 8}px`,
        boxShadow: shadow ? '0 2px 12px 0 rgba(0,0,0,0.1)' : 'none',
        cursor: 'pointer',
        transition: 'transform 0.3s ease',
      };
    });

    // 渲染价格
    const renderPrice = (item: RecommendItem) => {
      if (!props.node?.props?.showPrice) return null;

      return h(
        NSpace,
        { align: 'baseline', size: 8 },
        {
          default: () => [
            // 当前价格
            h(
              NText,
              { strong: true, style: { fontSize: '18px' }, type: 'error' },
              {
                default: () =>
                  `${item.price?.prefix || '¥'}${item.price?.current.toFixed(2)}${
                    item.price?.suffix || ''
                  }`,
              },
            ),
            // 原价
            props.node?.props?.showOriginalPrice &&
              item.price?.original &&
              h(
                NText,
                {
                  delete: true,
                  depth: 3,
                  style: { fontSize: '14px' },
                },
                {
                  default: () =>
                    `${item.price?.prefix || '¥'}${item.price?.original?.toFixed(2)}${
                      item.price?.suffix || ''
                    }`,
                },
              ),
          ],
        },
      );
    };

    // 渲染标签
    const renderTags = (item: RecommendItem) => {
      if (!props.node?.props?.showTags || !item.tags?.length) return null;

      return h(
        NSpace,
        { size: 4, wrap: true },
        {
          default: () =>
            item.tags?.map((tag) =>
              h(
                NTag,
                {
                  bordered: false,
                  color: tag.backgroundColor || '#f5f5f5',
                  size: 'small',
                  style: {
                    color: tag.color || '#666',
                  },
                },
                { default: () => tag.text },
              ),
            ),
        },
      );
    };

    // 渲染统计信息
    const renderStatistics = (item: RecommendItem) => {
      if (!props.node?.props?.showStatistics) return null;

      return h(
        NSpace,
        { size: 12, style: { color: '#999', fontSize: '12px' } },
        {
          default: () => [
            item.statistics?.sales &&
              h(
                NText,
                { depth: 3 },
                { default: () => `${item.statistics?.sales} 销量` },
              ),
            item.statistics?.views &&
              h(
                NText,
                { depth: 3 },
                { default: () => `${item.statistics?.views} 浏览` },
              ),
            item.statistics?.likes &&
              h(
                NText,
                { depth: 3 },
                { default: () => `${item.statistics?.likes} 点赞` },
              ),
          ],
        },
      );
    };

    // 渲染卡片模式
    const renderCard = (item: RecommendItem) => {
      return h(
        NCard,
        {
          hoverable: true,
          style: cardStyle.value,
        },
        {
          cover: () =>
            h(
              'div',
              { style: imageStyle.value },
              item.image
                ? h(NImage, {
                    objectFit: props.node?.props?.imageFit || 'cover',
                    preview: false,
                    src: item.image,
                    style: {
                      height: '100%',
                      left: 0,
                      position: 'absolute',
                      top: 0,
                      width: '100%',
                    },
                  })
                : h(
                    'div',
                    {
                      style: {
                        alignItems: 'center',
                        background: '#f5f5f5',
                        display: 'flex',
                        height: '100%',
                        justifyContent: 'center',
                        left: 0,
                        position: 'absolute',
                        top: 0,
                        width: '100%',
                      },
                    },
                    '暂无图片',
                  ),
            ),
          default: () =>
            h(
              NSpace,
              { size: 8, vertical: true },
              {
                default: () => [
                  // 标题
                  props.node?.props?.showTitle &&
                    h(NText, { strong: true }, { default: () => item.title }),
                  // 副标题
                  props.node?.props?.showSubtitle &&
                    item.subtitle &&
                    h(
                      NText,
                      { depth: 2, style: { fontSize: '14px' } },
                      { default: () => item.subtitle },
                    ),
                  // 价格
                  renderPrice(item),
                  // 标签
                  renderTags(item),
                  // 统计信息
                  renderStatistics(item),
                ],
              },
            ),
        },
      );
    };

    // 渲染列表模式
    const renderList = (item: RecommendItem) => {
      return h(NListItem, null, {
        default: () =>
          h(
            NSpace,
            { align: 'start', justify: 'start', size: 16 },
            {
              default: () => [
                // 图片
                h(
                  'div',
                  {
                    style: {
                      ...imageStyle.value,
                      width: '120px',
                    },
                  },
                  item.image
                    ? h(NImage, {
                        objectFit: props.node?.props?.imageFit || 'cover',
                        preview: false,
                        src: item.image,
                        style: {
                          height: '100%',
                          left: 0,
                          position: 'absolute',
                          top: 0,
                          width: '100%',
                        },
                      })
                    : h(
                        'div',
                        {
                          style: {
                            alignItems: 'center',
                            background: '#f5f5f5',
                            display: 'flex',
                            height: '100%',
                            justifyContent: 'center',
                            left: 0,
                            position: 'absolute',
                            top: 0,
                            width: '100%',
                          },
                        },
                        '暂无图片',
                      ),
                ),
                // 内容
                h(
                  NSpace,
                  { size: 8, style: { flex: 1 }, vertical: true },
                  {
                    default: () => [
                      // 标题
                      props.node?.props?.showTitle &&
                        h(
                          NText,
                          { strong: true },
                          { default: () => item.title },
                        ),
                      // 副标题
                      props.node?.props?.showSubtitle &&
                        item.subtitle &&
                        h(
                          NText,
                          { depth: 2, style: { fontSize: '14px' } },
                          { default: () => item.subtitle },
                        ),
                      // 价格
                      renderPrice(item),
                      // 标签
                      renderTags(item),
                      // 统计信息
                      renderStatistics(item),
                    ],
                  },
                ),
              ],
            },
          ),
      });
    };

    // 渲染网格布局
    const renderGrid = () => {
      const { columnsCount = 2, gutter = 16 } = props.node?.props || {};

      return h(
        NGrid,
        {
          cols: columnsCount,
          responsive: 'screen',
          xGap: gutter,
          yGap: gutter,
        },
        {
          default: () =>
            items.value.map((item) =>
              h(NGridItem, null, {
                default: () =>
                  props.node?.props?.showBadge && item.badge
                    ? h(
                        NBadge,
                        {
                          dot: !item.badge.text,
                          processing: true,
                          type:
                            item.badge.type === 'primary'
                              ? 'info'
                              : item.badge.type,
                          value: item.badge.text,
                        },
                        { default: () => renderCard(item) },
                      )
                    : renderCard(item),
              }),
            ),
        },
      );
    };

    // 渲染列表布局
    const renderListLayout = () => {
      return h(
        NList,
        { bordered: false },
        {
          default: () =>
            items.value.map((item) =>
              props.node?.props?.showBadge && item.badge
                ? h(
                    NBadge,
                    {
                      dot: !item.badge.text,
                      processing: true,
                      type:
                        item.badge.type === 'primary'
                          ? 'info'
                          : item.badge.type,
                      value: item.badge.text,
                    },
                    { default: () => renderList(item) },
                  )
                : renderList(item),
            ),
        },
      );
    };

    return () => {
      const { mode = 'card' } = props.node?.props || {};

      // 根据模式选择渲染方式
      switch (mode) {
        case 'list': {
          return renderListLayout();
        }
        case 'waterfall':
        case 'card':
        default: {
          return renderGrid();
        }
      }
    };
  },
});
