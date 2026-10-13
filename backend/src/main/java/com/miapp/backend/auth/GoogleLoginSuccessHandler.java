package com.miapp.backend.auth;

import java.io.IOException;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.miapp.backend.auth.AuthService.AuthResult;
import com.miapp.backend.common.ApiException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

/**
 * Se ejecuta cuando Spring ya ha validado la respuesta de Google. A partir de aquí la sesión
 * funciona igual que con contraseña: dejamos la cookie de refresh y volvemos al frontend, que
 * pedirá su access token a /api/auth/refresh. El JWT nunca va en la URL (quedaría en el
 * historial, en logs de servidores intermedios...).
 */
@Component
@RequiredArgsConstructor
class GoogleLoginSuccessHandler implements AuthenticationSuccessHandler {

	private final AuthService authService;
	private final RefreshTokenCookie refreshCookie;
	private final AuthProperties props;

	@Override
	public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
			Authentication authentication) throws IOException {
		String target;
		try {
			AuthResult result = authService.loginWithGoogle(GoogleProfile.from((OidcUser) authentication.getPrincipal()));
			response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.create(result.refreshToken()).toString());
			target = "/auth/callback";
		}
		catch (ApiException ex) {
			target = "/login?error=" + (ex.getStatus() == HttpStatus.CONFLICT ? "cuenta-existente" : "google");
		}

		// La sesión HTTP solo hacía falta durante el intercambio con Google (para guardar el "state")
		HttpSession session = request.getSession(false);
		if (session != null) {
			session.invalidate();
		}
		response.sendRedirect(props.frontendUrl() + target);
	}

}
