<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { animate, stagger } from 'framer-motion/dom'
import { ArrowUpRight, LockKeyhole, Menu, Navigation, X } from 'lucide-vue-next'

const navigation = [
  { label: 'Impacto', to: { path: '/', hash: '#conocenos' } },
  { label: 'Experiencia', to: { path: '/', hash: '#experiencia' } },
  { label: 'Proceso', to: { path: '/', hash: '#proceso' } },
  { label: 'Soluciones', to: { path: '/', hash: '#servicios' } },
]

const expanded = ref(true)
const mobileMenuOpen = ref(false)
const navRoot = ref(null)
const lastScrollY = ref(0)
const collapseScrollY = ref(0)
const reduceMotion = ref(false)
let entranceAnimation
let stateAnimation

function setExpanded(value) {
  expanded.value = value
  if (!value) mobileMenuOpen.value = false
}

function handleShellClick() {
  if (!expanded.value) setExpanded(true)
}

function toggleMobileMenu() {
  if (!expanded.value) {
    setExpanded(true)
    mobileMenuOpen.value = true
    return
  }

  mobileMenuOpen.value = !mobileMenuOpen.value
}

function closeMenu() {
  mobileMenuOpen.value = false
}

function updateOnScroll() {
  const latest = window.scrollY
  const previous = lastScrollY.value

  if (expanded.value && latest > previous && latest > 150) {
    setExpanded(false)
    collapseScrollY.value = latest
  } else if (!expanded.value && latest < previous && collapseScrollY.value - latest > 80) {
    setExpanded(true)
  }

  lastScrollY.value = latest
}

watch(expanded, async (isExpanded) => {
  await nextTick()
  if (reduceMotion.value || !navRoot.value) return

  stateAnimation?.stop?.()
  const links = navRoot.value.querySelectorAll('.animated-nav__item')
  stateAnimation = animate(
    links,
    isExpanded ? { opacity: [0, 1], x: [-12, 0] } : { opacity: [1, 0], x: [0, -12] },
    { duration: isExpanded ? 0.28 : 0.16, delay: isExpanded ? stagger(0.035) : 0 },
  )
})

onMounted(() => {
  reduceMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  lastScrollY.value = window.scrollY
  window.addEventListener('scroll', updateOnScroll, { passive: true })

  if (!reduceMotion.value && navRoot.value) {
    entranceAnimation = animate(
      navRoot.value,
      { opacity: [0, 1], y: [-72, 0] },
      { duration: 0.58, ease: [0.22, 1, 0.36, 1] },
    )
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateOnScroll)
  entranceAnimation?.stop?.()
  stateAnimation?.stop?.()
})
</script>

<template>
  <header class="animated-nav-host">
    <nav
      ref="navRoot"
      class="animated-nav"
      :class="{ 'is-collapsed': !expanded, 'is-mobile-open': mobileMenuOpen }"
      aria-label="Navegación principal"
      @click="handleShellClick"
    >
      <RouterLink
        class="animated-nav__brand"
        to="/"
        aria-label="Software Easy Dev - Inicio"
        :tabindex="expanded ? 0 : -1"
        @click.stop="closeMenu"
      >
        <Navigation :size="20" :stroke-width="1.9" aria-hidden="true" />
        <span>Software Easy Dev</span>
      </RouterLink>

      <div class="animated-nav__links" :aria-hidden="!expanded">
        <RouterLink
          v-for="item in navigation"
          :key="item.label"
          class="animated-nav__item"
          :to="item.to"
          :tabindex="expanded ? 0 : -1"
          @click.stop="closeMenu"
        >
          {{ item.label }}
        </RouterLink>
        <RouterLink
          class="animated-nav__item animated-nav__access"
          :to="{ name: 'admin-login' }"
          :tabindex="expanded ? 0 : -1"
          @click.stop="closeMenu"
        >
          <LockKeyhole :size="15" aria-hidden="true" />
          Acceso
        </RouterLink>
        <RouterLink
          class="animated-nav__item animated-nav__cta"
          :to="{ path: '/', hash: '#contacto' }"
          :tabindex="expanded ? 0 : -1"
          @click.stop="closeMenu"
        >
          Hablemos
          <ArrowUpRight :size="15" aria-hidden="true" />
        </RouterLink>
      </div>

      <button
        class="animated-nav__mobile-toggle"
        type="button"
        :aria-expanded="mobileMenuOpen"
        :aria-label="mobileMenuOpen ? 'Cerrar navegación' : 'Abrir navegación'"
        @click.stop="toggleMobileMenu"
      >
        <X v-if="mobileMenuOpen" :size="20" aria-hidden="true" />
        <Menu v-else :size="20" aria-hidden="true" />
      </button>

      <button
        v-if="!expanded"
        class="animated-nav__collapsed-button"
        type="button"
        aria-label="Expandir navegación"
        @click.stop="setExpanded(true)"
      >
        <Menu :size="21" aria-hidden="true" />
      </button>
    </nav>
  </header>
</template>

<style scoped>
.animated-nav-host{position:fixed;top:20px;right:0;left:0;z-index:80;display:flex;justify-content:center;pointer-events:none}.animated-nav{position:relative;display:flex;width:min(920px,calc(100% - 40px));min-height:54px;align-items:center;gap:18px;padding:6px 7px 6px 14px;overflow:visible;border:1px solid rgba(148,163,184,.32);border-radius:999px;background:rgba(255,255,255,.84);box-shadow:0 16px 50px rgba(15,23,42,.13),inset 0 1px 0 rgba(255,255,255,.85);backdrop-filter:blur(20px);pointer-events:auto;transition:width .42s cubic-bezier(.22,1,.36,1),box-shadow .25s ease,background .25s ease}.animated-nav.is-collapsed{width:54px;padding:0;cursor:pointer;background:rgba(255,255,255,.9)}.animated-nav.is-collapsed:hover{box-shadow:0 18px 48px rgba(37,99,235,.2)}.animated-nav__brand{display:flex;min-width:max-content;align-items:center;gap:8px;color:#0f172a;font-size:.74rem;font-weight:800;transition:opacity .2s ease,transform .25s ease}.animated-nav__brand svg{color:#2563eb}.animated-nav__links{display:flex;min-width:0;margin-left:auto;align-items:center;gap:3px;transition:opacity .18s ease}.animated-nav__item{display:inline-flex;min-height:40px;align-items:center;justify-content:center;gap:5px;padding:8px 10px;border-radius:999px;color:#526174;font-size:.7rem;font-weight:750;white-space:nowrap;transition:color .18s ease,background .18s ease,box-shadow .18s ease}.animated-nav__item:hover{color:#0f172a;background:#eef3f9}.animated-nav__access{margin-left:3px;border-left:1px solid #d8e1ed;border-radius:0;padding-left:13px}.animated-nav__cta{min-height:42px;padding-inline:15px;color:#fff;background:#2563eb;box-shadow:0 8px 18px rgba(37,99,235,.23)}.animated-nav__cta:hover{color:#fff;background:#1746b3}.animated-nav__collapsed-button{position:absolute;inset:0;display:grid;width:100%;height:100%;place-items:center;border:0;border-radius:50%;color:#0f172a;background:transparent;cursor:pointer}.animated-nav.is-collapsed .animated-nav__brand,.animated-nav.is-collapsed .animated-nav__links,.animated-nav.is-collapsed .animated-nav__mobile-toggle{visibility:hidden;opacity:0;pointer-events:none}.animated-nav__mobile-toggle{display:none;width:42px;height:42px;flex:0 0 auto;place-items:center;border:0;border-radius:50%;color:#0f172a;background:#eef3f9;cursor:pointer}.animated-nav a:focus-visible,.animated-nav button:focus-visible{outline:3px solid rgba(37,99,235,.38);outline-offset:3px}
@media(max-width:820px){.animated-nav-host{top:12px}.animated-nav{width:calc(100% - 24px);min-height:54px;gap:10px}.animated-nav__brand span{display:none}.animated-nav__links{position:absolute;top:64px;right:0;left:0;display:none;align-items:stretch;flex-direction:column;padding:10px;border:1px solid rgba(148,163,184,.3);border-radius:20px;background:rgba(255,255,255,.97);box-shadow:0 24px 60px rgba(15,23,42,.17);backdrop-filter:blur(20px)}.animated-nav.is-mobile-open .animated-nav__links{display:flex}.animated-nav__item{justify-content:flex-start;padding:11px 13px}.animated-nav__access{margin-left:0;border-top:1px solid #e2e8f0;border-left:0;border-radius:0;padding-top:13px}.animated-nav__cta{justify-content:center}.animated-nav__mobile-toggle{display:grid;margin-left:auto}}
@media(prefers-reduced-motion:reduce){.animated-nav,.animated-nav__brand,.animated-nav__links,.animated-nav__item{transition:none}}
</style>
