// Datos comunes de los documentos legales. Copiados de la web
// (Nub_studio_front: src/pages/public/legal/legalTypes.ts) para que la app diga lo mismo.
// Si cambian en la web, hay que actualizarlos aquí también.
//
// Cada documento es { title, subtitle, version, updated, intro?, sections: [{ id, title, blocks }] }
// y cada bloque tiene un tipo `t`:
//   p (párrafo) · h3 (subtítulo) · ul / ol (listas) · box (recuadro: important, info,
//   warning o success, con lista opcional) · table (head + rows) · contact (tarjeta oscura).
// El texto entre **dobles asteriscos** se muestra en negritas.

// Datos de contacto que aparecen en los documentos legales (igual que en la web)
export const EMAIL = 'nubstudio.uthh@gmail.com';
export const DOMICILIO =
  'Carretera México Laredo, Chapulhuacán Hidalgo #2, Barrio la Estación, Hidalgo, México';
