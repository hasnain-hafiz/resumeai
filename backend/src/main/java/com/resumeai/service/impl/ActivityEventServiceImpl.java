package com.resumeai.service.impl;

import com.resumeai.entity.ActivityEvent;
import com.resumeai.entity.User;
import com.resumeai.repository.ActivityEventRepository;
import com.resumeai.service.ActivityEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityEventServiceImpl implements ActivityEventService {

    private final ActivityEventRepository activityEventRepository;

    @Override
    @Transactional
    public void record(User user, ActivityEvent.Type type, String title) {
        activityEventRepository.save(
            ActivityEvent.builder().user(user).type(type).title(title).build()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActivityEvent> recent(User user, int limit) {
        return activityEventRepository.findByUserOrderByCreatedAtDesc(user, PageRequest.of(0, limit));
    }
}
