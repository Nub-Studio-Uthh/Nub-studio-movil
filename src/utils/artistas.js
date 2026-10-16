// Funciones puras del perfil de artista (HU-03).
import { normalizarObra } from './obras';

/** Año de una fecha ("2018-05-02T..." -> 2018), o null si no es válida. */
export function anioDe(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d.getFullYear();
}

/** Solo se muestran obras publicadas y activas (el endpoint por id regresa todas). */
export const esObraVisible = (o) => o?.estado === 'publicada' && o?.activa !== false;

/**
 * Convierte el artista de GET /api/artistas/:id al formato de la app.
 * Solo se conservan datos públicos: el endpoint también trae correo, teléfono y datos
 * bancarios, que la app nunca guarda ni muestra.
 * @param {Record<string, any>} raw
 */
export function normalizarArtista(raw) {
  const nombre = raw?.nombre_artistico || raw?.nombre_completo || '';
  const obras = (Array.isArray(raw?.obras) ? raw.obras : [])
    .filter(esObraVisible)
    .map((o) => normalizarObra({ ...o, artista_alias: nombre }));
  const fotoPrincipal = Array.isArray(raw?.fotos_personales)
    ? raw.fotos_personales.find((f) => f?.es_principal)?.url_foto
    : null;

  return {
    id: raw?.id_artista ?? null,
    nombre,
    biografia: (raw?.biografia ?? '').trim(),
    foto: raw?.foto_perfil || fotoPrincipal || null,
    ciudad: (raw?.ciudad ?? '').trim(),
    categoria: raw?.categoria_nombre ?? '',
    desde: anioDe(raw?.fecha_aprobacion ?? raw?.fecha_registro),
    obras,
  };
}
