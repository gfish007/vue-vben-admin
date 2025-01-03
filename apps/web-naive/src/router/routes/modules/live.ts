import type { AppRouteRecordRaw } from '#/router/types';

export default [
  {
    path: '/live',
    name: 'Live',
    component: 'LAYOUT',
    redirect: '/live/monitoring',
    meta: {
      title: '直播管理',
      icon: 'video-camera',
      sort: 3,
    },
    children: [
      {
        path: 'monitoring',
        name: 'LiveMonitoring',
        component: () => import('#/views/live/monitoring/index.vue'),
        meta: {
          title: '直播监控',
          icon: 'video-camera',
        },
      },
    ],
  },
] as AppRouteRecordRaw[]; 
