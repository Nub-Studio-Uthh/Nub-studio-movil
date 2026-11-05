import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useColeccionesViewModel } from '../../../src/viewmodels/useColeccionesViewModel';
import { getColeccionesPublicas } from '../../../src/models/coleccionService';
import { ApiError } from '../../../src/models/api';

jest.mock('../../../src/models/coleccionService', () => ({ getColeccionesPublicas: jest.fn() }));

const coleccion = (id, nombre) => ({ id, slug: `col-${id}`, nombre, totalObras: 2, obras: [] });

beforeEach(() => getColeccionesPublicas.mockReset());

describe('useColeccionesViewModel (HU-04)', () => {
  it('carga las colecciones publicadas', async () => {
    getColeccionesPublicas.mockResolvedValue([coleccion(1, 'Huapango'), coleccion(2, 'Xantolo')]);
    const { result } = renderHook(() => useColeccionesViewModel());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.colecciones.map((c) => c.nombre)).toEqual(['Huapango', 'Xantolo']);
    expect(result.current.error).toBeNull();
  });

  it('si falla muestra el error y "reload" vuelve a intentar', async () => {
    getColeccionesPublicas
      .mockRejectedValueOnce(new ApiError('Sin conexión', 0))
      .mockResolvedValue([coleccion(1, 'Huapango')]);
    const { result } = renderHook(() => useColeccionesViewModel());

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('Sin conexión');

    await act(async () => {
      await result.current.reload();
    });
    expect(result.current.status).toBe('success');
    expect(result.current.colecciones).toHaveLength(1);
  });

  it('si el refresco falla conserva la lista que ya se veía', async () => {
    getColeccionesPublicas.mockResolvedValueOnce([coleccion(1, 'Huapango')]);
    const { result } = renderHook(() => useColeccionesViewModel());
    await waitFor(() => expect(result.current.status).toBe('success'));

    getColeccionesPublicas.mockRejectedValueOnce(new ApiError('Sin conexión', 0));
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.status).toBe('success');
    expect(result.current.refreshing).toBe(false);
    expect(result.current.colecciones).toHaveLength(1);
  });
});
