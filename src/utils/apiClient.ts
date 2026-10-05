/**
 * Centralized, resilient API client for FAWNIC Atelier.
 * Prevents "Unexpected token '<' / 'T' ... is not valid JSON" errors by safely
 * inspecting response content types and handling HTML/server error responses cleanly.
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Resilient fetch wrapper with automatic backoff retry to gracefully handle
 * transient network lags, server reloads, or container cold starts.
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  maxRetries = 3,
  delayMs = 600
): Promise<Response> {
  let lastError: any = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(input, init);
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

export async function safeFetch<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(input, init);
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (isJson) {
      try {
        const data = await res.json();
        if (!res.ok) {
          return {
            ok: false,
            status: res.status,
            data,
            error: data.error || data.message || `Request failed with status ${res.status}`,
            message: data.message || data.error,
          };
        }
        return {
          ok: true,
          status: res.status,
          data,
          message: data.message,
        };
      } catch (jsonErr: any) {
        return {
          ok: false,
          status: res.status,
          error: 'Invalid response format received from server.',
        };
      }
    }

    // Response is NOT JSON (e.g. Vercel HTML error page, 404 HTML, or text)
    const textContent = await res.text().catch(() => '');
    let cleanMessage = 'Server temporarily unavailable. Please try again.';

    if (res.status === 404) {
      cleanMessage = 'The requested service endpoint could not be found.';
    } else if (res.status === 500 || res.status === 502 || res.status === 503) {
      cleanMessage = 'Server error occurred. Please try again momentarily.';
    } else if (res.status === 401) {
      cleanMessage = 'Invalid credentials or unauthorized access.';
    } else if (res.status === 403) {
      cleanMessage = 'Access denied. Account may be suspended or lack permissions.';
    }

    // If development, log the endpoint details without exposing to user
    const isDev = Boolean((import.meta as any).env?.DEV);
    if (isDev) {
      console.warn(`[safeFetch] Non-JSON response from ${input.toString()}: status ${res.status}, snippet:`, textContent.slice(0, 100));
    }

    return {
      ok: false,
      status: res.status,
      error: cleanMessage,
      message: cleanMessage,
    };
  } catch (netErr: any) {
    return {
      ok: false,
      status: 0,
      error: netErr?.message || 'Network connection failed. Please check your internet.',
      message: 'Network connection failed. Please check your internet.',
    };
  }
}
