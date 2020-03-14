import { Face, END } from '../src/types'
import ChurchillEngine, { createChurchillState, debugChurchillState, ChurchillMoveType } from '../src/churchill'
import { solve, debugSolution } from '.'

test('move to victory', () => {
	const initialState = createChurchillState({
		deck: '',
		devils: '',
		stacks: [
			'|AH',
		],
	})

	const engine = new ChurchillEngine()
	const moves = engine.movesForState(initialState)
	expect(moves.length).toEqual(1)
	expect(moves[0].type).toEqual(ChurchillMoveType.VICTORY)

	const newState = engine.applyMoveToState(moves[0], initialState)
	// console.log(debugChurchillState(newState))
	expect(newState.stacks[0].open.length).toEqual(0)
	expect(newState.victory[0].face).toEqual(Face.ACE)
})

test('move to victory opens closed cards', () => {
	const initialState = createChurchillState({
		deck: '',
		devils: '',
		stacks: [
			'9D|AH',
		],
	})

	const engine = new ChurchillEngine()
	const moves = engine.movesForState(initialState)
	expect(moves.length).toEqual(1)
	expect(moves[0].type).toEqual(ChurchillMoveType.VICTORY)

	const newState = engine.applyMoveToState(moves[0], initialState)
	expect(newState.stacks[0].closed.length).toEqual(0)
	expect(newState.stacks[0].open.length).toEqual(1)
})

test('devil move', () => {
	const initialState = createChurchillState({
		deck: '',
		devils: 'AD',
		stacks: [],
	})

	const engine = new ChurchillEngine()
	const moves = engine.movesForState(initialState)
	expect(moves.length).toEqual(1)
	expect(moves[0].type).toEqual(ChurchillMoveType.DEVIL)

	const newState = engine.applyMoveToState(moves[0], initialState)
	// console.log(debugChurchillState(newState))
	expect(newState.devils.length).toEqual(0)
	expect(newState.victory[1].face).toEqual(Face.ACE)
})

test('column move', () => {
	const initialState = createChurchillState({
		deck: '',
		devils: '',
		stacks: [
			'|8C',
			'|9D',
			'|XH 9S',
			'|XC 9H',
		],
	})

	const engine = new ChurchillEngine()
	const moves = engine.movesForState(initialState)
	expect(moves.length).toEqual(2)

	expect(moves[0].type).toEqual(ChurchillMoveType.COLUMN)
	expect(moves[0].from).toEqual(0)
	expect(moves[0].to).toEqual(1)
	expect(moves[1].type).toEqual(ChurchillMoveType.COLUMN)
	expect(moves[1].from).toEqual(0)
	expect(moves[1].to).toEqual(3)

	const newState = engine.applyMoveToState(moves[0], initialState)
	// console.log(debugChurchillState(newState))
	expect(newState.stacks[0].open.length).toEqual(0)
	expect(newState.stacks[1].open.length).toEqual(2)
})

test('king move', () => {
	const initialState = createChurchillState({
		deck: '',
		devils: '',
		stacks: [
			'|',
			'|9D KH',
		],
	})

	const engine = new ChurchillEngine()
	const moves = engine.movesForState(initialState)
	expect(moves.length).toEqual(1)
	expect(moves[0].type).toEqual(ChurchillMoveType.COLUMN)
	expect(moves[0].from).toEqual(1)
	expect(moves[0].to).toEqual(0)
})

test('reveal closed cards', () => {
	const initialState = createChurchillState({
		deck: '',
		devils: '',
		stacks: [
			'AH|XD',
			'|JC',
		],
	})

	const engine = new ChurchillEngine()
	const moves = engine.movesForState(initialState)
	expect(moves.length).toEqual(1)
	expect(moves[0].type).toEqual(ChurchillMoveType.COLUMN)
	expect(moves[0].from).toEqual(0)
	expect(moves[0].to).toEqual(1)

	const newState = engine.applyMoveToState(moves[0], initialState)
	expect(newState.stacks[0].closed.length).toEqual(0)
	expect(newState.stacks[0].open.length).toEqual(1)
})

test('end game from devils', () => {
	const initialState = createChurchillState({
		deck: '',
		devils: 'KS',
		victory: 'KH KD KC QS KH KD KC KS',
		stacks: [
			'|',
		],
	})

	const engine = new ChurchillEngine()
	const moves = engine.movesForState(initialState)
	expect(moves.length).toEqual(1)
	expect(moves[0].type).toEqual(ChurchillMoveType.DEVIL)

	const completeState = engine.applyMoveToState(moves[0], initialState)
	expect(engine.scoreForState(completeState)).toEqual(END)

	const solution = solve(initialState, 0, engine)
	
	expect(solution).not.toBeNull()
})

test('end game 2', () => {
	const initialState = createChurchillState({
		deck: '',
		devils: 'KS KD',
		victory: 'QH JD JC QS KH KD KC KS',
		stacks: [
			'|KH QC',
			'|KC QD',
			'|',
		],
	})

	const engine = new ChurchillEngine()
	const solution = solve(initialState, 0, engine)
	
	expect(solution).not.toBeNull()
})

function testStacksScores(betterStacks: string[], worseStacks: string[]) {
	const state1 = createChurchillState({
		deck: '',
		devils: '',
		stacks: betterStacks,
	})
	const state2 = createChurchillState({
		deck: '',
		devils: '',
		stacks: worseStacks,
	})

	const engine = new ChurchillEngine()
	expect(engine.scoreForState(state1)).toBeGreaterThan(engine.scoreForState(state2))
}

test('score runs in stacks', () => {
	testStacksScores(['|XD 9C'], ['|XD 9H'])
	testStacksScores(['|XD 9C 8H'], ['|XD 9H'])
	testStacksScores(['|XD 9C 8H 7D'], ['|XD 9H JC'])
})
