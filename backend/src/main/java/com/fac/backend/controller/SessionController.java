package com.fac.backend.controller;

import com.fac.backend.dto.session.SessionResponseDTO;
import com.fac.backend.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    @GetMapping
    public List<SessionResponseDTO> findAll(@PathVariable Long userId) {
        return sessionService.findAllByUserId(userId);
    }

    @GetMapping("/{sessionId}")
    public SessionResponseDTO findById(
            @PathVariable Long userId,
            @PathVariable Long sessionId) {
        return sessionService.findById(userId, sessionId);
    }

    @DeleteMapping("/{sessionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable Long userId,
            @PathVariable Long sessionId) {
        sessionService.delete(userId, sessionId);
    }
}