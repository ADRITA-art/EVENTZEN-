package com.adrita.eventzen.util;

import com.adrita.eventzen.dto.PaginatedResponse;

import java.util.Collections;
import java.util.List;

public final class PaginationUtils {

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 10;
    private static final int MAX_SIZE = 100;

    private PaginationUtils() {
    }

    public static <T> PaginatedResponse<T> paginate(List<T> items, Integer page, Integer size) {
        int resolvedPage = page == null ? DEFAULT_PAGE : Math.max(page, 0);
        int requestedSize = size == null ? DEFAULT_SIZE : size;
        int resolvedSize = Math.max(1, Math.min(requestedSize, MAX_SIZE));

        int totalElements = items.size();
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / resolvedSize);

        int fromIndex = resolvedPage * resolvedSize;
        if (fromIndex >= totalElements) {
            return new PaginatedResponse<>(
                    Collections.emptyList(),
                    resolvedPage,
                    resolvedSize,
                    totalElements,
                    totalPages,
                    resolvedPage == 0,
                    true
            );
        }

        int toIndex = Math.min(fromIndex + resolvedSize, totalElements);
        List<T> content = items.subList(fromIndex, toIndex);

        boolean first = resolvedPage == 0;
        boolean last = totalPages == 0 || resolvedPage >= totalPages - 1;

        return new PaginatedResponse<>(
                content,
                resolvedPage,
                resolvedSize,
                totalElements,
                totalPages,
                first,
                last
        );
    }
}
