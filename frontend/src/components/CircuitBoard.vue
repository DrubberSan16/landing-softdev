<script setup>
import { animate, hover, stagger } from 'framer-motion/dom'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const board = ref(null)
const cleanupTasks = []
const animationControls = []
const nodes = [
  { key: 'idea', kicker: 'Entrada', label: 'Tu proceso', icon: 'spark', className: 'circuit-node--idea' },
  { key: 'flow', kicker: 'Lógica', label: 'Automatización', icon: 'flow', className: 'circuit-node--flow' },
  { key: 'data', kicker: 'Control', label: 'Datos útiles', icon: 'database', className: 'circuit-node--data' },
  { key: 'result', kicker: 'Salida', label: 'Decisiones', icon: 'chart', className: 'circuit-node--result' },
]

onMounted(() => {
  if (!board.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const pulses = board.value.querySelectorAll('.circuit-board__pulse')
  const cards = board.value.querySelectorAll('.circuit-node')
  animationControls.push(animate(pulses, { strokeDashoffset: [0, -96] }, { duration: 2.4, delay: stagger(0.28), ease: 'linear', repeat: Infinity }))
  animationControls.push(animate(cards, { opacity: [0, 1], scale: [0.92, 1] }, { duration: 0.52, delay: stagger(0.1), ease: [0.22, 1, 0.36, 1] }))
  cards.forEach((card) => cleanupTasks.push(hover(card, () => {
    animationControls.push(animate(card, { scale: 1.055 }, { duration: 0.2 }))
    return () => animationControls.push(animate(card, { scale: 1 }, { duration: 0.18 }))
  })))
})

onBeforeUnmount(() => {
  cleanupTasks.forEach((cleanup) => cleanup?.())
  animationControls.forEach((control) => control?.stop?.())
})
</script>

<template>
  <div ref="board" class="circuit-board" role="img" aria-label="Flujo digital desde el proceso de negocio hasta decisiones basadas en datos">
    <div class="circuit-board__topline"><span><i></i>Sistema en operación</span><strong>SOFTDEV / FLOW 01</strong></div>
    <svg class="circuit-board__paths" viewBox="0 0 600 390" aria-hidden="true">
      <defs><linearGradient id="trace-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#60a5fa" /><stop offset="100%" stop-color="#2563eb" /></linearGradient></defs>
      <path class="circuit-board__trace" d="M112 92 H246 V148" /><path class="circuit-board__pulse" d="M112 92 H246 V148" />
      <path class="circuit-board__trace" d="M112 298 H246 V236" /><path class="circuit-board__pulse" d="M112 298 H246 V236" />
      <path class="circuit-board__trace" d="M354 148 H472 V195" /><path class="circuit-board__pulse" d="M354 148 H472 V195" />
      <path class="circuit-board__trace" d="M354 236 H472 V195" /><path class="circuit-board__pulse" d="M354 236 H472 V195" />
      <circle cx="112" cy="92" r="4" /><circle cx="112" cy="298" r="4" /><circle cx="246" cy="148" r="4" /><circle cx="246" cy="236" r="4" /><circle cx="472" cy="195" r="4" />
    </svg>
    <article v-for="node in nodes" :key="node.key" class="circuit-node" :class="node.className">
      <span class="circuit-node__icon" aria-hidden="true">
        <svg v-if="node.icon === 'spark'" viewBox="0 0 24 24"><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1"/><circle cx="12" cy="12" r="3"/></svg>
        <svg v-else-if="node.icon === 'flow'" viewBox="0 0 24 24"><rect x="3" y="4" width="7" height="6" rx="2"/><rect x="14" y="14" width="7" height="6" rx="2"/><path d="M10 7h3a4 4 0 0 1 4 4v3M14 17h-3a4 4 0 0 1-4-4v-3"/></svg>
        <svg v-else-if="node.icon === 'database'" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>
        <svg v-else viewBox="0 0 24 24"><path d="M4 19V9m5 10V5m5 14v-7m5 7V3"/></svg>
      </span>
      <span><small>{{ node.kicker }}</small><strong>{{ node.label }}</strong></span>
    </article>
    <div class="circuit-board__status"><span>01 Diagnóstico</span><span>02 Diseño</span><span>03 Entrega</span></div>
  </div>
</template>

<style scoped>
.circuit-board{position:relative;min-height:460px;overflow:hidden;border:1px solid rgba(148,163,184,.28);border-radius:28px;background:radial-gradient(circle at 72% 22%,rgba(37,99,235,.2),transparent 31%),linear-gradient(rgba(37,99,235,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,.055) 1px,transparent 1px),rgba(255,255,255,.82);background-size:auto,28px 28px,28px 28px,auto;box-shadow:0 28px 80px rgba(15,23,42,.14);backdrop-filter:blur(18px)}
.circuit-board::before{position:absolute;inset:0;content:'';background:linear-gradient(115deg,rgba(255,255,255,.84),transparent 44%);pointer-events:none}
.circuit-board__topline,.circuit-board__status{position:absolute;z-index:3;right:24px;left:24px;display:flex;align-items:center;justify-content:space-between;gap:12px;color:#64748b;font-size:.69rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.circuit-board__topline{top:22px}.circuit-board__status{bottom:20px}.circuit-board__topline span{display:flex;align-items:center;gap:8px}.circuit-board__topline i{width:7px;height:7px;border-radius:50%;background:#16a34a;box-shadow:0 0 0 5px rgba(22,163,74,.12)}
.circuit-board__paths{position:absolute;inset:46px 0 35px;width:100%;height:calc(100% - 81px)}.circuit-board__paths circle{fill:#2563eb}.circuit-board__trace,.circuit-board__pulse{fill:none;stroke-width:2}.circuit-board__trace{stroke:rgba(37,99,235,.2)}.circuit-board__pulse{stroke:url(#trace-gradient);stroke-dasharray:9 87;stroke-linecap:round;filter:drop-shadow(0 0 5px rgba(37,99,235,.7))}
.circuit-node{position:absolute;z-index:2;display:flex;align-items:center;gap:10px;min-width:138px;padding:12px 14px;border:1px solid rgba(148,163,184,.28);border-radius:14px;background:rgba(255,255,255,.91);box-shadow:0 12px 30px rgba(15,23,42,.1);will-change:transform}.circuit-node--idea{top:22%;left:3%}.circuit-node--flow{top:34%;left:38%}.circuit-node--data{top:63%;left:38%}.circuit-node--result{top:46%;right:3%}.circuit-node__icon{display:grid;width:34px;height:34px;flex:0 0 34px;place-items:center;border-radius:10px;color:#2563eb;background:#eaf1ff}.circuit-node__icon svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.circuit-node small,.circuit-node strong{display:block}.circuit-node small{margin-bottom:3px;color:#64748b;font-size:.63rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.circuit-node strong{color:#0f172a;font-size:.82rem}
@media(max-width:640px){.circuit-board{min-height:410px}.circuit-board__topline strong{display:none}.circuit-board__status{justify-content:center}.circuit-board__status span:nth-child(2){display:none}.circuit-node{min-width:116px;padding:9px 10px}.circuit-node__icon{width:30px;height:30px;flex-basis:30px}.circuit-node--idea{top:22%;left:3%}.circuit-node--flow{top:36%;left:34%}.circuit-node--data{top:65%;left:34%}.circuit-node--result{top:49%;right:2%}}
@media(prefers-reduced-motion:reduce){.circuit-board__pulse{stroke-dasharray:none;opacity:.62}}
</style>
