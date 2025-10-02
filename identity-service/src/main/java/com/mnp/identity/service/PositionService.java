package com.mnp.identity.service;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import com.mnp.identity.dto.response.PositionResponse;
import com.mnp.identity.entity.Position;
import com.mnp.identity.mapper.PositionMapper;
import com.mnp.identity.repository.PositionRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PositionService {
    PositionRepository positionRepository;
    PositionMapper positionMapper;

    @PreAuthorize("hasRole('ADMIN')")
    public List<PositionResponse> getAllPositions() {
        log.info("Getting all positions");
        return positionRepository.findAll().stream()
                .map(positionMapper::toPositionResponse)
                .toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public PositionResponse getPosition(String id) {
        Position position =
                positionRepository.findById(id).orElseThrow(() -> new RuntimeException("Position not found"));
        return positionMapper.toPositionResponse(position);
    }
}
