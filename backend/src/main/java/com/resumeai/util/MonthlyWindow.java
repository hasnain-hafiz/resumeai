package com.resumeai.util;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;

/**
 * The current calendar-month window in UTC, used to reset AI usage quotas on
 * a monthly cadence. Shared by {@link com.resumeai.service.AiUsageService}
 * (quota enforcement) and the Dashboard's AI usage card, so both agree on
 * exactly when "this month" starts and ends.
 */
public final class MonthlyWindow {

    private MonthlyWindow() {
    }

    public static Instant startOfCurrentMonthUtc() {
        return ZonedDateTime.now(ZoneOffset.UTC)
            .withDayOfMonth(1).toLocalDate().atStartOfDay(ZoneOffset.UTC).toInstant();
    }

    public static Instant startOfNextMonthUtc() {
        return ZonedDateTime.now(ZoneOffset.UTC)
            .withDayOfMonth(1).plusMonths(1).toLocalDate().atStartOfDay(ZoneOffset.UTC).toInstant();
    }
}
