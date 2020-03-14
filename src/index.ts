import { Engine, Score, Solution, SerializedState, END, START } from './types'
import * as _ from 'lodash'
import { pushAtSortPosition } from 'array-push-at-sort-position'
import QuickLRU from 'quick-lru'

export interface Solution<Move> {
	score: Score
	moves: number
	lastMove?: Move
	previous?: Solution<Move>
}

interface OpenSolution<State, Move> extends Solution<Move> {
	state: State
}

function compareSolutionScoresHighLow<Move>(a: Solution<Move>, b: Solution<Move>) {
	if (a.score === END && b.score === END) {
		return 0
	} else if (a.score === END) {
		return -1
	} else if (b.score === END) {
		return 1
	} else if (a.score > b.score) {
		return -1
	} else if (a.score < b.score) {
		return 1
	} else {
		return 0
	}
}

function compareSolutionScoresLowHigh<Move>(a: Solution<Move>, b: Solution<Move>) {
	if (a.score === b.score) {
		if (a.moves < b.moves) {
			return 1
		} else if (a.moves > b.moves) {
			return -1
		} else {
			return 0
		}
	} else if (a.score === END) {
		return 1
	} else if (b.score === END) {
		return -1
	} else if (a.score > b.score) {
		return 1
	} else if (a.score < b.score) {
		return -1
	} else {
		return 0
	}
}

function compareSolutionMoves<State, Move>(a: Solution<Move>, b: Solution<Move>) {
	if (a.moves < b.moves) {
		return -1
	} else if (a.moves > b.moves) {
		return 1
	} else {
		return 0
	}
}

function solutionToMoves<Move>(solution: Solution<Move>): Move[] {
	let previous: Solution<Move> | undefined = solution
	const moves: Move[] = []
	while (previous) {
		if (previous.lastMove) {
			moves.push(previous.lastMove)
		}
		previous = previous.previous
	}
	return moves.reverse()
}

export function debugSolution<State, Move>(solution: Solution<Move>, initialState: State, engine: Engine<State, Move>, omitMoves?: boolean, lastMoves?: number): string {
	let result = `${solution.moves} moves, score ${solution.score}\n`
	const moves = solutionToMoves(solution)
	if (!omitMoves) {
		let movesToShow = moves
		if (lastMoves && lastMoves < movesToShow.length) {
			movesToShow = movesToShow.slice(movesToShow.length - lastMoves)
		}
		result += movesToShow.map(move => engine.moveToString(move)).join('\n')
		result += '\n\n'
	}

	let state = initialState
	for (const move of moves) {
		state = engine.applyMoveToState(move, state)
	}
	
	result += engine.stateToString(state)

	return result
}

export function solve<State, Move>(initialState: State, maxSteps: number, engine: Engine<State, Move>): Solution<Move> | null {
	/* Keep track of states we've seen and what their score was */
	const seen: QuickLRU<SerializedState, Solution<Move>> = new QuickLRU({
		maxSize: 10000,
	})
	// const collisionTest: Map<SerializedState, State> = new Map()
	
	/* States we are still to consider moves from. Only new states are added. States are scored before being added. */
	const open: OpenSolution<State, Move>[] = []

	const winners: Solution<Move>[] = []

	open.push({
		state: initialState,
		score: START,
		moves: 0,
	})

	let steps = 0
	let bestMovesSoFar = 0
	let bestSolutionSoFar: Solution<Move> | undefined
	let alreadySeenCount = 0
	let improvedAlreadySeenCount = 0

	while (open.length) {
		// console.log(`Open size ${open.length}, seen size ${seen.size}`)
		const current = open.pop()!

		const moves = engine.movesForState(current.state)
		const newSolutions: Solution<Move>[] = []
		for (const move of moves) {
			const newState = engine.applyMoveToState(move, current.state)

			const newSerializedState = engine.serializeState(newState)

			// if (collisionTest.has(newSerializedState)) {
			// 	const collisionState = collisionTest.get(newSerializedState)
			// 	if (!_.isEqual(newState, collisionState)) {
			// 		console.log(`found collision ${engine.serializeState(newState)} vs ${engine.serializeState(collisionState!)}`)
			// 		console.log(engine.stateToString(newState))
			// 		console.log(engine.stateToString(collisionState!))
			// 		return null
			// 	} else {
			// 		// console.log('tested okay')
			// 	}
			// }
			// collisionTest.set(newSerializedState, newState)

			// console.log(`newSerializedState ${newSerializedState}`)
			const alreadySeen = seen.get(newSerializedState)
			if (alreadySeen) {
				if (alreadySeen.moves > current.moves + 1) {
					/* We have found a more efficient method to get to a state we've already been to,
					   so we update the existing solution.
					   */
					// console.log(`Improved moves from ${alreadySeen.moves} to ${current.moves + 1}`)

					alreadySeen.moves = current.moves + 1
					alreadySeen.lastMove = move
					alreadySeen.previous = current
					improvedAlreadySeenCount += 1
				}

				// console.log('Already seen')
				alreadySeenCount += 1
				continue
			}

			const newScore = engine.scoreForState(newState)
			const newSolution: OpenSolution<State, Move> = {
				state: newState,
				lastMove: move,
				moves: current.moves + 1,
				previous: current,
				score: newScore,
			}

			seen.set(newSerializedState, {
				moves: newSolution.moves,
				score: newSolution.score,
				lastMove: newSolution.lastMove,
				previous: newSolution.previous,
			})
				
			if (newScore === END) {
				winners.push(newSolution)
			} else {
				newSolutions.push(newSolution)
			}
		}

		/* Depth first */
		// open.push(...newSolutions.sort(compareSolutionScoresLowHigh)) 

		/* Breadth first */
		for (const newSolution of newSolutions) {
			pushAtSortPosition(open, newSolution, compareSolutionScoresLowHigh, true)
		}

		/* Check sorting is working */
		// let prevScore = open[0].score
		// for (const next of open) {
		// 	if (next.score < prevScore) {
		// 		throw new Error('Bad sort')
		// 	}
		// 	prevScore = next.score
		// }

		steps += 1
		if (steps % 10000 === 0) {
			console.log(`${steps} steps, ${open.length} open, ${seen.size} seen (${alreadySeenCount} avoided, ${improvedAlreadySeenCount} improved), ${winners.length} winners (best moves ${bestMovesSoFar})`)
			if (winners.length) {
				let bestMoves = 0
				let bestSolution: Solution<Move> | undefined
				for (const winner of winners) {
					if (bestMoves === 0 || winner.moves < bestMoves) {
						bestMoves = winner.moves
						bestSolution = winner
					}
				}

				if (bestMovesSoFar === 0 || bestMoves < bestMovesSoFar) {
					console.log(`Best move is ${bestMoves}`)
					console.log(debugSolution(bestSolution!, initialState, engine))

					bestMovesSoFar = bestMoves
					bestSolutionSoFar = bestSolution
				}
			}
			// console.log(debugSolution(current, engine))
		}

		if (steps % 10000 === 0) {
			console.log('Current solution')
			console.log(debugSolution(current, initialState, engine, false, 20))
		}
		// console.log('Current solution')
		// console.log(debugSolution(current, engine, true))
		if (maxSteps > 0 && steps >= maxSteps) {
			console.log(`Quitting after ${steps} steps with ${open.length} open states`)
			return current
		}
	}

	if (winners.length) {
		winners.sort(compareSolutionMoves)
		return winners[0]
	} else {
		console.log(`Failed to find a solution after ${steps} steps`)
		return null
	}
}
