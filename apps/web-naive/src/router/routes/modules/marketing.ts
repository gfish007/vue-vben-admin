import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'lucide: megaphone',
      order: 4,
      title: '营销管理',
    },
    name: 'Marketing',
    path: '/marketing',
    children: [
      {
        name: 'BannerManagement',
        path: '/marketing/banner',
        component: () => import('#/views/marketing/banner/index.vue'),
        meta: {
          icon: 'lucide: image',
          title: 'Banner管理',
        },
      },
      {
        name: 'RecommendManagement',
        path: '/marketing/recommend',
        component: () => import('#/views/marketing/recommend/index.vue'),
        meta: {
          icon: 'lucide: list',
          title: '推荐管理',
        },
      },
      {
        name: 'DiamondAreaManagement',
        path: '/marketing/diamond-area',
        component: () => import('#/views/marketing/diamondArea/index.vue'),
        meta: {
          icon: 'lucide: grid-3x3',
          title: '金刚区管理',
        },
      },
    ],
  },
];

export default routes;