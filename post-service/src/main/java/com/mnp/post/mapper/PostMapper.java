package com.mnp.post.mapper;

import com.mnp.post.dto.response.PostResponse;
import com.mnp.post.entity.Post;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PostMapper {
    PostResponse toPostResponse(Post post);
}
