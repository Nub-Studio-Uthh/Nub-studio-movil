import { fireEvent, render, screen } from '@testing-library/react-native';
import { FiltersScreen } from '../../../src/screens/catalog/FiltersScreen';
import {
  CatalogFiltersProvider,
  useCatalogFilters,
} from '../../../src/models/CatalogFiltersContext';

jest.mock('../../../src/models/categoriaService', () => ({
  getCategorias: jest.fn(async () => [
    { id: 1, nombre: 'Pintura', slug: 'pintura', total: 10 },
    { id: 2, nombre: 'Textil', slug: 'textil', total: 5 },
  ]),
}));
jest.mock('../../../src/models/obraService', () => ({
  getObras: jest.fn(async () => ({
    items: [{ precio: 21500 }],
    total: 39,
    page: 1,
    totalPages: 39,
  })),
}));

// Registra los filtros del contexto en cada render para revisar lo que se aplicó.
const espia = jest.fn();
function Espia() {
  espia(useCatalogFilters().filtros);
  return null;
}
const filtrosAplicados = () => espia.mock.calls.at(-1)[0];

function montar() {
  const navigation = { goBack: jest.fn() };
  render(
    <CatalogFiltersProvider>
      <FiltersScreen navigation={navigation} />
      <Espia />
    </CatalogFiltersProvider>
  );
  return navigation;
}

describe('FiltersScreen (HU-01)', () => {
  it('combina categoría y rango de precio y los aplica', async () => {
    const navigation = montar();
    fireEvent.press(await screen.findByText('Pintura'));
    fireEvent.changeText(screen.getByTestId('precio-minimo'), '500');
    fireEvent.changeText(screen.getByTestId('precio-maximo'), '3,000');

    expect(screen.getByText('APLICAR (2)')).toBeTruthy();
    fireEvent.press(screen.getByTestId('aplicar-filtros'));

    expect(navigation.goBack).toHaveBeenCalled();
    expect(filtrosAplicados()).toMatchObject({
      categoria: { id: 1, nombre: 'Pintura' },
      precioMin: 500,
      precioMax: 3000,
    });
  });

  it('no deja aplicar si el máximo es menor que el mínimo', async () => {
    const navigation = montar();
    await screen.findByText('Pintura');
    fireEvent.changeText(screen.getByTestId('precio-minimo'), '3000');
    fireEvent.changeText(screen.getByTestId('precio-maximo'), '500');

    expect(screen.getByTestId('error-precio')).toHaveTextContent(
      'El precio máximo debe ser mayor o igual al mínimo.'
    );
    fireEvent.press(screen.getByTestId('aplicar-filtros'));
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it('"Limpiar" quita la categoría y el precio elegidos', async () => {
    montar();
    fireEvent.press(await screen.findByText('Textil'));
    fireEvent.changeText(screen.getByTestId('precio-maximo'), '1000');
    expect(screen.getByText('APLICAR (2)')).toBeTruthy();

    fireEvent.press(screen.getByTestId('limpiar-filtros'));
    expect(screen.getByText('APLICAR')).toBeTruthy();
    expect(screen.getByTestId('precio-maximo').props.value).toBe('');
  });
});
