import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Heart } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { DETAIL_MARGIN } from '../../../constants/layout';
import { radius, space } from '../../../constants/spacing';
import { useDetalleObraViewModel } from '../../../viewmodels/useDetalleObraViewModel';
import { AccionesObra } from '../../components/obra/AccionesObra';
import { ArtistaCard } from '../../components/obra/ArtistaCard';
import { DetallesObra } from '../../components/obra/DetallesObra';
import { GaleriaImagenes } from '../../components/obra/GaleriaImagenes';
import { InfoObra } from '../../components/obra/InfoObra';
import { ErrorState } from '../../components/states/ErrorState';
import { IconButton } from '../../components/ui/IconButton';
import { Toast } from '../../components/ui/Toast';

// Altura aproximada de la barra de acciones (existencias, "Comprar ahora" y la fila del
// favorito y el carrito, más su relleno), para que el aviso aparezca justo encima de ella.
const ALTO_BARRA = 48 * 2 + 34 + space.md * 4;

/**
 * Detalle de obra (HU-02). Recibe { id } por parámetro de ruta; los datos, el favorito
 * y el carrito vienen de useDetalleObraViewModel y la pantalla se arma con components/obra.
 */
export function DetalleObraScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { id } = route.params ?? {};
  const {
    obra,
    error,
    reload,
    favorito,
    guardandoFavorito,
    requiereSesion,
    puedeGuardarFavoritos,
    toggleFavorito,
    agregandoCarrito,
    puedeComprar,
    agregarCarrito,
    comprando,
    comprarAhora,
    textoExistencias,
    agotada,
    cantidad,
    maximo,
    aumentar,
    disminuir,
  } = useDetalleObraViewModel(id);

  const [toast, setToast] = useState(null);
  const ocultarToast = useCallback(() => setToast(null), []);

  const volver = () => navigation.goBack();
  const irAlArtista = () => navigation.navigate('PerfilArtista', { id: obra.artista.id });

  // Sin sesión se pide iniciar sesión y, al entrar, se regresa a esta obra.
  const pedirSesion = (mensaje) =>
    Alert.alert('Inicia sesión', mensaje, [
      { text: 'Ahora no', style: 'cancel' },
      { text: 'Iniciar sesión', onPress: () => navigation.navigate('Login', { regresar: true }) },
    ]);

  // HU-07
  const onFavorito = async () => {
    if (requiereSesion) {
      pedirSesion('Para guardar obras en tus favoritos necesitas una cuenta.');
      return;
    }
    if (!puedeGuardarFavoritos) {
      Alert.alert('Favoritos', 'Los favoritos están disponibles para cuentas de cliente.');
      return;
    }
    const eraFavorito = favorito;
    const mensaje = await toggleFavorito();
    if (mensaje) {
      Alert.alert('No pudimos actualizar tus favoritos', mensaje);
      return;
    }
    setToast({
      id: Date.now(),
      texto: eraFavorito ? 'Quitado de favoritos' : 'Agregado a favoritos',
      icono: (
        <Heart
          size={18}
          color={colors.favorite}
          fill={eraFavorito ? 'transparent' : colors.favorite}
        />
      ),
    });
  };

  // HU-08: al agregar, se abre el carrito (flujo del prototipo).
  const onAgregar = async () => {
    if (requiereSesion) {
      pedirSesion('Para agregar obras a tu carrito necesitas una cuenta.');
      return;
    }
    if (!puedeComprar) {
      Alert.alert('Carrito', 'El carrito está disponible para cuentas de cliente.');
      return;
    }
    const mensaje = await agregarCarrito();
    if (mensaje) {
      Alert.alert('No pudimos agregar la obra', mensaje);
      return;
    }
    navigation.navigate('Tabs', { screen: 'Carrito' });
  };

  // HU-08: "Comprar ahora" deja la obra en el carrito y abre Finalizar compra solo con ella.
  const onComprar = async () => {
    if (requiereSesion) {
      pedirSesion('Para comprar necesitas una cuenta.');
      return;
    }
    if (!puedeComprar) {
      Alert.alert('Compras', 'Las compras están disponibles para cuentas de cliente.');
      return;
    }
    const mensaje = await comprarAhora();
    if (mensaje) {
      Alert.alert('No pudimos preparar tu compra', mensaje);
      return;
    }
    navigation.navigate('FinalizarCompra', { soloObra: obra.id });
  };

  if (error || !obra) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <View style={[styles.back, { top: insets.top + space.sm }]}>
          <IconButton
            icon={<ArrowLeft size={20} color={colors.textPrimary} />}
            label="Regresar"
            onPress={volver}
            round
            testID="detalle-regresar"
          />
        </View>
        {error ? (
          <ErrorState
            title="No pudimos cargar la obra"
            message={error}
            onRetry={reload}
            testID="detalle-error"
          />
        ) : (
          <ActivityIndicator color={colors.primary} testID="detalle-cargando" />
        )}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        testID="detalle-obra"
      >
        <GaleriaImagenes imagenes={obra.imagenes} titulo={obra.titulo} onBack={volver} />
        <View style={styles.panel}>
          <InfoObra
            titulo={obra.titulo}
            precio={obra.precio}
            descripcion={obra.descripcion}
            etiquetas={obra.etiquetas}
          >
            <ArtistaCard
              nombre={obra.artista.nombre}
              avatar={obra.artista.foto}
              onPress={irAlArtista}
            />
          </InfoObra>
          <DetallesObra
            historia={obra.historia}
            anio={obra.anio}
            dimensiones={obra.dimensiones}
            permiteMarco={obra.permiteMarco}
            conCertificado={obra.conCertificado}
          />
        </View>
      </ScrollView>
      <AccionesObra
        favorito={favorito}
        guardando={guardandoFavorito}
        agregando={agregandoCarrito}
        comprando={comprando}
        existenciasTexto={textoExistencias}
        agotada={agotada}
        cantidad={cantidad}
        maximo={maximo}
        onMas={aumentar}
        onMenos={disminuir}
        onToggleFavorito={onFavorito}
        onAgregar={onAgregar}
        onComprar={onComprar}
      />
      <Toast
        toast={toast}
        onHide={ocultarToast}
        bottom={ALTO_BARRA + Math.max(insets.bottom, space.md) + space.md}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgScreen },
  center: { justifyContent: 'center' },
  back: { position: 'absolute', left: space.lg },
  scroll: { flexGrow: 1 },
  panel: {
    flexGrow: 1,
    gap: space.xl,
    marginTop: -space.md,
    paddingHorizontal: DETAIL_MARGIN,
    paddingTop: space.xl,
    paddingBottom: space.xl,
    borderTopLeftRadius: radius.cardLarge,
    borderTopRightRadius: radius.cardLarge,
    backgroundColor: colors.bgScreen,
  },
});
