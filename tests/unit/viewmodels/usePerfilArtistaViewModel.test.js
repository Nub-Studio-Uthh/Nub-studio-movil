import { act, renderHook, waitFor } from '@testing-library/react-native';
import { usePerfilArtistaViewModel } from '../../../src/viewmodels/usePerfilArtistaViewModel';
import { getArtista } from '../../../src/models/artistaService';
import { ApiError } from '../../../src/models/api';

jest.mock('../../../src/models/artistaService', () => ({ getArtista: jest.fn() }));

const ARTISTA = {
  id: 4,
  nombre: 'Rosa Hernández',
  biografia: 'Pintora huasteca.',
  foto: null,
  ciudad: 'Huejutla de Reyes',
  categoria: 'Pintura',
  desde: 2018,
  obras: [
    { id: 1, titulo: 'Huapango en rojo' },
    { id: 2, titulo: 'Mercado de domingo' },
  ],
};

describe('usePerfilArtistaViewModel (HU-03)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('pide el artista por id y expone sus obras, iniciales y total', async () => {
    getArtista.mockResolvedValue(ARTISTA);
    const { result } = renderHook(() => usePerfilArtistaViewModel(4));

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getArtista).toHaveBeenCalledWith(4, expect.anything());
    expect(result.current.artista.nombre).toBe('Rosa Hernández');
    expect(result.current.obras).toHaveLength(2);
    expect(result.current.totalObras).toBe(2);
    expect(result.current.iniciales).toBe('RH');
    expect(result.current.error).toBeNull();
  });

  it('marca noEncontrado cuando la API responde 404', async () => {
    getArtista.mockRejectedValue(new ApiError('No encontramos lo que buscabas.', 404));
    const { result } = renderHook(() => usePerfilArtistaViewModel(999));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.noEncontrado).toBe(true);
    expect(result.current.artista).toBeNull();
    expect(result.current.obras).toEqual([]);
  });

  it('si falla la conexión permite reintentar', async () => {
    getArtista.mockRejectedValueOnce(new ApiError('Sin conexión', 0)).mockResolvedValue(ARTISTA);
    const { result } = renderHook(() => usePerfilArtistaViewModel(4));

    await waitFor(() => expect(result.current.error).toBe('Sin conexión'));
    expect(result.current.noEncontrado).toBe(false);

    await act(async () => {
      await result.current.reload();
    });
    expect(result.current.error).toBeNull();
    expect(result.current.artista.id).toBe(4);
  });
});
