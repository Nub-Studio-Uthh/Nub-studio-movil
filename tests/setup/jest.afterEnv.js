// Se carga después de preparar Jest, para que la limpieza automática de
// Testing Library (afterEach) quede registrada.
import { configure } from '@testing-library/react-native';

// El primer render de cada archivo carga todos los módulos y puede tardar varios
// segundos; los findBy*/waitFor esperan hasta 10 s en vez de 1 s.
configure({ asyncUtilTimeout: 10000 });
