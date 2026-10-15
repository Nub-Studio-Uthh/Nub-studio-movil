import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useDetalleObraViewModel } from '../../../src/viewmodels/useDetalleObraViewModel';
import { getObra } from '../../../src/models/obraService';

jest.mock('../../../src/models/obraService', () => ({ getObra: jest.fn() }));

const OBRA = { id: 7, titulo: 'Danza de la cosecha' };

describe('useDetalleObraViewModel', () => {
  beforeEach(() => jest.clearAllMocks());

  it('pide la obra por id y la entrega', async () => {
    getObra.mockResolvedValue(OBRA);
    const { result } = renderHook(() => useDetalleObraViewModel(7));

    await waitFor(() => expect(result.current.obra).toEqual(OBRA));
    expect(getObra).toHaveBeenCalledWith(7, expect.objectContaining({ signal: expect.anything() }));
    expect(result.current.error).toBeNull();
  });

  it('expone el error y permite reintentar', async () => {
    getObra.mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValueOnce(OBRA);
    const { result } = renderHook(() => useDetalleObraViewModel(7));

    await waitFor(() => expect(result.current.error).toBe('Sin conexión'));
    await act(() => result.current.reload());
    expect(result.current.obra).toEqual(OBRA);
    expect(result.current.error).toBeNull();
  });

  it('cambia el favorito solo en pantalla', async () => {
    getObra.mockResolvedValue(OBRA);
    const { result } = renderHook(() => useDetalleObraViewModel(7));
    await waitFor(() => expect(result.current.obra).toEqual(OBRA));

    expect(result.current.favorito).toBe(false);
    act(() => result.current.toggleFavorito());
    expect(result.current.favorito).toBe(true);
  });
});
