package com.internalmanagement.mlservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.cache.annotation.EnableCaching;

/**
 * Main application class for ML Service
 * 
 * This service handles:
 * - Machine Learning model training and prediction
 * - Real-time data collection from other microservices
 * - Model performance monitoring and continuous learning
 * - Task assignment recommendations
 */
@SpringBootApplication
@EnableFeignClients
@EnableKafka
@EnableAsync
@EnableScheduling
@EnableCaching
public class MLServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(MLServiceApplication.class, args);
    }
}