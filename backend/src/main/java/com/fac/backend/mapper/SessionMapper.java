package com.fac.backend.mapper;

import java.util.List;

import com.fac.backend.dto.session.SessionRequestDTO;
import com.fac.backend.dto.session.SessionResponseDTO;
import com.fac.backend.entity.Session;
import com.fac.backend.entity.User;
import org.springframework.stereotype.Component;

@Component
public class SessionMapper {

    public Session toEntity(SessionRequestDTO dto) {
        return Session.builder()
                .token(dto.getToken())
                .expiration(dto.getExpiration())
                .code2FA(dto.getCode2FA())
                .build();
    }

    public void updateEntity(SessionRequestDTO dto, Session session) {
        session.setToken(dto.getToken());
        session.setExpiration(dto.getExpiration());
        session.setCode2FA(dto.getCode2FA());
    }

    public SessionResponseDTO toResponseDTO(Session session) {
        return new SessionResponseDTO(
                session.getId(),
                session.getToken(),
                session.getExpiration(),
                session.getCode2FA()
        );
    }

    public List<SessionResponseDTO> toResponseDTOList(List<Session> sessions) {
        return sessions.stream()
                .map(this::toResponseDTO)
                .toList();
    }
}