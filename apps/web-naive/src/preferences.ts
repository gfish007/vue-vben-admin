import { defineOverridesPreferences } from '@vben/preferences';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    accessMode: 'backend',
    authPageLayout: 'panel-center',
    // 检查更新的时间间隔，单位为分钟
    checkUpdatesInterval: 1,
    dynamicTitle: true,
    // 是否开启检查更新
    enableCheckUpdates: true,
    loginExpiredMode: 'modal',
    name: import.meta.env.VITE_APP_TITLE,
    watermark: true,
  },
  theme: {
    builtinType: 'violet',
    colorPrimary: 'hsl(245 82% 67%)',
    mode: 'light',
    semiDarkSidebar: false,
  },
});
