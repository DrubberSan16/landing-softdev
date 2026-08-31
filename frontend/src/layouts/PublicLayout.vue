<script setup>
import { RouterLink, RouterView } from 'vue-router'
import AnimatedPublicNav from '../components/AnimatedPublicNav.vue'
import { appConfig } from '../services/config'
</script>

<template>
  <div class="public-shell">
    <AnimatedPublicNav />

    <RouterView />

    <footer class="public-footer">
      <div class="public-footer__inner">
        <div class="public-footer__brand">
          <div class="public-brand public-brand--footer"><span class="public-brand__mark">SE</span><span><strong>Software Easy Dev</strong><small>Software hecho alrededor de tu negocio</small></span></div>
          <p>Diseñamos plataformas, automatizaciones y experiencias digitales para empresas que quieren operar con más claridad.</p>
        </div>
        <div class="public-footer__column"><strong>Explorar</strong><RouterLink :to="{ path: '/', hash: '#conocenos' }">Impacto</RouterLink><RouterLink :to="{ path: '/', hash: '#proceso' }">Proceso</RouterLink><RouterLink to="/proyectos">Proyectos</RouterLink></div>
        <div class="public-footer__column"><strong>Contacto</strong><RouterLink :to="{ path: '/', hash: '#contacto' }">Solicitar diagnóstico</RouterLink><a href="https://wa.me/593991749473" target="_blank" rel="noopener noreferrer">WhatsApp</a><RouterLink to="/admin/login">Acceso administrativo</RouterLink></div>
      </div>
      <div class="public-footer__bottom"><span>© {{ new Date().getFullYear() }} {{ appConfig.appName }}</span><span>Guayaquil · Ecuador</span></div>
    </footer>

    <a class="public-whatsapp" href="https://wa.me/593991749473?text=Hola%20Software%20Easy%20Dev%2C%20quiero%20digitalizar%20un%20proceso%20de%20mi%20empresa." target="_blank" rel="noopener noreferrer" aria-label="Contactar por WhatsApp">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.7a8.4 8.4 0 0 1-12.4 7.4L4 20.2l1.1-4a8.4 8.4 0 1 1 15.4-4.5Z"/><path d="M9 8.1c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.8 1.8c.1.3 0 .5-.2.7l-.6.7c-.2.2-.1.4 0 .6.6 1.1 1.5 2 2.7 2.6.2.1.4.1.6-.1l.8-.9c.2-.2.4-.3.7-.2l1.8.8c.3.1.4.3.4.5 0 .4-.2 1.3-.7 1.8-.5.5-1.2.8-2 .7-1.2-.1-2.8-.6-4.8-2.3-1.6-1.4-2.7-3.1-3-4.4-.3-1 .1-1.8.8-2.3Z"/></svg>
      <span>Hablemos</span>
    </a>
  </div>
</template>

<style scoped>
.public-shell{min-height:100vh;background:#f8fafc}.public-brand{display:inline-flex;align-items:center;gap:11px}.public-brand__mark{display:grid;width:38px;height:38px;place-items:center;border-radius:11px;color:#fff;background:#2563eb;box-shadow:0 10px 24px rgba(37,99,235,.24);font-size:.68rem;font-weight:800;letter-spacing:-.03em}.public-brand strong,.public-brand small{display:block}.public-brand strong{color:#0f172a;font-family:'Plus Jakarta Sans','Manrope',sans-serif;font-size:.84rem}.public-brand small{margin-top:2px;color:#64748b;font-size:.57rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase}
.public-footer{padding:74px 0 26px;color:#cbd5e1;background:#0b1220}.public-footer__inner{display:grid;width:min(1180px,calc(100% - 40px));margin:auto;grid-template-columns:1.5fr .6fr .75fr;gap:70px}.public-brand--footer strong{color:#fff}.public-brand--footer small{color:#93a4bc}.public-footer__brand>p{max-width:500px;margin-top:22px;color:#93a4bc;font-size:.82rem;line-height:1.7}.public-footer__column{display:grid;align-content:start;gap:13px}.public-footer__column strong{margin-bottom:8px;color:#fff;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase}.public-footer__column a{color:#93a4bc;font-size:.76rem}.public-footer__column a:hover{color:#fff}.public-footer__bottom{display:flex;width:min(1180px,calc(100% - 40px));margin:55px auto 0;padding-top:20px;border-top:1px solid rgba(255,255,255,.1);justify-content:space-between;color:#64748b;font-size:.68rem}.public-whatsapp{position:fixed;right:22px;bottom:22px;z-index:45;display:flex;min-height:48px;align-items:center;gap:8px;padding:10px 14px;border:1px solid rgba(255,255,255,.6);border-radius:999px;color:#fff;background:#16a34a;box-shadow:0 14px 30px rgba(22,163,74,.25);font-size:.72rem;font-weight:800}.public-whatsapp svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}.public-nav a:focus-visible,.public-brand:focus-visible,.public-whatsapp:focus-visible,.public-menu-button:focus-visible{outline:3px solid rgba(37,99,235,.4);outline-offset:3px}
@media(max-width:900px){.public-footer__inner{grid-template-columns:1fr 1fr}.public-footer__brand{grid-column:1/-1}}
@media(max-width:600px){.public-header__inner,.public-footer__inner,.public-footer__bottom{width:calc(100% - 28px)}.public-brand small{display:none}.public-footer__inner{grid-template-columns:1fr;gap:42px}.public-footer__brand{grid-column:auto}.public-footer__bottom{align-items:flex-start;flex-direction:column;gap:8px}.public-whatsapp span{display:none}.public-whatsapp{width:50px;height:50px;justify-content:center;padding:0}}
</style>
