// Integración (#45): descubrimiento. Inicio, catálogo, filtros y detalle de obra con sus
// contextos, viewmodels, services, normalizadores y api.js; solo el backend está simulado.
import { crearBackend, obraApi, obraDetalleApi } from './backendFalso';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AuthProvider } from '../../../src/models/AuthContext';
import { CatalogFiltersProvider } from '../../../src/models/CatalogFiltersContext';
import { HomeScreen } from '../../../src/views/screens/catalog/HomeScreen';
import { CatalogScreen } from '../../../src/views/screens/catalog/CatalogScreen';
import { FiltersScreen } from '../../../src/views/screens/catalog/FiltersScreen';
import { DetalleObraScreen } from '../../../src/views/screens/catalog/DetalleObraScreen';
import { formatearPrecio } from '../../../src/utils/formatters';
import { almacen } from './secureStoreFalso';

jest.mock('expo-secure-store', () => require('./secureStoreFalso'));

// El primer render de las pantallas puede tardar en el runner de CI.
jest.setTimeout(30000);

const CATEGORIAS = [
  { id_categoria: 1, nombre: 'Pintura', slug: 'pintura', total_obras: '2' },
  { id_categoria: 2, nombre: 'Textil', slug: 'textil', total_obras: '1' },
];

const navegacion = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
});

/** Peticiones del catálogo (sin las destacadas de Inicio). */
const pedidasDelCatalogo = (api) =>
  api.llamadas('GET /api/obras').filter((p) => p.query.destacadas !== 'true');
const ultimaDelCatalogo = (api) => pedidasDelCatalogo(api).at(-1).query;

function montarCatalogo({ conFiltros = false } = {}) {
  const navigation = navegacion();
  render(
    <CatalogFiltersProvider>
      <CatalogScreen navigation={navigation} />
      {conFiltros ? <FiltersScreen navigation={navigation} /> : null}
    </CatalogFiltersProvider>
  );
  return navigation;
}

let api;
beforeEach(() => {
  almacen.clear();
  api = crearBackend();
  api.ruta('GET /api/categorias', () => ({ data: CATEGORIAS }));
  api.ruta('GET /api/obras', () => ({
    data: [
      obraApi(1, 'Xantolo', { precio_base: '2400.00' }),
      obraApi(2, 'Pencas', { precio_base: '800.00' }),
    ],
    pagination: { total: 2, totalPages: 1 },
  }));
});

describe('Integración: Inicio', () => {
  it('arma el inicio con destacadas, colecciones, recientes y blog desde la API', async () => {
    api.ruta('GET /api/obras', ({ query }) =>
      query.destacadas === 'true'
        ? { data: [obraApi(9, 'Danza de Viejos', { destacada: true })] }
        : { data: [obraApi(1, 'Xantolo'), obraApi(2, 'Pencas')], pagination: { total: 2 } }
    );
    api.ruta('GET /api/colecciones', () => ({
      data: [{ id_coleccion: 4, nombre: 'Raíces', slug: 'raices' }],
    }));
    api.ruta('GET /api/blog/posts', () => ({
      data: [{ id_post: 7, slug: 'xantolo', titulo: 'Así se vive el Xantolo' }],
      pagination: { total: 1, totalPages: 1 },
    }));
    const navigation = navegacion();
    render(<HomeScreen navigation={navigation} />);

    expect(await screen.findByTestId('destacada-0')).toBeTruthy();
    expect(screen.getByTestId('coleccion-raices')).toBeTruthy();
    expect(screen.getByText('Xantolo')).toBeTruthy();
    expect(await screen.findByTestId('inicio-post-0')).toBeTruthy();

    // Recientes: las 2 más nuevas; destacadas: hasta 6.
    const obras = api.llamadas('GET /api/obras');
    expect(obras.find((p) => p.query.destacadas === 'true').query.limit).toBe('6');
    expect(obras.find((p) => p.query.ordenar === 'recientes').query.limit).toBe('2');

    fireEvent.press(screen.getByTestId('destacada-0'));
    expect(navigation.navigate).toHaveBeenCalledWith('DetalleObra', { id: 9, slug: 'obra-9' });
  });
});

describe('Integración: catálogo y filtros', () => {
  it('muestra las obras del backend con su precio y el total', async () => {
    montarCatalogo();

    expect(await screen.findByText('Xantolo')).toBeTruthy();
    expect(screen.getByText('Pencas')).toBeTruthy();
    expect(screen.getByTestId('total-obras')).toHaveTextContent('2 obras');
    expect(screen.getAllByText(formatearPrecio(2400, { moneda: false })).length).toBeGreaterThan(0);
    expect(ultimaDelCatalogo(api)).toMatchObject({ page: '1', limit: '12', ordenar: 'recientes' });
  });

  it('la búsqueda llega al backend como ?buscar= y muestra lo que regresa', async () => {
    montarCatalogo();
    await screen.findByText('Xantolo');

    api.ruta('GET /api/obras', ({ query }) => ({
      data: query.buscar === 'pencas' ? [obraApi(2, 'Pencas')] : [],
      pagination: { total: 1, totalPages: 1 },
    }));
    fireEvent.changeText(screen.getByTestId('buscar-obras'), 'pencas');

    // Se busca cuando se deja de escribir (300 ms) con lo escrito.
    await waitFor(() => expect(ultimaDelCatalogo(api).buscar).toBe('pencas'));
    await waitFor(() => expect(screen.getByTestId('total-obras')).toHaveTextContent('1 obra'));
    expect(screen.getByText('Pencas')).toBeTruthy();
    expect(screen.queryByText('Xantolo')).toBeNull();
  });

  it('una categoría elegida en el catálogo llega al backend como ?categoria=', async () => {
    montarCatalogo();
    fireEvent.press(await screen.findByTestId('categoria-textil'));

    await waitFor(() => expect(ultimaDelCatalogo(api).categoria).toBe('2'));
  });

  it('los filtros aplicados en su pantalla cambian lo que pide el catálogo', async () => {
    const navigation = montarCatalogo({ conFiltros: true });
    await screen.findByText('Xantolo');

    // La pantalla de filtros comparte el contexto con el catálogo.
    fireEvent.press((await screen.findAllByText('Pintura')).at(-1));
    fireEvent.changeText(screen.getByTestId('precio-minimo'), '500');
    fireEvent.changeText(screen.getByTestId('precio-maximo'), '3,000');
    fireEvent.press(screen.getByTestId('aplicar-filtros'));

    expect(navigation.goBack).toHaveBeenCalled();
    await waitFor(() =>
      expect(ultimaDelCatalogo(api)).toMatchObject({
        categoria: '1',
        precio_min: '500',
        precio_max: '3000',
      })
    );
    expect(screen.getByTestId('abrir-filtros').props.accessibilityLabel).toBe('Filtros, 2 activos');
  });

  it('con filtros sin resultados muestra el aviso y "Limpiar filtros" vuelve a todas', async () => {
    montarCatalogo();
    await screen.findByText('Xantolo');

    api.ruta('GET /api/obras', ({ query }) =>
      query.buscar
        ? { data: [], pagination: { total: 0, totalPages: 0 } }
        : { data: [obraApi(1, 'Xantolo')], pagination: { total: 1, totalPages: 1 } }
    );
    fireEvent.changeText(screen.getByTestId('buscar-obras'), 'zzz');
    expect(await screen.findByTestId('catalogo-vacio')).toBeTruthy();

    fireEvent.press(screen.getByText(/limpiar filtros/i));
    expect(await screen.findByText('Xantolo')).toBeTruthy();
    expect(screen.getByTestId('buscar-obras').props.value).toBe('');
  });

  it('pagina: "Ver más obras" pide la página 2 y la agrega a la lista', async () => {
    api.ruta('GET /api/obras', ({ query }) =>
      query.page === '2'
        ? { data: [obraApi(3, 'Huapango')], pagination: { total: 3, totalPages: 2 } }
        : {
            data: [obraApi(1, 'Xantolo'), obraApi(2, 'Pencas')],
            pagination: { total: 3, totalPages: 2 },
          }
    );
    montarCatalogo();
    await screen.findByText('Xantolo');

    fireEvent.press(screen.getByTestId('ver-mas'));

    expect(await screen.findByText('Huapango')).toBeTruthy();
    expect(screen.getByText('Xantolo')).toBeTruthy();
    expect(ultimaDelCatalogo(api).page).toBe('2');
  });

  it('si el backend falla muestra el error y "Reintentar" vuelve a pedir', async () => {
    api.ruta('GET /api/obras', () => [500, { message: 'Error interno' }]);
    montarCatalogo();
    expect(await screen.findByTestId('estado-error')).toBeTruthy();

    api.ruta('GET /api/obras', () => ({
      data: [obraApi(1, 'Xantolo')],
      pagination: { total: 1, totalPages: 1 },
    }));
    fireEvent.press(screen.getByTestId('estado-error-accion'));
    expect(await screen.findByText('Xantolo')).toBeTruthy();
  });
});

describe('Integración: detalle de obra', () => {
  function montarDetalle(id = 51) {
    const navigation = navegacion();
    render(
      <AuthProvider>
        <DetalleObraScreen navigation={navigation} route={{ params: { id } }} />
      </AuthProvider>
    );
    return navigation;
  }

  it('muestra la obra del backend con su precio, existencias y artista', async () => {
    api.ruta('GET /api/obras/:id', ({ params }) => ({
      data: obraDetalleApi(Number(params.id), 'Espíritu Navideño', {
        precio_base: '2150.00',
        stock_disponible: 3,
      }),
    }));
    const navigation = montarDetalle();

    expect(await screen.findByText('Espíritu Navideño', {}, { timeout: 10000 })).toBeTruthy();
    expect(screen.getAllByText(formatearPrecio(2150, { moneda: false })).length).toBeGreaterThan(0);
    expect(screen.getByText('3 disponibles')).toBeTruthy();
    expect(api.llamadas('GET /api/obras/51')).toHaveLength(1);

    fireEvent.press(screen.getByText('Mariana Castillo'));
    expect(navigation.navigate).toHaveBeenCalledWith('PerfilArtista', { id: 27 });
  });

  it('si la obra no existe (404) lo explica', async () => {
    api.ruta('GET /api/obras/:id', () => [404, { message: 'Obra no encontrada' }]);
    montarDetalle(999);
    expect(await screen.findByTestId('detalle-error', {}, { timeout: 10000 })).toBeTruthy();
  });
});
