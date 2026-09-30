const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Valida el formato de un correo electrónico (HU-06). */
export function esCorreoValido(correo) {
  return typeof correo === 'string' && REGEX_CORREO.test(correo.trim());
}

/** La contraseña debe tener al menos 8 caracteres (HU-06). */
export function esContrasenaValida(contrasena) {
  return typeof contrasena === 'string' && contrasena.length >= 8;
}

/**
 * Valida el formulario de registro y regresa los errores por campo.
 * @returns {Record<string, string>} objeto vacío si no hay errores
 */
export function validarRegistro({ nombre, correo, contrasena, confirmacion, aceptaTerminos }) {
  const errores = {};
  if (!nombre || !nombre.trim()) errores.nombre = 'Este campo es obligatorio';
  if (!esCorreoValido(correo)) errores.correo = 'Ingresa un correo válido';
  if (!esContrasenaValida(contrasena)) errores.contrasena = 'Mínimo 8 caracteres';
  if (contrasena !== confirmacion) errores.confirmacion = 'Las contraseñas no coinciden';
  if (!aceptaTerminos) errores.terminos = 'Debes aceptar los términos y condiciones';
  return errores;
}
