// 定义模块类型
type ModuleType = {
  [key: string]: {
    [key: string]: any;
    default: any;
  };
};

// 自动导入所有组件相关文件
const modules = {
  components: import.meta.glob('./*.ts', { eager: true }) as ModuleType,
  data: import.meta.glob('./*Data.vue', { eager: true }) as ModuleType,
  events: import.meta.glob('./*Event.vue', { eager: true }) as ModuleType,
  properties: import.meta.glob('./*Property.vue', {
    eager: true,
  }) as ModuleType,
  renders: import.meta.glob('./*Render.ts', { eager: true }) as ModuleType,
  styles: import.meta.glob('./*Style.vue', { eager: true }) as ModuleType,
} as const;

console.log('【definitions/index.ts】已加载的模块:', {
  事件面板列表: Object.keys(modules.events),
  属性面板列表: Object.keys(modules.properties),
  数据面板列表: Object.keys(modules.data),
  样式面板列表: Object.keys(modules.styles),
  渲染器列表: Object.keys(modules.renders),
  组件列表: Object.keys(modules.components),
});

// 导出所有模块供注册使用
export const componentModules = modules;

// 获取所有组件名称（不包括Render文件）
const componentNames = Object.keys(modules.components)
  .map((path) => path.split('/').pop()?.replace('.ts', ''))
  .filter((name) => name && !name.endsWith('Render')) as string[];

// 导出组件名称列表供注册使用
export const availableComponents = componentNames;

// 导出所有模块的默认导出
export default {
  componentNames,
  getComponent: (name: string) => {
    const path = `./${name}.ts`;
    console.log('【getComponent】尝试获取组件:', {
      name,
      path,
      结果: modules.components[path]?.default,
    });
    return modules.components[path]?.default;
  },
  getData: (name: string) => {
    const path = `./${name}Data.vue`;
    console.log('【getData】尝试获取数据面板:', {
      name,
      path,
      结果: modules.data[path]?.default,
    });
    return modules.data[path]?.default;
  },
  getEvent: (name: string) => {
    const path = `./${name}Event.vue`;
    console.log('【getEvent】尝试获取事件面板:', {
      name,
      path,
      结果: modules.events[path]?.default,
    });
    return modules.events[path]?.default;
  },
  getProperty: (name: string) => {
    const path = `./${name}Property.vue`;
    console.log('【getProperty】尝试获取属性面板:', {
      name,
      path,
      结果: modules.properties[path]?.default,
    });
    return modules.properties[path]?.default;
  },
  getRender: (name: string) => {
    const path = `./${name}Render.ts`;
    console.log('【getRender】尝试获取渲染器:', {
      name,
      path,
      结果: modules.renders[path]?.default,
    });
    return modules.renders[path]?.default;
  },
  getStyle: (name: string) => {
    const path = `./${name}Style.vue`;
    console.log('【getStyle】尝试获取样式面板:', {
      name,
      path,
      结果: modules.styles[path]?.default,
    });
    return modules.styles[path]?.default;
  },
  modules,
};
