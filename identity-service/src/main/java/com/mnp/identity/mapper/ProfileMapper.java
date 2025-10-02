package com.mnp.identity.mapper;

import org.mapstruct.Mapper;

import com.mnp.identity.dto.request.ProfileCreationRequest;
import com.mnp.identity.dto.request.UserCreationRequest;

@Mapper(componentModel = "spring")
public interface ProfileMapper {
    ProfileCreationRequest toProfileCreationRequest(UserCreationRequest request);
}
