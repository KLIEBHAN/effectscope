export const fetchRaceBugOracle = [
  "render:selection-B:selection=B",
  "effect_start:effect-B:selection=B",
  "async_start:request-B:delayMs=1200,latest=true,selection=B",
  "render:selection-C:selection=C",
  "effect_start:effect-C:selection=C",
  "async_start:request-C:delayMs=200,latest=true,selection=C",
  "async_resolve:request-C:latest=true,selection=C",
  "state_write:todo-C:latest=true,selection=C",
  "async_resolve:request-B:latest=false,selection=B",
  "stale_write:todo-B:latest=false,selection=B",
  "invariant_fail:latest-request-wins",
];

export const fetchRaceFixOracle = [
  "render:selection-B:selection=B",
  "effect_start:effect-B:selection=B",
  "async_start:request-B:delayMs=1200,latest=true,selection=B",
  "render:selection-C:selection=C",
  "cleanup:effect-B:selection=B",
  "abort:request-B:latest=false,selection=B",
  "effect_start:effect-C:selection=C",
  "async_start:request-C:delayMs=200,latest=true,selection=C",
  "async_resolve:request-C:latest=true,selection=C",
  "state_write:todo-C:latest=true,selection=C",
  "invariant_pass:latest-request-wins",
];
