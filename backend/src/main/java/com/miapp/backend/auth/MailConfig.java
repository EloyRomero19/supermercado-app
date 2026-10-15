package com.miapp.backend.auth;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/** Activa @Async: los correos se envían en otro hilo, sin hacer esperar a la petición HTTP. */
@Configuration
@EnableAsync
class MailConfig {
}
