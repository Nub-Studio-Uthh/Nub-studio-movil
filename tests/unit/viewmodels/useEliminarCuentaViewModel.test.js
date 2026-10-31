import { act, renderHook } from '@testing-library/react-native';
import { useEliminarCuentaViewModel } from '../../../src/viewmodels/useEliminarCuentaViewModel';
import { useAuth } from '../../../src/models/AuthContext';

jest.mock('../../../src/models/AuthContext', () => ({ useAuth: jest.fn() }));

const eliminarCuenta = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ eliminarCuenta });
});

describe('useEliminarCuentaViewModel', () => {
  it('pide la contraseña antes de llamar al backend', async () => {
    const { result } = renderHook(() => useEliminarCuentaViewModel());
    let ok;
    await act(async () => {
      ok = await result.current.eliminar();
    });
    expect(ok).toBe(false);
    expect(result.current.error).toBe('Escribe tu contraseña para confirmar.');
    expect(eliminarCuenta).not.toHaveBeenCalled();
  });

  it('elimina la cuenta con la contraseña escrita', async () => {
    eliminarCuenta.mockResolvedValue(undefined);
    const { result } = renderHook(() => useEliminarCuentaViewModel());
    act(() => result.current.cambiarContrasena('Huapango.26'));
    let ok;
    await act(async () => {
      ok = await result.current.eliminar();
    });
    expect(ok).toBe(true);
    expect(eliminarCuenta).toHaveBeenCalledWith('Huapango.26');
    expect(result.current.eliminando).toBe(false);
  });

  it('muestra el error del servidor y lo limpia al volver a escribir', async () => {
    eliminarCuenta.mockRejectedValue(new Error('La contraseña no es correcta'));
    const { result } = renderHook(() => useEliminarCuentaViewModel());
    act(() => result.current.cambiarContrasena('otra'));
    await act(async () => {
      await result.current.eliminar();
    });
    expect(result.current.error).toBe('La contraseña no es correcta');
    act(() => result.current.cambiarContrasena('otra2'));
    expect(result.current.error).toBeNull();
  });
});
