import type { DataSourceApi } from '../../api/lowcode/dataSource.types';
import type { ComponentInstance, DataSource } from '../../types/lowcode';

import { defineStore } from 'pinia';

import {
  deleteDataSource,
  queryDataSourceList,
  saveOrUpdateDataSource,
} from '../../api/lowcode/dataSource';

interface LowCodeState {
  components: ComponentInstance[];
  currentComponentId: null | string;
  dataSources: DataSource[];
  dataSourcePagination: {
    current: number;
    size: number;
    total: number;
  };
  maxZIndex: number;
}

export const useLowCodeStore = defineStore('lowcode', {
  actions: {
    addComponent(component: ComponentInstance) {
      this.components.push(component);
      this.currentComponentId = component.componentInstanceId;
      const zIndex = component.style?.zIndex;
      this.maxZIndex = Math.max(
        this.maxZIndex,
        zIndex ? Number.parseInt(zIndex, 10) : 0,
      );
    },

    async addDataSource(dataSource: Omit<DataSource, 'id'>) {
      try {
        const response = await saveOrUpdateDataSource(dataSource);
        this.dataSources.push(response.data);
      } catch (error) {
        console.error('Failed to add data source:', error);
        throw error;
      }
    },

    bringComponentToFront(id: string) {
      const component = this.components.find(
        (c) => c.componentInstanceId === id,
      );
      if (component && component.style) {
        this.maxZIndex += 1;
        component.style.zIndex = this.maxZIndex.toString();
      }
    },

    getDataSourceById(id: string) {
      return this.dataSources.find((ds) => ds.id === id);
    },

    getMaxZIndex() {
      return this.maxZIndex;
    },

    async loadDataSources(params: DataSourceApi.QueryParams) {
      try {
        const response = await queryDataSourceList(params);
        const { current, records, size, total } = response;
        this.dataSources = records;
        this.dataSourcePagination = {
          current,
          size,
          total,
        };
      } catch (error) {
        console.error('Failed to load data sources:', error);
        throw error;
      }
    },

    removeComponent(id: string) {
      const index = this.components.findIndex(
        (c) => c.componentInstanceId === id,
      );
      if (index > -1) {
        this.components.splice(index, 1);
        if (this.currentComponentId === id) {
          this.currentComponentId = null;
        }
      }
    },

    async removeDataSource(id: string) {
      try {
        await deleteDataSource(id);
        this.dataSources = this.dataSources.filter((ds) => ds.id !== id);
      } catch (error) {
        console.error('Failed to delete data source:', error);
        throw error;
      }
    },

    setCurrentComponentId(id: null | string) {
      this.currentComponentId = id;
    },

    updateComponent(id: string, updates: Partial<ComponentInstance>) {
      const component = this.components.find(
        (c) => c.componentInstanceId === id,
      );
      if (component) {
        const updatedComponent: ComponentInstance = {
          ...component,
          ...updates,
          props: {
            ...component.props,
            ...updates.props,
          },
          style: {
            ...component.style,
            ...updates.style,
          },
        };
        const index = this.components.findIndex(
          (c) => c.componentInstanceId === id,
        );
        if (index > -1) {
          this.components.splice(index, 1, updatedComponent);
        }
      }
    },

    async updateDataSource(id: string, dataSource: DataSource) {
      try {
        const response = await saveOrUpdateDataSource(dataSource);
        const index = this.dataSources.findIndex((ds) => ds.id === id);
        if (index > -1) {
          this.dataSources[index] = response.data;
        }
      } catch (error) {
        console.error('Failed to update data source:', error);
        throw error;
      }
    },
  },

  getters: {
    currentComponent: (state) =>
      state.components.find(
        (c) => c.componentInstanceId === state.currentComponentId,
      ),
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
    maxZIndex: 0,
  }),
});
