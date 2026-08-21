import { ref, onUnmounted, type Ref } from "vue";

interface Position {
	x: number;
	y: number;
}

const INTERACTIVE_SELECTOR = "button, input, select, textarea, a, label, [role='button'], [contenteditable]";

export function useDraggable(target: Ref<HTMLElement | undefined>, handle: Ref<HTMLElement | undefined>) {
	const pos = ref<Position>({ x: 0, y: 0 });
	const isDragging = ref(false);
	let start = { x: 0, y: 0, posX: 0, posY: 0 };

	function onDown(e: MouseEvent) {
		if (e.button !== 0) return;
		if ((e.target as HTMLElement).closest(INTERACTIVE_SELECTOR)) return;
		const el = target.value;
		if (!el) return;
		isDragging.value = true;
		start = { x: e.clientX, y: e.clientY, posX: pos.value.x, posY: pos.value.y };
		window.addEventListener("mousemove", onMove);
		window.addEventListener("mouseup", onUp);
	}

	function onMove(e: MouseEvent) {
		if (!isDragging.value) return;
		const el = target.value;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const margin = 8;
		const maxX = window.innerWidth - rect.right + pos.value.x - margin;
		const maxY = window.innerHeight - rect.bottom + pos.value.y - margin;
		const minX = -rect.left + pos.value.x + margin;
		const minY = -rect.top + pos.value.y + margin;
		pos.value = {
			x: Math.max(minX, Math.min(start.posX + e.clientX - start.x, maxX)),
			y: Math.max(minY, Math.min(start.posY + e.clientY - start.y, maxY)),
		};
	}

	function onUp() {
		isDragging.value = false;
		window.removeEventListener("mousemove", onMove);
		window.removeEventListener("mouseup", onUp);
	}

	function reset() {
		pos.value = { x: 0, y: 0 };
	}

	onUnmounted(() => {
		window.removeEventListener("mousemove", onMove);
		window.removeEventListener("mouseup", onUp);
	});

	return { pos, isDragging, onDown, reset };
}
