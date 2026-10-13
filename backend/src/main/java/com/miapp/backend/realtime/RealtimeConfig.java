package com.miapp.backend.realtime;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Activa @Scheduled (el heartbeat de ListSubscriptions). */
@Configuration
@EnableScheduling
class RealtimeConfig {
}
