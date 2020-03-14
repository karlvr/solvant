import { Card, Face, CardStack, Engine, END, CardObjectId } from './types'
import { debugCardStacks, cardsToString, cardIsEqual, stringToCards, stringToCardStack, suitToColour, cardToString } from './utils'
import { produce } from 'immer'
import hash from 'object-hash'
import BigNumber from 'bignumber.js'

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

function packState(state: ChurchillState, b: BigNumber) {
	b = packCards(state.deck, b)
	b = packMagic(1, b)
	b = packCards(state.victory, b)
	b = packMagic(3, b)
	b = packCards(state.devils, b)
	b = packMagic(4, b)
	b = packCardStacks(state.stacks, b)
	return b
}

function packCardStacks(stacks: CardStack[], b: BigNumber) {
	for (const stack of stacks) {
		b = packCardStack(stack, b)
	}
	return b
}

function packCardStack(stack: CardStack, b: BigNumber) {
	b = packMagic(5, b)
	b = packCards(stack.closed, b)
	b = packMagic(2, b)
	b = packCards(stack.open, b)
	return b
}

function packCards(cards: Card[], b: BigNumber) {
	for (const card of cards) {
		b = packCard(card, b)
	}
	return b
}

function packCard(card: Card, b: BigNumber) {
	b = b.multipliedBy(32)
	b = b.plus(card.suit << 3 | card.face)
	return b
}

function packMagic(magic: number, b: BigNumber) {
	if (magic > 7) {
		throw new Error('bad magic')
	}
	b = b.multipliedBy(8)
	b = b.plus(magic)
	return b
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
	cardFrom?: Card
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

				/* A list of card and stack ids that `card` shouldn't be moved onto */
				const notOnList = state.notOn.get(card.id)

				const columnMoves: ChurchillColumnMove[] = []
				OTHER: for (let targetStackIndex = 0; targetStackIndex < bottomOfStacks.length; targetStackIndex++) {
					if (stackIndex !== targetStackIndex) {
						const target = bottomOfStacks[targetStackIndex]
						if (checkStackable(card, target)) {
							/* Found that `card` could be moved from `stack` onto `target` in stack `targetStackIndex`.
							   If `target` is `undefined` then the target stack is empty.
							 */
							
							if (notOnList) {
								if (target) {
									for (const notOn of notOnList) {
										if (notOn === target.id) {
											// console.log('AVOID LOOP')
											continue OTHER
										}
									}
								} else {
									const targetStackId = state.stacks[targetStackIndex].id
									for (const notOn of notOnList) {
										if (notOn === targetStackId) {
											// console.log('AVOID LOOP')
											continue OTHER
										}
									}
								}
							}

							/* Avoid repeating ourselves by returning a card back */
							// if (card.id === state.stacks[otherStackIndex].lastCardRemoved) {
							// 	console.log('REPEAT')
							// 	continue
							// }

							// TODO prevent king-lead column moves unless they move either side of a non-king lead column


							const cardFrom = stack.open.length > count ? stack.open[stack.open.length - count - 1] : undefined

							const columnMove: ChurchillColumnMove = {
								type: ChurchillMoveType.COLUMN,
								from: stackIndex,
								to: targetStackIndex,
								count,
								card,
								cardTo: target,
								cardFrom,
								notCardTo: [],
							}
							columnMoves.push(columnMove)
						}
					}
				}

				for (let i = 0; i < columnMoves.length; i++) {
					const move = columnMoves[i]
					for (let j = 0; j < columnMoves.length; j++) {
						// if (i !== j) {
						const otherMove = columnMoves[j]
						/* If there are multiple places this card could move, block the other choices if we choose this move */
						move.notCardTo.push(otherMove.cardTo ? otherMove.cardTo.id : state.stacks[otherMove.to].id)
						// }
					}

					// TODO if we're moving more than 1 card, let's also block moves of fewer cards, so we avoid visiting
					// extra states.

					/* Prevent move backs where we move off and then back */
					move.notCardTo.push(move.cardFrom ? move.cardFrom.id : state.stacks[move.from].id)

					/* Now that we've moved a card onto another, prevent us repeating that in decendants of this
					   move, to avoid infinite loops.
					 */
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
		const result = packState(state, new BigNumber(0))
		const stringResult = result.toFixed()
		return stringResult
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
