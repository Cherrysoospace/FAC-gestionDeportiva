package com.fac.backend.dto.profile;

import java.time.LocalDate;

import lombok.Value;

@Value
public class ProfileResponseDTO {

    Long id;

    String phone;

    LocalDate birthDate;

    String photoUrl;
}
