export interface Engine<State, Move> {
	movesForState: (state: State) => Move[]
	scoreForState: (state: State, moves: number) => Score
	applyMoveToState: (move: Move, state: State) => State
	serializeState: (state: State) => SerializedState
	stateToString: (state: State) => string
	moveToString: (state: Move) => string
}

export type SerializedState = string

export type Score = number

export const START: Score = 0
export const END: Score = 1000000

export enum Colour {
	RED,
	BLACK,
	UNKNOWN,
}

export enum Suit {
	HEARTS,
	DIAMONDS,
	CLUBS,
	SPADES,

	/** An unknown card */
	UNKNOWN,
}

/** Card face values from Unknown, Ace to King */
// export type Face = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13

export const enum Face {
	UNKNOWN = 0,
	ACE = 1,
	TWO = 2,
	THREE = 3,
	FOUR = 4,
	FIVE = 5,
	SIX = 6,
	SEVEN = 7,
	EIGHT = 8,
	NINE = 9,
	TEN = 10,
	JACK = 11,
	QUEEN = 12,
	KING = 13,
}

export type CardObjectId = number

export interface Card {
	id: CardObjectId
	suit: Suit
	face: Face
}

export interface CardStack {
	id: CardObjectId

	/** The face down cards at the top of the stack, in order from top to bottom */
	closed: Card[]

	/** The face up cards at the bottom of the stack, in order from top to bottom */
	open: Card[]
}
