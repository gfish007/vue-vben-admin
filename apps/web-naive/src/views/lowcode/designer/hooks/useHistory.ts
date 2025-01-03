import { ref, computed } from 'vue';
import { useLowCodeStore } from '#/store/modules/lowcode';
import type { ComponentRelation } from '#/types/lowcode';

export function useHistory() {
  const store = useLowCodeStore();
  
  // 历史记录栈
  const history = ref<ComponentRelation[][]>([]);
  // 当前位置
  const currentIndex = ref(-1);
  // 是否正在执行撤销/重做
  const isHistoryAction = ref(false);

  // 添加历史记录
  const addHistory = () => {
    if (isHistoryAction.value) {
      isHistoryAction.value = false;
      return;
    }

    // 如果当前不在最新位置，删除后面的记录
    if (currentIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, currentIndex.value + 1);
    }

    // 添加新记录
    history.value.push(JSON.parse(JSON.stringify(store.componentRelations)));
    currentIndex.value = history.value.length - 1;
  };

  // 撤销
  const undo = () => {
    if (currentIndex.value > 0) {
      isHistoryAction.value = true;
      currentIndex.value--;
      store.setComponentRelations(
        JSON.parse(JSON.stringify(history.value[currentIndex.value])),
      );
    }
  };

  // 重做
  const redo = () => {
    if (currentIndex.value < history.value.length - 1) {
      isHistoryAction.value = true;
      currentIndex.value++;
      store.setComponentRelations(
        JSON.parse(JSON.stringify(history.value[currentIndex.value])),
      );
    }
  };

  return {
    canUndo: computed(() => currentIndex.value > 0),
    canRedo: computed(() => currentIndex.value < history.value.length - 1),
    addHistory,
    undo,
    redo,
  };
} 
