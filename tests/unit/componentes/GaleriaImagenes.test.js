import { fireEvent, render, screen } from '@testing-library/react-native';
import { Image } from 'expo-image';
import { GaleriaImagenes } from '../../../src/views/components/obra/GaleriaImagenes';

const IMAGENES = [
  'https://res.cloudinary.com/demo/image/upload/v1/frente.jpg',
  'https://res.cloudinary.com/demo/image/upload/v1/detalle.jpg',
];

describe('GaleriaImagenes (#167, memoria de imágenes)', () => {
  beforeEach(() => {
    // La simulación global de expo-image no trae los métodos estáticos.
    Image.clearMemoryCache = jest.fn(() => Promise.resolve(true));
  });

  afterEach(() => {
    delete Image.clearMemoryCache;
  });

  it('guarda las fotos de la galería solo en disco, no en memoria', () => {
    render(<GaleriaImagenes imagenes={IMAGENES} titulo="Huapango" />);
    const fotos = screen.getAllByTestId('imagen');
    expect(fotos.length).toBeGreaterThan(0);
    fotos.forEach((foto) => expect(foto.props.cachePolicy).toBe('disk'));
  });

  it('pide a Cloudinary la foto del tamaño en que se muestra', () => {
    render(<GaleriaImagenes imagenes={IMAGENES} titulo="Huapango" />);
    const [primera] = screen.getAllByTestId('imagen');
    expect(primera.props.source.uri).toMatch(/\/image\/upload\/w_\d+,c_limit,f_auto,q_auto\//);
  });

  it('vacía la caché en memoria al salir de la obra, no antes', () => {
    const { unmount } = render(<GaleriaImagenes imagenes={IMAGENES} titulo="Huapango" />);
    expect(Image.clearMemoryCache).not.toHaveBeenCalled();
    unmount();
    expect(Image.clearMemoryCache).toHaveBeenCalledTimes(1);
  });

  it('no falla si vaciar la caché es rechazado', async () => {
    Image.clearMemoryCache = jest.fn(() => Promise.reject(new Error('sin actividad')));
    const { unmount } = render(<GaleriaImagenes imagenes={IMAGENES} />);
    expect(() => unmount()).not.toThrow();
    await Promise.resolve();
  });

  it('el botón de regreso sigue avisando a la pantalla', () => {
    const onBack = jest.fn();
    render(<GaleriaImagenes imagenes={IMAGENES} onBack={onBack} />);
    fireEvent.press(screen.getByTestId('detalle-regresar'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
