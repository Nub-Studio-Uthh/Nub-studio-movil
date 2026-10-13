import { fireEvent, render, screen } from '@testing-library/react-native';
import { ObraCard } from '../../../src/components/obra/ObraCard';

const obra = {
  id: 7,
  slug: 'huapango-en-rojo',
  titulo: 'Huapango en rojo',
  imagen: 'https://res.cloudinary.com/demo/image/upload/v1/rojo.jpg',
  artista: 'Rosa Hernández',
  categoria: 'Pintura',
  precio: 2300,
  precioOferta: 1850,
  destacada: true,
};

describe('ObraCard (HU-01)', () => {
  it('muestra título, artista, precio de oferta y el precio anterior', () => {
    render(<ObraCard obra={obra} testID="obra-card-0" />);
    expect(screen.getByText('Huapango en rojo')).toBeTruthy();
    expect(screen.getByText('Rosa Hernández')).toBeTruthy();
    expect(screen.getByText('$1,850')).toBeTruthy();
    expect(screen.getByText('$2,300')).toBeTruthy();
    // Con oferta, la etiqueta es "Oferta" aunque también sea destacada.
    expect(screen.getByText('OFERTA')).toBeTruthy();
  });

  it('muestra "Destacada" y un solo precio si no hay oferta', () => {
    render(<ObraCard obra={{ ...obra, precioOferta: null }} />);
    expect(screen.getByText('DESTACADA')).toBeTruthy();
    expect(screen.getByText('$2,300')).toBeTruthy();
    expect(screen.queryByText('$1,850')).toBeNull();
  });

  it('describe la obra para el lector de pantalla y avisa al tocarla', () => {
    const onPress = jest.fn();
    render(<ObraCard obra={obra} onPress={onPress} testID="obra-card-0" />);
    const card = screen.getByTestId('obra-card-0');
    expect(card.props.accessibilityLabel).toBe('Huapango en rojo, de Rosa Hernández, $1,850 MXN');
    fireEvent.press(card);
    expect(onPress).toHaveBeenCalledWith(obra);
  });

  it('no carga imágenes que no sean https', () => {
    render(<ObraCard obra={{ ...obra, imagen: 'http://inseguro.com/a.jpg' }} />);
    expect(screen.queryByTestId('imagen')).toBeNull();
  });
});
