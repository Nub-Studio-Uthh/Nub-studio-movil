# NU★B Studio Mobile — UI Kit v1.0

**Propuesta de identidad visual · Expo (React Native)**
Arte Huasteco Regional · Huasteca Hidalguense

## Scope de la app móvil

- **Pantallas incluidas:** Splash · Onboarding · Home · Catálogo · Detalle de obra · Favoritos · Carrito · Pasarela de pagos · Login · Registro
- **Pantallas excluidas:** Panel artista · Panel admin · Blog

---

## 1. Paleta de colores

### Colores primarios

| Token | HEX | RGB | Uso |
|---|---|---|---|
| `primary` | `#E8640C` | rgb(232, 100, 12) | Botones principales, tabs activos, acentos, CTA |
| `secondary` | `#A83B90` | rgb(168, 59, 144) | Gradientes, detalles decorativos, íconos secundarios |
| `tertiary` | `#6028AA` | rgb(96, 40, 170) | Badges premium, énfasis especial |

### Fondos

| Token | HEX | RGB | Uso |
|---|---|---|---|
| `bg-screen` | `#FFFFFF` | rgb(255, 255, 255) | Fondo de pantalla estándar |
| `bg-surface` | `#F9F8FC` | rgb(249, 248, 252) | Cards, bottom sheets, modales |
| `bg-input` | `#F5F5F2` | rgb(245, 245, 242) | Campos de texto |
| `bg-dark` | `#0D0B14` | rgb(13, 11, 20) | Splash, onboarding y detalle de obra en modo galería |

> **bg-dark:** no es un fondo general. Se usa únicamente en Splash, Onboarding y la pantalla de detalle de obra cuando la imagen llena la pantalla.

### Textos

| Token | HEX | RGB | Uso |
|---|---|---|---|
| `text-primary` | `#14121E` | rgb(20, 18, 30) | Títulos, cuerpo principal |
| `text-secondary` | `#5A5870` | rgb(90, 88, 112) | Subtítulos, descripciones |
| `text-muted` | `#9896A8` | rgb(152, 150, 168) | Placeholders, hints, texto deshabilitado |
| `text-on-dark` | `#FFFFFF` | rgb(255, 255, 255) | Texto sobre fondos oscuros o botón naranja |

### Bordes

| Token | HEX | RGB | Uso |
|---|---|---|---|
| `border-default` | `#E6E4EF` | rgb(230, 228, 239) | Cards, inputs, separadores |
| `border-subtle` | `rgba(0,0,0,0.05)` | — | Divisores dentro de listas |

### Estados del sistema

| Token | HEX | RGB | Uso |
|---|---|---|---|
| `success` | `#0E8A50` | rgb(14, 138, 80) | Confirmación de pago, compra exitosa |
| `error` | `#C4304A` | rgb(196, 48, 74) | Errores de formulario, eliminar |
| `warning` | `#A87006` | rgb(168, 112, 6) | Advertencias, acciones con precaución |
| `info` | `#2D6FBE` | rgb(45, 111, 190) | Mensajes informativos neutrales |

### Sombra estándar de card

| Plataforma | Valores |
|---|---|
| iOS | `shadowColor: '#000'` · `shadowOffset: {width: 0, height: 1}` · `shadowOpacity: 0.05` · `shadowRadius: 4` |
| Android | `elevation: 2` |

---

## 2. Tipografía

### Familias

| Familia | Rol | Uso | Carga |
|---|---|---|---|
| **SolveraLorvane** | Identidad de marca | Logo NU★B Studio, splash, títulos hero | `expo-font` · archivo local `SolveraLorvane.ttf` |
| **Nexa Heavy** | Impacto numérico | Precios, contadores, estadísticas | `expo-font` · archivo local `Nexa-Heavy.ttf` |
| **Outfit** | Tipografía del sistema | Todo lo demás: body, botones, nav, labels, formularios | `@expo-google-fonts/outfit` · pesos 400 / 500 / 600 / 700 |

> SolveraLorvane y Nexa Heavy son archivos de un solo peso, por lo que no se especifica `fontWeight`.

### Escala de tamaños (valores fijos en sp/dp)

| Rol | Familia | Tamaño | fontWeight | letterSpacing |
|---|---|---|---|---|
| Splash / Logo | SolveraLorvane | 64sp | — (archivo único) | -1.5 |
| H1 — Título de pantalla | SolveraLorvane | 36sp | — (archivo único) | -1 |
| H2 — Sección | Outfit | 22sp | 700 | -0.3 |
| H3 — Subsección | Outfit | 17sp | 600 | 0 |
| Body regular | Outfit | 15sp | 400 | 0 |
| Body small | Outfit | 14sp | 400 | 0 |
| Label uppercase | Outfit | 11sp | 700 | 1.5 |
| Precio | Nexa Heavy | 28sp | — (archivo único) | -0.5 |
| Botón | Outfit | 12sp | 700 | 2 |
| Caption / Hint | Outfit | 12sp | 400 | 0 |
| Badges / Chips | Outfit | 10sp | 700 | 1 |

> **Regla de legibilidad:** mínimo 14sp para todo texto de cuerpo (body regular y body small). Labels uppercase, badges y captions pueden bajar hasta 10sp porque su peso, capitalización y alto contraste compensan el tamaño reducido.

---

## 3. Componentes base

### Zona táctil mínima

Todo elemento interactivo (botón, ícono, tab, checkbox) debe tener una zona táctil mínima de **44 × 44 dp**. Usar `minHeight: 44` y `minWidth: 44`, o `hitSlop` cuando el elemento visual sea menor.

### Botones

Estilo común: `fontFamily: Outfit 700` · `fontSize: 12sp` · uppercase · `letterSpacing: 2` · `borderRadius: 100` · `paddingVertical: 14` · `paddingHorizontal: 24` · `minHeight: 48`

| Variante | backgroundColor | color | Borde |
|---|---|---|---|
| **Primario** | `#E8640C` | `#FFFFFF` | — |
| **Secundario (oscuro)** | `#14121E` | `#FFFFFF` | — |
| **Ghost / Outline** | `transparent` | `#14121E` | 1 · `#E6E4EF` |
| **Deshabilitado** | `#E6E4EF` | `#9896A8` | — (sin opacity adicional; el color ya comunica el estado) |
| **Destructivo** | `rgba(196,48,74,0.10)` | `#C4304A` | 1 · `rgba(196,48,74,0.20)` |

### Inputs / Campos de texto

| Propiedad | Valor |
|---|---|
| backgroundColor | `#F5F5F2` |
| borderWidth · borderColor | 1 · `#E6E4EF` |
| borderRadius | 14 |
| padding | vertical 12 · horizontal 16 |
| Texto | Outfit 400 · 15sp · `#14121E` |
| placeholderTextColor | `#9896A8` |
| minHeight | 48 |

| Estado | Estilo |
|---|---|
| Focus | `borderColor: '#E8640C'` |
| Error | `borderColor: 'rgba(196,48,74,0.5)'` · `backgroundColor: 'rgba(196,48,74,0.03)'` |

### Cards / Tarjetas

| Propiedad | Valor |
|---|---|
| backgroundColor | `#FFFFFF` |
| borderWidth · borderColor | 1 · `#E6E4EF` |
| borderRadius | 20 → card estándar (obra, producto) · 28 → card grande / modal / bottom sheet |
| padding | 16 |
| Sombra | iOS: `shadowColor:'#000'`, `shadowOffset:{width:0,height:1}`, `shadowOpacity:0.05`, `shadowRadius:4` · Android: `elevation: 2` |

### Badges de estado (contexto cliente / comprador)

Estilo común: `borderRadius: 40` · `paddingVertical: 3` · `paddingHorizontal: 12` · `fontSize: 10sp` · Outfit 700 · uppercase · `letterSpacing: 1`

| Badge | color | background |
|---|---|---|
| Oferta | `#E8640C` | `rgba(232,100,12,0.08)` |
| Destacada | `#6028AA` | `rgba(96,40,170,0.08)` |
| Agotada | `#5A5870` | `rgba(90,88,112,0.08)` |
| Pagado | `#0E8A50` | `rgba(14,138,80,0.08)` |

### Íconos

| Propiedad | Valor |
|---|---|
| Librería | `lucide-react-native` |
| Dependencia requerida | `react-native-svg` (peer dependency) |
| Tamaños | 16 / 20 / 24dp |
| strokeWidth | 1.5 (default) · 2 (énfasis) |
| Zona táctil | Mínimo 44dp si el ícono es interactivo |

---

## 4. Barra de navegación inferior (Tab Bar)

| Tab | Ícono Lucide | Ruta |
|---|---|---|
| Inicio | `Home` | `/home` |
| Catálogo | `LayoutGrid` | `/catalogo` |
| Favoritos | `Heart` | `/favoritos` |
| Carrito | `ShoppingCart` | `/carrito` |
| Cuenta | `User` | `/login` o `/perfil` |

**Estilos del tab bar:**

| Propiedad | Valor |
|---|---|
| backgroundColor | `#FFFFFF` |
| borderTop | 1 · `#E6E4EF` |
| paddingBottom | safe area inset bottom |
| height | 60 + safe area inset bottom |
| Tab activo | color `#E8640C` · ícono strokeWidth 2 |
| Tab inactivo | color `#9896A8` · ícono strokeWidth 1.5 |
| Label | Outfit 600 · 11sp |

---

## 5. Espaciado estándar

| Token | Valor | Uso |
|---|---|---|
| `space-xs` | 4dp | Gap entre ícono y texto inline |
| `space-sm` | 8dp | Gap entre elementos pequeños |
| `space-md` | 12dp | Padding interno de componentes compactos |
| `space-lg` | 16dp | Padding horizontal de pantalla (estándar) |
| `space-xl` | 24dp | Separación entre secciones |
| `space-2xl` | 32dp | Márgenes verticales de pantalla |

- **Padding horizontal de pantalla:** 16dp fijo en todas las pantallas.
- **Safe area:** siempre usar `useSafeAreaInsets()` de `react-native-safe-area-context`.

### Border radius

| Elemento | Valor |
|---|---|
| Botones pill | 100 |
| Inputs | 14 |
| Cards estándar | 20 |
| Cards grandes / modales | 28 |
| Avatares | 999 |
| Contenedor de ícono | 12 |

---

## 6. Dependencias clave

| Paquete | Uso |
|---|---|
| `expo-font` | Fuentes locales (SolveraLorvane, Nexa-Heavy) |
| `@expo-google-fonts/outfit` | Outfit |
| `react-native-svg` | Requerido por lucide-react-native |
| `lucide-react-native` | Íconos |
| `react-native-safe-area-context` | Safe area insets |
| `react-native-reanimated` | Animaciones |

---

## 7. Animaciones y feedback

| Tipo | Duración | Easing |
|---|---|---|
| Fade in de pantalla | 300ms | easeOut |
| Entrada de card | 400ms | spring con leve rebote |
| Micro-interacción botón | 150ms | easeInOut |
| Skeleton shimmer | 1400ms | loop infinite |

- Usar `react-native-reanimated` para animaciones fluidas.
- Respetar `AccessibilityInfo.isReduceMotionEnabled()`: sin animaciones de entrada si está activo.

---

Este UI Kit es la referencia única para el desarrollo visual de la app móvil NU★B Studio. Todo componente nuevo debe usar los tokens aquí definidos antes de introducir valores propios.
