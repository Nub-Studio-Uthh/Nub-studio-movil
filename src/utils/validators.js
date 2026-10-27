const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REGEX_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'.-]+$/;

/** Valida el formato de un correo electrónico (HU-06). */
export function esCorreoValido(correo) {
  return typeof correo === 'string' && REGEX_CORREO.test(correo.trim());
}

/** La contraseña debe tener al menos 8 caracteres (HU-06). */
export function esContrasenaValida(contrasena) {
  return typeof contrasena === 'string' && contrasena.length >= 8;
}

/**
 * Regresa el mensaje de lo primero que le falta a la contraseña,
 * o null si es segura (8+ caracteres, mayúscula, minúscula, número y especial).
 */
export function mensajeContrasenaInsegura(contrasena = '') {
  if (typeof contrasena !== 'string' || contrasena.length < 8) return 'Mínimo 8 caracteres';
  if (!/[A-Z]/.test(contrasena)) return 'Agrega al menos una mayúscula';
  if (!/[a-z]/.test(contrasena)) return 'Agrega al menos una minúscula';
  if (!/\d/.test(contrasena)) return 'Agrega al menos un número';
  if (!/[@$!%*?&#]/.test(contrasena)) return 'Agrega un carácter especial (@$!%*?&#)';
  return null;
}

/** El código de verificación son exactamente 6 dígitos. */
export function esCodigoValido(codigo) {
  return typeof codigo === 'string' && /^\d{6}$/.test(codigo);
}

/**
 * Valida el formulario de registro y regresa los errores por campo.
 * @returns {Record<string, string>} objeto vacío si no hay errores
 */
export function validarRegistro({ nombre, correo, contrasena, confirmacion, aceptaTerminos }) {
  const errores = {};
  if (!nombre || !nombre.trim()) errores.nombre = 'Este campo es obligatorio';
  else if (!REGEX_NOMBRE.test(nombre.trim())) errores.nombre = 'Solo se permiten letras';
  if (!esCorreoValido(correo)) errores.correo = 'Ingresa un correo válido';
  if (!esContrasenaValida(contrasena)) errores.contrasena = 'Mínimo 8 caracteres';
  if (contrasena !== confirmacion) errores.confirmacion = 'Las contraseñas no coinciden';
  if (!aceptaTerminos) errores.terminos = 'Debes aceptar los términos y condiciones';
  return errores;
}

/** Valida el formulario de login y regresa los errores por campo. */
export function validarLogin({ correo, contrasena }) {
  const errores = {};
  if (!esCorreoValido(correo)) errores.correo = 'Ingresa un correo válido';
  if (!contrasena) errores.contrasena = 'Ingresa tu contraseña';
  return errores;
}
