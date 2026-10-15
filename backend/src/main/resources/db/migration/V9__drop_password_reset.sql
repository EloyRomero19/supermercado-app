-- Se quita "¿Has olvidado tu contraseña?" (no se va a configurar el envío de correos).
-- V8 ya está aplicada en producción y no se edita: se deshace aquí su tabla.
DROP TABLE password_reset_token;
