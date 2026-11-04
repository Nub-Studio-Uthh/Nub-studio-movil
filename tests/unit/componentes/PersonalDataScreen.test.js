import { fireEvent, render, screen } from '@testing-library/react-native';
import { PersonalDataScreen } from '../../../src/views/screens/profile/PersonalDataScreen';
import { usePersonalDataViewModel } from '../../../src/viewmodels/usePersonalDataViewModel';

jest.mock('../../../src/viewmodels/usePersonalDataViewModel', () => ({
  usePersonalDataViewModel: jest.fn(),
}));

const cambiarNombre = jest.fn();
const vmBase = {
  vista: 'formulario',
  showSkeleton: false,
  esperando: false,
  correo: 'ana@correo.mx',
  aceptaMarketing: false,
  form: { nombre: 'Ana López', telefono: '' },
  errores: {},
  cambiar: jest.fn(() => cambiarNombre),
  guardar: jest.fn(),
  guardando: false,
  guardado: false,
  errorGuardar: null,
  hayCambios: false,
  cambiarMarketing: jest.fn(),
  cambiandoMarketing: false,
  errorMarketing: null,
  reload: jest.fn(),
};

function montar(cambios = {}) {
  usePersonalDataViewModel.mockReturnValue({ ...vmBase, ...cambios });
  const navigation = { goBack: jest.fn(), navigate: jest.fn() };
  render(<PersonalDataScreen navigation={navigation} />);
  return navigation;
}

beforeEach(() => jest.clearAllMocks());

describe('PersonalDataScreen (ARCO)', () => {
  it('muestra los datos, el correo solo como texto y el switch apagado', () => {
    montar();
    expect(screen.getByTestId('datos-nombre').props.value).toBe('Ana López');
    expect(screen.getByTestId('datos-correo')).toHaveTextContent('ana@correo.mx');
    expect(screen.getByTestId('datos-marketing').props.value).toBe(false);
  });

  it('sin cambios no deja guardar', () => {
    montar();
    expect(screen.getByTestId('datos-guardar').props.accessibilityState.disabled).toBe(true);
  });

  it('escribir y guardar llega al ViewModel', () => {
    const guardar = jest.fn();
    montar({ hayCambios: true, guardar });
    fireEvent.changeText(screen.getByTestId('datos-nombre'), 'Ana Ruiz');
    expect(cambiarNombre).toHaveBeenCalledWith('Ana Ruiz');
    fireEvent.press(screen.getByTestId('datos-guardar'));
    expect(guardar).toHaveBeenCalled();
  });

  it('mover el switch llega al ViewModel', () => {
    const cambiarMarketing = jest.fn();
    montar({ cambiarMarketing });
    fireEvent(screen.getByTestId('datos-marketing'), 'valueChange', true);
    expect(cambiarMarketing).toHaveBeenCalledWith(true);
  });

  it('avisa si se guardó y si hubo errores', () => {
    montar({
      guardado: true,
      errorGuardar: 'No se pudo guardar',
      errorMarketing: 'Sin conexión',
      errores: { telefono: 'Escribe 10 números' },
    });
    expect(screen.getByTestId('datos-guardado')).toBeTruthy();
    expect(screen.getByTestId('datos-error')).toHaveTextContent('No se pudo guardar');
    expect(screen.getByTestId('datos-marketing-error')).toHaveTextContent('Sin conexión');
    expect(screen.getByText('Escribe 10 números')).toBeTruthy();
  });

  it('muestra el error de carga con Reintentar', () => {
    const reload = jest.fn();
    montar({ vista: 'error', error: 'Sin conexión', reload });
    expect(screen.getByText('No pudimos cargar tus datos')).toBeTruthy();
    fireEvent.press(screen.getByTestId('estado-error-accion'));
    expect(reload).toHaveBeenCalled();
  });

  it('con la sesión vencida manda a iniciar sesión', () => {
    const navigation = montar({ vista: 'sesion-vencida' });
    fireEvent.press(screen.getByTestId('datos-sesion-vencida-accion'));
    expect(navigation.navigate).toHaveBeenCalledWith('Login', { regresar: true });
  });

  it('artistas y administradores ven sus datos sin formulario', () => {
    montar({ vista: 'solo-lectura', nombreSesion: 'Luz', correoSesion: 'luz@correo.mx' });
    expect(screen.getByTestId('datos-nombre')).toHaveTextContent('Luz');
    expect(screen.queryByTestId('datos-marketing')).toBeNull();
    expect(screen.queryByTestId('datos-guardar')).toBeNull();
  });

  it('mientras carga muestra el skeleton', () => {
    montar({ showSkeleton: true });
    expect(screen.getByLabelText('Cargando tus datos')).toBeTruthy();
    expect(screen.queryByTestId('datos-guardar')).toBeNull();
  });
});
