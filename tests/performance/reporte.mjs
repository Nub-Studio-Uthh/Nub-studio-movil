// REPORTE DE RENDIMIENTO Y ESFUERZO — issue #87
// Lee el resumen que guarda k6 (--summary-export) y arma una tabla en Markdown que se
// imprime en la terminal y, en GitHub Actions, también en el resumen de la ejecución.
//
// Uso:
//   node tests/performance/reporte.mjs carga reports/carga.json tests/performance/linea-base.json
//   node tests/performance/reporte.mjs estres reports/estres.json
//   node tests/performance/reporte.mjs linea-base reports/carga.json > tests/performance/linea-base.json
//
// carga: compara contra la línea base y termina con error si el rendimiento empeoró.
// estres: muestra las fases de estrés y recuperación, y termina con error si alguna no cumplió.
// linea-base: genera el archivo de línea base a partir de una ejecución.
import { appendFileSync, readFileSync } from 'node:fs';

// El p95 y el promedio pueden empeorar hasta un 20 %. Además se ignoran diferencias menores
// a 50 ms: con respuestas de pocos milisegundos, un 20 % es ruido de la máquina, no un problema.
const TOLERANCIA = 0.2;
const MARGEN_MS = 50;
const MAX_ERRORES_PCT = 1;

const leer = (ruta) => JSON.parse(readFileSync(ruta, 'utf8'));
const ms = (valor) => `${valor.toFixed(1)} ms`;
const pct = (valor) => `${valor.toFixed(2)} %`;

function metricas(resumen, filtro = '') {
  const m = resumen.metrics;
  const duracion = m[`http_req_duration${filtro}`];
  const fallidas = m[`http_req_failed${filtro}`];
  return {
    p95_ms: duracion['p(95)'],
    promedio_ms: duracion.avg,
    errores_pct: (fallidas.value ?? 0) * 100,
    peticiones_por_seg: m.http_reqs.rate,
  };
}

// En el resumen de k6, cada umbral vale true si se rompió y false si se cumplió.
function umbrales(metrica) {
  return Object.entries(metrica?.thresholds ?? {}).map(([regla, roto]) => ({ regla, ok: !roto }));
}

function publicar(markdown) {
  console.log(markdown);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
}

function compararCarga(rutaResumen, rutaLineaBase) {
  const actual = metricas(leer(rutaResumen));
  const base = leer(rutaLineaBase);
  const filas = [];
  let empeoro = false;

  for (const [clave, nombre] of [
    ['p95_ms', 'Tiempo de respuesta p95'],
    ['promedio_ms', 'Tiempo de respuesta promedio'],
  ]) {
    const antes = base.metricas[clave];
    const ahora = actual[clave];
    const cambio = antes > 0 ? (ahora - antes) / antes : 0;
    const ok = ahora <= antes * (1 + TOLERANCIA) || ahora - antes <= MARGEN_MS;
    if (!ok) empeoro = true;
    filas.push([nombre, ms(antes), ms(ahora), `${(cambio * 100).toFixed(1)} %`, ok ? '✅' : '❌']);
  }

  const erroresOk = actual.errores_pct < MAX_ERRORES_PCT;
  if (!erroresOk) empeoro = true;
  filas.push([
    'Peticiones con error',
    pct(base.metricas.errores_pct),
    pct(actual.errores_pct),
    '—',
    erroresOk ? '✅' : '❌',
  ]);
  filas.push([
    'Peticiones por segundo',
    base.metricas.peticiones_por_seg.toFixed(1),
    actual.peticiones_por_seg.toFixed(1),
    '—',
    'ℹ️',
  ]);

  publicar(
    [
      '## 05 · Rendimiento contra la línea base',
      '',
      `Línea base: ${base.origen} (${base.fecha}).`,
      `Falla si el p95 o el promedio empeoran más de un ${TOLERANCIA * 100} % (y más de ${MARGEN_MS} ms), o si los errores llegan al ${MAX_ERRORES_PCT} %.`,
      '',
      '| Métrica | Línea base | Actual | Cambio | Estado |',
      '| --- | --- | --- | --- | --- |',
      ...filas.map((f) => `| ${f.join(' | ')} |`),
      '',
      empeoro
        ? '❌ **El rendimiento empeoró respecto a la línea base.**'
        : '✅ Dentro de la línea base.',
    ].join('\n')
  );
  return empeoro ? 1 : 0;
}

function reporteEstres(rutaResumen) {
  const resumen = leer(rutaResumen);
  const filas = [];
  let fallo = false;

  for (const [fase, nombre] of [
    ['estres', 'Estrés'],
    ['recuperacion', 'Recuperación'],
  ]) {
    const filtro = `{scenario:${fase}}`;
    const valores = metricas(resumen, filtro);
    const reglas = [
      ...umbrales(resumen.metrics[`http_req_duration${filtro}`]),
      ...umbrales(resumen.metrics[`http_req_failed${filtro}`]),
      ...umbrales(resumen.metrics[`checks${filtro}`]),
    ];
    const ok = reglas.every((r) => r.ok);
    if (!ok) fallo = true;
    filas.push([
      nombre,
      ms(valores.p95_ms),
      ms(valores.promedio_ms),
      pct(valores.errores_pct),
      reglas.map((r) => `${r.ok ? '✅' : '❌'} ${r.regla}`).join('<br>'),
    ]);
  }

  publicar(
    [
      '## 06 · Esfuerzo por fase',
      '',
      `Usuarios virtuales máximos: ${resumen.metrics.vus_max?.max ?? '—'}.`,
      '',
      '| Fase | p95 | Promedio | Errores | Umbrales |',
      '| --- | --- | --- | --- | --- |',
      ...filas.map((f) => `| ${f.join(' | ')} |`),
      '',
      fallo
        ? '❌ **La API no cumplió los umbrales** (si falla la recuperación, no volvió a la normalidad después del pico).'
        : '✅ La API aguantó el estrés y se recuperó después del pico.',
    ].join('\n')
  );
  return fallo ? 1 : 0;
}

function lineaBase(rutaResumen) {
  const valores = metricas(leer(rutaResumen));
  const redondeado = Object.fromEntries(
    Object.entries(valores).map(([clave, valor]) => [clave, Number(valor.toFixed(2))])
  );
  const archivo = {
    fecha: new Date().toISOString().slice(0, 10),
    origen: 'GitHub Actions, release.yml',
    prueba: 'tests/performance/carga.js (20 usuarios, 2 minutos)',
    metricas: redondeado,
  };
  console.log(JSON.stringify(archivo, null, 2));
  return 0;
}

const [modo, ...rutas] = process.argv.slice(2);
const modos = { carga: compararCarga, estres: reporteEstres, 'linea-base': lineaBase };
if (!modos[modo] || rutas.length === 0) {
  console.error(
    'Uso: node tests/performance/reporte.mjs <carga|estres|linea-base> <resumen.json> [linea-base.json]'
  );
  process.exit(1);
}
process.exit(modos[modo](...rutas));
