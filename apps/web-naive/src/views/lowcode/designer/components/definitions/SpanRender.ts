import type { ComponentInstance } from '../../../../../types/lowcode';

import { h, ref, watchEffect } from 'vue';

import { useLowCodeStore } from '../../../../../store/modules/lowcode';

/**
 * 文本组件渲染函数
 * @param props 组件属性，包含 node 属性
 */
export const SpanRender = (props: {
  isPreview?: boolean;
  node: ComponentInstance;
}) => {
  const store = useLowCodeStore();
  const content = ref(props.node?.props?.content || '文本内容');
  const isPreview = props.isPreview ?? false;

  console.log('【Span渲染】isPreview状态:', {
    isPreview,
    组件ID: props.node?.componentInstanceId,
    组件类型: props.node?.componentCode,
  });

  // 处理数据绑定
  watchEffect(async () => {
    const dataBinding = props.node?.dataBinding;
    console.log('【Span渲染】数据绑定信息:', {
      数据绑定: dataBinding,
      是否预览: isPreview,
      组件ID: props.node?.componentInstanceId,
    });

    if (dataBinding && dataBinding.dsCode) {
      try {
        // 获取数据源
        const dataSource = store.currentPage?.dataSources?.find(
          (ds) => ds.dsCode === dataBinding.dsCode,
        );

        console.log('【Span渲染】找到数据源:', {
          数据源信息: dataSource,
          数据源类型: dataSource?.dsType,
          数据源编码: dataBinding.dsCode,
        });

        if (dataSource) {
          let dsData;

          // 在预览模式下，优先从缓存获取数据
          if (isPreview) {
            dsData = store.componentDataCache.get(dataBinding.dsCode);
            console.log('【Span渲染】预览模式 - 缓存数据:', {
              数据源编码: dataBinding.dsCode,
              缓存数据: dsData,
            });
          }

          // 如果没有缓存数据，则根据数据源类型获取数据
          if (!dsData) {
            if (dataSource.dsType === 'STATIC') {
              // 如果是静态数据源，直接使用 config.data
              dsData =
                typeof dataSource.config.data === 'string'
                  ? JSON.parse(dataSource.config.data || '{}')
                  : dataSource.config.data;
              console.log('【Span渲染】静态数据源数据:', dsData);
            } else {
              // 其他类型的数据源
              console.log('【Span渲染】获取动态数据源数据');
              dsData = await store.getDataSourceData(dataBinding.dsCode);
              // 更新缓存
              if (dsData && isPreview) {
                store.componentDataCache.set(dataBinding.dsCode, dsData);
              }
            }
          }

          if (dsData) {
            // 移除类型信息 (string) 等，并解析数据路径
            const cleanPath = dataBinding.path.replace(/\s*\([^)]*\)\s*$/, '');
            console.log('【Span渲染】数据路径处理:', {
              原始路径: dataBinding.path,
              处理后路径: cleanPath,
            });

            const path = cleanPath.split('.');
            let value = dsData;

            // 遍历路径获取数据
            for (const key of path) {
              if (value && typeof value === 'object') {
                value = value[key];
                console.log(`【Span渲染】访问路径 ${key}:`, value);
              } else {
                value = undefined;
                console.log(`【Span渲染】路径 ${key} 访问失败`);
                break;
              }
            }

            // 如果找到数据，更新内容
            if (value === undefined) {
              console.log('【Span渲染】未找到数据，使用默认内容');
            } else {
              content.value = String(value);
              console.log('【Span渲染】数据绑定成功:', {
                原始值: value,
                最终内容: content.value,
              });
            }
          } else {
            console.log('【Span渲染】未获取到数据源数据');
          }
        } else {
          console.log('【Span渲染】未找到对应的数据源');
        }
      } catch (error) {
        console.error('【Span渲染】数据绑定错误:', error);
      }
    } else {
      // 如果没有数据绑定，使用静态内容
      console.log('【Span渲染】使用静态内容:', props.node?.props?.content);
      content.value = props.node?.props?.content || '文本内容';
    }
  });

  // 根据类型设置颜色
  const typeColorMap = {
    default: '#333333',
    error: '#d03050',
    primary: '#2080f0',
    success: '#18a058',
    warning: '#f0a020',
  };

  // 提取非布局相关的样式
  const {
    alignItems: _alignItems,
    // 移除默认的边框样式
    // border: _border,
    bottom: _bottom,
    display: _display,
    flexDirection: _flexDirection,
    flexWrap: _flexWrap,
    gap: _gap,
    height: _height,
    justifyContent: _justifyContent,
    left: _left,
    margin: _margin,
    maxHeight: _maxHeight,
    maxWidth: _maxWidth,
    minHeight: _minHeight,
    minWidth: _minWidth,
    position: _position,
    right: _right,
    top: _top,
    width: _width,
    ...otherStyles
  } = props.node?.style || {};

  // 合并样式，只使用非布局相关的样式
  const finalStyle = {
    ...otherStyles,
    // 只在非预览模式下显示虚线框
    border: isPreview ? 'none' : '1px dashed rgb(232, 232, 232)',
    color:
      typeColorMap[props.node?.props?.type as keyof typeof typeColorMap] ||
      typeColorMap.default,
  };

  return h(
    'div',
    {
      'data-preview': isPreview,
      style: finalStyle,
    },
    content.value,
  );
};
