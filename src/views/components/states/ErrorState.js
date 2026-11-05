import { WifiOff } from 'lucide-react-native';
import { EmptyState } from './EmptyState';

/** Estado de error con "Reintentar" (vuelve a mostrar el skeleton). */
export function ErrorState({ title, message, onRetry, testID = 'estado-error', style }) {
  return (
    <EmptyState
      Icon={WifiOff}
      tone="error"
      title={title}
      message={message ?? 'Revisa tu conexión a internet e inténtalo de nuevo.'}
      actionLabel="Reintentar"
      onAction={onRetry}
      testID={testID}
      style={style}
    />
  );
}
