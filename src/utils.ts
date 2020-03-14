import { Card, CardStack, Face, Suit, Colour } from './types'

/** The id for the next card */
let nextId = 1

export function suitToColour(suit: Suit) {
	switch (suit) {
		case Suit.HEARTS:
		case Suit.DIAMONDS:
			return Colour.RED
		case Suit.CLUBS:
		case Suit.SPADES:
			return Colour.BLACK
		case Suit.UNKNOWN:
			return Colour.UNKNOWN
	}
}

export function cardIsEqual(a: Card, b: Card) {
	return a.suit === b.suit && a.face === b.face
}

function suitToString(suit: Suit): string {
	switch (suit) {
		case Suit.HEARTS: return '♥︎'
		case Suit.DIAMONDS: return '♦︎'
		case Suit.CLUBS: return '♣︎'
		case Suit.SPADES: return '♠︎'
		case Suit.UNKNOWN: return '?'
	}
}

function stringToSuit(suitString: string): Suit {
	switch (suitString) {
		case 'H':
		case '♥︎':
			return Suit.HEARTS
		case 'D': 
		case '♦︎':
			return Suit.DIAMONDS
		case 'C':
		case '♣︎':
			return Suit.CLUBS
		case 'S': 
		case '♠︎':
			return Suit.SPADES
		case '?': return Suit.UNKNOWN
	}

	throw new Error(`Invalid suit string: ${suitString}`)
}

function faceToString(face: Face): string {
	if (face === 0) {
		return '?'
	} else if (face === 1) {
		return 'A'
	} else if (face >= 2 && face <= 9) {
		return `${face}`
	} else if (face === 10) {
		return '⑩'
	} else if (face === 11) {
		return 'J'
	} else if (face === 12) {
		return 'Q'
	} else if (face === 13) {
		return 'K'
	} else {
		throw new Error(`Invalid Face: ${face}`)
	}
}

function stringToFace(faceString: string): Face {
	if (faceString === '?') {
		return 0
	} else if (faceString === 'A') {
		return 1
	} else if (faceString === 'X' || faceString === '⑩') {
		return 10
	} else if (faceString === 'J') {
		return 11
	} else if (faceString === 'Q') {
		return 12
	} else if (faceString === 'K') {
		return 13
	} else {
		const face = parseInt(faceString, 10)
		if (face >= 2 && face <= 9) {
			return face as Face
		} else {
			throw new Error(`Invalid face string: ${faceString}`)
		}
	}
}

export function cardToString(card: Card): string {
	return `${faceToString(card.face)}${suitToString(card.suit)}`
}

export function stringToCard(cardString: string): Card {
	if (cardString.length !== 2) {
		throw new Error(`Invalid card string: ${cardString}`)
	}

	return {
		suit: stringToSuit(cardString[1]),
		face: stringToFace(cardString[0]),
		id: nextId++,
	}
}

export function stringToCards(cardsString: string): Card[] {
	if (cardsString === '') {
		return []
	}

	const result: Card[] = []
	for (const cardString of cardsString.split(' ')) {
		result.push(stringToCard(cardString))
	}
	return result
}

export function cardsToString(cards: Card[]): string {
	return cards.map(cardToString).join(' ')
}

export function stringToCardStack(stackString: string): CardStack {
	const parts = stackString.split('|')
	if (parts.length !== 2) {
		throw new Error(`Invalid card stack string: ${stackString}`)
	}

	const result: CardStack = {
		id: nextId++,
		closed: stringToCards(parts[0]),
		open: stringToCards(parts[1]),
	}

	return result
}

export function debugCardStacks(cardStacks: CardStack[]): string {
	let result = ''
	let level = 0
	let foundCard = true
	while (foundCard) {
		foundCard = false

		for (const stack of cardStacks) {
			if (stack.closed.length > level) {
				result += '-- '
				foundCard = true
			} else if (level < stack.closed.length + stack.open.length) {
				result += cardToString(stack.open[level - stack.closed.length]) + ' '
				foundCard = true
			} else {
				result += '   '
			}
		}

		level += 1
		result += '\n'
	}

	return result
}

/** Check that the array of cards represents the given number of full decks. */
export function sanityCheck(cards: Card[], decks: number) {
	const errors: string[] = []
	const expectedCards = makeDecks(decks)
	for (const card of cards) {
		const found = expectedCards.findIndex(ex => cardIsEqual(ex, card))
		if (found !== -1) {
			expectedCards.splice(found, 1)
		} else if (card.face !== Face.UNKNOWN) {
			errors.push(`Found an unexpected ${cardToString(card)}`)
		}
	}

	for (const card of expectedCards) {
		errors.push(`Missing a ${cardToString(card)}`)
	}

	if (errors.length) {
		throw new Error(errors.join('\n'))
	}
}

function makeDecks(count: number): Card[] {
	const result: Card[] = []
	let id = 1
	for (let i = 0; i < count; i++) {
		for (const suit of [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES]) {
			for (let face = Face.ACE; face <= Face.KING; face++) {
				result.push({
					face,
					suit,
					id: id++,
				})
			}
		}
	}
	return result
}