package com.mnp.ai.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

@Service
@Slf4j
public class FileProcessingService {

    public String extractTextFromFile(MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename();
        String contentType = file.getContentType();

        log.info("Processing file: {} with content type: {}", fileName, contentType);

        if (fileName == null) {
            throw new IllegalArgumentException("File name cannot be null");
        }

        String fileExtension = getFileExtension(fileName).toLowerCase();

        try (InputStream inputStream = file.getInputStream()) {
            return switch (fileExtension) {
                case "pdf" -> extractFromPdf(inputStream);
                case "docx" -> extractFromDocx(inputStream);
                case "doc" -> extractFromDoc(inputStream);
                case "txt", "md" -> extractFromText(inputStream);
                default -> throw new UnsupportedOperationException("Unsupported file type: " + fileExtension);
            };
        }
    }

    private String extractFromPdf(InputStream inputStream) throws IOException {
        try (PDDocument document = PDDocument.load(inputStream)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);
            log.info("Successfully extracted {} characters from PDF", text.length());
            return text;
        }
    }

    private String extractFromDocx(InputStream inputStream) throws IOException {
        try (XWPFDocument document = new XWPFDocument(inputStream);
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            String text = extractor.getText();
            log.info("Successfully extracted {} characters from DOCX", text.length());
            return text;
        }
    }

    private String extractFromDoc(InputStream inputStream) throws IOException {
        try (HWPFDocument document = new HWPFDocument(inputStream);
             WordExtractor extractor = new WordExtractor(document)) {
            String text = extractor.getText();
            log.info("Successfully extracted {} characters from DOC", text.length());
            return text;
        }
    }

    private String extractFromText(InputStream inputStream) throws IOException {
        byte[] bytes = inputStream.readAllBytes();
        String text = new String(bytes);
        log.info("Successfully extracted {} characters from text file", text.length());
        return text;
    }

    private String getFileExtension(String fileName) {
        int lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex == -1) {
            return "";
        }
        return fileName.substring(lastDotIndex + 1);
    }

    public boolean isSupportedFileType(String fileName) {
        String extension = getFileExtension(fileName).toLowerCase();
        return switch (extension) {
            case "pdf", "docx", "doc", "txt", "md" -> true;
            default -> false;
        };
    }
}
