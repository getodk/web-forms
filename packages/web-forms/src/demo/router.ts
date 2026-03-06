import type { Component } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import AppUser from './AppUser.vue';
import CPA from './CPA.vue';
import Form from './Form.vue';
import FormPreview from './FormPreview.vue';
import HomePage from './HomePage.vue';
import Login from './Login.vue';
import PublicLink from './PublicLink.vue';

const routes = [
	{ path: '/', component: HomePage as Component },
	{ path: '/form', component: FormPreview as Component },
	{ path: '/form/:category/:form', component: FormPreview as Component },
	{ path: '/f/:id', component: PublicLink },
	{ name: 'app', path: '/app', component: AppUser },
	{ name: 'form', path: '/form/:id?', component: Form },
	{ name: 'login', path: '/login', component: Login },
	{ path: '/cpa', component: CPA },
];

const router = createRouter({
	history: createWebHashHistory(),
	routes,
});

export default router;
