import { h } from 'vue';

/**
 * 容器组件渲染函数
 * @param props 组件属性，包含 node 属性
 * @param slots 插槽内容
 */
const ContainerRender = (props: any, { slots }: any) => {
  // 从 node 中获取样式
  const style = props.node?.style || {};

  console.log('Container render props:', {
    node: props.node,
    style,
  });

  // 只使用非布局相关的样式
  return h(
    'div',
    {
      style,
    },
    slots.default?.(),
  );
};

export default ContainerRender;
