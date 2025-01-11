import type { DataSourceApi } from '../../api/lowcode/dataSource.types';
import type { ComponentInstance, DataSource } from '../../types/lowcode';

import { nanoid } from 'nanoid';
import { defineStore } from 'pinia';

import {
  deleteDataSource,
  getDataSourceDetail,
  queryDataSourceList,
  saveOrUpdateDataSource,
} from '../../api/lowcode/dataSource';

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

    async addDataSource(dataSource: Omit<DataSource, 'id'>) {
      try {
        const res = await saveOrUpdateDataSource(dataSource);
        if (res.data) {
          await this.loadDataSources({
            page: {
              current: this.dataSourcePagination.current,
              size: this.dataSourcePagination.size,
            },
            queryBody: {},
          });
        }
        return res.data;
      } catch (error) {
        console.error('Failed to add data source:', error);
        throw error;
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

    async updateDataSource(id: string, dataSource: DataSource) {
      try {
        const res = await saveOrUpdateDataSource({ ...dataSource, id });
        if (res.data) {
          await this.loadDataSources({
            page: {
              current: this.dataSourcePagination.current,
              size: this.dataSourcePagination.size,
            },
            queryBody: {},
          });
        }
        return res.data;
      } catch (error) {
        console.error('Failed to update data source:', error);
        throw error;
      }
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
    dataSourcePagination: {
      current: 1,
      size: 10,
      total: 0,
    },
    dataSources: [],
  }),
});
