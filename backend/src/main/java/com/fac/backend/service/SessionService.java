package com.fac.backend.service;

import com.fac.backend.dto.session.SessionRequestDTO;
import com.fac.backend.dto.session.SessionResponseDTO;
import com.fac.backend.entity.Session;
import com.fac.backend.entity.User;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.mapper.SessionMapper;
import com.fac.backend.repository.SessionRepository;
import com.fac.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final SessionMapper sessionMapper;

    public void registerAuthenticatedSession(
            User user,
            String jti,
            Instant expiresAt) {

        Session session = Session.builder()
                .token(jti)
                .expiration(LocalDateTime.ofInstant(
                        expiresAt,
                        ZoneId.systemDefault()
                ))
                .user(user)
                .build();

        sessionRepository.save(session);
    }

    public SessionResponseDTO create(Long userId, SessionRequestDTO dto) {
        User user = findUser(userId);
        if (sessionRepository.existsByToken(dto.getToken())) {
            throw new ApplicationException(
                    ErrorCase.ALREADY_EXISTS,
                    "El token ya estÃ¡ registrado"
            );
        }

        Session session = sessionMapper.toEntity(dto);
        session.setUser(user); //este no tiene el id generado por la base de datos
        Session savedSession = sessionRepository.save(session); //este ya tiene el id generado por la base de datos
        return sessionMapper.toResponseDTO(savedSession);
    }

    public List<SessionResponseDTO> findAllByUserId(Long userId) {
        findUser(userId);
        return sessionMapper.toResponseDTOList(
                sessionRepository.findAllByUserId(userId)
        );
    }

    public SessionResponseDTO findById(Long userId, Long sessionId) {
        return sessionMapper.toResponseDTO(findSession(userId, sessionId));
    }

    public SessionResponseDTO update(
            Long userId,
            Long sessionId,
            SessionRequestDTO dto) {

        findUser(userId);
        Session session = findSession(userId, sessionId);
        if (sessionRepository.existsByTokenAndIdNot(dto.getToken(), sessionId)) {
            throw new ApplicationException(
                    ErrorCase.ALREADY_EXISTS,
                    "El token ya estÃ¡ registrado"
            );
        }

        sessionMapper.updateEntity(dto, session);
        Session updatedSession = sessionRepository.save(session);
        return sessionMapper.toResponseDTO(updatedSession);
    }

    public void delete(Long userId, Long sessionId) {
        sessionRepository.delete(findSession(userId, sessionId));
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApplicationException(
                        ErrorCase.NOT_FOUND,
                        "Usuario no encontrado con id: " + userId
                ));
    }

    private Session findSession(Long userId, Long sessionId) {
        return sessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ApplicationException(
                        ErrorCase.NOT_FOUND,
                        "SesiÃ³n no encontrada para este usuario"
                ));
    }
}