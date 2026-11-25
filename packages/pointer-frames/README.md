# pointer-frames

Mueve una secuencia de imágenes (frames) según la posición del puntero. Sin dependencias ni framework.

```ts
import { createPointerFrames, frameRange, pad } from 'pointer-frames';

const path = (n: number) => `/frames/frame-${pad(n, 3)}.jpg`;

const pf = createPointerFrames({
  img: document.querySelector('#frog')!,
  negative: frameRange(path, 1, 59),   // reposo -> mirar arriba (o izquierda con axis: 'x')
  positive: frameRange(path, 85, 100), // reposo -> mirar abajo  (o derecha)
  axis: 'y',
});

// pf.setTarget(-0.5)  // control manual (scroll, giroscopio...)
// pf.destroy()        // limpiar (SPA, view transitions)
```

## Opciones

| Opción | Por defecto | Qué hace |
| --- | --- | --- |
| `img` | — | `<img>` cuyo `src` cambia |
| `negative` / `positive` | — | Frames de cada lado del eje; el primero es el reposo |
| `axis` | `'y'` | `'x'` o `'y'` |
| `reference` | `img` | Elemento contra el que se mide el puntero |
| `reach` | `1` | Distancia (en mitades de la referencia) para llegar al extremo |
| `smoothing` | `0.15` | Suavizado por frame, 0..1 |
| `preload` | `true` | Precarga los frames |
| `resetOnLeave` | `true` | Vuelve al reposo al salir el puntero de la ventana |
| `respectReducedMotion` | `true` | Sin interpolación si el usuario prefiere menos movimiento |
| `onFrame` | — | `(src, value) => void` en cada cambio de frame |

## Usarlo en otro proyecto

- Publicado: `pnpm build && npm publish` dentro de esta carpeta, luego `pnpm add pointer-frames`.
- Sin publicar: `pnpm add file:../ruta/a/pointer-frames` o `pnpm add github:usuario/repo#path:packages/pointer-frames`.
