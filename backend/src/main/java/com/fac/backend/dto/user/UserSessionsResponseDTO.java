package com.fac.backend.dto.user;

import java.util.List;

import com.fac.backend.dto.session.SessionResponseDTO;
import lombok.Value;

@Value
public class UserSessionsResponseDTO {

    Long id;

    String name;

    String email;

    List<SessionResponseDTO> sessions;
}
