// La app móvil es solo para clientes (#148). Artistas y administradores tienen su portal
// en la web, así que la app no les deja iniciar sesión.
export const ROL_CLIENTE = 'cliente';

export const MSG_SOLO_CLIENTES =
  'Esta app es solo para clientes. Si eres artista o administrador, entra desde la web.';

/** Una sesión sin rol (datos viejos o incompletos) se trata como de cliente. */
export const esRolPermitido = (usuario) => !usuario?.rol || usuario.rol === ROL_CLIENTE;
