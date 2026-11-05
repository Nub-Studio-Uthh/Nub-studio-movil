import { fireEvent, render, screen } from '@testing-library/react-native';
import { SortSelector } from '../../../src/views/components/catalog/SortSelector';

describe('SortSelector (HU-01)', () => {
  it('se ve como botón "Ordenar: Más recientes" y deja elegir otro orden', () => {
    const onChange = jest.fn();
    render(<SortSelector value="recientes" onChange={onChange} />);

    expect(screen.getByText('Ordenar:')).toBeTruthy();
    expect(screen.getByText('Más recientes')).toBeTruthy();
    expect(screen.getByLabelText('Ordenar por: Más recientes')).toBeTruthy();

    fireEvent.press(screen.getByTestId('ordenar'));
    fireEvent.press(screen.getByTestId('orden-precio_asc'));
    expect(onChange).toHaveBeenCalledWith('precio_asc');
  });

  it('muestra el nombre corto del orden elegido', () => {
    render(<SortSelector value="precio_desc" onChange={jest.fn()} />);
    expect(screen.getByText('Mayor precio')).toBeTruthy();
  });
});
