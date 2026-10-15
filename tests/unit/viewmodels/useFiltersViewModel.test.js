import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useFiltersViewModel } from '../../../src/viewmodels/useFiltersViewModel';
import {
  CatalogFiltersProvider,
  useCatalogFilters,
} from '../../../src/models/CatalogFiltersContext';

jest.mock('../../../src/models/categoriaService', () => ({
  getCategorias: jest.fn(async () => [
    { id: 1, nombre: 'Pintura', slug: 'pintura' },
    { id: 2, nombre: 'Textil', slug: 'textil' },
  ]),
}));
jest.mock('../../../src/models/obraService', () => ({
  getObras: jest.fn(async () => ({ items: [{ precio: 21500 }], total: 1, page: 1, totalPages: 1 })),
}));

// El ViewModel y el contexto en el mismo render, para revisar qué se aplicó al catálogo.
const montar = () =>
  renderHook(() => ({ vm: useFiltersViewModel(), catalogo: useCatalogFilters() }), {
    wrapper: CatalogFiltersProvider,
  });

describe('useFiltersViewModel', () => {
  it('carga las categorías y redondea el tope del precio a miles', async () => {
    const { result } = montar();
    await waitFor(() => expect(result.current.vm.categorias.data).toHaveLength(2));
    await waitFor(() => expect(result.current.vm.topePrecio).toBe(22000));
  });

  it('elegir la misma categoría dos veces la quita', async () => {
    const { result } = montar();
    await waitFor(() => expect(result.current.vm.categorias.isLoading).toBe(false));
    const pintura = result.current.vm.categorias.data[0];

    act(() => result.current.vm.elegirCategoria(pintura));
    expect(result.current.vm.borrador.categoria).toEqual({ id: 1, nombre: 'Pintura' });
    expect(result.current.vm.nActivos).toBe(1);

    act(() => result.current.vm.elegirCategoria(pintura));
    expect(result.current.vm.borrador.categoria).toBeNull();
    expect(result.current.vm.nActivos).toBe(0);
  });

  it('no aplica un rango de precio inválido', async () => {
    const { result } = montar();
    await waitFor(() => expect(result.current.vm.categorias.isLoading).toBe(false));

    act(() => result.current.vm.cambiar({ precioMin: 5000, precioMax: 1000 }));
    expect(result.current.vm.error).toMatch(/mayor o igual/);

    let aplicado;
    act(() => {
      aplicado = result.current.vm.aplicar();
    });
    expect(aplicado).toBe(false);
    expect(result.current.catalogo.filtros.precioMin).toBeNull();
  });

  it('aplica el borrador al catálogo solo al llamar a aplicar', async () => {
    const { result } = montar();
    await waitFor(() => expect(result.current.vm.categorias.isLoading).toBe(false));

    act(() => result.current.vm.cambiar({ precioMin: 1000, precioMax: 5000 }));
    expect(result.current.catalogo.filtros.precioMin).toBeNull();

    let aplicado;
    act(() => {
      aplicado = result.current.vm.aplicar();
    });
    expect(aplicado).toBe(true);
    expect(result.current.catalogo.filtros).toMatchObject({ precioMin: 1000, precioMax: 5000 });
  });
});
