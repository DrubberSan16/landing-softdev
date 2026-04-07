import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import PublicLayout from '../layouts/PublicLayout.vue'
import AdminDashboardPage from '../pages/AdminDashboardPage.vue'
import AdminLoginPage from '../pages/AdminLoginPage.vue'
import AdminModulePage from '../pages/AdminModulePage.vue'
import ContactPage from '../pages/ContactPage.vue'
import HomePage from '../pages/HomePage.vue'
import NotFoundPage from '../pages/NotFoundPage.vue'
import ProjectDetailPage from '../pages/ProjectDetailPage.vue'
import ProjectsPage from '../pages/ProjectsPage.vue'
import { getAdminSessionToken } from '../utils/admin-session'

const routes = [
  {
    path: '/',
    component: PublicLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: HomePage,
        meta: {
          pageType: 'home',
          routeName: 'home',
        },
      },
      {
        path: 'proyectos',
        name: 'projects',
        component: ProjectsPage,
        meta: {
          pageType: 'catalog',
          routeName: 'projects-catalog',
        },
      },
      {
        path: 'proyectos/:slug',
        name: 'project-detail',
        component: ProjectDetailPage,
        meta: {
          pageType: 'project_detail',
          routeName: 'project-detail',
        },
      },
      {
        path: 'contacto',
        name: 'contact',
        component: ContactPage,
        meta: {
          pageType: 'contact',
          routeName: 'contact',
        },
      },
    ],
  },
  {
    path: '/admin/login',
    name: 'admin-login',
    component: AdminLoginPage,
    meta: {
      guestOnly: true,
      pageType: 'other',
      routeName: 'admin-login',
    },
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: {
      requiresAuth: true,
      pageType: 'other',
    },
    children: [
      {
        path: '',
        redirect: { name: 'admin-dashboard' },
      },
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: AdminDashboardPage,
        meta: {
          routeName: 'admin-dashboard',
        },
      },
      {
        path: 'proyectos',
        name: 'admin-projects',
        component: AdminModulePage,
        meta: {
          routeName: 'admin-projects',
          moduleKey: 'projects',
        },
      },
      {
        path: 'categorias',
        name: 'admin-categories',
        component: AdminModulePage,
        meta: {
          routeName: 'admin-categories',
          moduleKey: 'categories',
        },
      },
      {
        path: 'tecnologias',
        name: 'admin-technologies',
        component: AdminModulePage,
        meta: {
          routeName: 'admin-technologies',
          moduleKey: 'technologies',
        },
      },
      {
        path: 'contactos',
        name: 'admin-contacts',
        component: AdminModulePage,
        meta: {
          routeName: 'admin-contacts',
          moduleKey: 'contacts',
        },
      },
      {
        path: 'metricas',
        name: 'admin-metrics',
        component: AdminModulePage,
        meta: {
          routeName: 'admin-metrics',
          moduleKey: 'metrics',
        },
      },
      {
        path: 'usuarios',
        name: 'admin-users',
        component: AdminModulePage,
        meta: {
          routeName: 'admin-users',
          moduleKey: 'users',
        },
      },
      {
        path: 'roles',
        name: 'admin-roles',
        component: AdminModulePage,
        meta: {
          routeName: 'admin-roles',
          moduleKey: 'roles',
        },
      },
      {
        path: 'notificaciones',
        name: 'admin-notifications',
        component: AdminModulePage,
        meta: {
          routeName: 'admin-notifications',
          moduleKey: 'notifications',
        },
      },
      {
        path: 'auditoria',
        name: 'admin-audit',
        component: AdminModulePage,
        meta: {
          routeName: 'admin-audit',
          moduleKey: 'audit',
        },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundPage,
    meta: {
      pageType: 'other',
      routeName: 'not-found',
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    if (to.hash) {
      return {
        el: to.hash,
        top: 96,
        behavior: 'smooth',
      }
    }

    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const token = getAdminSessionToken()

  if (to.meta.requiresAuth && !token) {
    return { name: 'admin-login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && token) {
    return { name: 'admin-dashboard' }
  }

  return true
})

export default router
