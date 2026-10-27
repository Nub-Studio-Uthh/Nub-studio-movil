import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { PostScreen } from '../../../src/views/screens/blog/PostScreen';
import { getPost } from '../../../src/models/blogService';
import { ApiError } from '../../../src/models/api';
import { useAuth } from '../../../src/models/AuthContext';
import { crearComentario, getComentarios } from '../../../src/models/comentarioService';

jest.mock('../../../src/models/blogService', () => ({ getPost: jest.fn() }));
jest.mock('../../../src/models/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../../src/models/comentarioService', () => ({
  getComentarios: jest.fn(),
  crearComentario: jest.fn(),
  eliminarComentario: jest.fn(),
}));

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

beforeEach(() => {
  jest.clearAllMocks();
  getPost.mockReset();
  useAuth.mockReturnValue({ status: 'guest', token: null, usuario: null });
  getComentarios.mockResolvedValue([]);
});

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

  it('muestra los comentarios y sin sesión invita a iniciar sesión para comentar', async () => {
    getPost.mockResolvedValue(completo);
    getComentarios.mockResolvedValue([
      {
        id: 1,
        idUsuario: 3,
        nivel: 0,
        contenido: 'Hermosa tradición',
        autor: 'Ana López',
        esArtista: false,
        fecha: null,
        respuestas: [],
      },
    ]);
    const navigation = montar();

    expect(await screen.findByText('Hermosa tradición')).toBeTruthy();
    expect(screen.getByText('1 comentario')).toBeTruthy();
    expect(screen.queryByTestId('comentarios-input')).toBeNull();
    fireEvent.press(screen.getByTestId('comentarios-iniciar-sesion'));
    expect(navigation.navigate).toHaveBeenCalledWith('Login', { regresar: true });
  });

  it('con sesión publica un comentario y avisa "Comentario publicado"', async () => {
    useAuth.mockReturnValue({ status: 'authenticated', token: 'tk', usuario: { rol: 'cliente' } });
    crearComentario.mockResolvedValue({ id: 2, pendiente: false });
    getPost.mockResolvedValue(completo);
    montar();

    fireEvent.changeText(await screen.findByTestId('comentarios-input'), 'Me encantó');
    fireEvent.press(screen.getByTestId('comentarios-enviar'));

    expect(await screen.findByText('Comentario publicado')).toBeTruthy();
    expect(crearComentario).toHaveBeenCalledWith('tk', 7, 'Me encantó', null);
  });

  it('al tocar "Responder" la barra indica a quién se responde y envía la respuesta', async () => {
    useAuth.mockReturnValue({ status: 'authenticated', token: 'tk', usuario: { rol: 'cliente' } });
    crearComentario.mockResolvedValue({ id: 9, pendiente: false });
    getPost.mockResolvedValue(completo);
    getComentarios.mockResolvedValue([
      {
        id: 1,
        idUsuario: 3,
        nivel: 0,
        contenido: 'Hermosa tradición',
        autor: 'Ana López',
        esArtista: false,
        fecha: null,
        respuestas: [],
      },
    ]);
    montar();

    fireEvent.press(await screen.findByTestId('responder-1'));
    expect(
      within(screen.getByTestId('comentarios-respondiendo')).getByText('Ana López', {
        exact: false,
      })
    ).toBeTruthy();

    fireEvent.changeText(screen.getByTestId('comentarios-input'), 'Gracias, Ana');
    fireEvent.press(screen.getByTestId('comentarios-enviar'));
    expect(await screen.findByText('Comentario publicado')).toBeTruthy();
    expect(crearComentario).toHaveBeenCalledWith('tk', 7, 'Gracias, Ana', 1);
    expect(screen.queryByTestId('comentarios-respondiendo')).toBeNull();
  });
});
