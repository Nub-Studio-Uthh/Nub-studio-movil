import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { VerifyEmailScreen } from '../../../src/views/screens/auth/VerifyEmailScreen';
import { reenviarCodigo, verificarCorreo } from '../../../src/models/authService';
import { ApiError } from '../../../src/models/api';

jest.mock('../../../src/models/authService', () => ({
  verificarCorreo: jest.fn(),
  reenviarCodigo: jest.fn(),
}));

const CORREO = 'ana@mail.com';

function montar() {
  const navigation = { reset: jest.fn(), goBack: jest.fn() };
  render(<VerifyEmailScreen navigation={navigation} route={{ params: { correo: CORREO } }} />);
  return navigation;
}

const campo = () => screen.getByTestId('verificar-codigo');
const deshabilitado = () =>
  screen.getByTestId('verificar-enviar').props.accessibilityState.disabled;

beforeEach(() => jest.clearAllMocks());

describe('VerifyEmailScreen (HU-06)', () => {
  it('dice a qué correo se mandó el código', () => {
    montar();
    expect(screen.getByText(`Enviamos un código de 6 dígitos a ${CORREO}`)).toBeTruthy();
  });

  it('solo acepta dígitos y activa "Verificar" con los 6', () => {
    montar();
    expect(deshabilitado()).toBe(true);

    fireEvent.changeText(campo(), '12a-34');
    expect(campo().props.value).toBe('1234');
    expect(deshabilitado()).toBe(true);

    fireEvent.changeText(campo(), '123456');
    expect(deshabilitado()).toBe(false);
  });

  it('con el código correcto lleva a iniciar sesión con el correo ya escrito', async () => {
    verificarCorreo.mockResolvedValue();
    const navigation = montar();
    fireEvent.changeText(campo(), '123456');
    fireEvent.press(screen.getByTestId('verificar-enviar'));

    await waitFor(() =>
      expect(navigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'Login', params: { correo: CORREO, verificado: true } }],
      })
    );
    expect(verificarCorreo).toHaveBeenCalledWith({ correo: CORREO, codigo: '123456' });
  });

  it('con un código incorrecto muestra el error y se queda en la pantalla', async () => {
    verificarCorreo.mockRejectedValue(new ApiError('Código incorrecto', 400));
    const navigation = montar();
    fireEvent.changeText(campo(), '000000');
    fireEvent.press(screen.getByTestId('verificar-enviar'));

    expect(await screen.findByTestId('verificar-error')).toHaveTextContent('Código incorrecto');
    expect(navigation.reset).not.toHaveBeenCalled();

    // Al escribir de nuevo se quita el error.
    fireEvent.changeText(campo(), '00000');
    expect(screen.queryByTestId('verificar-error')).toBeNull();
  });

  it('"Reenviar código" manda uno nuevo y lo avisa', async () => {
    reenviarCodigo.mockResolvedValue();
    montar();
    fireEvent.press(screen.getByTestId('verificar-reenviar'));

    expect(await screen.findByText('Te enviamos un código nuevo.')).toBeTruthy();
    expect(reenviarCodigo).toHaveBeenCalledWith(CORREO);
  });

  it('si no se pudo reenviar muestra el motivo', async () => {
    reenviarCodigo.mockRejectedValue(new ApiError('Intenta más tarde', 500));
    montar();
    fireEvent.press(screen.getByTestId('verificar-reenviar'));

    expect(await screen.findByTestId('verificar-error')).toHaveTextContent('Intenta más tarde');
  });
});
