import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useComentariosViewModel } from '../../../src/viewmodels/useComentariosViewModel';
import { useAuth } from '../../../src/models/AuthContext';
import {
  crearComentario,
  eliminarComentario,
  getComentarios,
} from '../../../src/models/comentarioService';
import { ApiError } from '../../../src/models/api';

jest.mock('../../../src/models/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../../src/models/comentarioService', () => ({
  getComentarios: jest.fn(),
  crearComentario: jest.fn(),
  eliminarComentario: jest.fn(),
}));

const CLIENTE = { status: 'authenticated', token: 'tk', usuario: { rol: 'cliente', id: 9 } };
const comentario = (id, extra = {}) => ({
  id,
  idUsuario: 1,
  nivel: 0,
  contenido: `Comentario ${id}`,
  autor: 'Ana',
  respuestas: [],
  ...extra,
});

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue(CLIENTE);
  getComentarios.mockResolvedValue([comentario(1, { respuestas: [comentario(2, { nivel: 1 })] })]);
});

describe('useComentariosViewModel (HU-05)', () => {
  it('carga los comentarios y cuenta también las respuestas', async () => {
    const { result } = renderHook(() => useComentariosViewModel(7));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getComentarios).toHaveBeenCalledWith(7, expect.anything());
    expect(result.current.total).toBe(2);
    expect(result.current.titulo).toBe('2 comentarios');
    expect(result.current.puedeEscribir).toBe(true);
  });

  it('sin sesión se pueden leer pero pide iniciar sesión para escribir', async () => {
    useAuth.mockReturnValue({ status: 'guest', token: null, usuario: null });
    const { result } = renderHook(() => useComentariosViewModel(7));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.requiereSesion).toBe(true);
    expect(result.current.puedeEscribir).toBe(false);
  });

  it('no envía un comentario vacío', async () => {
    const { result } = renderHook(() => useComentariosViewModel(7));
    let r;
    await act(async () => {
      r = await result.current.enviar();
    });
    expect(r).toEqual({ ok: false, error: 'Escribe tu comentario.' });
    expect(crearComentario).not.toHaveBeenCalled();
  });

  it('publica una respuesta, limpia el campo y recarga la lista', async () => {
    crearComentario.mockResolvedValue({ id: 3, pendiente: false });
    const { result } = renderHook(() => useComentariosViewModel(7));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.responder(comentario(1));
      result.current.setTexto('  Gracias por compartir  ');
    });
    let r;
    await act(async () => {
      r = await result.current.enviar();
    });
    expect(crearComentario).toHaveBeenCalledWith('tk', 7, 'Gracias por compartir', 1);
    expect(r).toEqual({ ok: true, pendiente: false });
    expect(result.current.texto).toBe('');
    expect(result.current.respondiendoA).toBeNull();
    expect(getComentarios).toHaveBeenCalledTimes(2);
  });

  it('un comentario con enlaces queda pendiente y no recarga', async () => {
    crearComentario.mockResolvedValue({ id: 4, pendiente: true });
    const { result } = renderHook(() => useComentariosViewModel(7));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.setTexto('Visita www.ejemplo.com'));
    let r;
    await act(async () => {
      r = await result.current.enviar();
    });
    expect(r).toEqual({ ok: true, pendiente: true });
    expect(getComentarios).toHaveBeenCalledTimes(1);
  });

  it('si el backend lo rechaza conserva el texto y regresa el motivo', async () => {
    crearComentario.mockRejectedValue(new ApiError('Contiene palabras no permitidas.', 422));
    const { result } = renderHook(() => useComentariosViewModel(7));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.setTexto('texto'));
    let r;
    await act(async () => {
      r = await result.current.enviar();
    });
    expect(r).toEqual({ ok: false, error: 'Contiene palabras no permitidas.' });
    expect(result.current.texto).toBe('texto');
  });

  it('no deja responder a un comentario del último nivel', async () => {
    const { result } = renderHook(() => useComentariosViewModel(7));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.responder(comentario(8, { nivel: 2 })));
    expect(result.current.respondiendoA).toBeNull();
  });

  it('reconoce los comentarios propios y los borra', async () => {
    eliminarComentario.mockResolvedValue(undefined);
    const { result } = renderHook(() => useComentariosViewModel(7));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.esMio({ idUsuario: 9 })).toBe(true);
    expect(result.current.esMio({ idUsuario: 1 })).toBe(false);

    let error;
    await act(async () => {
      error = await result.current.eliminar(comentario(5));
    });
    expect(eliminarComentario).toHaveBeenCalledWith('tk', 5);
    expect(error).toBeNull();
  });

  it('si falla la carga muestra el error', async () => {
    getComentarios.mockRejectedValue(new ApiError('Sin conexión', 0));
    const { result } = renderHook(() => useComentariosViewModel(7));
    await waitFor(() => expect(result.current.error).toBe('Sin conexión'));
  });

  it('espera a tener el id de la publicación antes de pedir comentarios', () => {
    renderHook(() => useComentariosViewModel(undefined));
    expect(getComentarios).not.toHaveBeenCalled();
  });
});
