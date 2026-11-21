package com.fac.backend.controller;

import com.fac.backend.dto.InternalEmailRequestDTO;
import com.fac.backend.dto.common.MessageResponseDTO;
import com.fac.backend.service.MailService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/internal/notifications")
@RequiredArgsConstructor
public class InternalNotificationController {

    private final MailService mailService;

    @PostMapping("/email")
    public ResponseEntity<MessageResponseDTO> sendEmail(
            @Valid @RequestBody InternalEmailRequestDTO dto) {
        List<String> recipients = dto.getTo().stream()
                .map(email -> email.trim().toLowerCase(Locale.ROOT))
                .distinct()
                .toList();

        mailService.sendBcc(recipients, dto.getSubject().trim(), dto.getBody());

        return ResponseEntity.accepted().body(
                new MessageResponseDTO(
                        "Notificación encolada para " + recipients.size() + " destinatario(s)"
                )
        );
    }
}
