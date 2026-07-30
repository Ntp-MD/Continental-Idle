import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'game',
      component: () => import('@/layouts/gameLayout.vue'),
    },
    {
      path: '/editor',
      name: 'editor',
      component: () => import('@/layouts/gameLayout.vue'),
    },
  ],
})

export default router
