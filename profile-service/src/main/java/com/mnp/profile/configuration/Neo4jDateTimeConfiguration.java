package com.mnp.profile.configuration;

import org.neo4j.driver.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.neo4j.core.convert.Neo4jConversions;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

@Configuration
public class Neo4jDateTimeConfiguration {

    @Bean
    public Neo4jConversions neo4jConversions() {
        List<Converter<?, ?>> converters = new ArrayList<>();
        converters.add(new Neo4jDateTimeToLocalDateTimeConverter());
        converters.add(new Neo4jZonedDateTimeToLocalDateTimeConverter());
        return new Neo4jConversions(converters);
    }

    /**
     * Converter for Neo4j LocalDateTime to Java LocalDateTime
     */
    public static class Neo4jDateTimeToLocalDateTimeConverter implements Converter<Value, LocalDateTime> {
        @Override
        public LocalDateTime convert(Value source) {
            if (source == null || source.isNull()) {
                return null;
            }

            try {
                // Try as LocalDateTime first (most common case)
                return source.asLocalDateTime();
            } catch (Exception e) {
                try {
                    // If that fails, try as ZonedDateTime and convert
                    ZonedDateTime zdt = source.asZonedDateTime();
                    return zdt.toLocalDateTime();
                } catch (Exception ex) {
                    // Last resort: try to parse as string
                    try {
                        String dateStr = source.asString();
                        if (dateStr.contains("Z") || dateStr.contains("+")) {
                            return ZonedDateTime.parse(dateStr).toLocalDateTime();
                        }
                        return LocalDateTime.parse(dateStr);
                    } catch (Exception parseEx) {
                        throw new RuntimeException("Cannot convert Neo4j datetime value: " + source, parseEx);
                    }
                }
            }
        }
    }

    /**
     * Converter for Neo4j ZonedDateTime to Java LocalDateTime
     */
    public static class Neo4jZonedDateTimeToLocalDateTimeConverter implements Converter<Value, LocalDateTime> {
        @Override
        public LocalDateTime convert(Value source) {
            if (source == null || source.isNull()) {
                return null;
            }

            try {
                ZonedDateTime zdt = source.asZonedDateTime();
                return zdt.toLocalDateTime();
            } catch (Exception e) {
                try {
                    return source.asLocalDateTime();
                } catch (Exception ex) {
                    throw new RuntimeException("Cannot convert Neo4j datetime value: " + source, ex);
                }
            }
        }
    }
}

