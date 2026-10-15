import { act, renderHook } from '@testing-library/react-native';
import { useVerifyEmailViewModel } from '../../../src/viewmodels/useVerifyEmailViewModel';
import { reenviarCodigo, verificarCorreo } from '../../../src/models/authService';

jest.mock('../../../src/models/authService', () => ({
  verificarCorreo: jest.fn(),
  reenviarCodigo: jest.fn(),
}));

const CORREO = 'ana@correo.com';

describe('useVerifyEmailViewModel', () => {
  beforeEach(() => jest.clearAllMocks());

  it('solo acepta dígitos en el código', () => {
    const { result } = renderHook(() => useVerifyEmailViewModel(CORREO));
    act(() => result.current.cambiarCodigo('12a-3 4'));
    expect(result.current.codigo).toBe('1234');
    expect(result.current.puedeVerificar).toBe(false);
  });

  it('no llama a la API con un código incompleto', async () => {
    const { result } = renderHook(() => useVerifyEmailViewModel(CORREO));
    act(() => result.current.cambiarCodigo('123'));

    let ok;
    await act(async () => {
      ok = await result.current.verificar();
    });
    expect(ok).toBe(false);
    expect(result.current.error).toBe('El código tiene 6 dígitos');
    expect(verificarCorreo).not.toHaveBeenCalled();
  });

  it('verifica el correo con el código', async () => {
    verificarCorreo.mockResolvedValue();
    const { result } = renderHook(() => useVerifyEmailViewModel(CORREO));
    act(() => result.current.cambiarCodigo('123456'));

    let ok;
    await act(async () => {
      ok = await result.current.verificar();
    });
    expect(ok).toBe(true);
    expect(verificarCorreo).toHaveBeenCalledWith({ correo: CORREO, codigo: '123456' });
  });

  it('avisa cuando reenvía el código', async () => {
    reenviarCodigo.mockResolvedValue();
    const { result } = renderHook(() => useVerifyEmailViewModel(CORREO));

    await act(() => result.current.reenviar());
    expect(reenviarCodigo).toHaveBeenCalledWith(CORREO);
    expect(result.current.info).toBe('Te enviamos un código nuevo.');
    expect(result.current.reenviando).toBe(false);
  });
});
