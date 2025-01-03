import { ref } from 'vue';
import { useLowCodeStore } from '#/store/modules/lowcode';
import { useHistory } from './useHistory';
import type { Component, ComponentRelation } from '#/types/lowcode';
import { v4 as uuidv4 } from 'uuid';

export function useDragDrop() {
  const store = useLowCodeStore();
  const { addHistory } = useHistory();
  
  // 拖拽状态
  const dragoverNodeId = ref<string | null>(null);
  const dragPosition = ref<'before' | 'after' | 'inside' | null>(null);

  // 处理拖拽进入
  const handleDragEnter = (e: DragEvent, nodeId: string) => {
    e.preventDefault();
    dragoverNodeId.value = nodeId;

    // 计算拖拽位置
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    
    if (offsetY < rect.height * 0.25) {
      dragPosition.value = 'before';
    } else if (offsetY > rect.height * 0.75) {
      dragPosition.value = 'after';
    } else {
      // 检查是否是容器组件
      const component = store.components.find(
        (item) => item.componentCode === store.componentRelations.find(
          (rel) => rel.componentInstanceId === nodeId,
        )?.componentCode,
      );
      dragPosition.value = component?.isContainer ? 'inside' : 'after';
    }
  };

  // 处理拖拽离开
  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    dragoverNodeId.value = null;
    dragPosition.value = null;
  };

  // 处理拖拽放置
  const handleDrop = (e: DragEvent, targetId: string | null = null) => {
    e.preventDefault();
    const position = dragPosition.value;
    dragoverNodeId.value = null;
    dragPosition.value = null;

    // 处理组件移动
    const moveNodeId = e.dataTransfer?.getData('moveNodeId');
    if (moveNodeId) {
      if (!targetId) return;

      const targetNode = store.componentRelations.find(
        (item) => item.componentInstanceId === targetId,
      );
      if (!targetNode) return;

      let parentId = targetNode.parentInstanceId;
      let index = store.componentRelations
        .filter((item) => item.parentInstanceId === parentId)
        .findIndex((item) => item.componentInstanceId === targetId);

      if (position === 'inside') {
        parentId = targetId;
        index = store.componentRelations
          .filter((item) => item.parentInstanceId === parentId)
          .length;
      } else if (position === 'after') {
        index += 1;
      }

      store.moveComponent(moveNodeId, parentId, index);
      addHistory();
      return;
    }

    // 处理新组件添加
    const componentCode = e.dataTransfer?.getData('componentCode');
    if (!componentCode) return;

    // 查找组件定义
    const component = store.components.find(
      (item) => item.componentCode === componentCode,
    );
    if (!component) return;

    // 创建组件实例
    const componentInstance: ComponentRelation = {
      id: 0,
      tenantId: '',
      pageCode: store.currentPage?.pageCode || '',
      version: '1.0.0',
      componentInstanceId: uuidv4(),
      parentInstanceId: targetId,
      componentCode: component.componentCode,
      props: { ...component.defaultProps },
      sortOrder: store.componentRelations.filter(
        (item) => item.parentInstanceId === targetId,
      ).length,
    };

    // 添加到组件关系中
    store.addComponent(componentInstance);
    addHistory();
  };

  return {
    dragoverNodeId,
    dragPosition,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  };
} 
