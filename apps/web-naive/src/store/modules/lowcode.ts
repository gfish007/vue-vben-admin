import type { DataSourceApi } from '../../api/lowcode/dataSource.types';
import type { PageApi } from '../../api/lowcode/page.types';
import type {
  ComponentInstance,
  DataSource,
  Page,
  PageEvent,
  PageEventType,
} from '../../types/lowcode';

import { nanoid } from 'nanoid';
import { defineStore } from 'pinia';

import {
  deleteDataSource,
  getDataSourceDetail,
  queryDataSourceList,
  saveOrUpdateDataSource,
} from '../../api/lowcode/dataSource';
import { getPageDetail, saveOrUpdatePage } from '../../api/lowcode/page';
import { PageStatus } from '../../api/lowcode/page.types';
import { components } from '../../views/lowcode/designer/components/registry';

// 数据源缓存
const dataSourceCache = new Map<
  string,
  {
    data: any;
    timestamp: number;
    ttl: number;
  }
>();

// 缓存配置
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存
const CACHE_CLEANUP_INTERVAL = 10 * 60 * 1000; // 10分钟清理一次

// 定期清理过期缓存
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of dataSourceCache.entries()) {
    if (now - value.timestamp > value.ttl) {
      dataSourceCache.delete(key);
    }
  }
}, CACHE_CLEANUP_INTERVAL);

// 定义状态接口
export interface LowCodeState {
  components: ComponentInstance[];
  currentComponentId: null | string;
  currentPage: null | Page;
  dataSourceList: DataSource[];
  globalDataSources: DataSource[]; // 全局数据源列表
  dataSourcePagination: {
    current: number;
    size: number;
    total: number;
  };
  dataSourceLoadingStates: Map<string, boolean>;
  componentDataCache: Map<string, any>;
}

export const useLowCodeStore = defineStore('lowcode', {
  actions: {
    // 添加组件
    addComponent(component: ComponentInstance, parentId?: string) {
      // 确保组件有唯一ID
      if (!component.componentInstanceId) {
        component.componentInstanceId = nanoid();
      }
      console.log('添加组件：', component);
      // 合并组件配置
      this.mergeComponentConfig(component);

      let added = false;
      if (parentId) {
        // 递归查找父容器并添加组件
        const addToContainer = (components: ComponentInstance[]): boolean => {
          for (const comp of components) {
            if (comp.componentInstanceId === parentId) {
              if (comp.componentCode !== 'Container') {
                return false;
              }
              if (!comp.children) {
                comp.children = [];
              }
              comp.children.push(component);
              this.currentComponentId = component.componentInstanceId;
              return true;
            }
            if (comp.children?.length && addToContainer(comp.children)) {
              return true;
            }
          }
          return false;
        };

        added = addToContainer(this.components);
        if (!added) {
          this.components.push(component);
          this.currentComponentId = component.componentInstanceId;
          added = true;
        }
      } else {
        // 添加到根级别
        this.components.push(component);
        this.currentComponentId = component.componentInstanceId;
        added = true;
      }

      // 同步更新 currentPage 的组件列表
      if (added && this.currentPage) {
        this.currentPage.components = [...this.components];
      }

      return added;
    },

    async addDataSource(dataSource: DataSource) {
      try {
        if (!this.currentPage) {
          this.initPage();
        }

        // 确保 dataSources 数组已初始化
        if (!this.currentPage!.dataSources) {
          this.currentPage!.dataSources = [];
        }

        console.log('添加数据源前的列表:', this.currentPage!.dataSources);

        // 检查数据源编码是否重复
        if (
          this.currentPage!.dataSources.some(
            (ds) => ds.dsCode === dataSource.dsCode,
          )
        ) {
          throw new Error('该数据源编码已存在');
        }

        // 保存到后端
        const data = await saveOrUpdateDataSource(dataSource);
        console.log('保存数据源响应:', data);

        // 更新页面数据源列表
        const updatedDataSources = [...this.currentPage!.dataSources, data];
        console.log('更新后的数据源列表:', updatedDataSources);

        // 更新页面配置
        await this.updateCurrentPage({
          ...this.currentPage!,
          dataSources: updatedDataSources,
        });

        // 刷新数据源列表
        await this.loadDataSources({
          page: {
            current: 1,
            size: 10,
          },
          queryBody: {
            dsCode: '',
            dsName: '',
          },
        });

        return data;
      } catch (error) {
        console.error('Failed to add data source:', error);
        throw error;
      }
    },

    // 添加事件
    addEvent(event: PageEvent) {
      if (!this.currentPage) {
        this.initPage();
      }

      // 检查事件类型是否重复
      if (this.currentPage.events.some((e) => e.type === event.type)) {
        throw new Error('该事件类型已存在');
      }

      // 更新页面事件列表
      const updatedEvents = [...this.currentPage.events, event];

      // 更新页面配置
      this.updateCurrentPage({
        ...this.currentPage,
        events: updatedEvents,
      });

      return true;
    },

    // 批量加载数据源
    async batchLoadDataSources(dsCodes: string[]) {
      return Promise.all(
        dsCodes.map((dsCode) => this.loadDataSourceData(dsCode)),
      );
    },

    // 清除组件数据缓存
    clearComponentDataCache(componentId?: string) {
      if (componentId) {
        this.componentDataCache.delete(componentId);
      } else {
        this.componentDataCache.clear();
      }
    },

    // 删除数据源
    deleteDataSource(dsCode: string) {
      if (!this.currentPage) {
        return false;
      }

      // 更新页面数据源列表
      const updatedDataSources = this.currentPage.dataSources.filter(
        (ds) => ds.dsCode !== dsCode,
      );

      // 更新页面配置
      this.updateCurrentPage({
        ...this.currentPage,
        dataSources: updatedDataSources,
      });

      return true;
    },

    // 删除事件
    deleteEvent(eventType: PageEventType) {
      if (!this.currentPage) {
        return false;
      }

      // 更新页面事件列表
      const updatedEvents = this.currentPage.events.filter(
        (e) => e.type !== eventType,
      );

      // 更新页面配置
      this.updateCurrentPage({
        ...this.currentPage,
        events: updatedEvents,
      });

      return true;
    },

    // 执行事件动作
    async executeAction(action: Action, context: Record<string, any> = {}) {
      try {
        switch (action.type) {
          case 'loadData': {
            // 处理加载数据动作
            const params =
              typeof action.params === 'function'
                ? action.params(context)
                : action.params;

            // 如果有处理函数，先获取所有依赖数据
            if (action.handler) {
              const handler = new Function('sources', 'params', action.handler);
              const result = handler(this.dataSourceList, params);
              // 更新数据源数据
              this.updateDataSource(action.target, result);
            } else {
              // 直接加载数据
              await this.loadDataSource(action.target, params);
            }

            // 执行成功后的动作
            if (action.success) {
              for (const successAction of action.success) {
                await this.executeAction(successAction, context);
              }
            }
            break;
          }
          case 'message': {
            // 处理消息提示动作
            const messageType = action.messageType || 'info';
            window.$message[messageType](action.content);
            break;
          }
          case 'function': {
            // 处理自定义函数动作
            const handler = new Function('sources', 'context', action.handler);
            const sources = {};
            if (action.dependencies) {
              for (const dsCode of action.dependencies) {
                sources[dsCode] = this.getDataSourceData(dsCode);
              }
            }
            await handler(sources, context);
            break;
          }
        }
      } catch (error) {
        console.error('Execute action failed:', error);
        // 执行错误处理动作
        if ('error' in action && action.error) {
          for (const errorAction of action.error) {
            await this.executeAction(errorAction, { error });
          }
        }
      }
    },

    // 执行数据源
    async executeDataSource(
      dataSource: DataSource,
      params?: Record<string, any>,
    ) {
      switch (dataSource.dsType) {
        case 'API': {
          const config = dataSource.config as any;
          // 发送API请求
          const response = await fetch(config.url, {
            body: config.method === 'GET' ? undefined : JSON.stringify(params),
            headers: {
              'Content-Type': 'application/json',
              ...config.headers,
            },
            method: config.method,
          });
          return await response.json();
        }
        case 'STATIC': {
          return (dataSource.config as any).data;
        }
        case 'FUNCTION': {
          const config = dataSource.config as any;
          const handler = new Function('sources', 'params', config.handler);
          const sources = {};
          if (config.dependencies) {
            for (const dsCode of config.dependencies) {
              sources[dsCode] = this.getDataSourceData(dsCode);
            }
          }
          return handler(sources, params);
        }
        default: {
          throw new Error(`Unsupported data source type: ${dataSource.dsType}`);
        }
      }
    },

    // 执行事件
    async executeEvent(event: EventConfig, context: Record<string, any> = {}) {
      for (const action of event.actions) {
        await this.executeAction(action, context);
      }
    },

    // 查找组件及其父组件
    findComponentWithParent(id: string): {
      component: ComponentInstance | null;
      parent: ComponentInstance[] | null;
    } {
      const find = (
        components: ComponentInstance[],
      ): {
        component: ComponentInstance | null;
        parent: ComponentInstance[] | null;
      } => {
        for (const comp of components) {
          if (comp.componentInstanceId === id) {
            return { component: comp, parent: components };
          }
          if (comp.children?.length) {
            const result = find(comp.children);
            if (result.component) {
              return result;
            }
          }
        }
        return { component: null, parent: null };
      };
      return find(this.components);
    },

    async getDataSource(id: string) {
      try {
        const res = await getDataSourceDetail(id);
        return res.data;
      } catch (error) {
        console.error('Failed to get data source:', error);
        throw error;
      }
    },

    // 获取数据源数据
    async getDataSourceData(dsCode: string, forceRefresh = false) {
      // 检查缓存
      const cached = dataSourceCache.get(dsCode);
      if (
        !forceRefresh &&
        cached &&
        Date.now() - cached.timestamp < cached.ttl
      ) {
        return cached.data;
      }

      // 设置加载状态
      this.dataSourceLoadingStates.set(dsCode, true);

      try {
        const ds =
          this.currentPage?.dataSources.find((d) => d.dsCode === dsCode) ||
          this.globalDataSources.find((d) => d.dsCode === dsCode);
        if (!ds) throw new Error('数据源不存在');

        let data;
        if (ds.dsType === 'API') {
          const config = ds.config as any;
          const response = await fetch(config.url, {
            body: config.method === 'GET' ? undefined : config.params,
            headers: {
              'Content-Type': 'application/json',
              ...JSON.parse(config.headers || '{}'),
            },
            method: config.method,
          });
          data = await response.json();
        } else if (ds.dsType === 'STATIC') {
          data = JSON.parse((ds.config as any).data);
        }

        // 更新缓存
        dataSourceCache.set(dsCode, {
          data,
          timestamp: Date.now(),
          ttl: CACHE_TTL,
        });

        return data;
      } finally {
        this.dataSourceLoadingStates.set(dsCode, false);
      }
    },

    // 初始化页面
    initPage() {
      this.currentPage = {
        components: [],
        dataSources: [],
        events: [],
        pageCode: `PAGE_${nanoid(6)}`,
        pageName: '新页面',
      };
    },

    // 加载数据源数据
    async loadDataSource(dsCode: string, params?: Record<string, any>) {
      const dataSource = this.getDataSourceData(dsCode);
      if (!dataSource) return;

      try {
        const result = await this.executeDataSource(dataSource, params);
        this.updateDataSource(dsCode, result);
      } catch (error) {
        console.error('Load data source failed:', error);
        throw error;
      }
    },

    // 加载数据源数据（带缓存）
    async loadDataSourceData(dsCode: string, forceRefresh = false) {
      // 检查缓存
      const cached = dataSourceCache.get(dsCode);
      if (
        !forceRefresh &&
        cached &&
        Date.now() - cached.timestamp < cached.ttl
      ) {
        return cached.data;
      }

      // 设置加载状态
      this.dataSourceLoadingStates.set(dsCode, true);

      try {
        const ds = this.currentPage?.dataSources.find(
          (d) => d.dsCode === dsCode,
        );
        if (!ds) throw new Error('数据源不存在');

        let data;
        if (ds.dsType === 'API') {
          const config = ds.config as any;
          const response = await fetch(config.url, {
            body: config.method === 'GET' ? undefined : config.params,
            headers: {
              'Content-Type': 'application/json',
              ...JSON.parse(config.headers || '{}'),
            },
            method: config.method,
          });
          data = await response.json();
        } else if (ds.dsType === 'STATIC') {
          data = JSON.parse((ds.config as any).data);
        }

        // 更新缓存
        dataSourceCache.set(dsCode, {
          data,
          timestamp: Date.now(),
          ttl: CACHE_TTL,
        });

        return data;
      } finally {
        this.dataSourceLoadingStates.set(dsCode, false);
      }
    },

    // 数据源相关方法
    async loadDataSources(params: DataSourceApi.QueryParams) {
      try {
        const res = await queryDataSourceList(params);
        this.dataSourceList = res.records;
        this.dataSourcePagination = {
          current: res.current,
          size: res.size,
          total: res.total,
        };
      } catch (error) {
        console.error('加载数据源列表失败:', error);
        throw error;
      }
    },

    // 加载全局数据源
    async loadGlobalDataSources() {
      try {
        const res = await queryDataSourceList({
          page: { current: 1, size: 999 },
          queryBody: { scope: 'GLOBAL' },
        });
        this.globalDataSources = res.records || [];
      } catch (error) {
        console.error('Failed to load global data sources:', error);
        throw error;
      }
    },

    // 加载页面详情
    async loadPageDetail(params: { pageCode: string; version: string }) {
      try {
        const data = await getPageDetail(params);
        if (!data) {
          throw new Error('页面数据为空');
        }

        // 处理组件配置
        if (data.components) {
          data.components.forEach((comp) => this.mergeComponentConfig(comp));
        }

        // 更新当前页面
        this.currentPage = data;
        this.components = data.components || [];
        return data;
      } catch (error) {
        console.error('Failed to load page:', error);
        throw error;
      }
    },

    // 合并组件配置
    mergeComponentConfig(component: ComponentInstance) {
      // 从组件注册表中获取组件定义
      const componentDef = components.find(
        (comp) => comp.componentCode === component.componentCode,
      );

      if (componentDef) {
        // 合并属性面板配置
        component.propertyPanel = {
          ...componentDef.propertyPanel,
          ...component.propertyPanel,
        };
      }

      // 递归处理子组件
      if (component.children) {
        component.children.forEach(this.mergeComponentConfig);
      }
    },

    // 移动组件
    moveComponent(sourceId: string, targetId: string): boolean {
      // 检查是否是自己拖到自己
      if (sourceId === targetId) {
        return false;
      }

      // 查找源组件及其父组件
      const { component: sourceComponent, parent: sourceParent } =
        this.findComponentWithParent(sourceId);
      if (!sourceComponent || !sourceParent) {
        return false;
      }

      // 移除源组件
      const sourceIndex = sourceParent.indexOf(sourceComponent);
      sourceParent.splice(sourceIndex, 1);

      // 添加到目标位置
      if (targetId === 'root') {
        this.components.push(sourceComponent);
        this.currentComponentId = sourceComponent.componentInstanceId;
        return true;
      }

      // 查找目标容器
      const { component: targetComponent } =
        this.findComponentWithParent(targetId);
      if (!targetComponent) {
        this.components.push(sourceComponent);
        this.currentComponentId = sourceComponent.componentInstanceId;
        return true;
      }

      if (targetComponent.componentCode !== 'Container') {
        // 如果移动失败，将组件放回原位置
        sourceParent.splice(sourceIndex, 0, sourceComponent);
        return false;
      }

      if (!targetComponent.children) {
        targetComponent.children = [];
      }
      targetComponent.children.push(sourceComponent);
      this.currentComponentId = sourceComponent.componentInstanceId;
      return true;
    },

    // 引用全局数据源到页面
    async referenceGlobalDataSource(globalDsCode: string) {
      try {
        const globalDs = this.globalDataSources.find(
          (ds) => ds.dsCode === globalDsCode,
        );
        if (!globalDs) {
          throw new Error('Global data source not found');
        }

        // 检查是否已经引用
        if (
          this.currentPage?.dataSources?.some(
            (ds) => ds.dsCode === globalDsCode,
          )
        ) {
          throw new Error('该数据源已被引用');
        }

        // 创建页面级引用
        const pageDs = {
          ...globalDs,
          globalDsCode: globalDs.dsCode,
          scope: 'PAGE',
          sourceType: 'GLOBAL_REF',
        };

        if (!this.currentPage) {
          this.initPage();
        }
        if (!this.currentPage.dataSources) {
          this.currentPage.dataSources = [];
        }

        this.currentPage.dataSources.push(pageDs);
        return pageDs;
      } catch (error) {
        console.error('Failed to reference global data source:', error);
        throw error;
      }
    },

    // 删除组件
    removeComponent(id: string): boolean {
      const { component, parent } = this.findComponentWithParent(id);

      if (component && parent) {
        const index = parent.indexOf(component);
        parent.splice(index, 1);

        if (this.currentComponentId === id) {
          this.currentComponentId = null;
        }

        // 同步更新 currentPage 的组件列表
        if (this.currentPage) {
          this.currentPage.components = [...this.components];
        }

        return true;
      }
      return false;
    },

    async removeDataSource(id: string) {
      try {
        await deleteDataSource(id);
        // 从全局数据源列表中移除
        this.globalDataSources = this.globalDataSources.filter(
          (ds) => ds.id !== id,
        );
        // 从页面数据源列表中移除
        if (this.currentPage) {
          this.currentPage.dataSources = this.currentPage.dataSources.filter(
            (ds) => ds.id !== id,
          );
        }
      } catch (error) {
        console.error('Failed to delete data source:', error);
        throw error;
      }
    },

    // 删除事件
    removeEvent(type: PageEventType) {
      if (!this.currentPage) {
        return false;
      }

      // 更新页面事件列表
      const updatedEvents = this.currentPage.events.filter(
        (e) => e.type !== type,
      );

      // 更新页面配置
      this.updateCurrentPage({
        ...this.currentPage,
        events: updatedEvents,
      });

      return true;
    },

    // 保存页面
    async savePage() {
      if (!this.currentPage) {
        throw new Error('当前页面不存在');
      }

      try {
        const pageData: Omit<PageApi.QueryResult, 'id'> = {
          components: this.components,
          dataSources: this.currentPage.dataSources,
          events: this.currentPage.events,
          pageCode: this.currentPage.pageCode,
          pageName: this.currentPage.pageName,
          status: PageStatus.DRAFT,
          version: '1.0.0',
        };

        console.log('Saving page data:', pageData);
        const data = await saveOrUpdatePage(pageData);
        if (!data) {
          throw new Error('保存页面失败：服务器返回数据为空');
        }
        return data;
      } catch (error) {
        console.error('Failed to save page:', error);
        throw error;
      }
    },

    // 设置当前选中的组件
    setCurrentComponentId(id: string) {
      this.currentComponentId = id;
    },

    // 更新组件
    updateComponent(id: string, updates: Partial<ComponentInstance>): boolean {
      const { component } = this.findComponentWithParent(id);

      if (component) {
        // 保存原有的组件树结构
        const children = component.children;

        // 合并更新，确保保留原有字段
        Object.assign(component, {
          ...updates,
          componentInstanceId: id, // 保持原有的ID
          children, // 保持原有的子组件
        });

        console.log('组件更新后的状态:', {
          更新内容: updates,
          更新后的组件: component,
          组件ID: id,
        });

        return true;
      }
      return false;
    },

    // 更新组件数据（带缓存）
    updateComponentData(componentId: string, data: any) {
      this.componentDataCache.set(componentId, data);
    },

    // 更新当前页面
    updateCurrentPage(page: Page) {
      console.log('更新页面配置:', page);
      this.currentPage = page;
    },

    // 更新数据源
    async updateDataSource(id: string, dataSource: DataSource) {
      try {
        const data = await saveOrUpdateDataSource(dataSource);

        // 如果是全局数据源，更新全局数据源列表
        if (dataSource.scope === 'GLOBAL') {
          this.globalDataSources = this.globalDataSources.map((ds) =>
            ds.id === id ? data : ds,
          );
        }

        // 如果是页面数据源，更新页面数据源列表
        if (dataSource.scope === 'PAGE' && this.currentPage) {
          this.currentPage.dataSources = this.currentPage.dataSources.map(
            (ds) => (ds.id === id ? data : ds),
          );
        }

        return data;
      } catch (error) {
        console.error('Failed to update data source:', error);
        throw error;
      }
    },

    // 更新数据源数据（针对全局数据源列表）
    updateDataSourceData(dsCode: string, data: any) {
      const index = this.dataSourceList.findIndex((ds) => ds.dsCode === dsCode);
      if (index > -1) {
        this.dataSourceList[index] = {
          ...this.dataSourceList[index],
          data,
        };
      }
    },

    // 更新事件
    updateEvent(event: PageEvent) {
      if (!this.currentPage) {
        return false;
      }

      // 更新页面事件列表
      const updatedEvents = this.currentPage.events.map((e) =>
        e.type === event.type ? event : e,
      );

      // 更新页面配置
      this.updateCurrentPage({
        ...this.currentPage,
        events: updatedEvents,
      });

      return true;
    },

    // 更新数据源配置（针对页面级数据源）
    updatePageDataSource(dataSource: DataSource) {
      if (!this.currentPage) {
        return false;
      }

      // 更新页面数据源列表
      const updatedDataSources = this.currentPage.dataSources.map((ds) =>
        ds.dsCode === dataSource.dsCode ? dataSource : ds,
      );

      // 更新页面配置
      this.updateCurrentPage({
        ...this.currentPage,
        dataSources: updatedDataSources,
      });

      return true;
    },
  },

  getters: {
    // 获取当前选中的组件实例
    currentComponent: (state) => {
      if (!state.currentComponentId) return undefined;
      const { component } = state.findComponentWithParent(
        state.currentComponentId,
      );
      return component || undefined;
    },

    // 获取缓存的组件数据
    getCachedComponentData: (state) => (componentId: string) => {
      return state.componentDataCache.get(componentId);
    },

    // 获取数据源加载状态
    isDataSourceLoading: (state) => (dsCode: string) => {
      return state.dataSourceLoadingStates.get(dsCode) || false;
    },
  },

  state: (): LowCodeState => ({
    componentDataCache: new Map<string, any>(),
    components: [],
    currentComponentId: null,
    currentPage: null,
    dataSourceList: [],
    dataSourceLoadingStates: new Map<string, boolean>(),
    dataSourcePagination: {
      current: 1,
      size: 10,
      total: 0,
    },
    globalDataSources: [], // 初始化全局数据源列表
  }),
});
