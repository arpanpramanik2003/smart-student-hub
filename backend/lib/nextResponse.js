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

  static error(message, status = 400, details = null, code = null) {
    return NextResponse.json(
      {
        message,
        error: {
          message,
          ...(details ? { details } : {}),
          ...(code ? { code } : {}),
        },
      },
      { status }
    );
  }
}

export function createPagination(total, page, limit) {
  const safeTotal = Math.max(0, parseInt(total) || 0);
  const safePage = Math.max(1, parseInt(page) || 1);
  const safeLimit = Math.max(1, parseInt(limit) || 10);
  const pages = Math.ceil(safeTotal / safeLimit) || 1;
  const hasMore = safePage < pages;

  return {
    total: safeTotal,
    page: safePage,
    currentPage: safePage,
    limit: safeLimit,
    pages,
    hasMore,
  };
}