import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { CatalogScreen } from '../../../src/views/screens/catalog/CatalogScreen';
import { CatalogFiltersProvider } from '../../../src/models/CatalogFiltersContext';
import { getObras } from '../../../src/models/obraService';

jest.mock('../../../src/models/obraService', () => ({ getObras: jest.fn() }));
jest.mock('../../../src/models/categoriaService', () => ({
  getCategorias: jest.fn(async () => [
    { id: 1, nombre: 'Pintura', slug: 'pintura', total: 1 },
    { id: 2, nombre: 'Escultura', slug: 'escultura', total: 1 },
  ]),
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

const pagina = (items) => ({ items, total: items.length, page: 1, totalPages: 1 });

/** Filtros con los que se pidió la última página de obras. */
const ultimosFiltros = () => getObras.mock.calls.at(-1)[0];

function montar() {
  const navigation = { navigate: jest.fn() };
  render(
    <CatalogFiltersProvider>
      <CatalogScreen navigation={navigation} />
    </CatalogFiltersProvider>
  );
  return navigation;
}

beforeEach(() => {
  getObras.mockReset();
  getObras.mockResolvedValue(pagina([obra(1, 'Xantolo')]));
});

describe('CatalogScreen: búsqueda y filtros (HU-01)', () => {
  it('busca lo escrito cuando se deja de escribir', async () => {
    montar();
    await screen.findByText('Xantolo');
    expect(ultimosFiltros().buscar).toBe('');

    getObras.mockResolvedValue(pagina([obra(2, 'Pencas')]));
    fireEvent.changeText(screen.getByTestId('buscar-obras'), 'pencas');
    expect(screen.getByTestId('buscar-obras').props.value).toBe('pencas');

    await waitFor(() => expect(ultimosFiltros().buscar).toBe('pencas'));
    expect(await screen.findByText('Pencas')).toBeTruthy();
  });

  it('elegir una categoría filtra las obras y tocarla otra vez la quita', async () => {
    montar();
    fireEvent.press(await screen.findByTestId('categoria-pintura'));
    await waitFor(() =>
      expect(ultimosFiltros().categoria).toEqual(expect.objectContaining({ id: 1 }))
    );

    fireEvent.press(screen.getByTestId('categoria-pintura'));
    await waitFor(() => expect(ultimosFiltros().categoria).toBeNull());
  });

  it('"Todas" quita la categoría elegida', async () => {
    montar();
    fireEvent.press(await screen.findByTestId('categoria-escultura'));
    await waitFor(() =>
      expect(ultimosFiltros().categoria).toEqual(expect.objectContaining({ id: 2 }))
    );

    fireEvent.press(screen.getByTestId('categoria-todas'));
    await waitFor(() => expect(ultimosFiltros().categoria).toBeNull());
  });

  it('el botón de filtros abre la pantalla de filtros y muestra cuántos hay activos', async () => {
    const navigation = montar();
    expect(screen.getByTestId('abrir-filtros').props.accessibilityLabel).toBe('Filtros');

    fireEvent.press(await screen.findByTestId('categoria-pintura'));
    await waitFor(() =>
      expect(screen.getByTestId('abrir-filtros').props.accessibilityLabel).toBe(
        'Filtros, 1 activos'
      )
    );

    fireEvent.press(screen.getByTestId('abrir-filtros'));
    expect(navigation.navigate).toHaveBeenCalledWith('Filtros');
  });
});
