import { h } from 'vue';

/**
 * 容器组件渲染函数
 * @param props 组件属性，包含 node 属性
 * @param slots 插槽内容
 */
export const ContainerRender = (props: any, { slots }: any) => {
  // 从 node 中获取样式
  const style = props.node?.style || {};

  console.log('Container render props:', {
    node: props.node,
    style,
  });

  // 提取非布局相关的样式
  // const {
  //   alignItems,
  //   bottom,
  //   display,
  //   flexDirection,
  //   flexWrap,
  //   gap,
  //   height,
  //   justifyContent,
  //   left,
  //   margin,
  //   maxHeight,
  //   maxWidth,
  //   minHeight,
  //   minWidth,
  //   position,
  //   right,
  //   top,
  //   width,
  //   ...otherStyles
  // } = style;

  // console.log('Container render style:', {
  //   finalStyle: otherStyles,
  //   layoutStyles: {
  //     alignItems,
  //     display,
  //     flexDirection,
  //     flexWrap,
  //     gap,
  //     justifyContent,
  //   },
  //   originalStyle: style,
  // });

  // 只使用非布局相关的样式
  return h(
    'div',
    {
      style,
    },
    slots.default?.(),
  );
};
