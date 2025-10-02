package com.mnp.workload;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class WorkloadServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(WorkloadServiceApplication.class, args);
    }
}
