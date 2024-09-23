import { h } from 'vue';

import { NTree } from 'naive-ui';

export const renderSourceList = (
  selectedMenuKeys,
  menuOptions,
  expandedKeys,
) => {
  return function ({ onCheck, pattern }) {
    return h(NTree, {
      blockLine: true,
      checkable: true,
      checkedKeys: selectedMenuKeys.value,
      data: menuOptions.value,
      expandedKeys: expandedKeys.value,
      'onUpdate:checkedKeys': (checkedKeys) => {
        selectedMenuKeys.value = checkedKeys;
        onCheck(checkedKeys);
      },
      'onUpdate:expandedKeys': (keys) => {
        expandedKeys.value = keys;
      },
      pattern,
      selectable: false,
      style: 'margin: 0 4px; height: 300px;',
    });
  };
};

export const renderTargetList = (
  selectedMenuKeys,
  menuOptions,
  expandedKeys,
) => {
  return function ({ onCheck, pattern }) {
    return h(NTree, {
      blockLine: true,
      checkable: true,
      checkedKeys: selectedMenuKeys.value,
      data: menuOptions.value,
      expandedKeys: expandedKeys.value,
      'onUpdate:checkedKeys': (checkedKeys) => {
        selectedMenuKeys.value = checkedKeys;
        onCheck(checkedKeys);
      },
      'onUpdate:expandedKeys': (keys) => {
        expandedKeys.value = keys;
      },
      pattern,
      selectable: false,
      style: 'margin: 0 4px; height: 300px;',
    });
  };
};
