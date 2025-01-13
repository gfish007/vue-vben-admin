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

// 定义状态接口
interface LowCodeState {
  // 组件列表，用于存储所有组件实例
  components: ComponentInstance[];
  // 当前选中的组件ID
  currentComponentId: null | string;
  // 数据源列表
  dataSources: DataSource[];
  // 数据源分页
  dataSourcePagination: {
    current: number;
    size: number;
    total: number;
  };
  currentPage: null | Page;
}

export const useLowCodeStore = defineStore('lowcode', {
  actions: {
    // 添加组件
    addComponent(component: ComponentInstance, parentId?: string) {
      // 确保组件有唯一ID
      if (!component.componentInstanceId) {
        component.componentInstanceId = nanoid();
      }

      if (!parentId) {
        // 添加到根级别
        this.components.push(component);
        this.currentComponentId = component.componentInstanceId;
        return true;
      }

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

      const added = addToContainer(this.components);
      if (!added) {
        this.components.push(component);
        this.currentComponentId = component.componentInstanceId;
      }
      return added;
    },

    async addDataSource(dataSource: DataSource) {
      try {
        if (!this.currentPage) {
          this.initPage();
        }

        // 检查数据源编码是否重复
        if (
          this.currentPage!.dataSources.some(
            (ds) => ds.dsCode === dataSource.dsCode,
          )
        ) {
          throw new Error('该数据源编码已存在');
        }

        // 保存到后端
        const res = await saveOrUpdateDataSource(dataSource);
        if (!res.data) {
          throw new Error('保存数据源失败：服务器返回数据为空');
        }

        // 更新页面数据源列表
        const updatedDataSources = [...this.currentPage!.dataSources, res.data];

        // 更新页面配置
        this.updateCurrentPage({
          ...this.currentPage!,
          dataSources: updatedDataSources,
        });

        // 刷新数据源列表
        await this.loadDataSources({
          page: {
            current: this.dataSourcePagination.current,
            size: this.dataSourcePagination.size,
          },
          queryBody: {},
        });

        return res.data;
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

    // 数据源相关方法
    async loadDataSources(params: DataSourceApi.QueryParams) {
      try {
        const data = await queryDataSourceList(params);

        this.dataSources = data.records;
        this.dataSourcePagination.total = data.total;
      } catch (error) {
        console.error('Failed to load data sources:', error);
        throw error;
      }
    },

    // 加载页面详情
    async loadPageDetail(params: { pageCode: string; version: string }) {
      try {
        const data = await getPageDetail(params);
        if (!data) {
          throw new Error('获取页面详情失败：服务器未返回数据');
        }

        // 更新组件列表
        this.components = data.components || [];

        // 更新当前页面
        this.updateCurrentPage({
          components: data.components || [],
          dataSources: data.dataSources || [],
          events: data.events || [],
          pageCode: data.pageCode,
          pageName: data.pageName,
        });

        return data;
      } catch (error) {
        console.error('Failed to load page detail:', error);
        throw error;
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

    // 删除组件
    removeComponent(id: string): boolean {
      const { component, parent } = this.findComponentWithParent(id);

      if (component && parent) {
        const index = parent.indexOf(component);
        parent.splice(index, 1);

        if (this.currentComponentId === id) {
          this.currentComponentId = null;
        }
        return true;
      }
      return false;
    },

    async removeDataSource(id: string) {
      try {
        await deleteDataSource(id);
        await this.loadDataSources({
          page: {
            current: this.dataSourcePagination.current,
            size: this.dataSourcePagination.size,
          },
          queryBody: {},
        });
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
        Object.assign(component, updates);
        return true;
      }
      return false;
    },

    // 更新当前页面
    updateCurrentPage(page: Page) {
      console.log('更新页面配置:', page);
      this.currentPage = page;
    },

    // 更新数据源
    updateDataSource(dataSource: DataSource) {
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
  },

  state: (): LowCodeState => ({
    components: [],
    currentComponentId: null,
    currentPage: null as null | Page,
    dataSourcePagination: {
      current: 1,
      size: 10,
      total: 0,
    },
    dataSources: [],
  }),
});
