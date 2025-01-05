import type { ComponentInstance } from '#/types/lowcode';

import { defineStore } from 'pinia';

interface LowCodeState {
  currentComponentId: null | string;
  components: ComponentInstance[];
  maxZIndex: number;
}

export const useLowCodeStore = defineStore('lowcode', {
  actions: {
    addComponent(component: ComponentInstance) {
      this.components.push(component);
      this.currentComponentId = component.componentInstanceId;
      this.maxZIndex = Math.max(this.maxZIndex, component.style?.zIndex || 0);
    },

    bringComponentToFront(id: string) {
      const component = this.components.find(
        (c) => c.componentInstanceId === id,
      );
      if (component && component.style) {
        this.maxZIndex += 1;
        component.style.zIndex = this.maxZIndex;
      }
    },

    getMaxZIndex() {
      return this.maxZIndex;
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

    setCurrentComponentId(id: null | string) {
      this.currentComponentId = id;
    },

    updateComponent(id: string, updates: Partial<ComponentInstance>) {
      const index = this.components.findIndex(
        (c) => c.componentInstanceId === id,
      );
      if (index > -1) {
        const updatedComponent = {
          ...this.components[index],
          ...updates,
          props: {
            ...this.components[index].props,
            ...updates.props,
          },
          style: {
            ...this.components[index].style,
            ...updates.style,
          },
        };
        this.components.splice(index, 1, updatedComponent);
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
    maxZIndex: 0,
  }),
});
