import { act, renderHook, waitFor } from '@testing-library/react-native';
import { usePersonalDataViewModel } from '../../../src/viewmodels/usePersonalDataViewModel';
import { useAuth } from '../../../src/models/AuthContext';
import { actualizarPerfil, getPerfil } from '../../../src/models/perfilService';

jest.mock('../../../src/models/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../../src/models/perfilService', () => ({
  getPerfil: jest.fn(),
  actualizarPerfil: jest.fn(),
}));

const PERFIL = {
  nombre: 'Ana López',
  correo: 'ana@correo.mx',
  telefono: '',
  aceptaMarketing: false,
};
const actualizarUsuario = jest.fn();

const sesion = (usuario = { nombre: 'Ana López', rol: 'cliente' }) =>
  useAuth.mockReturnValue({
    status: 'authenticated',
    token: 'tkn',
    usuario,
    actualizarUsuario,
  });

async function montar() {
  const hook = renderHook(() => usePersonalDataViewModel());
  await waitFor(() => expect(hook.result.current.form.nombre).toBe('Ana López'));
  return hook;
}

beforeEach(() => {
  jest.clearAllMocks();
  sesion();
  getPerfil.mockResolvedValue(PERFIL);
  actualizarPerfil.mockResolvedValue(PERFIL);
  actualizarUsuario.mockResolvedValue(undefined);
});

describe('usePersonalDataViewModel', () => {
  it('carga los datos reales del backend', async () => {
    const { result } = await montar();
    expect(getPerfil).toHaveBeenCalledWith('tkn', expect.anything());
    expect(result.current.vista).toBe('formulario');
    expect(result.current.correo).toBe('ana@correo.mx');
    expect(result.current.aceptaMarketing).toBe(false);
    expect(result.current.hayCambios).toBe(false);
  });

  it('si falla muestra el error y Reintentar recupera los datos', async () => {
    getPerfil.mockRejectedValueOnce(Object.assign(new Error('Sin conexión'), { status: 0 }));
    const { result } = renderHook(() => usePersonalDataViewModel());
    await waitFor(() => expect(result.current.vista).toBe('error'));
    expect(result.current.error).toBe('Sin conexión');
    await act(async () => {
      await result.current.reload();
    });
    expect(result.current.vista).toBe('formulario');
    expect(result.current.form.nombre).toBe('Ana López');
  });

  it('con 401 pide iniciar sesión de nuevo', async () => {
    getPerfil.mockRejectedValue(Object.assign(new Error('Sesión'), { status: 401 }));
    const { result } = renderHook(() => usePersonalDataViewModel());
    await waitFor(() => expect(result.current.vista).toBe('sesion-vencida'));
  });

  it('sin sesión no consulta el backend', () => {
    useAuth.mockReturnValue({ status: 'guest', token: null, usuario: null });
    const { result } = renderHook(() => usePersonalDataViewModel());
    expect(result.current.vista).toBe('sesion-vencida');
    expect(getPerfil).not.toHaveBeenCalled();
  });

  it('un artista solo ve los datos de su sesión', () => {
    sesion({ nombre: 'Luz', correo: 'luz@correo.mx', rol: 'artista' });
    const { result } = renderHook(() => usePersonalDataViewModel());
    expect(result.current.vista).toBe('solo-lectura');
    expect(result.current.nombreSesion).toBe('Luz');
    expect(getPerfil).not.toHaveBeenCalled();
  });

  it('valida antes de guardar y limpia el error al escribir', async () => {
    const { result } = await montar();
    act(() => result.current.cambiar('telefono')('123'));
    await act(async () => {
      await result.current.guardar();
    });
    expect(result.current.errores.telefono).toBe('Escribe 10 números');
    expect(actualizarPerfil).not.toHaveBeenCalled();
    act(() => result.current.cambiar('telefono')('1234'));
    expect(result.current.errores.telefono).toBeUndefined();
  });

  it('guarda solo lo que cambió y actualiza el nombre de la sesión', async () => {
    actualizarPerfil.mockResolvedValue({ ...PERFIL, nombre: 'Ana Ruiz' });
    const { result } = await montar();
    act(() => result.current.cambiar('nombre')('  Ana Ruiz '));
    expect(result.current.hayCambios).toBe(true);
    await act(async () => {
      await result.current.guardar();
    });
    expect(actualizarPerfil).toHaveBeenCalledWith('tkn', { nombre: 'Ana Ruiz' });
    expect(actualizarUsuario).toHaveBeenCalledWith({ nombre: 'Ana Ruiz' });
    expect(result.current.form.nombre).toBe('Ana Ruiz');
    expect(result.current.guardado).toBe(true);
    expect(result.current.hayCambios).toBe(false);
  });

  it('cambiar solo el teléfono no toca los datos de la sesión', async () => {
    actualizarPerfil.mockResolvedValue({ ...PERFIL, telefono: '7711234567' });
    const { result } = await montar();
    act(() => result.current.cambiar('telefono')('7711234567'));
    await act(async () => {
      await result.current.guardar();
    });
    expect(actualizarPerfil).toHaveBeenCalledWith('tkn', { telefono: '7711234567' });
    expect(actualizarUsuario).not.toHaveBeenCalled();
  });

  it('si falla al guardar conserva lo escrito', async () => {
    actualizarPerfil.mockRejectedValue(new Error('El servidor tuvo un problema.'));
    const { result } = await montar();
    act(() => result.current.cambiar('nombre')('Ana Ruiz'));
    await act(async () => {
      await result.current.guardar();
    });
    expect(result.current.errorGuardar).toBe('El servidor tuvo un problema.');
    expect(result.current.form.nombre).toBe('Ana Ruiz');
    expect(result.current.guardado).toBe(false);
    expect(result.current.guardando).toBe(false);
  });

  it('enciende el marketing solo cuando la persona mueve el switch', async () => {
    const { result } = await montar();
    expect(actualizarPerfil).not.toHaveBeenCalled();
    await act(async () => {
      await result.current.cambiarMarketing(true);
    });
    expect(actualizarPerfil).toHaveBeenCalledWith('tkn', { aceptaMarketing: true });
    expect(result.current.aceptaMarketing).toBe(true);
  });

  it('si falla el marketing regresa como estaba y avisa', async () => {
    actualizarPerfil.mockRejectedValue(new Error('Sin conexión'));
    const { result } = await montar();
    await act(async () => {
      await result.current.cambiarMarketing(true);
    });
    expect(result.current.aceptaMarketing).toBe(false);
    expect(result.current.errorMarketing).toBe('Sin conexión');
    expect(result.current.cambiandoMarketing).toBe(false);
  });

  it('cambiar el switch no borra lo que se está escribiendo', async () => {
    const { result } = await montar();
    act(() => result.current.cambiar('nombre')('Ana Ruiz'));
    await act(async () => {
      await result.current.cambiarMarketing(true);
    });
    expect(result.current.form.nombre).toBe('Ana Ruiz');
  });
});
