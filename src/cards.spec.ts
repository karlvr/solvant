import { Suit, Face } from '../src/types'
import { stringToCard, stringToCards } from '../src/utils'

test('stringToCard', () => {
	expect(stringToCard('AH').suit).toEqual(Suit.HEARTS)
	expect(stringToCard('AH').face).toEqual(Face.ACE)
	expect(stringToCard('XS').suit).toEqual(Suit.SPADES)
	expect(stringToCard('XS').face).toEqual(Face.TEN)

})

test('stringToCards', () => {
	const cards = stringToCards('QD 4C 9H XS JD AS')
	expect(cards.length).toEqual(6)
	expect(cards[1].suit).toEqual(Suit.CLUBS)
})
