// Mismas reglas que el backend (validarActualizarPerfil).
const REGEX_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/;
const REGEX_TELEFONO = /^\d{10}$/;

/** Convierte la respuesta de GET o PUT /api/auth/perfil en los datos que usa la pantalla. */
export function normalizarPerfil(raw) {
  return {
    nombre: raw?.nombre ?? '',
    correo: raw?.correo ?? '',
    telefono: raw?.telefono ?? '',
    aceptaMarketing: raw?.acepta_marketing === true,
  };
}

/**
 * Valida el formulario y regresa los errores por campo.
 * @returns {Record<string, string>} objeto vacío si no hay errores
 */
export function validarPerfil({ nombre, telefono }) {
  const errores = {};
  const limpio = nombre.trim();
  if (limpio.length < 3 || limpio.length > 100) {
    errores.nombre = 'Escribe entre 3 y 100 caracteres';
  } else if (!REGEX_NOMBRE.test(limpio)) {
    errores.nombre = 'Solo se permiten letras y espacios';
  }
  const tel = telefono.trim();
  if (tel && !REGEX_TELEFONO.test(tel)) errores.telefono = 'Escribe 10 números';
  return errores;
}

/** Solo lo que cambió, para no volver a validar un dato que la persona no tocó. */
export function cambiosDePerfil(form, perfil) {
  const cambios = {};
  const nombre = form.nombre.trim();
  const telefono = form.telefono.trim();
  if (nombre !== perfil.nombre) cambios.nombre = nombre;
  if (telefono !== perfil.telefono) cambios.telefono = telefono;
  return cambios;
}
