import { fireEvent, render, screen } from '@testing-library/react-native';
import { AccountScreen } from '../../../src/views/screens/profile/AccountScreen';
import { useAccountViewModel } from '../../../src/viewmodels/useAccountViewModel';

jest.mock('../../../src/viewmodels/useAccountViewModel', () => ({
  useAccountViewModel: jest.fn(),
}));

function montar() {
  const navigation = { navigate: jest.fn() };
  render(<AccountScreen navigation={navigation} />);
  return navigation;
}

beforeEach(() => jest.clearAllMocks());

describe('AccountScreen: aviso de privacidad y términos', () => {
  it('sin sesión se pueden abrir el aviso de privacidad y los términos', () => {
    useAccountViewModel.mockReturnValue({ autenticado: false });
    const navigation = montar();

    fireEvent.press(screen.getByTestId('cuenta-privacidad'));
    expect(navigation.navigate).toHaveBeenCalledWith('Legal', { tipo: 'privacidad' });
    fireEvent.press(screen.getByTestId('cuenta-terminos'));
    expect(navigation.navigate).toHaveBeenCalledWith('Legal', { tipo: 'terminos' });
  });

  it('con sesión también aparecen junto a las opciones de la cuenta', () => {
    useAccountViewModel.mockReturnValue({
      autenticado: true,
      nombre: 'Ana López',
      correo: 'ana@correo.com',
      iniciales: 'AL',
      cerrarSesion: jest.fn(),
    });
    const navigation = montar();

    expect(screen.getByTestId('cuenta-eliminar')).toBeTruthy();
    fireEvent.press(screen.getByTestId('cuenta-privacidad'));
    expect(navigation.navigate).toHaveBeenCalledWith('Legal', { tipo: 'privacidad' });
    expect(screen.getByText('NUB Studio v1.0.0')).toBeTruthy();
  });
});
