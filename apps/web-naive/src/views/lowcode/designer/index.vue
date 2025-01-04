<script setup lang="ts">
import ComponentPanel from './components/ComponentPanel.vue';
import DesignCanvas from './components/DesignCanvas.vue';
import PropertyPanel from './components/PropertyPanel.vue';
</script>

<template>
  <div class="designer-container">
    <div class="designer-panel">
      <ComponentPanel />
    </div>
    <div class="designer-canvas">
      <DesignCanvas />
    </div>
    <div class="designer-panel">
      <PropertyPanel />
    </div>
  </div>
</template>

<style lang="less" scoped>
.designer-container {
  display: flex;
  height: 100%;
  gap: 16px;
  padding: 16px;
  background-color: #f5f5f5;
}

.designer-panel {
  width: 380px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.designer-canvas {
  flex: 1;
  min-width: 320px;
  max-width: 400px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
</style> 
