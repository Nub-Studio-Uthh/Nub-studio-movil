import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ColeccionesScreen } from '../../../src/views/screens/coleccion/ColeccionesScreen';
import { getColeccionesPublicas } from '../../../src/models/coleccionService';
import { ApiError } from '../../../src/models/api';

jest.mock('../../../src/models/coleccionService', () => ({ getColeccionesPublicas: jest.fn() }));

const coleccion = (id, nombre, extra = {}) => ({
  id,
  slug: `col-${id}`,
  nombre,
  historia: '',
  portada: null,
  destacada: false,
  artista: 'Rosa Hernández',
  artistaId: null,
  artistaFoto: null,
  totalObras: 3,
  obras: [],
  ...extra,
});

function montar() {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  render(<ColeccionesScreen navigation={navigation} />);
  return navigation;
}

beforeEach(() => getColeccionesPublicas.mockReset());

describe('ColeccionesScreen (HU-04)', () => {
  it('lista las colecciones con su descripción y número de obras, y abre la elegida', async () => {
    getColeccionesPublicas.mockResolvedValue([
      coleccion(1, 'Día de Muertos', { historia: 'Xantolo y tradición', totalObras: 14 }),
      coleccion(2, 'Textiles huastecos', { totalObras: 1 }),
      coleccion(3, 'Paisajes de la sierra', { totalObras: 0 }),
    ]);
    const navigation = montar();

    expect(await screen.findByText('Día de Muertos')).toBeTruthy();
    expect(screen.getByText('Xantolo y tradición')).toBeTruthy();
    expect(screen.getByText('14 OBRAS')).toBeTruthy();
    // Sin historia se muestra el artista; con 1 obra, en singular.
    expect(screen.getAllByText('De Rosa Hernández')).toHaveLength(2);
    expect(screen.getByText('1 OBRA')).toBeTruthy();
    // Sin obras no se muestra el badge.
    expect(screen.queryByText('0 OBRAS')).toBeNull();

    fireEvent.press(screen.getByTestId('coleccion-tarjeta-1'));
    expect(navigation.navigate).toHaveBeenCalledWith('Coleccion', {
      slug: 'col-2',
      coleccion: expect.objectContaining({ id: 2 }),
    });
  });

  it('sin colecciones muestra un mensaje claro', async () => {
    getColeccionesPublicas.mockResolvedValue([]);
    montar();
    expect(await screen.findByText('Aún no hay colecciones')).toBeTruthy();
  });

  it('si falla la carga muestra el error y "Reintentar" vuelve a pedirlas', async () => {
    getColeccionesPublicas.mockRejectedValueOnce(new ApiError('Sin conexión', 0));
    montar();
    expect(await screen.findByText('No pudimos cargar las colecciones')).toBeTruthy();

    getColeccionesPublicas.mockResolvedValue([coleccion(9, 'Huapango')]);
    fireEvent.press(screen.getByTestId('estado-error-accion'));
    expect(await screen.findByText('Huapango')).toBeTruthy();
    await waitFor(() => expect(getColeccionesPublicas).toHaveBeenCalledTimes(2));
  });

  it('el botón de regresar vuelve a la pantalla anterior', async () => {
    getColeccionesPublicas.mockResolvedValue([]);
    const navigation = montar();
    await screen.findByText('Aún no hay colecciones');
    fireEvent.press(screen.getByTestId('colecciones-regresar'));
    expect(navigation.goBack).toHaveBeenCalled();
  });
});
