package com.mnp.ai.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import com.vladsch.flexmark.html2md.converter.FlexmarkHtmlConverter;
import com.vladsch.flexmark.util.data.MutableDataSet;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileProcessingService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    /**
     * Extract text content from uploaded file based on file type
     */
    public String extractTextFromFile(MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename();
        String fileExtension = getFileExtension(fileName).toLowerCase();

        log.info("Processing file: {} with extension: {}", fileName, fileExtension);

        try (InputStream inputStream = file.getInputStream()) {
            return switch (fileExtension) {
                case "pdf" -> extractFromPdf(inputStream);
                case "docx" -> extractFromDocx(inputStream);
                case "doc" -> extractFromDoc(inputStream);
                case "txt", "md" -> extractFromText(inputStream);
                case "json" -> extractFromJson(inputStream);
                case "xml" -> extractFromXml(inputStream);
                case "html", "htm" -> extractFromHtml(inputStream);
                default -> throw new IllegalArgumentException("Unsupported file format: " + fileExtension);
            };
        }
    }

    /**
     * Download and extract content from URL
     */
    public Mono<String> extractTextFromUrl(String url, String documentType) {
        log.info("Downloading content from URL: {} (type: {})", url, documentType);

        return webClient
                .get()
                .uri(url)
                .retrieve()
                .bodyToMono(String.class)
                .map(content -> {
                    try {
                        return switch (documentType.toLowerCase()) {
                            case "google_docs" -> processGoogleDocsContent(content);
                            case "confluence" -> processConfluenceContent(content);
                            case "notion" -> processNotionContent(content);
                            case "html" -> extractFromHtmlString(content);
                            default -> content; // Plain text
                        };
                    } catch (Exception e) {
                        log.error("Error processing URL content", e);
                        throw new RuntimeException("Failed to process URL content", e);
                    }
                })
                .doOnError(error -> log.error("Failed to download from URL: {}", url, error));
    }

    private String extractFromPdf(InputStream inputStream) throws IOException {
        try (PDDocument document = PDDocument.load(inputStream)) {
            PDFTextStripper pdfStripper = new PDFTextStripper();
            return pdfStripper.getText(document);
        }
    }

    private String extractFromDocx(InputStream inputStream) throws IOException {
        try (XWPFDocument document = new XWPFDocument(inputStream);
                XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }

    private String extractFromDoc(InputStream inputStream) throws IOException {
        try (HWPFDocument document = new HWPFDocument(inputStream);
                WordExtractor extractor = new WordExtractor(document)) {
            return extractor.getText();
        }
    }

    private String extractFromText(InputStream inputStream) throws IOException {
        return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
    }

    private String extractFromJson(InputStream inputStream) throws IOException {
        Map<String, Object> jsonMap = objectMapper.readValue(inputStream, Map.class);
        return convertJsonToReadableText(jsonMap);
    }

    private String extractFromXml(InputStream inputStream) throws IOException {
        XmlMapper xmlMapper = new XmlMapper();
        Map<String, Object> xmlMap = xmlMapper.readValue(inputStream, Map.class);
        return convertMapToReadableText(xmlMap);
    }

    private String extractFromHtml(InputStream inputStream) throws IOException {
        String html = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        return extractFromHtmlString(html);
    }

    private String extractFromHtmlString(String html) {
        // Convert HTML to Markdown for better text extraction
        MutableDataSet options = new MutableDataSet();
        FlexmarkHtmlConverter converter = FlexmarkHtmlConverter.builder(options).build();
        return converter.convert(html);
    }

    private String processGoogleDocsContent(String content) {
        // Extract text from Google Docs export format
        // This would need specific parsing based on Google Docs API response
        return content.replaceAll("<[^>]*>", "") // Remove HTML tags
                .replaceAll("\\s+", " ") // Normalize whitespace
                .trim();
    }

    private String processConfluenceContent(String content) {
        // Process Confluence-specific markup and structure
        return content.replaceAll("\\{[^}]*\\}", "") // Remove Confluence macros
                .replaceAll("<[^>]*>", "") // Remove HTML tags
                .replaceAll("\\s+", " ") // Normalize whitespace
                .trim();
    }

    private String processNotionContent(String content) {
        // Process Notion-specific content structure
        return content.replaceAll("\\*\\*(.+?)\\*\\*", "$1") // Bold text
                .replaceAll("\\*(.+?)\\*", "$1") // Italic text
                .replaceAll("```[\\s\\S]*?```", "") // Code blocks
                .trim();
    }

    private String convertJsonToReadableText(Map<String, Object> jsonMap) {
        StringBuilder text = new StringBuilder();
        convertMapToText(jsonMap, text, 0);
        return text.toString();
    }

    private String convertMapToReadableText(Map<String, Object> map) {
        StringBuilder text = new StringBuilder();
        convertMapToText(map, text, 0);
        return text.toString();
    }

    @SuppressWarnings("unchecked")
    private void convertMapToText(Map<String, Object> map, StringBuilder text, int depth) {
        String indent = "  ".repeat(depth);

        for (Map.Entry<String, Object> entry : map.entrySet()) {
            text.append(indent).append(entry.getKey()).append(": ");

            Object value = entry.getValue();
            if (value instanceof Map) {
                text.append("\n");
                convertMapToText((Map<String, Object>) value, text, depth + 1);
            } else if (value instanceof Iterable) {
                text.append("\n");
                for (Object item : (Iterable<?>) value) {
                    if (item instanceof Map) {
                        convertMapToText((Map<String, Object>) item, text, depth + 1);
                    } else {
                        text.append(indent).append("  - ").append(item).append("\n");
                    }
                }
            } else {
                text.append(value).append("\n");
            }
        }
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return "";
        }

        int lastDotIndex = fileName.lastIndexOf('.');
        return lastDotIndex >= 0 ? fileName.substring(lastDotIndex + 1) : "";
    }

    /**
     * Validate if file type is supported
     */
    public boolean isFileTypeSupported(String fileName) {
        String extension = getFileExtension(fileName).toLowerCase();
        return switch (extension) {
            case "pdf", "docx", "doc", "txt", "md", "json", "xml", "html", "htm" -> true;
            default -> false;
        };
    }

    /**
     * Get file size limit in MB based on file type
     */
    public long getFileSizeLimit(String fileName) {
        String extension = getFileExtension(fileName).toLowerCase();
        return switch (extension) {
            case "pdf", "docx", "doc" -> 10; // 10MB for documents
            case "txt", "md", "json", "xml", "html", "htm" -> 5; // 5MB for text files
            default -> 1; // 1MB for unsupported types
        };
    }
}
