import { h } from 'vue';

export const ContainerRender = (props: any) => {
  const { style = {}, children } = props;

  // 默认样式
  const defaultStyle = {
    backgroundColor: '#fafafa',
    border: '1px dashed #e8e8e8',
    borderRadius: '4px',
    minHeight: '240px',
    padding: '16px',
  };

  // 合并样式，确保外部传入的样式优先级更高
  const mergedStyle = {
    ...defaultStyle,
    ...style,
  };

  return h(
    'div',
    {
      style: mergedStyle,
    },
    children,
  );
};
