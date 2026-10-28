package com.fac.backend.service;

import com.fac.backend.entity.AuditLog;
import com.fac.backend.entity.Role;
import com.fac.backend.repository.AuditLogRepository;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void logPermissionChange(
            Long actorUserId,
            String actorEmail,
            Role role,
            Set<Long> added,
            Set<Long> removed,
            Set<Long> finalPermissionIds) {

        AuditLog auditLog = new AuditLog();
        auditLog.setActorUserId(actorUserId);
        auditLog.setActorEmail(actorEmail);
        auditLog.setAction("ROLE_PERMISSIONS_UPDATED");
        auditLog.setRoleId(role.getId());
        auditLog.setRoleName(role.getName());
        auditLog.setDetails(
                "Permisos agregados: " + added
                        + "; permisos retirados: " + removed
                        + "; total final: " + finalPermissionIds.size()
        );

        auditLogRepository.save(auditLog);
    }
}
