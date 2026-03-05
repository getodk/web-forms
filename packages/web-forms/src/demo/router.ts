import type { Component } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import AppUser from './AppUser.vue';
import CPA from './CPA.vue';
import FormPreview from './FormPreview.vue';
import HomePage from './HomePage.vue';
import PublicLink from './PublicLink.vue';

const routes = [
	{ path: '/', component: HomePage as Component },
	{ path: '/form', component: FormPreview as Component },
	{ path: '/form/:category/:form', component: FormPreview as Component },
	{ path: '/f/:id', component: PublicLink },
	{ path: '/app/:id', component: AppUser },
	{ path: '/cpa', component: CPA },
];

const router = createRouter({
	history: createWebHashHistory(),
	routes,
});

export default router;
