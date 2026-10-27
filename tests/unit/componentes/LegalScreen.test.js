import { fireEvent, render, screen } from '@testing-library/react-native';
import { LegalScreen } from '../../../src/views/screens/common/LegalScreen';

function montar(tipo) {
  const navigation = { goBack: jest.fn(), replace: jest.fn() };
  render(<LegalScreen navigation={navigation} route={{ params: { tipo } }} />);
  return navigation;
}

describe('LegalScreen', () => {
  it('muestra los Términos de la web con su índice y sus secciones', () => {
    montar('terminos');
    expect(screen.getByText('Términos y Condiciones')).toBeTruthy();
    expect(screen.getByText('Versión 1.0')).toBeTruthy();
    expect(screen.getByTestId('legal-indice')).toBeTruthy();
    expect(screen.getByTestId('legal-seccion-devoluciones')).toBeTruthy();
    // El título aparece dos veces: en el índice y como encabezado de la sección.
    expect(screen.getAllByText('7. Política de devoluciones y reembolsos')).toHaveLength(2);
  });

  it('dibuja recuadros, tablas y negritas del Aviso de Privacidad', () => {
    montar('privacidad');
    expect(screen.getByText('Aviso de Privacidad')).toBeTruthy();
    expect(screen.getAllByText('IMPORTANTE:').length).toBeGreaterThan(0);
    expect(screen.getAllByText('DATOS ESPECÍFICOS').length).toBeGreaterThan(0);
    expect(screen.getByText('¿Dudas sobre privacidad?')).toBeTruthy();
  });

  it('el índice es tocable y el botón final abre el otro documento', () => {
    const navigation = montar('terminos');
    fireEvent.press(screen.getByTestId('legal-ir-contacto'));
    fireEvent.press(screen.getByTestId('legal-otro'));
    expect(navigation.replace).toHaveBeenCalledWith('Legal', { tipo: 'privacidad' });
    fireEvent.press(screen.getByTestId('legal-regresar'));
    expect(navigation.goBack).toHaveBeenCalled();
  });

  it('si el tipo no existe muestra los Términos', () => {
    montar('otro');
    expect(screen.getByText('Términos y Condiciones')).toBeTruthy();
  });
});
