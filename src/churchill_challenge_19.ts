import ChurchillEngine, { createChurchillState, allCards } from './churchill'
import { solve, debugSolution } from '.'
import { sanityCheck } from './utils'

const initialState = createChurchillState({
	deck:
		'JS XH JC 7H 5H AC QD 4D QC 3D ' +
		'QS KC XC AD AH 2S 7S QH 8H AH ' +
		'4D JH XC 3H 9H JD 9D 6D XS KD ' +
		'AD 6D 4S 7D 7H QD 6C 2C AS JD ' +
		'4C 8S 7C 5D 7D KH 8D 5S 6H 9C ' +
		'5C 8C KS 6S KS 2H QH 4C 8C 4H ' +
		'AS 7S 5H XS 3S KH 9C 6S',
	devils: '8S 2D 9S XD 5C QC',
	stacks: [
		'|JC',
		'5D|4S',
		'9D KC|5S',
		'XD 3C 8D|8H',
		'4H 6C QS 2S|9S',
		'3D JS AC 3H|7C',
		'KD 3S 2D|9H',
		'JH 2H|2C',
		'XH|3C',
		'|6H',
	],
})

sanityCheck(allCards(initialState), 2)
const engine = new ChurchillEngine()
const result = solve(initialState, 0, engine)

if (result) {
	console.log(debugSolution(result, initialState, engine))
} else {
	console.log('Failed to find a solution')
}
