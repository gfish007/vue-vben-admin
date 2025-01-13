import { h } from 'vue';

import { useLowCodeStore } from '../../../../../store/modules/lowcode';

/**
 * 文本组件渲染函数
 * @param props 组件属性，包含 node 属性
 */
export const SpanRender = (props: any) => {
  const store = useLowCodeStore();

  // 从 node 中获取属性和样式
  const node = props.node;
  const style = node?.style || {};
  const type = node?.props?.type || 'default';

  // 获取显示内容
  let content = node?.props?.content || '文本内容';

  // 处理数据绑定
  const dataBinding = node?.props?.dataBinding;
  if (dataBinding) {
    console.log('处理数据绑定:', {
      binding: dataBinding,
      isPreview: props.isPreview,
    });

    // 获取数据源
    let dataSource = node.dataSource; // 组件自身的数据源

    // 如果使用的是页面数据源，从页面配置中获取
    if (dataBinding.sourceCode && !dataSource) {
      dataSource = store.currentPage?.dataSources?.find(
        (ds) => ds.dsCode === dataBinding.sourceCode,
      );
    }

    if (dataSource) {
      console.log('找到数据源:', dataSource);

      // 如果是静态数据源
      if (dataSource.dsType === 'STATIC') {
        try {
          // 解析数据路径
          const path = dataBinding.path.split('.');
          let data = (dataSource.config as any).data;

          // 遍历路径获取数据
          for (const key of path) {
            if (data && typeof data === 'object') {
              data = data[key];
            } else {
              data = undefined;
              break;
            }
          }

          // 如果找到数据，更新内容
          if (data !== undefined) {
            content = String(data);
            console.log('数据绑定成功:', { content, data });
          }
        } catch (error) {
          console.error('数据绑定错误:', error);
        }
      }

      // 如果是API数据源，并且是预览模式
      if (dataSource.dsType === 'API' && props.isPreview) {
        // TODO: 实现API数据源的数据获取和绑定
        console.log('API数据源预览:', dataSource);
      }
    }
  }

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
    alignItems,
    bottom,
    display,
    flexDirection,
    flexWrap,
    gap,
    height,
    justifyContent,
    left,
    margin,
    maxHeight,
    maxWidth,
    minHeight,
    minWidth,
    position,
    right,
    top,
    width,
    ...otherStyles
  } = style;

  // 合并样式，只使用非布局相关的样式
  const finalStyle = {
    ...otherStyles,
    color:
      typeColorMap[type as keyof typeof typeColorMap] || typeColorMap.default,
  };

  return h(
    'div',
    {
      style: finalStyle,
    },
    content,
  );
};
