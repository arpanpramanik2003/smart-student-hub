export class NextResponse extends Response {
  static json(body, init = {}) {
    const headers = new Headers(init.headers || {});
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json; charset=utf-8');
    }

    return new Response(JSON.stringify(body), {
      ...init,
      headers,
    });
  }

  static redirect(url, status = 307) {
    return Response.redirect(url, status);
  }
}