import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: '/',
			name: 'game',
			component: () => import('@/components/GameLayout.vue'),
		},
		{
			path: '/editor',
			name: 'editor',
			component: () => import('@/components/GameLayout.vue'),
		},
	],
})

export default router
