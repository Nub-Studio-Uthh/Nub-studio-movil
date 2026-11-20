// RESUMEN DE COMPATIBILIDAD — issue #49
// Junta los reportes de cada emulador (tests/compatibilidad/probar-dispositivo.sh) en una
// tabla en Markdown que se imprime en la terminal y, en GitHub Actions, también en el resumen
// de la ejecución.
//
// Uso:
//   node tests/compatibilidad/resumen.mjs resultados
//
// "resultados" tiene una carpeta por dispositivo (los artefactos reporte-compatibilidad-*),
// cada una con dispositivo.txt, maestro.xml, arranque.txt, memoria.txt y fallas.txt.
// Siempre termina sin error: cada versión ya falla o pasa en su propio job.
import { appendFileSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Mismo orden que la matriz de manual.yml; lo que no esté aquí va al final.
const ORDEN = ['api26', 'api29', 'api31', 'api34', 'api36', 'gama-baja'];

const leerSiExiste = (ruta) => (existsSync(ruta) ? readFileSync(ruta, 'utf8') : '');
const miles = (n) => Math.round(n).toLocaleString('en-US');

export function leerDispositivo(texto) {
  return Object.fromEntries(
    texto
      .split('\n')
      .map((linea) => linea.trim())
      .filter((linea) => linea.includes('='))
      .map((linea) => [linea.slice(0, linea.indexOf('=')), linea.slice(linea.indexOf('=') + 1)])
  );
}

// Cada <testcase> de Maestro es un flujo; falló si trae <failure> o <error>, o si su status
// no es SUCCESS.
export function leerFlujos(xml) {
  const flujos = [];
  const patron = /<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g;
  for (const [, atributos, cuerpo = ''] of xml.matchAll(patron)) {
    const nombre = /\bname="([^"]*)"/.exec(atributos)?.[1] ?? '¿sin nombre?';
    const status = /\bstatus="([^"]*)"/.exec(atributos)?.[1];
    const fallo =
      /<(failure|error)\b/.test(cuerpo) || (status !== undefined && status !== 'SUCCESS');
    flujos.push({ nombre, ok: !fallo });
  }
  return flujos;
}

export function leerNumeros(texto) {
  return texto
    .split('\n')
    .map((linea) => Number.parseFloat(linea))
    .filter((n) => Number.isFinite(n));
}

export function filaDispositivo(id, carpeta) {
  const datos = leerDispositivo(leerSiExiste(join(carpeta, 'dispositivo.txt')));
  const flujos = leerFlujos(leerSiExiste(join(carpeta, 'maestro.xml')));
  const arranques = leerNumeros(leerSiExiste(join(carpeta, 'arranque.txt')));
  const [memoriaKb] = leerNumeros(leerSiExiste(join(carpeta, 'memoria.txt')));
  const fallas = leerDispositivo(leerSiExiste(join(carpeta, 'fallas.txt')));
  return { id, datos, flujos, arranques, memoriaKb, fallas };
}

// Cierres inesperados y ANR de la app durante la prueba (del registro de Android).
function celdaFallas({ cierres, anr }) {
  if (cierres === undefined || anr === undefined) return '—';
  const ok = Number(cierres) === 0 && Number(anr) === 0;
  return `${ok ? '✅' : '❌'} ${cierres} / ${anr}`;
}

function celdaFlujos(flujos) {
  if (flujos.length === 0) return '⚠️ Sin resultados';
  const aprobados = flujos.filter((f) => f.ok).length;
  return `${aprobados === flujos.length ? '✅' : '❌'} ${aprobados} de ${flujos.length}`;
}

function celdaArranque(arranques) {
  if (arranques.length === 0) return '—';
  const promedio = arranques.reduce((a, b) => a + b, 0) / arranques.length;
  return `${miles(promedio)} ms (${miles(Math.min(...arranques))}–${miles(Math.max(...arranques))})`;
}

export function armarTabla(filas) {
  const lineas = [
    '## 09 · Pruebas de compatibilidad',
    '',
    '| Dispositivo | Android (API) | Pantalla | RAM | Flujos E2E | Cierres / ANR de la app | Arranque en frío (promedio de 5) | Memoria en Login (PSS) |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const { id, datos, flujos, arranques, memoriaKb, fallas } of filas) {
    const nombre = datos.nombre || id;
    const version = datos.android ? `${datos.android} (${datos.api})` : '—';
    const pantalla = datos.pantalla ? `${datos.pantalla} · ${datos.densidad} dpi` : '—';
    const ram = datos.ram_mb ? `${(Number(datos.ram_mb) / 1024).toFixed(1)} GB` : '—';
    const memoria = memoriaKb ? `${miles(memoriaKb / 1024)} MB` : '—';
    lineas.push(
      `| ${nombre} | ${version} | ${pantalla} | ${ram} | ${celdaFlujos(flujos)} | ${celdaFallas(fallas)} | ${celdaArranque(arranques)} | ${memoria} |`
    );
  }

  const fallidos = filas.filter(({ flujos }) => flujos.some((f) => !f.ok));
  const sinDatos = filas.filter(({ flujos }) => flujos.length === 0);
  if (fallidos.length > 0) {
    lineas.push('', '### Flujos que fallaron', '');
    for (const { id, datos, flujos } of fallidos) {
      const nombres = flujos.filter((f) => !f.ok).map((f) => `\`${f.nombre}\``);
      lineas.push(`- **${datos.nombre || id}:** ${nombres.join(', ')}`);
    }
  }
  if (sinDatos.length > 0) {
    lineas.push(
      '',
      `> ⚠️ Sin resultados de flujos en: ${sinDatos.map(({ id, datos }) => datos.nombre || id).join(', ')}. ` +
        'El emulador no arrancó o la app no se instaló; la causa está en el log de su job.'
    );
  }
  lineas.push(
    '',
    '> Los emuladores dibujan por software: el arranque y la memoria sirven para comparar ' +
      'versiones entre sí, no con un teléfono real. Las capturas de cada flujo están en el ' +
      'artefacto `reporte-compatibilidad-<versión>`, carpeta `maestro/`.'
  );
  return lineas.join('\n');
}

function ordenar(a, b) {
  const pa = ORDEN.indexOf(a) === -1 ? ORDEN.length : ORDEN.indexOf(a);
  const pb = ORDEN.indexOf(b) === -1 ? ORDEN.length : ORDEN.indexOf(b);
  return pa - pb || a.localeCompare(b);
}

function principal(raiz) {
  const filas = readdirSync(raiz, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => ({
      carpeta: join(raiz, d.name),
      id: d.name.replace('reporte-compatibilidad-', ''),
    }))
    .sort((a, b) => ordenar(a.id, b.id))
    .map(({ id, carpeta }) => filaDispositivo(id, carpeta));

  const markdown =
    filas.length > 0 ? armarTabla(filas) : 'No se encontraron reportes de compatibilidad.';
  console.log(markdown);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
}

if (process.argv[1]?.endsWith('resumen.mjs')) principal(process.argv[2] ?? 'resultados');
