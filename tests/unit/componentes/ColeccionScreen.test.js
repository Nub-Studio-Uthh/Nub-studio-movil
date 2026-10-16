import { fireEvent, render, screen } from '@testing-library/react-native';
import { ColeccionScreen } from '../../../src/views/screens/coleccion/ColeccionScreen';
import { getColeccion } from '../../../src/models/coleccionService';
import { ApiError } from '../../../src/models/api';

jest.mock('../../../src/models/coleccionService', () => ({ getColeccion: jest.fn() }));

const obra = (id, titulo) => ({
  id,
  slug: `obra-${id}`,
  titulo,
  imagen: null,
  artista: 'Rosa Hernández',
  categoria: '',
  precio: 2300,
  precioOferta: null,
  destacada: false,
});

const DETALLE = {
  id: 4,
  slug: 'xantolo',
  nombre: 'Día de Muertos',
  historia: 'Piezas inspiradas en el Xantolo de Huejutla.',
  portada: null,
  destacada: false,
  artista: 'Rosa Hernández',
  artistaId: 22,
  artistaFoto: null,
  totalObras: 2,
  obras: [obra(1, 'Arco de cempasúchil'), obra(2, 'Altar huasteco')],
};

function montar(params = { slug: 'xantolo' }) {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  render(<ColeccionScreen navigation={navigation} route={{ params }} />);
  return navigation;
}

beforeEach(() => getColeccion.mockReset());

describe('ColeccionScreen (HU-04)', () => {
  it('muestra la descripción de la colección y sus obras; cada obra abre su detalle', async () => {
    getColeccion.mockResolvedValue(DETALLE);
    const navigation = montar();

    expect(await screen.findByText('Arco de cempasúchil')).toBeTruthy();
    expect(screen.getByTestId('coleccion-nombre')).toHaveTextContent('Día de Muertos');
    expect(screen.getByText('Piezas inspiradas en el Xantolo de Huejutla.')).toBeTruthy();
    expect(screen.getByTestId('coleccion-total')).toHaveTextContent('2 obras');
    expect(getColeccion).toHaveBeenCalledWith('xantolo', expect.anything());

    fireEvent.press(screen.getByTestId('coleccion-obra-1'));
    expect(navigation.navigate).toHaveBeenCalledWith('DetalleObra', { id: 2, slug: 'obra-2' });
  });

  it('el artista abre su perfil', async () => {
    getColeccion.mockResolvedValue(DETALLE);
    const navigation = montar();
    await screen.findByText('Arco de cempasúchil');

    fireEvent.press(screen.getByTestId('coleccion-artista'));
    expect(navigation.navigate).toHaveBeenCalledWith('PerfilArtista', { id: 22 });
  });

  it('con los datos de la lista muestra el nombre de inmediato, antes de que lleguen las obras', () => {
    getColeccion.mockReturnValue(new Promise(() => {}));
    montar({ slug: 'xantolo', coleccion: { ...DETALLE, obras: [] } });
    expect(screen.getByTestId('coleccion-nombre')).toHaveTextContent('Día de Muertos');
  });

  it('una colección sin obras publicadas lo indica', async () => {
    getColeccion.mockResolvedValue({ ...DETALLE, obras: [], totalObras: 0 });
    montar();
    expect(await screen.findByText('Aún no tiene obras publicadas')).toBeTruthy();
  });

  it('si la colección ya no existe (404) lo indica y permite regresar', async () => {
    getColeccion.mockRejectedValue(new ApiError('No encontramos lo que buscabas.', 404));
    const navigation = montar({ slug: 'no-existe' });

    expect(await screen.findByText('Esta colección ya no está disponible')).toBeTruthy();
    fireEvent.press(screen.getByTestId('coleccion-regresar'));
    expect(navigation.goBack).toHaveBeenCalled();
  });

  it('si falla la conexión permite reintentar', async () => {
    getColeccion.mockRejectedValueOnce(new ApiError('Sin conexión', 0));
    montar();
    expect(await screen.findByText('No pudimos cargar la colección')).toBeTruthy();

    getColeccion.mockResolvedValue(DETALLE);
    fireEvent.press(screen.getByTestId('estado-error-accion'));
    expect(await screen.findByText('Altar huasteco')).toBeTruthy();
  });
});
