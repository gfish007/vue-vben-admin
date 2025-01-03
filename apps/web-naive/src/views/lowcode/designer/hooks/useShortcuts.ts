import { onMounted, onUnmounted } from 'vue';
import { useDialog } from 'naive-ui';
import { useLowCodeStore } from '#/store/modules/lowcode';
import { useHistory } from './useHistory';

export function useShortcuts() {
  const store = useLowCodeStore();
  const dialog = useDialog();
  const { undo, redo, addHistory } = useHistory();

  // 剪贴板数据
  let clipboardData: any = null;

  // 复制组件
  const handleCopy = () => {
    if (!store.selectedInstanceId) return;
    const node = store.componentRelations.find(
      (item) => item.componentInstanceId === store.selectedInstanceId,
    );
    if (node) {
      clipboardData = JSON.parse(JSON.stringify(node));
    }
  };

  // 粘贴组件
  const handlePaste = () => {
    if (!clipboardData) return;
    
    // 获取当前选中组件的父节点ID
    const parentId = store.selectedComponent?.parentInstanceId ?? null;
    
    // 深度复制并重新生成ID
    const copyNode = (node: any): any => {
      const newNode = { ...node };
      newNode.componentInstanceId = nanoid();
      newNode.parentInstanceId = parentId;
      if (node.children) {
        newNode.children = node.children.map((child: any) =>
          copyNode({ ...child, parentInstanceId: newNode.componentInstanceId }),
        );
      }
      return newNode;
    };
    
    const newNode = copyNode(clipboardData);
    store.addComponent(newNode);
    addHistory();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // 忽略输入框中的快捷键
    if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
      return;
    }

    // Ctrl/Command + Z: 撤销
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    }

    // Ctrl/Command + Shift + Z: 重做
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      redo();
    }

    // Ctrl/Command + Y: 重做
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();
      redo();
    }

    // Ctrl/Command + C: 复制
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      e.preventDefault();
      handleCopy();
    }

    // Ctrl/Command + V: 粘贴
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault();
      handlePaste();
    }

    // Delete/Backspace: 删除选中组件
    if ((e.key === 'Delete' || e.key === 'Backspace') && store.selectedInstanceId) {
      e.preventDefault();
      dialog.warning({
        title: '确认删除',
        content: '是否确认删除此组件？删除后将无法恢复',
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: () => {
          store.removeComponent(store.selectedInstanceId!);
          addHistory();
        },
      });
    }
  };

  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown);
  });

  // 返回快捷键提示
  return {
    shortcuts: [
      { key: '⌘/Ctrl + Z', description: '撤销' },
      { key: '⌘/Ctrl + Shift + Z', description: '重做' },
      { key: '⌘/Ctrl + Y', description: '重做' },
      { key: '⌘/Ctrl + C', description: '复制组件' },
      { key: '⌘/Ctrl + V', description: '粘贴组件' },
      { key: 'Delete/Backspace', description: '删除选中组件' },
    ],
    handleCopy,
    handlePaste,
  };
} 
