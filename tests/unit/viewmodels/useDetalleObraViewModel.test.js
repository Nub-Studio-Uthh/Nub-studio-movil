import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useDetalleObraViewModel } from '../../../src/viewmodels/useDetalleObraViewModel';
import { getObra } from '../../../src/models/obraService';
import { useAuth } from '../../../src/models/AuthContext';
import { agregarFavorito, esFavorito, quitarFavorito } from '../../../src/models/favoritoService';
import { ApiError } from '../../../src/models/api';

jest.mock('../../../src/models/obraService', () => ({ getObra: jest.fn() }));
jest.mock('../../../src/models/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../../src/models/favoritoService', () => ({
  agregarFavorito: jest.fn(),
  esFavorito: jest.fn(),
  quitarFavorito: jest.fn(),
}));

const OBRA = { id: 7, titulo: 'Danza de la cosecha' };
const CLIENTE = { status: 'authenticated', token: 'tk', usuario: { rol: 'cliente' } };

describe('useDetalleObraViewModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getObra.mockResolvedValue(OBRA);
    useAuth.mockReturnValue({ status: 'guest', token: null, usuario: null });
  });

  it('pide la obra por id y la entrega', async () => {
    const { result } = renderHook(() => useDetalleObraViewModel(7));

    await waitFor(() => expect(result.current.obra).toEqual(OBRA));
    expect(getObra).toHaveBeenCalledWith(7, expect.objectContaining({ signal: expect.anything() }));
    expect(result.current.error).toBeNull();
  });

  it('expone el error y permite reintentar', async () => {
    getObra.mockReset();
    getObra.mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValueOnce(OBRA);
    const { result } = renderHook(() => useDetalleObraViewModel(7));

    await waitFor(() => expect(result.current.error).toBe('Sin conexión'));
    await act(() => result.current.reload());
    expect(result.current.obra).toEqual(OBRA);
    expect(result.current.error).toBeNull();
  });

  describe('favorito (HU-07)', () => {
    it('sin sesión pide iniciar sesión y no llama a la API', async () => {
      const { result } = renderHook(() => useDetalleObraViewModel(7));
      await waitFor(() => expect(result.current.obra).toEqual(OBRA));

      expect(result.current.requiereSesion).toBe(true);
      await act(async () => {
        await result.current.toggleFavorito();
      });
      expect(result.current.favorito).toBe(false);
      expect(esFavorito).not.toHaveBeenCalled();
      expect(agregarFavorito).not.toHaveBeenCalled();
    });

    it('con sesión de cliente lee si ya es favorita y la puede quitar', async () => {
      useAuth.mockReturnValue(CLIENTE);
      esFavorito.mockResolvedValue(true);
      quitarFavorito.mockResolvedValue();
      const { result } = renderHook(() => useDetalleObraViewModel(7));

      await waitFor(() => expect(result.current.favorito).toBe(true));
      expect(esFavorito).toHaveBeenCalledWith('tk', 7, expect.anything());

      let mensaje;
      await act(async () => {
        mensaje = await result.current.toggleFavorito();
      });
      expect(mensaje).toBeNull();
      expect(quitarFavorito).toHaveBeenCalledWith('tk', 7);
      expect(result.current.favorito).toBe(false);
    });

    it('agrega a favoritos y, si el backend falla, regresa el corazón como estaba', async () => {
      useAuth.mockReturnValue(CLIENTE);
      esFavorito.mockResolvedValue(false);
      agregarFavorito.mockResolvedValueOnce(true);
      const { result } = renderHook(() => useDetalleObraViewModel(7));
      await waitFor(() => expect(esFavorito).toHaveBeenCalled());

      await act(async () => {
        await result.current.toggleFavorito();
      });
      expect(result.current.favorito).toBe(true);

      quitarFavorito.mockRejectedValueOnce(new ApiError('Sin conexión', 0));
      let mensaje;
      await act(async () => {
        mensaje = await result.current.toggleFavorito();
      });
      expect(mensaje).toBe('Sin conexión');
      expect(result.current.favorito).toBe(true);
    });

    it('una cuenta que no es de cliente no puede guardar favoritos', async () => {
      useAuth.mockReturnValue({ ...CLIENTE, usuario: { rol: 'artista' } });
      const { result } = renderHook(() => useDetalleObraViewModel(7));
      await waitFor(() => expect(result.current.obra).toEqual(OBRA));

      expect(result.current.requiereSesion).toBe(false);
      expect(result.current.puedeGuardarFavoritos).toBe(false);
      expect(esFavorito).not.toHaveBeenCalled();
    });
  });
});
