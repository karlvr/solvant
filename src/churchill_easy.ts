import ChurchillEngine, { createChurchillState } from './churchill'
import { solve, debugSolution } from '.'

const initialState = createChurchillState({
	deck:
		'3S 4S 5S 4H 3C AD 2D 9C XD ' +
		'7H JD 2H 3H JD 3C KH XH QC ' +
		'3D 8C 6C XH QD AH JC 9D 6S ' +
		'3S JS 4S 5D 7S AC QH 4D 6H ' +
		'5H 2H XS 8H 9S KD 4H 9H AD ' +
		'QS KC XC 7C 6H JH 5S 6D 3H ' +
		'8S 5C 2D 8S KC XC XS JH 7D ' +
		'QC 8D 5C 7C JS',
	devils: '4C 7H 5D 6S AS AC',
	stacks: [
		'|8D',
		'2S|3D',
		'KS 9S|4D',
		'8C 7S JC|KD',
		'QD 9D 2S KH|XD',
		'9H 8H 7D 9C|QS',
		'2C 2C 6D|AS',
		'5H AH|QH',
		'6C|4C',
		'|KS',
	],
})

const engine = new ChurchillEngine()
const result = solve(initialState, 0, engine)

if (result) {
	console.log(debugSolution(result, initialState, engine))
} else {
	console.log('Failed to find a solution')
}
