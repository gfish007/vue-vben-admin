import type { ComponentDefinition } from '../../../../types/lowcode';

/**
 * 组件分类定义
 */
export const componentCategories = [
  {
    code: 'basic',
    name: '基础组件',
    children: [
      { code: 'layout', name: '布局组件' },
      { code: 'display', name: '展示组件' },
      { code: 'form', name: '表单组件' },
      { code: 'feedback', name: '反馈组件' },
      { code: 'navigation', name: '导航组件' },
    ],
  },
  {
    code: 'business',
    name: '业务组件',
    children: [
      { code: 'table', name: '表格组件' },
      { code: 'chart', name: '图表组件' },
      { code: 'map', name: '地图组件' },
    ],
  },
] as const;

/**
 * 自动导入所有组件定义和渲染器
 */
const modules = {
  ...import.meta.glob<{ [key: string]: ComponentDefinition }>(
    './definitions/*.ts',
    { eager: true },
  ),
  ...import.meta.glob<{ [key: string]: any }>('./definitions/*.vue', {
    eager: true,
  }),
};

/**
 * 组件注册列表
 */
export const components: ComponentDefinition[] = Object.values(modules)
  .map((module) => Object.values(module)[0])
  .filter(
    (component): component is ComponentDefinition => !!component?.componentCode,
  );

/**
 * 组件注册表
 */
export const componentRegistry = Object.entries(modules)
  .filter(([_, module]) => {
    const component = Object.values(module)[0];
    return component?.componentCode;
  })
  .reduce(
    (acc, [key, module]) => {
      const fileName = key
        .split('/')
        .pop()
        ?.replace(/\.(ts|vue)$/, '');
      const componentName = fileName?.replace(
        /^(\w+)(Property|Data|Render)?$/,
        '$1',
      );
      const type = fileName?.replace(new RegExp(`^${componentName}`), '') || '';
      const component = Object.values(module)[0];

      if (!componentName) return acc;

      // 收集同名的组件定义、渲染器和面板
      const registry = {
        component: type === '' ? component : undefined,
        panels: {},
        render: type === 'Render' ? component : undefined,
      };

      if (type === 'Property' || type === 'Data') {
        registry.panels = {
          ...registry.panels,
          [fileName]: component,
        };
      }

      // 合并同名组件的配置
      acc[componentName] = acc[componentName]
        ? {
            ...acc[componentName],
            ...registry,
            panels: {
              ...acc[componentName].panels,
              ...registry.panels,
            },
          }
        : registry;

      return acc;
    },
    {} as Record<string, any>,
  );
