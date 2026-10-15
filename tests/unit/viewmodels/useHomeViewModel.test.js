import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useHomeViewModel } from '../../../src/viewmodels/useHomeViewModel';
import { getDestacadas, getObras } from '../../../src/models/obraService';
import { getColecciones } from '../../../src/models/coleccionService';

jest.mock('../../../src/models/obraService', () => ({
  getDestacadas: jest.fn(),
  getObras: jest.fn(),
}));
jest.mock('../../../src/models/coleccionService', () => ({ getColecciones: jest.fn() }));

const OBRA = { id: 1, titulo: 'Xantolo' };

describe('useHomeViewModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getColecciones.mockResolvedValue([{ id: 3, nombre: 'Huasteca' }]);
  });

  it('carga destacadas, recientes y colecciones', async () => {
    getDestacadas.mockResolvedValue([OBRA]);
    getObras.mockResolvedValue({ items: [OBRA], total: 1 });
    const { result } = renderHook(() => useHomeViewModel());

    await waitFor(() => expect(result.current.esperando).toBe(false));
    expect(result.current.destacadas.data).toEqual([OBRA]);
    expect(result.current.recientes.data).toEqual([OBRA]);
    expect(result.current.colecciones.data).toHaveLength(1);
    expect(result.current.sinObras).toBe(false);
    expect(result.current.fallaronTodas).toBe(false);
    expect(getObras).toHaveBeenCalledWith(
      { ordenar: 'recientes' },
      expect.objectContaining({ limit: 2 })
    );
  });

  it('marca sinObras cuando no hay destacadas ni recientes', async () => {
    getDestacadas.mockResolvedValue([]);
    getObras.mockResolvedValue({ items: [], total: 0 });
    const { result } = renderHook(() => useHomeViewModel());

    await waitFor(() => expect(result.current.esperando).toBe(false));
    expect(result.current.sinObras).toBe(true);
  });

  it('marca fallaronTodas y se recupera con recargarTodo', async () => {
    getDestacadas.mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValue([OBRA]);
    getObras
      .mockRejectedValueOnce(new Error('Sin conexión'))
      .mockResolvedValue({ items: [OBRA], total: 1 });
    const { result } = renderHook(() => useHomeViewModel());

    await waitFor(() => expect(result.current.fallaronTodas).toBe(true));
    await act(() => result.current.recargarTodo());
    expect(result.current.fallaronTodas).toBe(false);
    expect(result.current.destacadas.data).toEqual([OBRA]);
  });
});
