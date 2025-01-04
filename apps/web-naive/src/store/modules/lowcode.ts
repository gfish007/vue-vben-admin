import { defineStore } from 'pinia';
import type { Component, ComponentRelation, PageConfig } from '#/types/lowcode';

export interface LowCodeState {
  currentPage: PageConfig | null;
  componentRelations: ComponentRelation[];
  selectedComponentId: string | null;
  currentComponent: Component | null;
  currentNode: ComponentRelation | null;
}

export const useLowCodeStore = defineStore('lowcode', {
  state: (): LowCodeState => ({
    currentPage: null,
    componentRelations: [],
    selectedComponentId: null,
    currentComponent: null,
    currentNode: null,
  }),

  actions: {
    setCurrentPage(page: PageConfig) {
      this.currentPage = page;
    },

    setComponentRelations(relations: ComponentRelation[]) {
      this.componentRelations = relations;
    },

    setSelectedComponentId(id: string | null) {
      this.selectedComponentId = id;
      if (id) {
        // 设置当前组件和节点
        const node = this.componentRelations.find(
          comp => comp.componentInstanceId === id
        );
        if (node) {
          this.currentNode = node;
          // TODO: 从组件库中获取组件定义
          this.currentComponent = null;
        } else {
          this.currentNode = null;
          this.currentComponent = null;
        }
      } else {
        this.currentComponent = null;
        this.currentNode = null;
      }
    },

    addComponent(component: ComponentRelation) {
      this.componentRelations.push(component);
    },

    updateComponent(component: ComponentRelation) {
      const index = this.componentRelations.findIndex(
        comp => comp.componentInstanceId === component.componentInstanceId
      );
      if (index > -1) {
        this.componentRelations[index] = component;
      }
    },

    removeComponent(id: string) {
      const index = this.componentRelations.findIndex(
        comp => comp.componentInstanceId === id
      );
      if (index > -1) {
        this.componentRelations.splice(index, 1);
      }
    },

    swapComponents(sourceId: string, targetId: string) {
      const sourceIndex = this.componentRelations.findIndex(
        comp => comp.componentInstanceId === sourceId
      );
      const targetIndex = this.componentRelations.findIndex(
        comp => comp.componentInstanceId === targetId
      );
      if (sourceIndex > -1 && targetIndex > -1) {
        const sourceComponent = this.componentRelations[sourceIndex] as ComponentRelation;
        const targetComponent = this.componentRelations[targetIndex] as ComponentRelation;
        
        // Create new component objects with swapped sort orders
        const newSourceComponent: ComponentRelation = {
          ...targetComponent,
          sortOrder: sourceComponent.sortOrder
        };
        
        const newTargetComponent: ComponentRelation = {
          ...sourceComponent,
          sortOrder: targetComponent.sortOrder
        };
        
        this.componentRelations[sourceIndex] = newSourceComponent;
        this.componentRelations[targetIndex] = newTargetComponent;
      }
    },
  },
}); 
