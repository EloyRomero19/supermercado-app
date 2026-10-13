package com.miapp.backend.ratelimit;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Contador por "ventana fija": como mucho N peticiones por clave (IP o usuario) en cada ventana
 * de tiempo. Vive en memoria, igual que las conexiones SSE: suficiente para una instancia.
 */
@Component
class RateLimiter {

	private record Window(long startMillis, long lengthMillis, AtomicInteger count) {

		boolean expired(long now) {
			return now - startMillis >= lengthMillis;
		}

	}

	private final Map<String, Window> windows = new ConcurrentHashMap<>();

	/**
	 * Cuenta un intento. Devuelve 0 si se permite, o los segundos que faltan para poder reintentar.
	 */
	long tryAcquire(String key, int limit, Duration window) {
		long now = System.currentTimeMillis();
		Window current = windows.compute(key, (k, existing) -> existing == null || existing.expired(now)
				? new Window(now, window.toMillis(), new AtomicInteger()) : existing);
		if (current.count().incrementAndGet() <= limit) {
			return 0;
		}
		long remainingMillis = current.startMillis() + current.lengthMillis() - now;
		return Math.max(1, TimeUnit.MILLISECONDS.toSeconds(remainingMillis + 999));
	}

	/** Borra las ventanas caducadas para que el mapa no crezca sin límite. */
	@Scheduled(fixedRate = 5, timeUnit = TimeUnit.MINUTES)
	void cleanUp() {
		long now = System.currentTimeMillis();
		windows.values().removeIf(window -> window.expired(now));
	}

}
