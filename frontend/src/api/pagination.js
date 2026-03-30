export const toPage = (payload) => {
  if (Array.isArray(payload)) {
    return {
      content: payload,
      page: 0,
      size: payload.length,
      totalElements: payload.length,
      totalPages: payload.length > 0 ? 1 : 0,
      first: true,
      last: true,
    };
  }

  return {
    content: payload?.content || [],
    page: payload?.page ?? 0,
    size: payload?.size ?? 0,
    totalElements: payload?.totalElements ?? 0,
    totalPages: payload?.totalPages ?? 0,
    first: payload?.first ?? true,
    last: payload?.last ?? true,
  };
};

export const toList = (payload) => toPage(payload).content;
