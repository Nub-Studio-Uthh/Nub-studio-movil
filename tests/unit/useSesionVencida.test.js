import { renderHook } from '@testing-library/react-native';
import { useSesionVencida } from '../../src/navigation/useSesionVencida';
import { useAuth } from '../../src/models/AuthContext';

jest.mock('../../src/models/AuthContext', () => ({ useAuth: jest.fn() }));

const navegacion = (listo = true) => ({ isReady: () => listo, reset: jest.fn() });

beforeEach(() => jest.clearAllMocks());

describe('useSesionVencida', () => {
  it('lleva a Iniciar sesión con el aviso y limpia las pantallas anteriores', () => {
    useAuth.mockReturnValue({ sesionVencida: true });
    const ref = navegacion();
    renderHook(() => useSesionVencida(ref));
    expect(ref.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Login', params: { sesionVencida: true } }],
    });
  });

  it('no navega si la sesión sigue bien', () => {
    useAuth.mockReturnValue({});
    const ref = navegacion();
    renderHook(() => useSesionVencida(ref));
    expect(ref.reset).not.toHaveBeenCalled();
  });

  it('no navega si la navegación aún no está lista', () => {
    useAuth.mockReturnValue({ sesionVencida: true });
    const ref = navegacion(false);
    renderHook(() => useSesionVencida(ref));
    expect(ref.reset).not.toHaveBeenCalled();
  });

  it('solo navega una vez aunque la pantalla se vuelva a dibujar', () => {
    useAuth.mockReturnValue({ sesionVencida: true });
    const ref = navegacion();
    const { rerender } = renderHook(() => useSesionVencida(ref));
    rerender();
    expect(ref.reset).toHaveBeenCalledTimes(1);
  });
});
