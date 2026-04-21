import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export class ApiError extends HTTPException {
  public statusCode: ContentfulStatusCode;

  constructor(statusCode: ContentfulStatusCode, message: string) {
    super(statusCode, { message });
    this.statusCode = statusCode;
  }

  getResponse() {
    return new Response(JSON.stringify({ error: this.message }), {
      status: this.statusCode,
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
    });
  }
}
