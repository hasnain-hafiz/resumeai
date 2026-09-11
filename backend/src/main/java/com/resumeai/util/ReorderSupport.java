package com.resumeai.util;

import com.resumeai.exception.InvalidReorderException;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Shared by every "reorder this list of entities" service method
 * (Experience, Projects, list-items within one group, ...): validates that
 * the client's {@code orderedIds} is an exact permutation of the entities it
 * claims to reorder, then returns them in that order so the caller can
 * assign {@code sortOrder = index} and save. Rejecting outright on a
 * mismatch (rather than best-effort reordering) avoids silently dropping an
 * item or leaving a stale sortOrder behind.
 */
public final class ReorderSupport {

    private ReorderSupport() {}

    public static <T> List<T> reorder(List<T> existing, List<UUID> orderedIds, Function<T, UUID> idOf) {
        if (existing.size() != orderedIds.size()) {
            throw new InvalidReorderException("orderedIds must include every item exactly once");
        }

        Map<UUID, T> byId = existing.stream().collect(Collectors.toMap(idOf, e -> e));
        Set<UUID> seen = new HashSet<>();
        List<T> ordered = new ArrayList<>(orderedIds.size());

        for (UUID id : orderedIds) {
            T entity = byId.get(id);
            if (entity == null || !seen.add(id)) {
                throw new InvalidReorderException("orderedIds must include every item exactly once");
            }
            ordered.add(entity);
        }

        return ordered;
    }
}
