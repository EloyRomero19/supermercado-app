package com.miapp.backend.auth;

import java.io.UnsupportedEncodingException;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.util.StringUtils;
import org.springframework.web.util.HtmlUtils;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;

/**
 * Envía el email con el enlace para restablecer la contraseña por SMTP (Gmail, Brevo, Resend…:
 * ver MAIL_* en .env.example).
 * - AFTER_COMMIT: solo si el enlace se guardó de verdad en la base de datos.
 * - @Async: en otro hilo; la petición responde ya, haya cuenta o no, y tarde lo que tarde el SMTP.
 * Sin MAIL_HOST (en desarrollo) no envía nada: escribe el enlace en el log para poder probarlo.
 */
@Slf4j
@Component
class PasswordResetMailer {

	private final ObjectProvider<JavaMailSender> mailSender;
	private final String host;
	private final String from;

	PasswordResetMailer(ObjectProvider<JavaMailSender> mailSender, @Value("${spring.mail.host:}") String host,
			@Value("${app.mail.from:}") String from, @Value("${spring.mail.username:}") String username) {
		this.mailSender = mailSender;
		this.host = host;
		// Si no se indica el remitente, el propio usuario del SMTP (en Gmail tiene que ser ese)
		this.from = StringUtils.hasText(from) ? from : username;
	}

	@Async
	@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
	void onPasswordResetRequested(PasswordResetRequested event) {
		JavaMailSender sender = mailSender.getIfAvailable();
		if (!StringUtils.hasText(host) || sender == null) {
			log.warn("Correo sin configurar (MAIL_HOST). Enlace para restablecer la contraseña de {}: {}",
					event.email(), event.link());
			return;
		}
		try {
			MimeMessage message = sender.createMimeMessage();
			// true = multipart: texto plano y HTML (cada programa de correo muestra el que sepa)
			MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
			helper.setFrom(from, "¿Qué falta?");
			helper.setTo(event.email());
			helper.setSubject("Cambia tu contraseña de ¿Qué falta?");
			helper.setText(text(event), html(event));
			sender.send(message);
			log.info("Enviado el enlace para restablecer la contraseña a {}", event.email());
		}
		catch (MailException | MessagingException | UnsupportedEncodingException ex) {
			// Sin el enlace en el log: quien lea los logs no debe poder cambiar contraseñas ajenas
			log.error("No se pudo enviar el enlace para restablecer la contraseña a {}", event.email(), ex);
		}
	}

	private static String text(PasswordResetRequested event) {
		return """
				Hola, %s:

				Alguien (seguramente tú) ha pedido cambiar la contraseña de tu cuenta de ¿Qué falta?.
				Para elegir una nueva, abre este enlace. Caduca en 1 hora y solo funciona una vez:

				%s

				Si no lo has pedido tú, ignora este correo: tu contraseña no cambia.
				""".formatted(event.displayName(), event.link());
	}

	private static String html(PasswordResetRequested event) {
		// El nombre lo escribió el usuario: se escapa para que no pueda meter HTML en el correo
		return """
				<div style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.5;color:#1a2e22;max-width:480px">
				  <p>Hola, %s:</p>
				  <p>Alguien (seguramente tú) ha pedido cambiar la contraseña de tu cuenta de <b>¿Qué falta?</b>.</p>
				  <p><a href="%s" style="display:inline-block;background:#0a7e3a;color:#fff;text-decoration:none;
				     font-weight:600;padding:12px 20px;border-radius:10px">Elegir una contraseña nueva</a></p>
				  <p style="font-size:14px;color:#55665b">El enlace caduca en 1 hora y solo funciona una vez.
				     Si no lo has pedido tú, ignora este correo: tu contraseña no cambia.</p>
				</div>
				""".formatted(HtmlUtils.htmlEscape(event.displayName()), HtmlUtils.htmlEscape(event.link()));
	}

}
