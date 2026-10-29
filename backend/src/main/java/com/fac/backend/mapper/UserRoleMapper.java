package com.fac.backend.mapper;

import com.fac.backend.dto.user.UserResponseDTO;
import com.fac.backend.dto.userrole.RoleUserResponseDTO;
import com.fac.backend.dto.userrole.UserRoleResponseDTO;
import com.fac.backend.entity.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class UserRoleMapper {

    private final RoleMapper roleMapper;

    public UserRoleResponseDTO toResponseDTO(UserRole userRole) {
        return new UserRoleResponseDTO(
                userRole.getId(),
                userRole.getUser().getId(),
                roleMapper.toResponseDTO(userRole.getRole())
        );
    }

    public List<UserRoleResponseDTO> toResponseDTOList(List<UserRole> userRoles) {
        return userRoles.stream().map(this::toResponseDTO).toList();
    }

    public RoleUserResponseDTO toRoleUserResponseDTO(UserRole userRole) {
        var user = userRole.getUser();
        return new RoleUserResponseDTO(
                userRole.getId(),
                userRole.getRole().getId(),
                new UserResponseDTO(user.getId(), user.getName(), user.getEmail(), user.isEnabled(), user.getAuthProvider())
        );
    }

    public List<RoleUserResponseDTO> toRoleUserResponseDTOList(List<UserRole> userRoles) {
        return userRoles.stream().map(this::toRoleUserResponseDTO).toList();
    }
}
