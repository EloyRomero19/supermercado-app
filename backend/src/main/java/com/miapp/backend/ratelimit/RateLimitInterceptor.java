package com.miapp.backend.ratelimit;

import java.time.Duration;
import java.util.List;

import org.springframework.http.HttpMethod;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/**
 * Limita los endpoints sensibles a ataques de fuerza bruta. Es un interceptor de Spring MVC:
 * se ejecuta después de Spring Security, así que ya sabemos quién es el usuario si hay token.
 */
@Component
@RequiredArgsConstructor
class RateLimitInterceptor implements HandlerInterceptor {

	/** byUser: se cuenta por usuario autenticado; si no, por IP. */
	private record Rule(HttpMethod method, String path, int limit, Duration window, boolean byUser) {
	}

	private static final List<Rule> RULES = List.of(
			// Probar contraseñas: 10 intentos por minuto y por IP
			new Rule(HttpMethod.POST, "/api/auth/login", 10, Duration.ofMinutes(1), false),
			// Crear cuentas en masa
			new Rule(HttpMethod.POST, "/api/auth/register", 10, Duration.ofHours(1), false),
			new Rule(HttpMethod.POST, "/api/auth/refresh", 60, Duration.ofMinutes(1), false),
			// Adivinar códigos de invitación: 10 intentos por minuto y por usuario
			new Rule(HttpMethod.POST, "/api/lists/join", 10, Duration.ofMinutes(1), true));

	private final RateLimiter limiter;
	private final RateLimitProperties props;

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
		if (!props.enabled()) {
			return true;
		}
		for (Rule rule : RULES) {
			if (rule.method().matches(request.getMethod()) && rule.path().equals(request.getRequestURI())) {
				String key = rule.path() + "|" + clientKey(request, rule.byUser());
				long retryAfter = limiter.tryAcquire(key, rule.limit(), rule.window());
				if (retryAfter > 0) {
					throw new TooManyRequestsException(retryAfter);
				}
			}
		}
		return true;
	}

	/**
	 * La IP la da getRemoteAddr(). Detrás de Caddy sería la IP de Caddy, pero con
	 * server.forward-headers-strategy=native Tomcat la sustituye por la de X-Forwarded-For,
	 * y solo si la petición viene de una IP interna (un proxy nuestro, no un cliente que mienta).
	 */
	private static String clientKey(HttpServletRequest request, boolean byUser) {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		if (byUser && auth != null && auth.isAuthenticated()) {
			return "user:" + auth.getName();
		}
		return "ip:" + request.getRemoteAddr();
	}

}
