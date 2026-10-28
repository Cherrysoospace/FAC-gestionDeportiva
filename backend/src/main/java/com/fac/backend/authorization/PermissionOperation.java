package com.fac.backend.authorization;

public enum PermissionOperation {

    VER("Ver"),
    LISTAR("Listar"),
    CREAR("Crear"),
    ACTUALIZAR("Actualizar"),
    ELIMINAR("Eliminar");

    private final String label;

    PermissionOperation(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
