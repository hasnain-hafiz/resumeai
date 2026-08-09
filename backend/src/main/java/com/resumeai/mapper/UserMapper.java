package com.resumeai.mapper;

import com.resumeai.dto.response.UserResponse;
import com.resumeai.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserResponse toResponse(User user);
}
