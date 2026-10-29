package com.fac.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Habilita @Async (usado por SmtpMailService). Spring Boot crea el pool de
 * hilos y se configura con spring.task.execution.* en application.properties.
 */
@Configuration
@EnableAsync
public class AsyncConfig {
}
