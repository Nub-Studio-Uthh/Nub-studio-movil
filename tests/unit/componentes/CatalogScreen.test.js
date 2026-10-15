import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { CatalogScreen } from '../../../src/screens/catalog/CatalogScreen';
import { CatalogFiltersProvider } from '../../../src/models/CatalogFiltersContext';
import { getObras } from '../../../src/models/obraService';
import { ApiError } from '../../../src/models/api';

jest.mock('../../../src/models/obraService', () => ({ getObras: jest.fn() }));
jest.mock('../../../src/models/categoriaService', () => ({
  getCategorias: jest.fn(async () => [{ id: 1, nombre: 'Pintura', slug: 'pintura', total: 1 }]),
}));

const obra = (id, titulo) => ({
  id,
  slug: `obra-${id}`,
  titulo,
  imagen: null,
  artista: 'Mariana Castillo',
  categoria: 'Pintura',
  precio: 1500,
  precioOferta: null,
  destacada: false,
});

const pagina = (items, total = items.length) => ({ items, total, page: 1, totalPages: 1 });

function montar() {
  const navigation = { navigate: jest.fn() };
  render(
    <CatalogFiltersProvider>
      <CatalogScreen navigation={navigation} />
    </CatalogFiltersProvider>
  );
  return navigation;
}

beforeEach(() => getObras.mockReset());

describe('CatalogScreen (HU-01)', () => {
  it('muestra las obras y el total al terminar de cargar', async () => {
    getObras.mockResolvedValue(pagina([obra(1, 'Portada universitaria'), obra(2, 'Corrido')], 39));
    const navigation = montar();

    expect(await screen.findByText('Portada universitaria')).toBeTruthy();
    expect(await screen.findByText('39 obras')).toBeTruthy();

    fireEvent.press(screen.getByTestId('obra-card-0'));
    expect(navigation.navigate).toHaveBeenCalledWith('DetalleObra', { id: 1, slug: 'obra-1' });
  });

  it('con filtros sin resultados muestra un mensaje claro y permite limpiarlos', async () => {
    getObras.mockResolvedValueOnce(pagina([obra(1, 'Portada universitaria')]));
    montar();
    await screen.findByText('Portada universitaria');

    getObras.mockResolvedValue(pagina([]));
    fireEvent.changeText(screen.getByTestId('buscar-obras'), 'zzz');
    expect(await screen.findByText('No hay obras con esos filtros')).toBeTruthy();

    getObras.mockResolvedValue(pagina([obra(1, 'Portada universitaria')]));
    fireEvent.press(screen.getByTestId('catalogo-vacio-accion'));
    expect(await screen.findByText('Portada universitaria')).toBeTruthy();
    expect(screen.getByTestId('buscar-obras').props.value).toBe('');
  });

  it('si falla la carga muestra el error y "Reintentar" vuelve a pedir las obras', async () => {
    getObras.mockRejectedValueOnce(new ApiError('No pudimos conectar con el servidor.', 0));
    montar();
    expect(await screen.findByText('No pudimos cargar las obras')).toBeTruthy();

    getObras.mockResolvedValue(pagina([obra(3, 'Detalles escultóricos')]));
    fireEvent.press(screen.getByTestId('estado-error-accion'));
    expect(await screen.findByText('Detalles escultóricos')).toBeTruthy();
    await waitFor(() => expect(getObras).toHaveBeenCalledTimes(2));
  });
});
