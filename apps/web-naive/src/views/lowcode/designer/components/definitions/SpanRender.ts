import { h } from 'vue';

/**
 * 文本组件渲染函数
 * @param props 组件属性，包含 node 属性
 */
export const SpanRender = (props: any) => {
  // 从 node 中获取属性和样式
  const content = props.node?.props?.content || '文本内容';
  const type = props.node?.props?.type || 'default';
  const style = props.node?.style || {};

  console.log('Span render props:', {
    content,
    node: props.node,
    style,
    type,
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

  console.log('Span render style:', {
    finalStyle: {
      ...otherStyles,
      color:
        typeColorMap[type as keyof typeof typeColorMap] || typeColorMap.default,
    },
    layoutStyles: {
      alignItems,
      display,
      flexDirection,
      flexWrap,
      gap,
      justifyContent,
    },
    originalStyle: style,
  });

  // 合并样式，只使用非布局相关的样式
  const finalStyle = {
    ...otherStyles,
    color:
      typeColorMap[type as keyof typeof typeColorMap] || typeColorMap.default,
  };

  return h(
    'div',
    {
      style,
    },
    content,
  );
};
