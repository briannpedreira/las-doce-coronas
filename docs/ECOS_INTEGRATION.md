# Contrato de integración del sistema de Ecos

El runtime define window.LDC_ECOS y mantiene las definiciones desacopladas del motor.

## Adaptador esperado

```js
window.LDC_ECOS.attachBattle({
  canSummon: function (eco) {},
  summon: function (eco) {},
  useEcoAbility: function (eco, ability) {},
  getBattleContext: function () {}
});
```

## API disponible
- LDC_ECOS.register(definition)
- LDC_ECOS.get(id)
- LDC_ECOS.list()
- LDC_ECOS.attachBattle(adapter)
- LDC_ECOS.detachBattle()
- LDC_ECOS.summon(id)
- LDC_ECOS.useAbility(id, abilityId)
- LDC_ECOS.preview()

## Contrato de una definición
Cada Eco debe tener id estable, nombre, título, tipo, descripción, afinidades, costes configurables, habilidades con id/tipo/objetivo/parámetros, metadatos de frames y estado de canon para separar datos confirmados de propuestas.

## Reglas de combate
1. El runtime no modifica recursos reales sin un adaptador.
2. El motor valida costes, usos por combate, objetivos y estados.
3. La UI no decide si una unidad está viva o puede ser objetivo.
4. El motor limita resurrecciones, inmunidades y duraciones.
5. Los multiplicadores iniciales son provisionales hasta contrastarlos con el balance real.

La integración final debe conectarse donde el menú de combate confirma una acción de Eco. No descontar recursos desde el renderer.
