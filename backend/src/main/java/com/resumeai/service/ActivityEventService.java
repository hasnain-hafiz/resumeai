package com.resumeai.service;

import com.resumeai.entity.ActivityEvent;
import com.resumeai.entity.User;

import java.util.List;

/**
 * Any feature can call {@link #record} when something dashboard-worthy
 * happens for a user (account created, resume created, AI feature used...).
 * Keeps the Dashboard decoupled from every other feature's internals - it
 * only ever reads this one feed.
 */
public interface ActivityEventService {

    void record(User user, ActivityEvent.Type type, String title);

    List<ActivityEvent> recent(User user, int limit);
}
