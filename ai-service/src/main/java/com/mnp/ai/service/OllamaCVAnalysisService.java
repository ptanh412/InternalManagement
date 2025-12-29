package com.mnp.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mnp.ai.dto.response.CVAnalysisResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Service
@Slf4j
public class OllamaCVAnalysisService extends GeminiCVAnalysisService {

    @Value("${ollama.api.url:http://localhost:11434/api/generate}")
    private String ollamaApiUrl;

    @Value("${ollama.model:llama3}")
    private String ollamaModel;

    // Sử dụng Constructor Injection để truyền các dependency lên class cha
    public OllamaCVAnalysisService(
            ObjectMapper objectMapper,
            WebClient webClient,
            IdentityIntegrationService identityIntegrationService) {
        super(objectMapper, webClient, identityIntegrationService);
    }

    /**
     * Override lại phương thức analyzeCV chính.
     * Logic: Thay đổi cách gọi API sang Ollama, nhưng giữ nguyên logic tạo Prompt và Parse kết quả.
     */
    @Override
    public CVAnalysisResult analyzeCV(String cvContent, String fileName) {
        log.info("Analyzing CV with Local Ollama AI (Model: {}): {}", ollamaModel, fileName);

        try {
            // 1. TÁI SỬ DỤNG hàm tạo prompt từ class cha (GeminiCVAnalysisService)
            // Yêu cầu: Đổi hàm createCVAnalysisPrompt trong class cha sang 'protected'
            String prompt = super.createCVAnalysisPrompt(cvContent);

            // 2. Cấu hình Request Body theo chuẩn của Ollama
            // Ollama API đơn giản hơn Google: model, prompt, format: json, stream: false
            Map<String, Object> requestBody = Map.of(
                    "model", ollamaModel,
                    "prompt", prompt,
                    "stream", false,       // False để nhận về 1 cục JSON thay vì stream
                    "format", "json",      // Ép Ollama trả về JSON chuẩn
                    "temperature", 0.2     // Nhiệt độ thấp để dữ liệu chính xác
            );

            log.info("Sending request to Ollama API: {}", ollamaApiUrl);

            // 3. Gọi API Ollama
            String response = getWebClient() // Giả sử bạn đã tạo getter hoặc đổi webClient sang protected
                    .post()
                    .uri(ollamaApiUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .onStatus(status -> status.isError(), clientResponse -> {
                        log.error("Ollama API Error Status: {}", clientResponse.statusCode());
                        return clientResponse.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(new RuntimeException("Ollama Error: " + body)));
                    })
                    .bodyToMono(String.class)
                    .block();

            if (response != null) {
                log.info("Received response from Ollama");
                // Xử lý JSON đặc thù của Ollama (khác Google)
                String aiResponseText = extractTextFromOllamaResponse(response);

                // 4. TÁI SỬ DỤNG hàm parse kết quả từ class cha
                // Yêu cầu: Đổi hàm parseCVAnalysisResult trong class cha sang 'protected'
                return super.parseCVAnalysisResult(aiResponseText, fileName);
            } else {
                throw new RuntimeException("Empty response from Ollama API");
            }

        } catch (Exception e) {
            log.error("Error analyzing CV with Ollama: {}", e.getMessage(), e);
            // 5. TÁI SỬ DỤNG hàm fallback từ class cha
            return super.createFallbackCVAnalysis(cvContent, fileName);
        }
    }

    /**
     * Hàm này riêng biệt cho Ollama vì cấu trúc JSON response khác Google Gemini
     * Google: candidates[0].content.parts[0].text
     * Ollama: response
     */
    private String extractTextFromOllamaResponse(String jsonResponse) throws JsonProcessingException {
        JsonNode rootNode = getObjectMapper().readTree(jsonResponse);

        // Kiểm tra lỗi từ Ollama
        if (rootNode.has("error")) {
            throw new RuntimeException(rootNode.get("error").asText());
        }

        // Lấy trường "response" chứa nội dung text
        if (rootNode.has("response")) {
            return rootNode.get("response").asText();
        }

        throw new RuntimeException("Invalid Ollama response format: 'response' field missing");
    }

    // Helper getter để truy cập các biến private của cha (nếu bạn không đổi chúng sang protected)
    private WebClient getWebClient() {
        // Cách tốt nhất: Đổi 'private final WebClient webClient' ở class cha thành 'protected final'
        // Nếu không đổi được, bạn phải inject lại WebClient vào class này và dùng 'this.webClient'
        try {
            java.lang.reflect.Field field = GeminiCVAnalysisService.class.getDeclaredField("webClient");
            field.setAccessible(true);
            return (WebClient) field.get(this);
        } catch (Exception e) {
            throw new RuntimeException("Cannot access WebClient from parent class. Please change visibility to protected.", e);
        }
    }

    private ObjectMapper getObjectMapper() {
        // Tương tự như trên. Khuyên dùng: Đổi 'private final ObjectMapper' ở cha thành 'protected'
        try {
            java.lang.reflect.Field field = GeminiCVAnalysisService.class.getDeclaredField("objectMapper");
            field.setAccessible(true);
            return (ObjectMapper) field.get(this);
        } catch (Exception e) {
            throw new RuntimeException("Cannot access ObjectMapper. Please change visibility to protected.", e);
        }
    }
}