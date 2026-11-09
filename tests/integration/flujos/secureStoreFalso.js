// Almacenamiento seguro del teléfono (expo-secure-store) en memoria, para las pruebas de
// integración. Se usa con:
//   jest.mock('expo-secure-store', () => require('./secureStoreFalso'));
// y cada prueba empieza con almacen.clear().

export const almacen = new Map();

export const getItemAsync = async (clave) => (almacen.has(clave) ? almacen.get(clave) : null);

export const setItemAsync = async (clave, valor) => {
  almacen.set(clave, valor);
};

export const deleteItemAsync = async (clave) => {
  almacen.delete(clave);
};
