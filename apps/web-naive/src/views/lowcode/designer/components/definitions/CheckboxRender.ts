import { h } from 'vue';

import { NCheckbox, NCheckboxGroup } from 'naive-ui';

export const CheckboxRender = (props: any) => {
  const { disabled = false, options = [], style = {}, value = [] } = props;

  return h(
    NCheckboxGroup,
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
          h(NCheckbox, {
            disabled: option.disabled,
            key: option.value,
            label: option.label,
            value: option.value,
          }),
        ),
    },
  );
};
