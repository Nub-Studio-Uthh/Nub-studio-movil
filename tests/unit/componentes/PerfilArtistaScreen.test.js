import { fireEvent, render, screen } from '@testing-library/react-native';
import { PerfilArtistaScreen } from '../../../src/views/screens/artist/PerfilArtistaScreen';
import { getArtista } from '../../../src/models/artistaService';
import { ApiError } from '../../../src/models/api';

jest.mock('../../../src/models/artistaService', () => ({ getArtista: jest.fn() }));

const obra = (id, titulo) => ({
  id,
  slug: `obra-${id}`,
  titulo,
  imagen: null,
  artista: 'Rosa Hernández',
  categoria: 'Pintura',
  precio: 2300,
  precioOferta: null,
  destacada: false,
});

const ARTISTA = {
  id: 4,
  nombre: 'Rosa Hernández',
  biografia: 'Pintora huasteca que retrata las fiestas, la música y los paisajes de la región.',
  foto: null,
  ciudad: 'Huejutla de Reyes',
  categoria: 'Pintura',
  desde: 2018,
  obras: [obra(1, 'Huapango en rojo'), obra(2, 'Mercado de domingo')],
};

function montar(params = { id: 4 }) {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  render(<PerfilArtistaScreen navigation={navigation} route={{ params }} />);
  return navigation;
}

beforeEach(() => getArtista.mockReset());

describe('PerfilArtistaScreen (HU-03)', () => {
  it('muestra la información pública del artista', async () => {
    getArtista.mockResolvedValue(ARTISTA);
    montar();

    expect((await screen.findByTestId('perfil-nombre')).props.children).toBe('Rosa Hernández');
    expect(screen.getByText('Huejutla de Reyes · Pintura')).toBeTruthy();
    expect(screen.getByText(ARTISTA.biografia)).toBeTruthy();
    expect(screen.getByText('RH')).toBeTruthy();
    expect(screen.getByText('2018')).toBeTruthy();
    expect(screen.getByText('Obras')).toBeTruthy();
    expect(getArtista).toHaveBeenCalledWith(4, expect.anything());
  });

  it('lista sus obras y cada una abre su detalle', async () => {
    getArtista.mockResolvedValue(ARTISTA);
    const navigation = montar();

    expect(await screen.findByText('Huapango en rojo')).toBeTruthy();
    expect(screen.getByText('Mercado de domingo')).toBeTruthy();

    fireEvent.press(screen.getByTestId('perfil-obra-1'));
    expect(navigation.navigate).toHaveBeenCalledWith('DetalleObra', { id: 2, slug: 'obra-2' });
  });

  it('si el artista no tiene obras publicadas lo explica', async () => {
    getArtista.mockResolvedValue({ ...ARTISTA, obras: [] });
    montar();
    expect(await screen.findByText('Aún no tiene obras publicadas')).toBeTruthy();
  });

  it('si el artista no existe lo explica y permite regresar', async () => {
    getArtista.mockRejectedValue(new ApiError('No encontramos lo que buscabas.', 404));
    const navigation = montar({ id: 999 });

    expect(await screen.findByText('Este artista no está disponible')).toBeTruthy();
    fireEvent.press(screen.getByTestId('perfil-no-encontrado-accion'));
    expect(navigation.goBack).toHaveBeenCalled();
  });

  it('si falla la conexión permite reintentar', async () => {
    getArtista.mockRejectedValueOnce(new ApiError('Sin conexión', 0));
    montar();
    expect(await screen.findByText('No pudimos cargar el perfil')).toBeTruthy();

    getArtista.mockResolvedValue(ARTISTA);
    fireEvent.press(screen.getByTestId('estado-error-accion'));
    expect(await screen.findByTestId('perfil-nombre')).toBeTruthy();
  });
});
