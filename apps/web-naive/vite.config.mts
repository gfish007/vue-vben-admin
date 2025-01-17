import { defineConfig } from '@vben/vite-config';

import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';

export default defineConfig(async () => {
  return {
    application: {},
    plugins: [vue(), vueJsx()],
    vite: {
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // mock代理目标地址
            target: 'http://localhost:8092',
            ws: true,
          },
        },
      },
    },
  };
});
