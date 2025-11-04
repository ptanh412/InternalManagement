package com.mnp.profile.repository.httpclient;

import com.mnp.profile.configuration.AuthenticationRequestInterceptor;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;
import com.mnp.profile.dto.ApiResponse;
import com.mnp.profile.dto.response.FileResponse;

@FeignClient(name = "file-service", url = "${app.services.file}", configuration = AuthenticationRequestInterceptor.class)
public interface FileClient {
    @PostMapping(value = "/file/media/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<FileResponse> uploadMedia(@RequestPart("file") MultipartFile file);
}
