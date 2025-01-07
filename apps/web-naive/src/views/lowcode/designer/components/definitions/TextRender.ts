import { h } from 'vue';

import { NText } from 'naive-ui';

export const TextRender = (props: any) => {
  const { content = '文本内容', style = {}, type = 'default' } = props;

  // 默认样式
  const defaultStyle = {
    display: 'inline-block',
    padding: '0',
    width: '100%',
  };

  // 合并样式，确保外部传入的样式优先级更高
  const mergedStyle = {
    ...defaultStyle,
    ...style,
  };

  return h(
    NText,
    {
      style: mergedStyle,
      type,
    },
    () => content,
  );
};
