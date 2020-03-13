import { Engine, Score, Solution, SerializedState, END, START } from './types'
import * as _ from 'lodash'
import { pushAtSortPosition } from 'array-push-at-sort-position'
import QuickLRU from 'quick-lru'

function compareSolutionScoresHighLow<State, Move>(a: Solution<State, Move>, b: Solution<State, Move>) {
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

function compareSolutionScoresLowHigh<State, Move>(a: Solution<State, Move>, b: Solution<State, Move>) {
	if (a.score === END && b.score === END) {
		return 0
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

function compareSolutionMoves<State, Move>(a: Solution<State, Move>, b: Solution<State, Move>) {
	if (a.moves < b.moves) {
		return -1
	} else if (a.moves > b.moves) {
		return 1
	} else {
		return 0
	}
}

export function debugSolution<State, Move>(solution: Solution<State, Move>, engine: Engine<State, Move>, omitMoves?: boolean, lastMoves?: number): string {
	let result = `${solution.moves} moves, score ${solution.score}\n`
	if (!omitMoves) {
		let previous: Solution<State, Move> | undefined = solution
		const moves: Move[] = []
		while (previous && (!lastMoves || moves.length < lastMoves)) {
			if (previous.move) {
				moves.push(previous.move)
			}
			previous = previous.previous
		}
		result += moves.reverse().map(move => engine.moveToString(move)).join('\n')
		result += '\n\n'
	}
	result += engine.stateToString(solution.state)

	return result
}

export function solve<State, Move>(initialState: State, maxSteps: number, engine: Engine<State, Move>): Solution<State, Move> | null {
	/* Keep track of states we've seen and what their score was */
	const seen: QuickLRU<SerializedState, Solution<State, Move>> = new QuickLRU({
		maxSize: 10000,
	})
	// const collisionTest: Map<SerializedState, State> = new Map()
	
	/* States we are still to consider moves from. Only new states are added. States are scored before being added. */
	const open: Solution<State, Move>[] = []

	const winners: Solution<State, Move>[] = []

	open.push({
		state: initialState,
		moves: 0,
		score: START,
	})

	let steps = 0
	let bestMovesSoFar = 0
	let bestSolutionSoFar: Solution<State, Move> | undefined
	let alreadySeenCount = 0

	while (open.length) {
		// console.log(`Open size ${open.length}, seen size ${seen.size}`)
		const current = open.pop()!

		const moves = engine.movesForState(current.state)
		const newSolutions: Solution<State, Move>[] = []
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
					/* We have found a more efficient method to get to this state */
					// console.log(`Improved moves from ${alreadySeen.moves} to ${current.moves + 1}`)

					alreadySeen.moves = current.moves + 1
					alreadySeen.move = move
					alreadySeen.previous = current
				}

				// console.log('Already seen')
				alreadySeenCount += 1
				continue
			}

			const newScore = engine.scoreForState(newState)
			const newSolution: Solution<State, Move> = {
				state: newState,
				move,
				moves: current.moves + 1,
				previous: current,
				score: newScore,
			}

			seen.set(newSerializedState, newSolution)
				
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

		/* Sort open to look at best solutions first */
		// open.sort(compareSolutionScores).reverse()

		/* Check sorting is working */
		// let prevScore = open[0].score
		// for (const next of open) {
		// 	if (next.score > prevScore) {
		// 		throw new Error('Bad sort')
		// 	}
		// 	prevScore = next.score
		// }
		// console.log(`first ${open[0].score} last ${open[open.length - 1].score}`)

		steps += 1
		if (steps % 10000 === 0) {
			console.log(`${steps} steps, ${open.length} open, ${seen.size} seen (${alreadySeenCount} avoided), ${winners.length} winners (best moves ${bestMovesSoFar})`)
			if (winners.length) {
				let bestMoves = 0
				let bestSolution: Solution<State, Move> | undefined
				for (const winner of winners) {
					if (bestMoves === 0 || winner.moves < bestMoves) {
						bestMoves = winner.moves
						bestSolution = winner
					}
				}

				if (bestMovesSoFar === 0 || bestMoves < bestMovesSoFar) {
					console.log(`Best move is ${bestMoves}`)
					console.log(debugSolution(bestSolution!, engine))

					bestMovesSoFar = bestMoves
					bestSolutionSoFar = bestSolution
				}
			}
			// console.log(debugSolution(current, engine))
		}

		if (steps % 10000 === 0) {
			console.log('Current solution')
			console.log(debugSolution(current, engine, false, 20))
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
