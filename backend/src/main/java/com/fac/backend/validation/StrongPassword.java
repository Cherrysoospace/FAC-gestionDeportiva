package com.fac.backend.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import jakarta.validation.ReportAsSingleViolation;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Reglas de seguridad de la contraseña, en un solo lugar para registro,
 * actualización y recuperación. Un valor null se considera válido:
 * la obligatoriedad se declara aparte con @NotBlank.
 */
@Documented
@Constraint(validatedBy = {})
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@ReportAsSingleViolation
@Size(min = 8, max = 72)
@Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])\\S{8,72}$")
public @interface StrongPassword {

    String message() default "La contraseña debe tener entre 8 y 72 caracteres, "
            + "una mayúscula, una minúscula, un número y un carácter especial "
            + "(@$!%*?&), sin espacios";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
