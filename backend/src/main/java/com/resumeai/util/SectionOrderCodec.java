package com.resumeai.util;

import com.resumeai.entity.Resume;
import com.resumeai.entity.Resume.SectionKey;
import com.resumeai.exception.InvalidReorderException;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/**
 * Encodes/decodes {@link Resume#getSectionOrder()} between its persisted
 * comma-separated string form and a {@code List<String>} for the API, and
 * validates that a client-submitted order is a genuine reordering (same set
 * of section keys, no duplicates, none missing) rather than silently
 * dropping or duplicating a section.
 */
public final class SectionOrderCodec {

    private SectionOrderCodec() {}

    public static List<String> decode(String csv) {
        List<String> keys = new ArrayList<>();
        for (String part : csv.split(",")) {
            if (!part.isBlank()) keys.add(part.trim());
        }
        return keys;
    }

    public static String encode(List<String> keys) {
        return String.join(",", keys);
    }

    /**
     * @throws InvalidReorderException if {@code candidate} isn't exactly a permutation of every {@link SectionKey}
     */
    public static void validate(List<String> candidate) {
        if (candidate.size() != SectionKey.values().length) {
            throw new InvalidReorderException(
                "sectionOrder must contain exactly the " + SectionKey.values().length + " resume sections"
            );
        }

        Set<SectionKey> seen = EnumSet.noneOf(SectionKey.class);
        for (String raw : candidate) {
            SectionKey key;
            try {
                key = SectionKey.valueOf(raw);
            } catch (IllegalArgumentException e) {
                throw new InvalidReorderException("Unknown section key: '" + raw + "'");
            }
            if (!seen.add(key)) {
                throw new InvalidReorderException("Duplicate section key: '" + raw + "'");
            }
        }
    }
}
