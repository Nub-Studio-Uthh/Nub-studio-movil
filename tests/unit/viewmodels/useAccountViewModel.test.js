import { renderHook } from '@testing-library/react-native';
import { useAccountViewModel } from '../../../src/viewmodels/useAccountViewModel';
import { useAuth } from '../../../src/models/AuthContext';

jest.mock('../../../src/models/AuthContext', () => ({ useAuth: jest.fn() }));

describe('useAccountViewModel', () => {
  it('trata como visitante a quien no tiene sesión', () => {
    useAuth.mockReturnValue({ status: 'guest', usuario: null, signOut: jest.fn() });
    const { result } = renderHook(() => useAccountViewModel());
    expect(result.current.autenticado).toBe(false);
    expect(result.current.iniciales).toBe('?');
  });

  it('entrega nombre, correo e iniciales de la sesión', () => {
    const signOut = jest.fn();
    useAuth.mockReturnValue({
      status: 'authenticated',
      usuario: { nombre: 'Ana López Ruiz', email: 'ana@correo.com' },
      signOut,
    });
    const { result } = renderHook(() => useAccountViewModel());

    expect(result.current).toMatchObject({
      autenticado: true,
      nombre: 'Ana López Ruiz',
      correo: 'ana@correo.com',
      iniciales: 'AL',
    });
    expect(result.current.cerrarSesion).toBe(signOut);
  });
});
