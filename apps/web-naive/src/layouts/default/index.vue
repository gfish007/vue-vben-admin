<script setup lang="ts">
import { NConfigProvider, NDialogProvider, NMessageProvider } from 'naive-ui';
// ... 其他导入
</script>

<template>
  <NConfigProvider>
    <NMessageProvider>
      <NDialogProvider>
        <!-- 原有的布局内容 -->
        <NLayout class="h-full">
          <NLayoutHeader>
            <!-- header content -->
          </NLayoutHeader>
          <NLayout has-sider>
            <NLayoutSider>
              <!-- sider content -->
            </NLayoutSider>
            <NLayoutContent>
              <RouterView />
            </NLayoutContent>
          </NLayout>
        </NLayout>
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template> 
