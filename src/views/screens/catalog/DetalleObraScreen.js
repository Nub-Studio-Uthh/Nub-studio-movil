import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { DETAIL_MARGIN } from '../../../constants/layout';
import { radius, space } from '../../../constants/spacing';
import { useRemoteData } from '../../../hooks/useRemoteData';
import { getObra } from '../../../models/obraService';
import { AccionesObra } from '../../components/obra/AccionesObra';
import { ArtistaCard } from '../../components/obra/ArtistaCard';
import { DetallesObra } from '../../components/obra/DetallesObra';
import { GaleriaImagenes } from '../../components/obra/GaleriaImagenes';
import { InfoObra } from '../../components/obra/InfoObra';
import { ErrorState } from '../../components/states/ErrorState';
import { IconButton } from '../../components/ui/IconButton';

// El carrito (HU-08) todavía no existe: por ahora solo avisa.
const proximamente = (titulo) => Alert.alert(titulo, 'Esta función estará disponible pronto.');

/**
 * Detalle de obra (HU-02). Recibe { id } por parámetro de ruta, pide la obra a la API
 * y arma la pantalla con los componentes de components/obra.
 */
export function DetalleObraScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { id } = route.params ?? {};
  // TODO HU-07: el favorito debe guardarse en el backend (requiere sesión). Por ahora solo cambia en pantalla.
  const [favorito, setFavorito] = useState(false);
  const { data: obra, error, reload } = useRemoteData((signal) => getObra(id, { signal }), null);

  const volver = () => navigation.goBack();
  const irAlArtista = () => navigation.navigate('PerfilArtista', { id: obra.artista.id });

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
        onToggleFavorito={() => setFavorito((v) => !v)}
        onAgregar={() => proximamente('Carrito')}
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
