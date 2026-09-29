/**
 * Frame-driven waits for the simulation tests.
 *
 * The engine only advances inside `requestAnimationFrame`, and a fully loaded `test:unit` run starves
 * those frames for seconds at a time. A fixed sleep then measures how busy the machine was rather than
 * what the code does - which is how these suites came to pass alone and fail in parallel. Poll the
 * condition, give it a generous deadline, and let an idle run finish early.
 */

/** Returns the milliseconds it took, or -1 when the condition never held inside the deadline. */
export async function framesUntil(
	check: () => boolean,
	options: { deadlineMs?: number; pollMs?: number } = {},
): Promise<number> {
	const deadlineMs = options.deadlineMs ?? 20_000
	const pollMs = options.pollMs ?? 50
	const started = Date.now()
	for (;;) {
		if (check()) return Date.now() - started
		if (Date.now() - started > deadlineMs) return -1
		await new Promise(resolve => window.setTimeout(resolve, pollMs))
	}
}

/** The assertion the tests kept forgetting: a starved run must say so, not fail on a bare boolean. */
export function frameDeadline(label: string, waitedMs: number): void {
	if (waitedMs < 0) throw new Error(`${label}: the condition never held within the deadline (frames starved?)`)
}
