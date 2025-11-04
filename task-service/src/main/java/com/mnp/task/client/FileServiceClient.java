package com.mnp.task.client;

import com.mnp.task.configuration.FeignClientConfiguration;
import com.mnp.task.dto.response.ApiResponse;
import com.mnp.task.dto.response.FileResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@FeignClient(name = "file-service", url = "${app.services.file}", configuration = FeignClientConfiguration.class)
public interface FileServiceClient {

    @PostMapping(value = "/media/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<FileResponse> uploadFile(@RequestPart("file") MultipartFile file);

    @GetMapping("/media/download/{fileName}")
    ResponseEntity<Resource> downloadFile(@PathVariable("fileName") String fileName);
}
