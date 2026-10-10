import { API_URL } from '../config';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const TIMEOUT_MS = 15_000;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
}

/** Hace una petición al backend y devuelve el JSON. Cualquier fallo se convierte en ApiError. */
export async function request<T>(path: string, { method = 'GET', body, token }: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisá tu conexión.');
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 204) return undefined as T;

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // respuesta sin JSON: se maneja abajo según el código
  }

  if (!response.ok) {
    const error = (data as { error?: { message?: string; details?: Array<{ mensaje?: string }> } } | null)?.error;
    // Si el servidor explica qué campo falló, se muestra ese detalle en lugar del mensaje genérico.
    const detail = error?.details
      ?.map((d) => d.mensaje)
      .filter(Boolean)
      .join(' ');
    throw new ApiError(response.status, detail || error?.message || 'Ocurrió un error inesperado.');
  }
  return data as T;
}
