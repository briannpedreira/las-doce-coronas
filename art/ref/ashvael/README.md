# Sistema de Ecos v1 — Ashvael

Esta rama incorpora un laboratorio visual y una API inicial reutilizable para Ecos.

## Qué incluye
- js/eco-runtime.js: registro de Ecos, visor de invocación, renderer pixel-art Canvas y contrato de adaptador de combate.
- art/ref/ashvael/ashvael.json: definición declarativa de Ashvael, habilidades, afinidades y rutas de recursos.
- docs/ECOS_INTEGRATION.md: contrato para conectar el motor de combate.
- El botón Ecos aparece en la interfaz y abre un laboratorio de prueba.

## Estado honesto de integración
El laboratorio es funcional como vista previa y simulador aislado. No altera partidas guardadas ni recursos reales. El motor concentra la lógica en js/game.js, cuyo contenido no estuvo disponible para lectura en esta sesión; por eso no se conectó automáticamente el daño, PM, Ímpetu, estados o resurrección del combate real.

Cuando el motor exponga sus funciones, registrar un adaptador con window.LDC_ECOS.attachBattle(adapter). Ver contrato en docs/ECOS_INTEGRATION.md.

## Canon
La única descripción confirmada por el autor es «Ave inmensa de plumas de brasa». El lore extendido y los valores de balance deben validarse.
