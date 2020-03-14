import ChurchillEngine, { createChurchillState } from './churchill'
import { solve, debugSolution } from '.'

const initialState = createChurchillState({
	deck:
		'AS 3C XH KD 6S 5D 2D 5H 8D JD ' +
		'5S QH KC QD XD AH 3D 8S 4C QC ' +
		'7S XC 8H AC 9S 5D 8S 5H XS AC ' +
		'2S 7H 2C 6C 6H 3S 2S 8C KH QS ' +
		'8D 6H 5C KH JC KS 9H 9D 4C JC ' +
		'AH 6D 4H AS KC XH KD QD QH 9C ' +
		'7C AD KS 7H AD 5S 9H XC',
	devils: 'JS 3C 8C JH 9D 3H',
	stacks: [
		'|3H',
		'3S|6C',
		'4S JH|4D',
		'2H 7D 9S|QC',
		'XS 7S JS 9C|6S',
		'2H 2D 2C 7D|XD',
		'3D QS 4D|5C',
		'6D 4H|7C',
		'8H|4S',
		'|JD',
	],
})

const engine = new ChurchillEngine()
const result = solve(initialState, 0, engine)

if (result) {
	console.log(debugSolution(result, initialState, engine))
} else {
	console.log('Failed to find a solution')
}
