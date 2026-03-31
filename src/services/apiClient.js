export class ApiError extends Error {
  constructor(message, payload = {}) {
    super(message);
    this.name = "ApiError";
    Object.assign(this, payload);
  }
}

export async function apiRequest(url, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(url, {
    method: options.method || "GET",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    body:
      options.body === undefined
        ? undefined
        : isFormData
          ? options.body
          : JSON.stringify(options.body),
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload?.message
        ? payload.message
        : "Nao foi possivel concluir a solicitacao.";

    throw new ApiError(message, {
      status: response.status,
      ...(typeof payload === "object" ? payload : {}),
    });
  }

  return payload;
}
