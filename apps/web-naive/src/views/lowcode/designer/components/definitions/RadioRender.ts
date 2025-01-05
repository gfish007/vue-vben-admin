import { h } from 'vue';

import { NRadio, NRadioGroup } from 'naive-ui';

export const RadioRender = (props: any) => {
  const { disabled = false, options = [], style = {}, value = '' } = props;

  return h(
    NRadioGroup,
    {
      disabled,
      style: {
        ...style,
      },
      value,
    },
    {
      default: () =>
        options.map((option: any) =>
          h(NRadio, {
            disabled: option.disabled,
            key: option.value,
            label: option.label,
            value: option.value,
          }),
        ),
    },
  );
};
