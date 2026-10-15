import { fireEvent, render, screen } from '@testing-library/react-native';
import { PostScreen } from '../../../src/views/screens/blog/PostScreen';
import { getPost } from '../../../src/models/blogService';
import { ApiError } from '../../../src/models/api';

jest.mock('../../../src/models/blogService', () => ({ getPost: jest.fn() }));

const palabras = (n) => Array.from({ length: n }, () => 'huapango').join(' ');

const completo = {
  id: 7,
  slug: 'el-xantolo',
  titulo: 'El Xantolo: la fiesta que une a vivos y muertos',
  extracto: '',
  imagen: null,
  categoria: 'Tradiciones',
  autor: 'Equipo NU-B Studio',
  autorFoto: null,
  fecha: new Date(2026, 8, 20),
  comentarios: 0,
  contenido:
    `<h2>Origen</h2><p>El Xantolo es la celebración de <b>Día de Muertos</b>. ${palabras(400)}</p>` +
    '<img src="https://res.cloudinary.com/demo/image/upload/v1/arco.jpg" alt="Arco de cempasúchil en Huejutla.">',
  etiquetas: [],
};

function montar(params = { slug: 'el-xantolo' }) {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  render(<PostScreen navigation={navigation} route={{ params }} />);
  return navigation;
}

beforeEach(() => getPost.mockReset());

describe('PostScreen (HU-05)', () => {
  it('abre la publicación en su propia pantalla con su texto e imágenes', async () => {
    getPost.mockResolvedValue(completo);
    montar();

    expect(await screen.findByText('Origen')).toBeTruthy();
    expect(getPost).toHaveBeenCalledWith('el-xantolo', expect.anything());
    expect(screen.getByTestId('post-titulo').props.children).toBe(completo.titulo);
    expect(screen.getByText('TRADICIONES')).toBeTruthy();
    expect(screen.getByText('Equipo NU-B Studio')).toBeTruthy();
    expect(screen.getByText('ES')).toBeTruthy();
    expect(screen.getByTestId('post-meta').props.children).toBe('20 sep 2026 · 2 min');
    expect(screen.getByText('Día de Muertos')).toBeTruthy();
    expect(screen.getByTestId('post-imagen-2')).toBeTruthy();
    expect(screen.getByText('Arco de cempasúchil en Huejutla.')).toBeTruthy();
  });

  it('mientras carga muestra el título que ya venía de la lista', async () => {
    let resolver;
    getPost.mockReturnValue(new Promise((r) => (resolver = r)));
    montar({ slug: 'el-xantolo', post: { ...completo, contenido: null } });

    expect(screen.getByTestId('post-titulo').props.children).toBe(completo.titulo);
    resolver(completo);
    expect(await screen.findByText('Origen')).toBeTruthy();
  });

  it('si la publicación ya no existe lo explica y permite volver al blog', async () => {
    getPost.mockRejectedValue(new ApiError('No encontramos lo que buscabas.', 404));
    const navigation = montar();

    expect(await screen.findByText('Esta publicación ya no está disponible')).toBeTruthy();
    fireEvent.press(screen.getByTestId('post-no-encontrado-accion'));
    expect(navigation.goBack).toHaveBeenCalled();
  });

  it('si falla la conexión permite reintentar', async () => {
    getPost.mockRejectedValueOnce(new ApiError('No pudimos conectar con el servidor.', 0));
    montar();
    expect(await screen.findByText('No pudimos cargar la publicación')).toBeTruthy();

    getPost.mockResolvedValue(completo);
    fireEvent.press(screen.getByTestId('estado-error-accion'));
    expect(await screen.findByText('Origen')).toBeTruthy();
  });
});
