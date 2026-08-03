import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: '/',
			name: 'game',
			component: () => import('@/components/gameLayout.vue'),
		},
		{
			path: '/editor',
			name: 'editor',
			component: () => import('@/components/gameLayout.vue'),
		},
	],
})

export default router
