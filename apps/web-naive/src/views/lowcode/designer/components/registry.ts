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
 * 自动导入所有组件定义
 * 使用 Vite 的 import.meta.glob 特性
 */
const modules = import.meta.glob<{ [key: string]: ComponentDefinition }>(
  './definitions/*.ts',
  { eager: true },
);

/**
 * 组件注册列表
 * 自动从 definitions 目录加载所有组件
 */
export const components: ComponentDefinition[] = Object.values(modules)
  .map((module) => Object.values(module)[0])
  .filter((component): component is ComponentDefinition => !!component);
