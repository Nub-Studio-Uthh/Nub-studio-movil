import { render, screen } from '@testing-library/react-native';
import { LoginScreen } from '../../../src/views/screens/auth/LoginScreen';
import { useAuth } from '../../../src/models/AuthContext';

jest.mock('../../../src/models/AuthContext', () => ({ useAuth: jest.fn() }));

const navigation = { navigate: jest.fn(), reset: jest.fn(), canGoBack: jest.fn() };

beforeEach(() => useAuth.mockReturnValue({ signIn: jest.fn() }));

describe('LoginScreen: sesión vencida', () => {
  it('explica por qué se pide iniciar sesión de nuevo', () => {
    render(<LoginScreen navigation={navigation} route={{ params: { sesionVencida: true } }} />);
    expect(screen.getByTestId('login-sesion-vencida')).toBeTruthy();
  });

  it('no muestra el aviso en un inicio de sesión normal', () => {
    render(<LoginScreen navigation={navigation} route={{}} />);
    expect(screen.queryByTestId('login-sesion-vencida')).toBeNull();
  });
});
