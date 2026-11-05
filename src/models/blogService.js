import { apiGet } from './api';
import { normalizarPost } from '../utils/blog';

/**
 * Publicaciones del blog, de la más reciente a la más antigua (GET /api/blog/posts, público).
 * El backend solo regresa las publicadas y ya las ordena por fecha de publicación.
 * @param {{ page?: number, limit?: number, signal?: AbortSignal }} [options]
 */
export async function getPosts({ page = 1, limit = 10, signal } = {}) {
  const body = await apiGet('/api/blog/posts', { params: { page, limit }, signal });
  const items = Array.isArray(body?.data) ? body.data.map(normalizarPost) : [];
  const total = Number(body?.pagination?.total) || 0;
  const totalPages = Number(body?.pagination?.totalPages) || 0;
  return { items, total, page, totalPages };
}

/**
 * Una publicación completa con su contenido (GET /api/blog/posts/:slug, público).
 * @param {string} slug
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function getPost(slug, { signal } = {}) {
  const body = await apiGet(`/api/blog/posts/${encodeURIComponent(slug)}`, { signal });
  return normalizarPost(body?.data);
}
