import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { DetalleObraScreen } from '../../../src/views/screens/catalog/DetalleObraScreen';
import { getObra } from '../../../src/models/obraService';
import { useAuth } from '../../../src/models/AuthContext';
import { agregarFavorito, esFavorito } from '../../../src/models/favoritoService';
import { ApiError } from '../../../src/models/api';

jest.mock('../../../src/models/obraService', () => ({ getObra: jest.fn() }));
jest.mock('../../../src/models/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../../src/models/favoritoService', () => ({
  agregarFavorito: jest.fn(),
  esFavorito: jest.fn(),
  quitarFavorito: jest.fn(),
}));

const OBRA = {
  id: 7,
  titulo: 'Danza de la cosecha',
  descripcion: 'Óleo sobre tela.',
  precio: 2300,
  imagenes: [],
  etiquetas: [],
  historia: '',
  anio: 2024,
  dimensiones: '',
  permiteMarco: false,
  conCertificado: false,
  artista: { id: 22, nombre: 'gus', foto: null },
};

function montar() {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  render(<DetalleObraScreen navigation={navigation} route={{ params: { id: 7 } }} />);
  return navigation;
}

beforeEach(() => {
  jest.clearAllMocks();
  getObra.mockResolvedValue(OBRA);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('Detalle de obra: favorito (HU-07)', () => {
  it('sin sesión, el corazón pide iniciar sesión y regresa a la obra al entrar', async () => {
    useAuth.mockReturnValue({ status: 'guest', token: null, usuario: null });
    const navigation = montar();
    await screen.findByText('Danza de la cosecha');

    fireEvent.press(screen.getByTestId('detalle-favorito'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Inicia sesión',
      expect.any(String),
      expect.arrayContaining([expect.objectContaining({ text: 'Iniciar sesión' })])
    );
    const botones = Alert.alert.mock.calls[0][2];
    botones.find((b) => b.text === 'Iniciar sesión').onPress();
    expect(navigation.navigate).toHaveBeenCalledWith('Login', { regresar: true });
    expect(agregarFavorito).not.toHaveBeenCalled();
  });

  it('con sesión de cliente agrega la obra a favoritos', async () => {
    useAuth.mockReturnValue({ status: 'authenticated', token: 'tk', usuario: { rol: 'cliente' } });
    esFavorito.mockResolvedValue(false);
    agregarFavorito.mockResolvedValue(true);
    montar();
    await screen.findByText('Danza de la cosecha');
    await waitFor(() => expect(esFavorito).toHaveBeenCalled());

    fireEvent.press(screen.getByTestId('detalle-favorito'));
    await waitFor(() => expect(agregarFavorito).toHaveBeenCalledWith('tk', 7));
    await waitFor(() => expect(screen.getByLabelText('Quitar de favoritos')).toBeTruthy());
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('si falla al guardar lo avisa', async () => {
    useAuth.mockReturnValue({ status: 'authenticated', token: 'tk', usuario: { rol: 'cliente' } });
    esFavorito.mockResolvedValue(false);
    agregarFavorito.mockRejectedValue(new ApiError('Sin conexión', 0));
    montar();
    await screen.findByText('Danza de la cosecha');
    await waitFor(() => expect(esFavorito).toHaveBeenCalled());

    fireEvent.press(screen.getByTestId('detalle-favorito'));
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        'No pudimos actualizar tus favoritos',
        'Sin conexión'
      )
    );
    expect(screen.getByLabelText('Agregar a favoritos')).toBeTruthy();
  });
});
