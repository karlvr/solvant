import { Card, Face, CardStack, Engine, END, CardObjectId } from './types'
import { debugCardStacks, cardsToString, cardIsEqual, stringToCards, stringToCardStack, suitToColour, cardToString } from './utils'
import { produce } from 'immer'
import hash from 'object-hash'

export interface ChurchillState {
	

	/** The stack of cards still to be dealt, with the top of the deck last in the array */
	deck: Card[]

	/** The top card in each of the eight victory piles */
	victory: Card[]

	/** The devil's six cards, with the top last in the array */
	devils: Card[]

	/** The stacks of cards */
	stacks: ChurchillCardStack[]

	notOn: Map<CardObjectId, CardObjectId[]>
}

interface ChurchillCardStack extends CardStack {
	// lastCardRemoved?: CardObjectId
}

export enum ChurchillMoveType {
	DECK,
	COLUMN,
	VICTORY,
	DEVIL,
}

export interface ChurchillMove {
	type: ChurchillMoveType
	from?: number
	to?: number
	count?: number
	card?: Card
	cardTo?: Card
	notCardTo?: CardObjectId[]
}

export interface ChurchillColumnMove extends ChurchillMove {
	type: ChurchillMoveType.COLUMN
	from: number
	to: number
	count: number
	card: Card
	cardTo?: Card
	notCardTo: CardObjectId[]
}

export interface ChurchillVictoryMove extends ChurchillMove {
	type: ChurchillMoveType.VICTORY
	from: number
	card: Card
}

export function debugChurchillState(state: ChurchillState): string {
	let result = ''
	result += `${state.deck.length < 10 ? '0' : ''}${state.deck.length}  ${cardsToString(state.devils)}  ${cardsToString(state.victory)}\n\n`
	result += debugCardStacks(state.stacks)
	return result
}

export interface ChurchillInitialState {
	/** Deck in reverse order (top card first) */
	deck: string
	/** Devils row in order left to right */
	devils: string
	/** Victory row */
	victory?: string
	/** Stacks in order left to right */
	stacks: string[]
}

/**
 * Create a new Churchill state
 */
export function createChurchillState(initial: ChurchillInitialState): ChurchillState {
	return produce({
		deck: stringToCards(initial.deck).reverse(),
		devils: stringToCards(initial.devils),
		stacks: initial.stacks.map(s => stringToCardStack(s)),
		victory: stringToCards(initial.victory || '?H ?D ?C ?S ?H ?D ?C ?S'),
		notOn: new Map(),
	}, draft => draft)
}

declare global {
	interface Array<T> {
		peek(): T | undefined
	}
}

Array.prototype.peek = function() {
	return this[this.length - 1]
}

const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997, 1009, 1013, 1019, 1021, 1031, 1033, 1039, 1049, 1051, 1061, 1063, 1069, 1087, 1091, 1093, 1097, 1103, 1109, 1117, 1123, 1129, 1151, 1153, 1163, 1171, 1181, 1187, 1193, 1201, 1213, 1217, 1223, 1229, 1231, 1237, 1249, 1259, 1277, 1279, 1283, 1289, 1291, 1297, 1301, 1303, 1307, 1319, 1321, 1327, 1361, 1367, 1373, 1381, 1399, 1409, 1423, 1427, 1429, 1433, 1439, 1447, 1451, 1453, 1459, 1471, 1481, 1483, 1487, 1489, 1493, 1499, 1511, 1523, 1531, 1543, 1549, 1553, 1559, 1567, 1571, 1579, 1583, 1597, 1601, 1607, 1609, 1613, 1619, 1621, 1627, 1637, 1657, 1663, 1667, 1669, 1693, 1697, 1699, 1709, 1721, 1723, 1733, 1741, 1747, 1753, 1759, 1777, 1783, 1787, 1789, 1801, 1811, 1823, 1831, 1847, 1861, 1867, 1871, 1873, 1877, 1879, 1889, 1901, 1907, 1913, 1931, 1933, 1949, 1951, 1973, 1979, 1987, 1993, 1997, 1999, 2003, 2011, 2017, 2027, 2029, 2039, 2053, 2063, 2069, 2081, 2083, 2087, 2089, 2099, 2111, 2113, 2129, 2131, 2137, 2141, 2143, 2153, 2161, 2179, 2203, 2207, 2213, 2221, 2237, 2239, 2243, 2251, 2267, 2269, 2273, 2281, 2287, 2293, 2297, 2309, 2311, 2333, 2339, 2341, 2347, 2351, 2357, 2371, 2377, 2381, 2383, 2389, 2393, 2399, 2411, 2417, 2423, 2437, 2441, 2447, 2459, 2467, 2473, 2477, 2503, 2521, 2531, 2539, 2543, 2549, 2551, 2557, 2579, 2591, 2593, 2609, 2617, 2621, 2633, 2647, 2657, 2659, 2663, 2671, 2677, 2683, 2687, 2689, 2693, 2699, 2707, 2711, 2713, 2719, 2729, 2731, 2741, 2749, 2753, 2767, 2777, 2789, 2791, 2797, 2801, 2803, 2819, 2833, 2837, 2843, 2851, 2857, 2861, 2879, 2887, 2897, 2903, 2909, 2917, 2927, 2939, 2953, 2957, 2963, 2969, 2971, 2999, 3001, 3011, 3019, 3023, 3037, 3041, 3049, 3061, 3067, 3079, 3083, 3089, 3109, 3119, 3121, 3137, 3163, 3167, 3169, 3181, 3187, 3191, 3203, 3209, 3217, 3221, 3229, 3251, 3253, 3257, 3259, 3271, 3299, 3301, 3307, 3313, 3319, 3323, 3329, 3331, 3343, 3347, 3359, 3361, 3371, 3373, 3389, 3391, 3407, 3413, 3433, 3449, 3457, 3461, 3463, 3467, 3469, 3491, 3499, 3511, 3517, 3527, 3529, 3533, 3539, 3541, 3547, 3557, 3559, 3571, 3581, 3583, 3593, 3607, 3613, 3617, 3623, 3631, 3637, 3643, 3659, 3671, 3673, 3677, 3691, 3697, 3701, 3709, 3719, 3727, 3733, 3739, 3761, 3767, 3769, 3779, 3793, 3797, 3803, 3821, 3823, 3833, 3847, 3851, 3853, 3863, 3877, 3881, 3889, 3907, 3911, 3917, 3919, 3923, 3929, 3931, 3943, 3947, 3967, 3989, 4001, 4003, 4007, 4013, 4019, 4021, 4027, 4049, 4051, 4057, 4073, 4079, 4091, 4093, 4099, 4111, 4127, 4129, 4133, 4139, 4153, 4157, 4159, 4177, 4201, 4211, 4217, 4219, 4229, 4231, 4241, 4243, 4253, 4259, 4261, 4271, 4273, 4283, 4289, 4297, 4327, 4337, 4339, 4349, 4357, 4363, 4373, 4391, 4397, 4409, 4421, 4423, 4441, 4447, 4451, 4457, 4463, 4481, 4483, 4493, 4507, 4513, 4517, 4519, 4523, 4547, 4549, 4561, 4567, 4583, 4591, 4597, 4603, 4621, 4637, 4639, 4643, 4649, 4651, 4657, 4663, 4673, 4679, 4691, 4703, 4721, 4723, 4729, 4733, 4751, 4759, 4783, 4787, 4789, 4793, 4799, 4801, 4813, 4817, 4831, 4861, 4871, 4877, 4889, 4903, 4909, 4919, 4931, 4933, 4937, 4943, 4951, 4957, 4967, 4969, 4973, 4987, 4993, 4999, 5003, 5009, 5011, 5021, 5023, 5039, 5051, 5059, 5077, 5081, 5087, 5099, 5101, 5107, 5113, 5119, 5147, 5153, 5167, 5171, 5179, 5189, 5197, 5209, 5227, 5231, 5233, 5237, 5261, 5273, 5279, 5281, 5297, 5303, 5309, 5323, 5333, 5347, 5351, 5381, 5387, 5393, 5399, 5407, 5413, 5417, 5419, 5431, 5437, 5441, 5443, 5449, 5471, 5477, 5479, 5483, 5501, 5503, 5507, 5519, 5521, 5527, 5531, 5557, 5563, 5569, 5573, 5581, 5591, 5623, 5639, 5641, 5647, 5651, 5653, 5657, 5659, 5669, 5683, 5689, 5693, 5701, 5711, 5717, 5737, 5741, 5743, 5749, 5779, 5783, 5791, 5801, 5807, 5813, 5821, 5827, 5839, 5843, 5849, 5851, 5857, 5861, 5867, 5869, 5879, 5881, 5897, 5903, 5923, 5927, 5939, 5953, 5981, 5987, 6007, 6011, 6029, 6037, 6043, 6047, 6053, 6067, 6073, 6079, 6089, 6091, 6101, 6113, 6121, 6131, 6133, 6143, 6151, 6163, 6173, 6197, 6199, 6203, 6211, 6217, 6221, 6229, 6247, 6257, 6263, 6269, 6271, 6277, 6287, 6299, 6301, 6311, 6317, 6323, 6329, 6337, 6343, 6353, 6359, 6361, 6367, 6373, 6379, 6389, 6397, 6421, 6427, 6449, 6451, 6469, 6473, 6481, 6491, 6521, 6529, 6547, 6551, 6553, 6563, 6569, 6571, 6577, 6581, 6599, 6607, 6619, 6637, 6653, 6659, 6661, 6673, 6679, 6689, 6691, 6701, 6703, 6709, 6719, 6733, 6737, 6761, 6763, 6779, 6781, 6791, 6793, 6803, 6823, 6827, 6829, 6833, 6841, 6857, 6863, 6869, 6871, 6883, 6899, 6907, 6911, 6917, 6947, 6949, 6959, 6961, 6967, 6971, 6977, 6983, 6991, 6997, 7001, 7013, 7019, 7027, 7039, 7043, 7057, 7069, 7079, 7103, 7109, 7121, 7127, 7129, 7151, 7159, 7177, 7187, 7193, 7207, 7211, 7213, 7219, 7229, 7237, 7243, 7247, 7253, 7283, 7297, 7307, 7309, 7321, 7331, 7333, 7349, 7351, 7369, 7393, 7411, 7417, 7433, 7451, 7457, 7459, 7477, 7481, 7487, 7489, 7499, 7507, 7517, 7523, 7529, 7537, 7541, 7547, 7549, 7559, 7561, 7573, 7577, 7583, 7589, 7591, 7603, 7607, 7621, 7639, 7643, 7649, 7669, 7673, 7681, 7687, 7691, 7699, 7703, 7717, 7723, 7727, 7741, 7753, 7757, 7759, 7789, 7793, 7817, 7823, 7829, 7841, 7853, 7867, 7873, 7877, 7879, 7883, 7901, 7907, 7919, 7927, 7933, 7937, 7949, 7951, 7963, 7993, 8009, 8011, 8017, 8039, 8053, 8059, 8069, 8081, 8087, 8089, 8093, 8101, 8111, 8117, 8123, 8147, 8161, 8167, 8171, 8179, 8191, 8209, 8219, 8221, 8231, 8233, 8237, 8243, 8263, 8269, 8273, 8287, 8291, 8293, 8297, 8311, 8317, 8329, 8353, 8363, 8369, 8377, 8387, 8389, 8419, 8423, 8429, 8431, 8443, 8447, 8461, 8467, 8501, 8513, 8521, 8527, 8537, 8539, 8543, 8563, 8573, 8581, 8597, 8599, 8609, 8623, 8627, 8629, 8641, 8647, 8663, 8669, 8677, 8681, 8689, 8693, 8699, 8707, 8713, 8719, 8731, 8737, 8741, 8747, 8753, 8761, 8779, 8783, 8803, 8807, 8819, 8821, 8831, 8837, 8839, 8849, 8861, 8863, 8867, 8887, 8893, 8923, 8929, 8933, 8941, 8951, 8963, 8969, 8971, 8999, 9001, 9007, 9011, 9013, 9029, 9041, 9043, 9049, 9059, 9067, 9091, 9103, 9109, 9127, 9133, 9137, 9151, 9157, 9161, 9173, 9181, 9187, 9199, 9203, 9209, 9221, 9227, 9239, 9241, 9257, 9277, 9281, 9283, 9293, 9311, 9319, 9323, 9337, 9341, 9343, 9349, 9371, 9377, 9391, 9397, 9403, 9413, 9419, 9421, 9431, 9433, 9437, 9439, 9461, 9463, 9467, 9473, 9479, 9491, 9497, 9511, 9521, 9533, 9539, 9547, 9551, 9587, 9601, 9613, 9619, 9623, 9629, 9631, 9643, 9649, 9661, 9677, 9679, 9689, 9697, 9719, 9721, 9733, 9739, 9743, 9749, 9767, 9769, 9781, 9787, 9791, 9803, 9811, 9817, 9829, 9833, 9839, 9851, 9857, 9859, 9871, 9883, 9887, 9901, 9907, 9923, 9929, 9931, 9941, 9949, 9967, 9973, 10007, 10009, 10037, 10039, 10061, 10067, 10069, 10079, 10091, 10093, 10099, 10103, 10111, 10133, 10139, 10141, 10151, 10159, 10163, 10169, 10177, 10181, 10193, 10211, 10223, 10243, 10247, 10253, 10259, 10267, 10271, 10273, 10289, 10301, 10303, 10313, 10321, 10331, 10333, 10337, 10343, 10357, 10369, 10391, 10399, 10427, 10429, 10433, 10453, 10457, 10459, 10463, 10477, 10487, 10499, 10501, 10513, 10529, 10531, 10559, 10567, 10589, 10597, 10601, 10607, 10613, 10627, 10631, 10639, 10651, 10657, 10663, 10667, 10687, 10691, 10709, 10711, 10723, 10729, 10733, 10739, 10753, 10771, 10781, 10789, 10799, 10831, 10837, 10847, 10853, 10859, 10861, 10867, 10883, 10889, 10891, 10903, 10909, 10937, 10939, 10949, 10957, 10973, 10979, 10987, 10993, 11003, 11027, 11047, 11057, 11059, 11069, 11071, 11083, 11087, 11093, 11113, 11117, 11119, 11131, 11149, 11159, 11161, 11171, 11173, 11177, 11197, 11213, 11239, 11243, 11251, 11257, 11261, 11273, 11279, 11287, 11299, 11311, 11317, 11321, 11329, 11351, 11353, 11369, 11383, 11393, 11399, 11411, 11423, 11437, 11443, 11447, 11467, 11471, 11483, 11489, 11491, 11497, 11503, 11519, 11527, 11549, 11551, 11579, 11587, 11593, 11597, 11617, 11621, 11633, 11657, 11677, 11681, 11689, 11699, 11701, 11717, 11719, 11731, 11743, 11777, 11779, 11783, 11789, 11801, 11807, 11813, 11821, 11827, 11831, 11833, 11839, 11863, 11867, 11887, 11897, 11903, 11909, 11923, 11927, 11933, 11939, 11941, 11953, 11959, 11969, 11971, 11981, 11987, 12007, 12011, 12037, 12041, 12043, 12049, 12071, 12073, 12097, 12101, 12107, 12109, 12113, 12119, 12143, 12149, 12157, 12161, 12163, 12197, 12203, 12211, 12227, 12239, 12241, 12251, 12253, 12263, 12269, 12277, 12281, 12289, 12301, 12323, 12329, 12343, 12347, 12373, 12377, 12379]

export class ChurchillEngine implements Engine<ChurchillState, ChurchillMove> {
	public movesForState(state: ChurchillState): ChurchillMove[] {
		const result: ChurchillMove[] = []

		/* Deck */
		if (state.deck.length) {
			let found = false
			for (const stack of state.stacks) {
				if (!stackIsLeadByKing(stack)) {
					found = true
					break
				}
			}
			
			if (found) {
				result.push({ type: ChurchillMoveType.DECK })
			} else {
				console.log('CANT DECK!')
			}
		}

		const nextVictoryCards = getNextVictoryCards(state)

		/* Devils */
		if (state.devils.length) {
			const next = state.devils.peek()!
			if (nextVictoryCards.find(c => cardIsEqual(c, next))) {
				const devilMove = { type: ChurchillMoveType.DEVIL }
				result.push(devilMove)

				/* If the move is for an Ace, always do it */
				if (next.face === Face.ACE) {
					return [devilMove]
				}
			}
		}

		/* Victory */
		let i = 0
		for (const stack of state.stacks) {
			if (stack.open.length) {
				const next = stack.open.peek()!
				if (nextVictoryCards.find(c => cardIsEqual(c, next))) {
					const victoryMove: ChurchillVictoryMove = {
						type: ChurchillMoveType.VICTORY,
						from: i,
						card: next,
					}
					result.push(victoryMove)

					/* If the move is for an Ace, always do it */
					if (next.face === Face.ACE) {
						return [victoryMove]
					}
				}
			}

			i++
		}

		/* Column */
		const bottomOfStacks = state.stacks.map(stack => stack.open.peek())
		for (let stackIndex = 0; stackIndex < state.stacks.length; stackIndex++) { /* For each stack */
			const stack = state.stacks[stackIndex]
			let previousCard: Card | undefined = undefined
			for (let count = 1; count <= stack.open.length; count++) {
				const card = stack.open[stack.open.length - count]
				if (previousCard && !checkMovable(card, previousCard)) {
					break
				}

				const notOnList = state.notOn.get(card.id)

				const columnMoves: ChurchillColumnMove[] = []
				OTHER: for (let otherStackIndex = 0; otherStackIndex < bottomOfStacks.length; otherStackIndex++) {
					if (stackIndex !== otherStackIndex) {
						const target = bottomOfStacks[otherStackIndex]
						if (checkStackable(card, target)) {
							
							
							
							if (notOnList) {
								for (const other of notOnList) {
									if ((target && other === target.id) || (!target && other === state.stacks[otherStackIndex].id)) {
										// console.log('AVOID LOOP')
										continue OTHER
									}
								}
							}

							/* Avoid repeating ourselves by returning a card back */
							// if (card.id === state.stacks[otherStackIndex].lastCardRemoved) {
							// 	console.log('REPEAT')
							// 	continue
							// }

							// TODO prevent king-lead column moves unless they move either side of a non-king lead column

							const columnMove: ChurchillColumnMove = {
								type: ChurchillMoveType.COLUMN,
								from: stackIndex,
								to: otherStackIndex,
								count,
								card,
								cardTo: target,
								notCardTo: [],
							}
							columnMoves.push(columnMove)
						}
					}
				}

				for (let i = 0; i < columnMoves.length; i++) {
					for (let j = 0; j < columnMoves.length; j++) {
						// if (i !== j) {
						const otherMove = columnMoves[j]
						/* If there are multiple places this card could move, block the other choices if we choose this move */
						columnMoves[i].notCardTo.push(otherMove.cardTo ? otherMove.cardTo.id : state.stacks[otherMove.to].id)
						// }
					}

					// TODO if we're moving more than 1 card, let's also block moves of fewer cards, so we avoid visiting
					// extra states.

					// TODO prevent move backs where we move off and then back

					/* Now that we've moved a card onto another, prevent us repeating that in decendants of this
					   move, to avoid infinite loops.
					 */
					// const move = columnMoves[i]
					// move.notCardTo.push(move.cardTo ? move.cardTo.id : state.stacks[move.to].id)
				}

				result.push(...columnMoves)
				// console.log('number of column moves', columnMoves.length)

				previousCard = card
			}
		}

		return result
	}
	
	public scoreForState(state: ChurchillState): number {
		if (checkComplete(state)) {
			return END
		}

		if (checkUncoveredUnknownCard(state)) {
			return END
		}

		let result = 0

		/* The more cards in the victory row the better */
		const VICTORY_FACTOR = 3.0
		result += state.victory.reduce((total, card) => total + card.face, 0) * VICTORY_FACTOR

		/* The more cards you've drawn the better (a little) */
		const DECK_FACTOR = 1.5 /* We deal ~ 10 cards each time and at worst create 10 new runs */
		result -= state.deck.length * DECK_FACTOR

		/* The fewer cards in the devils row the better */
		result -= state.devils.length

		/* The more and longer stacks starting with kings the better */
		const KING_COLUMN_FACTOR = 2.0
		result += state.stacks.reduce((total, stack) => total + (!stack.closed.length && stack.open.length && stack.open[0].face === Face.KING ? stack.open.length * KING_COLUMN_FACTOR : 0), 0)

		/* The fewer separate runs the better */
		const RUN_FACTOR = 2.0
		result -= state.stacks.reduce((total, stack) => total + countRunsInStack(stack), 0) * RUN_FACTOR

		/* TODO It's worse to have more runs on top of closed cards as it makes them harder to reveal */

		/* The fewer closed cards the better */
		const CLOSED_CARD_FACTOR = 2.0
		result -= state.stacks.reduce((total, stack) => total + stack.closed.length, 0) * CLOSED_CARD_FACTOR

		/* Make sure we never accidentally return END as our score */
		if (result === END) {
			result -= 1
		}
		return result
	}

	public applyMoveToState(move: ChurchillMove, state: ChurchillState): ChurchillState {
		switch (move.type) {
			case ChurchillMoveType.DECK:
				return applyDeckMoveToState(state)
			case ChurchillMoveType.VICTORY:
				return applyVictoryMoveToState(move as ChurchillVictoryMove, state)
			case ChurchillMoveType.DEVIL:
				return applyDevilMoveToState(state)
			case ChurchillMoveType.COLUMN:
				return applyColumnMoveToState(move as ChurchillColumnMove, state)
			default:
				throw new Error(`Move type not supported: ${move.type}`)
		}
	}

	public serializeState(state: ChurchillState) {
		return hash(debugChurchillState(state))
		// let result = 0
		// let primeIndex = 0
		// result += Math.pow(primes[primeIndex++], state.deck.length)
		// result += Math.pow(primes[primeIndex++], state.devils.length)
		// for (const card of state.victory) {
		// 	result += Math.pow(primes[primeIndex++], cardToNumber(card))
		// }
		// for (const stack of state.stacks) {
		// 	for (const card of stack.closed) {
		// 		result += Math.pow(primes[primeIndex++], cardToNumber(card))
		// 	}
		// 	for (const card of stack.open) {
		// 		result += Math.pow(primes[primeIndex++], cardToNumber(card))
		// 	}
		// }
		
		// if (primeIndex >= primes.length) {
		// 	throw new Error('Ran out of primes')
		// }
		// return result
	}

	public stateToString(state: ChurchillState): string {
		return debugChurchillState(state)
	}

	public moveToString(move: ChurchillMove): string {
		switch (move.type) {
			case ChurchillMoveType.DECK:
				return 'DECK'
			case ChurchillMoveType.DEVIL:
				return 'DEVIL'
			case ChurchillMoveType.VICTORY:
				return `${cardToString(move.card!)} from #${move.from! + 1} to victory`
			case ChurchillMoveType.COLUMN:
				// move.notCardTo
				return `${cardToString(move.card!)}${move.count! > 1 ? ' +' + (move.count! - 1) : ''}${move.cardTo ? ' to ' + cardToString(move.cardTo) : ''} (from #${move.from! + 1} to #${move.to! + 1})`
		}
	}

}

function cardToNumber(card: Card) {
	return card.suit * (Face.KING + 1) + card.face
}

function checkComplete(state: ChurchillState): boolean {
	if (state.victory.length !== 8) {
		return false
	}

	for (const card of state.victory) {
		if (card.face !== Face.KING) {
			return false
		}
	}

	return true
}

function checkUncoveredUnknownCard(state: ChurchillState): boolean {
	for (const stack of state.stacks) {
		if (stack.open.length && stack.open[stack.open.length - 1].face === Face.UNKNOWN) {
			return true
		}
	}

	return false
}

/**
 * Returns `true` if the card can be placed on the stack.
 * @param card The card to stack
 * @param bottomOfStack The card on the bottom of the target stack, or undefined if the stack is empty
 */
function checkStackable(card: Card, bottomOfStack: Card | undefined): boolean {
	/* Only kings can move to empty stacks */
	if (bottomOfStack === undefined) {
		return card.face === Face.KING
	}

	/* Aces must go to the victory row */
	if (card.face === Face.ACE) {
		return false
	}

	const cardColour = suitToColour(card.suit)
	const bottomOfStackColour = suitToColour(bottomOfStack.suit)
	return (cardColour !== bottomOfStackColour && card.face + 1 === bottomOfStack.face)
}

/**
 * Returns `true` if it is possible to move a substack starting with `card` and with the
 * given next card, assuming all cards after it in the substack have also been checked.
 * @param card The top card of the substack to move
 * @param nextCard The next card of the substack to move
 */
function checkMovable(card: Card, nextCard: Card) {
	return checkStackable(nextCard, card)
}

/**
 * Returns the number of separate runs of cards in the open part of the given stack.
 * @param stack 
 */
function countRunsInStack(stack: CardStack): number {
	let result = 0
	let previous: Card | undefined
	for (const card of stack.open) {
		if (previous) {
			if (!checkMovable(previous, card)) {
				result += 1
			}
		} else {
			result += 1
		}
		previous = card
	}
	return result
}

function nextVictoryCard(card: Card): Card | undefined {
	if (card.face === Face.KING) {
		return undefined
	}

	return {
		id: -1,
		suit: card.suit,
		face: card.face + 1,
	}
}

function getNextVictoryCards(state: ChurchillState): Card[] {
	const result: Card[] = []
	for (const card of state.victory) {
		const next = nextVictoryCard(card)
		if (next) {
			result.push(next)
		}
	}
	return result
}

function applyDeckMoveToState(state: ChurchillState): ChurchillState {
	return produce(state, draft => {
		for (const stack of draft.stacks) {
			if (draft.deck.length === 0) {
				break
			}
			if (stackIsLeadByKing(stack)) {
				continue
			}
	
			const card = draft.deck.pop()!
			stack.open.push(card)

			/* We reset the noOn map after drawing as it can be useful to move things around in between
			   deck draws as new cards fall.
			 */
			draft.notOn = new Map()
			// stack.lastCardRemoved = undefined
		}
	})
}

function applyVictoryMoveToState(move: ChurchillVictoryMove, state: ChurchillState): ChurchillState {
	return produce(state, draft => {
		const stack = draft.stacks[move.from]
		const card = stack.open.pop()!

		/* Open a closed card if appropriate */
		if (stack.open.length === 0 && stack.closed.length) {
			stack.open.push(stack.closed.pop()!)
		}

		// stack.lastCardRemoved = undefined

		let placed = false
		for (let i = 0; i < draft.victory.length; i++) {
			const next = nextVictoryCard(draft.victory[i])
			if (next && cardIsEqual(card, next)) {
				draft.victory[i] = card
				placed = true
				break
			}
		}

		if (!placed) {
			throw new Error('Failed to complete victory move')
		}
	})
}

function applyDevilMoveToState(state: ChurchillState): ChurchillState {
	return produce(state, draft => {
		const card = draft.devils.pop()!

		let placed = false
		for (let i = 0; i < draft.victory.length; i++) {
			const next = nextVictoryCard(draft.victory[i])
			if (next && cardIsEqual(card, next)) {
				draft.victory[i] = card
				placed = true
				break
			}
		}

		if (!placed) {
			throw new Error('Failed to complete devil move')
		}
	})
}

function applyColumnMoveToState(move: ChurchillColumnMove, state: ChurchillState): ChurchillState {
	return produce(state, draft => {
		const fromStack = draft.stacks[move.from]
		const toStack = draft.stacks[move.to]

		const removed = fromStack.open.splice(fromStack.open.length - move.count, move.count)
		toStack.open.push(...removed)

		/* Open a closed card if appropriate */
		if (fromStack.open.length === 0 && fromStack.closed.length) {
			fromStack.open.push(fromStack.closed.pop()!)
			// fromStack.lastCardRemoved = undefined
		} else {
			// fromStack.lastCardRemoved = removed[0].id
		}

		for (const other of move.notCardTo) {
			let notOnList = draft.notOn.get(move.card.id)
			if (!notOnList) {
				notOnList = []
				draft.notOn.set(move.card.id, notOnList)
			}
			notOnList.push(other)
		}

		// toStack.lastCardRemoved = undefined
	})
}

function stackIsLeadByKing(stack: CardStack): boolean {
	if (stack.closed.length) {
		return false
	}

	if (!stack.open.length) {
		return false
	}

	return stack.open[0].face === Face.KING
}
