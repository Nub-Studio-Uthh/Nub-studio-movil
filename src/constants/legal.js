// Documentos legales de la app: los mismos de la web (ver legalComun.js).
import { PRIVACIDAD } from './legalPrivacidad';
import { TERMINOS } from './legalTerminos';

export const LEGAL = {
  terminos: TERMINOS,
  privacidad: PRIVACIDAD,
};

/** El otro documento, para el enlace del final ("Ver Aviso de Privacidad"). */
export const OTRO_DOCUMENTO = {
  terminos: { tipo: 'privacidad', label: 'Ver Aviso de Privacidad' },
  privacidad: { tipo: 'terminos', label: 'Ver Términos y Condiciones' },
};
