package com.devteria.chat.repository.httpclient;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import com.devteria.chat.configuration.AuthenticationRequestInterceptor;
import com.devteria.chat.dto.ApiResponse;
import com.devteria.chat.dto.response.FileResponse;

@FeignClient(
        name = "file-service",
        url = "http://localhost:8084",
        configuration = {AuthenticationRequestInterceptor.class})
public interface FileClient {

    @PostMapping(value = "/file/media/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<FileResponse> uploadMedia(@RequestPart("file") MultipartFile file);
}
