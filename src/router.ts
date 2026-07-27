import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'game',
      component: () => import('@/layouts/GameLayout.vue'),
    },
    {
      path: '/editor',
      name: 'editor',
      component: () => import('@/blueprint-editor/App.vue'),
    },
  ],
})

export default router
