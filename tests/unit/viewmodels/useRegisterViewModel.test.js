import { act, renderHook } from '@testing-library/react-native';
import { useRegisterViewModel } from '../../../src/viewmodels/useRegisterViewModel';
import { useAuth } from '../../../src/models/AuthContext';
import { ApiError } from '../../../src/models/api';

jest.mock('../../../src/models/AuthContext', () => ({ useAuth: jest.fn() }));

const signUp = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ signUp });
});

/** Llena el formulario con datos válidos. */
function llenar(result) {
  act(() => {
    result.current.cambiar('nombre')('Ana López');
    result.current.cambiar('correo')('ana@mail.com');
    result.current.cambiar('contrasena')('Secreta1!');
    result.current.cambiar('confirmacion')('Secreta1!');
  });
  act(() => result.current.toggleTerminos());
}

async function enviar(result) {
  let respuesta;
  await act(async () => {
    respuesta = await result.current.registrar();
  });
  return respuesta;
}

describe('useRegisterViewModel (HU-06)', () => {
  it('empieza con el formulario vacío y sin errores', () => {
    const { result } = renderHook(() => useRegisterViewModel());
    expect(result.current.form).toEqual({
      nombre: '',
      correo: '',
      contrasena: '',
      confirmacion: '',
      aceptaTerminos: false,
    });
    expect(result.current.errores).toEqual({});
    expect(result.current.enviando).toBe(false);
  });

  it('con el formulario vacío marca los errores y no llama a signUp', async () => {
    const { result } = renderHook(() => useRegisterViewModel());
    expect(await enviar(result)).toBeNull();
    expect(signUp).not.toHaveBeenCalled();
    expect(result.current.errores).toEqual(
      expect.objectContaining({
        nombre: 'Este campo es obligatorio',
        correo: 'Ingresa un correo válido',
        terminos: 'Debes aceptar los términos y condiciones',
      })
    );
  });

  it('al escribir en un campo se borra su error', async () => {
    const { result } = renderHook(() => useRegisterViewModel());
    await enviar(result);
    act(() => result.current.cambiar('nombre')('Ana'));
    expect(result.current.errores.nombre).toBeUndefined();
    expect(result.current.errores.correo).toBeDefined();
  });

  it('toggleTerminos alterna la casilla de términos', () => {
    const { result } = renderHook(() => useRegisterViewModel());
    act(() => result.current.toggleTerminos());
    expect(result.current.form.aceptaTerminos).toBe(true);
    act(() => result.current.toggleTerminos());
    expect(result.current.form.aceptaTerminos).toBe(false);
  });

  it('con datos válidos crea la cuenta y regresa el correo para verificarlo', async () => {
    signUp.mockResolvedValue({ correo: 'ana@mail.com' });
    const { result } = renderHook(() => useRegisterViewModel());
    llenar(result);

    expect(await enviar(result)).toBe('ana@mail.com');
    expect(signUp).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Ana López', correo: 'ana@mail.com', aceptaTerminos: true })
    );
    expect(result.current.errores).toEqual({});
    expect(result.current.enviando).toBe(false);
  });

  it('si el correo ya está registrado (409) lo marca en el campo correo', async () => {
    signUp.mockRejectedValue(new ApiError('Este correo ya está registrado.', 409));
    const { result } = renderHook(() => useRegisterViewModel());
    llenar(result);

    expect(await enviar(result)).toBeNull();
    expect(result.current.errores).toEqual({ correo: 'Este correo ya está registrado.' });
    expect(result.current.errorGeneral).toBeNull();
    expect(result.current.enviando).toBe(false);
  });

  it('otros errores se muestran como error general y se borran al escribir', async () => {
    signUp.mockRejectedValue(new ApiError('Sin conexión', 0));
    const { result } = renderHook(() => useRegisterViewModel());
    llenar(result);

    expect(await enviar(result)).toBeNull();
    expect(result.current.errorGeneral).toBe('Sin conexión');

    act(() => result.current.cambiar('correo')('otra@mail.com'));
    expect(result.current.errorGeneral).toBeNull();
  });
});
