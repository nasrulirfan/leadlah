const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type RequestError = Error & { status?: number; body?: unknown };

const extractErrorMessage = (status: number, body: unknown) => {
  if (typeof body === "string" && body.trim().length) {
    return body;
  }

  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length) {
      return message;
    }
    if (Array.isArray(message) && message.length) {
      const first = message.find(
        (item) => typeof item === "string" && item.trim().length,
      );
      if (typeof first === "string") {
        return first;
      }
    }
  }

  return `Request failed with status ${status}`;
};

const buildError = (status: number, body: unknown) => {
  const error = new Error(extractErrorMessage(status, body)) as RequestError;
  error.status = status;
  error.body = body;
  return error;
};

export async function requestApi<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: init.cache ?? "no-store",
    ...init,
    headers: {
      ...(init.headers ?? {}),
      "Content-Type": "application/json",
    },
  });

  const text = await response.text();
  const body = text
    ? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      })()
    : null;

  if (!response.ok) {
    throw buildError(response.status, body);
  }

  return body as T;
}

export function isApiNotFound(error: unknown) {
  return Boolean(
    error &&
    typeof error === "object" &&
    "status" in error &&
    (error as { status?: number }).status === 404,
  );
}
