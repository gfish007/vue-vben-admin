import { defineStore } from 'pinia';
import type { PageApi } from '#/api/lowcode/page.types';

interface LowCodeState {
  currentPage: Nullable<PageApi.PageRecord>;
  componentRelations: any[];
}

export const useLowCodeStore = defineStore('lowcode', {
  state: (): LowCodeState => ({
    currentPage: null,
    componentRelations: [],
  }),

  actions: {
    setCurrentPage(page: PageApi.PageRecord) {
      this.currentPage = page;
      // 设置组件关系
      if (page.layoutConfig?.components) {
        this.componentRelations = page.layoutConfig.components;
      }
    },

    setComponentRelations(relations: any[]) {
      this.componentRelations = relations;
    },
  },
}); 
