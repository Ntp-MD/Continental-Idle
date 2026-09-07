export function chatPairKey(firstId: string, secondId: string): string {
	return firstId < secondId ? `${firstId}|${secondId}` : `${secondId}|${firstId}`
}

const GUEST_EXCHANGES: ReadonlyArray<readonly [string, string]> = [
	['Morning. Sleep well?', 'Like a rock. You?'],
	['Busy day today.', 'Tell me about it.'],
	['Have you tried the breakfast?', 'Twice already.'],
	['Is the lift still slow?', 'Slower than checkout.'],
	['Nice weather outside.', 'Shame about the queue.'],
	['Are you staying long?', 'Just the night.'],
	['The halls are quiet today.', 'Enjoy it while it lasts.'],
	['Do you know a good room?', 'Top floor, far corner.'],
	['Coffee first, talk later?', 'Deal.'],
	['Have we met before?', 'Everyone looks familiar here.'],
	['The staff are lovely.', 'Best part of this place.'],
	['See you around?', 'Count on it.'],
]

const STAFF_EXCHANGES: ReadonlyArray<readonly [string, string]> = [
	['Table six needs water.', 'On it, coming right over.'],
	['Did the new linen arrive?', 'This morning. All pressed.'],
	['Checkout rush at noon.', 'I will cover the desk.'],
	['Restock the bar before evening.', 'Already on the list.'],
	['The elevator acts up again.', 'Logged with maintenance.'],
	['VIP in the lounge tonight.', 'Noted. Best behavior.'],
	['Who took the master key?', 'Front desk has it.'],
	['Breaks after the rush?', 'You first, I will follow.'],
]

function hashPairKey(pairKey: string): number {
	let hash = 0x811c9dc5
	for (let i = 0; i < pairKey.length; i++) {
		hash ^= pairKey.charCodeAt(i)
		hash = Math.imul(hash, 0x01000193)
	}
	return hash >>> 0
}

export function resolveChatExchange(pairKey: string, salt = 0, staffOnly = false): readonly [string, string] {
	const pool = staffOnly ? STAFF_EXCHANGES : GUEST_EXCHANGES
	return pool[(hashPairKey(pairKey) + (salt >>> 0)) % pool.length]
}
