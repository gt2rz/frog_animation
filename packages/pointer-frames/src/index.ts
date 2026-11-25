export type Axis = 'x' | 'y';

export interface PointerFramesOptions {
	/** Elemento <img> cuyo `src` se va cambiando. */
	img: HTMLImageElement;
	/**
	 * Frames para el lado negativo del eje (arriba en `y`, izquierda en `x`).
	 * El primero es el de reposo y el último el de máxima intensidad.
	 */
	negative: string[];
	/** Frames para el lado positivo del eje (abajo en `y`, derecha en `x`). */
	positive: string[];
	/** Eje que se sigue. Por defecto `'y'`. */
	axis?: Axis;
	/**
	 * Elemento contra el que se normaliza la posición del puntero.
	 * Por defecto la propia imagen: su mitad superior = -1..0, inferior = 0..1.
	 */
	reference?: Element;
	/**
	 * Cuántas "mitades" de la referencia hacen falta para llegar al extremo.
	 * 1 = el borde de la referencia; 2 = el doble de lejos. Por defecto 1.
	 */
	reach?: number;
	/** Suavizado por frame (0..1). Más bajo = más lento. Por defecto 0.15. */
	smoothing?: number;
	/** Precarga todos los frames al iniciar. Por defecto true. */
	preload?: boolean;
	/** Vuelve al reposo cuando el puntero sale de la ventana. Por defecto true. */
	resetOnLeave?: boolean;
	/** Respeta `prefers-reduced-motion` (no anima). Por defecto true. */
	respectReducedMotion?: boolean;
	/** Se llama cada vez que cambia el frame mostrado. */
	onFrame?: (src: string, value: number) => void;
}

export interface PointerFramesInstance {
	/** Fija el valor objetivo manualmente (-1..1), p. ej. desde scroll o un giroscopio. */
	setTarget(value: number): void;
	/** Quita listeners y detiene la animación. */
	destroy(): void;
}

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

/**
 * Genera rutas de frames numerados.
 * `frameRange((n) => `/img/frame-${pad(n, 3)}.jpg`, 1, 59)`
 * Si `from > to` la secuencia sale invertida.
 */
export function frameRange(path: (n: number) => string, from: number, to: number): string[] {
	const step = from <= to ? 1 : -1;
	const out: string[] = [];
	for (let i = from; step > 0 ? i <= to : i >= to; i += step) out.push(path(i));
	return out;
}

/** Rellena con ceros a la izquierda: `pad(7, 3)` → `'007'`. */
export const pad = (n: number, width: number) => String(n).padStart(width, '0');

export function preloadFrames(srcs: string[]): void {
	for (const src of srcs) {
		const img = new Image();
		img.decoding = 'async';
		img.src = src;
	}
}

export function createPointerFrames(options: PointerFramesOptions): PointerFramesInstance {
	const {
		img,
		negative,
		positive,
		axis = 'y',
		reference = img,
		reach = 1,
		smoothing = 0.15,
		preload = true,
		resetOnLeave = true,
		respectReducedMotion = true,
		onFrame,
	} = options;

	if (!negative.length || !positive.length) {
		throw new Error('pointer-frames: `negative` y `positive` necesitan al menos un frame.');
	}

	if (preload) preloadFrames([...negative, ...positive]);

	const reduced =
		respectReducedMotion &&
		typeof matchMedia === 'function' &&
		matchMedia('(prefers-reduced-motion: reduce)').matches;

	let target = 0;
	let current = 0;
	let lastSrc = '';
	let raf = 0;

	const render = () => {
		const frames = current <= 0 ? negative : positive;
		const src = frames[Math.round(Math.abs(current) * (frames.length - 1))];
		if (src !== lastSrc) {
			lastSrc = src;
			img.src = src;
			onFrame?.(src, current);
		}
	};

	const tick = () => {
		current += (target - current) * smoothing;
		// Cuando ya ha llegado, se para el bucle para no gastar CPU.
		if (Math.abs(target - current) < 0.001) {
			current = target;
			raf = 0;
		} else {
			raf = requestAnimationFrame(tick);
		}
		render();
	};

	const setTarget = (value: number) => {
		target = clamp(value);
		if (reduced) {
			current = target;
			render();
			return;
		}
		if (!raf) raf = requestAnimationFrame(tick);
	};

	const onMove = (e: PointerEvent) => {
		const rect = reference.getBoundingClientRect();
		const half = (axis === 'y' ? rect.height : rect.width) / 2;
		if (!half) return;
		const center = axis === 'y' ? rect.top + half : rect.left + half;
		const pos = axis === 'y' ? e.clientY : e.clientX;
		setTarget((pos - center) / (half * reach));
	};

	const onLeave = (e: PointerEvent) => {
		// relatedTarget null = el puntero ha salido de la ventana.
		if (!e.relatedTarget) setTarget(0);
	};

	window.addEventListener('pointermove', onMove, { passive: true });
	if (resetOnLeave) document.addEventListener('pointerout', onLeave);

	return {
		setTarget,
		destroy() {
			window.removeEventListener('pointermove', onMove);
			document.removeEventListener('pointerout', onLeave);
			if (raf) cancelAnimationFrame(raf);
			raf = 0;
		},
	};
}
