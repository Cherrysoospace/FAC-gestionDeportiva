package com.fac.backend.dto.permission;

import com.fac.backend.authorization.PermissionOperation;
import lombok.Value;

@Value
public class PermissionItemDTO {

    Long id;
    String url;
    String method;
    String module;
    String resource;
    PermissionOperation operation;
    String operationLabel;
}
