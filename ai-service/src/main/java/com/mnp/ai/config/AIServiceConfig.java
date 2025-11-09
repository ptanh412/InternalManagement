package com.mnp.ai.config;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class for AI Service to ensure all components are properly scanned
 */
@Configuration
@ComponentScan(basePackages = {"com.mnp.ai.service", "com.mnp.ai.controller"})
public class AIServiceConfig {
    // Configuration class to ensure proper component scanning
    // This helps IntelliJ IDEA's autowiring detection
}

