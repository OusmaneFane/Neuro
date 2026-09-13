/** Extract payload from Laravel `{ data: T }` or return as-is. */
export function unwrap<T>(body: unknown): T {
  if (body !== null && typeof body === 'object' && 'data' in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

export interface LaravelPage<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

export function pageItems<T>(body: unknown): LaravelPage<T> {
  const inner = unwrap<LaravelPage<T> | T[]>(body);
  if (Array.isArray(inner)) {
    return { data: inner, current_page: 1, last_page: 1, per_page: inner.length, total: inner.length };
  }
  return inner;
}
