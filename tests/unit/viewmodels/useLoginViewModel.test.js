import { act, renderHook } from '@testing-library/react-native';
import { useLoginViewModel } from '../../../src/viewmodels/useLoginViewModel';

const mockSignIn = jest.fn();
jest.mock('../../../src/models/AuthContext', () => ({ useAuth: () => ({ signIn: mockSignIn }) }));

const llenar = (result, correo, contrasena) =>
  act(() => {
    result.current.cambiar('correo')(correo);
    result.current.cambiar('contrasena')(contrasena);
  });

describe('useLoginViewModel', () => {
  beforeEach(() => jest.clearAllMocks());

  it('usa el correo que llega por ruta', () => {
    const { result } = renderHook(() => useLoginViewModel('ana@correo.com'));
    expect(result.current.form.correo).toBe('ana@correo.com');
    expect(result.current.puedeEnviar).toBe(false);
  });

  it('no llama a la API si el formulario no es válido', async () => {
    const { result } = renderHook(() => useLoginViewModel());
    llenar(result, 'no-es-correo', 'x');

    let r;
    await act(async () => {
      r = await result.current.ingresar();
    });
    expect(r).toBeNull();
    expect(result.current.errores.correo).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('devuelve ok cuando inicia sesión', async () => {
    mockSignIn.mockResolvedValue();
    const { result } = renderHook(() => useLoginViewModel());
    llenar(result, 'ana@correo.com', 'Secreta1!');

    let r;
    await act(async () => {
      r = await result.current.ingresar();
    });
    expect(r).toEqual({ resultado: 'ok' });
  });

  it('pide verificar el correo si la cuenta no está verificada', async () => {
    mockSignIn.mockRejectedValue(
      Object.assign(new Error('Verifica tu correo'), { data: { requiresVerification: true } })
    );
    const { result } = renderHook(() => useLoginViewModel());
    llenar(result, ' ana@correo.com ', 'Secreta1!');

    let r;
    await act(async () => {
      r = await result.current.ingresar();
    });
    expect(r).toEqual({ resultado: 'verificar', correo: 'ana@correo.com' });
    expect(result.current.enviando).toBe(false);
  });

  it('muestra el error del servidor', async () => {
    mockSignIn.mockRejectedValue(new Error('Credenciales incorrectas'));
    const { result } = renderHook(() => useLoginViewModel());
    llenar(result, 'ana@correo.com', 'mala');

    await act(() => result.current.ingresar());
    expect(result.current.errorGeneral).toBe('Credenciales incorrectas');
    expect(result.current.enviando).toBe(false);
  });
});
