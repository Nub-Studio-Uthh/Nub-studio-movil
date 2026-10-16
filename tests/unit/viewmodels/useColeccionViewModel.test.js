import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useColeccionViewModel } from '../../../src/viewmodels/useColeccionViewModel';
import { getColeccion } from '../../../src/models/coleccionService';
import { ApiError } from '../../../src/models/api';

jest.mock('../../../src/models/coleccionService', () => ({ getColeccion: jest.fn() }));

const DETALLE = {
  id: 4,
  slug: 'libros',
  nombre: 'La historia de un libro',
  historia: 'Libros ilustrados a mano.',
  portada: null,
  destacada: false,
  artista: 'Rosa Hernández',
  artistaId: 22,
  artistaFoto: null,
  totalObras: 2,
  obras: [
    { id: 54, slug: 'libro-1', titulo: 'libro 1' },
    { id: 55, slug: 'libro-2', titulo: 'libro 2' },
  ],
};

beforeEach(() => getColeccion.mockReset());

describe('useColeccionViewModel (HU-04)', () => {
  it('pide la colección por slug y expone sus obras, iniciales y total', async () => {
    getColeccion.mockResolvedValue(DETALLE);
    const { result } = renderHook(() => useColeccionViewModel('libros'));

    expect(result.current.obrasCargadas).toBe(false);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getColeccion).toHaveBeenCalledWith('libros', expect.anything());
    expect(result.current.coleccion.nombre).toBe('La historia de un libro');
    expect(result.current.obras).toHaveLength(2);
    expect(result.current.obrasCargadas).toBe(true);
    expect(result.current.totalTexto).toBe('2 obras');
    expect(result.current.iniciales).toBe('RH');
  });

  it('mientras carga muestra los datos que venían de la lista', () => {
    getColeccion.mockReturnValue(new Promise(() => {}));
    const previa = { ...DETALLE, obras: [], totalObras: 5 };
    const { result } = renderHook(() => useColeccionViewModel('libros', previa));

    expect(result.current.coleccion.nombre).toBe('La historia de un libro');
    expect(result.current.obras).toEqual([]);
    expect(result.current.totalTexto).toBe('5 obras');
    expect(result.current.sinDatos).toBe(false);
  });

  it('marca noEncontrado cuando la API responde 404', async () => {
    getColeccion.mockRejectedValue(new ApiError('No encontramos lo que buscabas.', 404));
    const { result } = renderHook(() => useColeccionViewModel('no-existe'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.noEncontrado).toBe(true);
    expect(result.current.sinDatos).toBe(true);
  });

  it('si falla la conexión permite reintentar', async () => {
    getColeccion.mockRejectedValueOnce(new ApiError('Sin conexión', 0)).mockResolvedValue(DETALLE);
    const { result } = renderHook(() => useColeccionViewModel('libros'));

    await waitFor(() => expect(result.current.error).toBe('Sin conexión'));
    expect(result.current.noEncontrado).toBe(false);

    await act(async () => {
      await result.current.reload();
    });
    expect(result.current.error).toBeNull();
    expect(result.current.obras).toHaveLength(2);
  });
});
