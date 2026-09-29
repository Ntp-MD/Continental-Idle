import { test } from 'vitest'
import assert from 'node:assert/strict'
import {
	incomeMultiplier,
	netOf,
	readReputation,
	REPUTATION_NEUTRAL,
} from '../../src/blueprint-editor/domain/economy/reputation'

test('an untested room reports the neutral standing, not a fabricated one', () => {
	const reading = readReputation(0, 0)
	assert.equal(reading.unproven, true)
	assert.equal(reading.score, REPUTATION_NEUTRAL)
	assert.equal(reading.multiplier, 0.85)
	assert.equal(netOf(1000, reading), 850)
})

test('every visit served is full trust, every visit lost is the floor', () => {
	assert.equal(readReputation(50, 0).score, 100)
	assert.equal(readReputation(50, 0).multiplier, 1)
	assert.equal(netOf(2640, readReputation(50, 0)), 2640)
	assert.equal(readReputation(0, 20).score, 0)
	assert.equal(readReputation(0, 20).multiplier, 0.5)
	assert.equal(netOf(1000, readReputation(0, 20)), 500)
})

test('half the crowd lost at a line halves the trust, in the middle of the band', () => {
	const reading = readReputation(10, 10)
	assert.equal(reading.servedShare, 0.5)
	assert.equal(reading.score, 50)
	assert.equal(reading.multiplier, 0.75)
	assert.equal(reading.unproven, false)
})

test('losing more guests never raises the score', () => {
	let previous = 101
	for (let walkOuts = 0; walkOuts <= 20; walkOuts++) {
		const score = readReputation(10, walkOuts).score
		assert.ok(score <= previous, `${walkOuts} walk-outs scored ${score}, above the previous ${previous}`)
		previous = score
	}
})

test('the multiplier band is closed, so a score cannot pay more than face value', () => {
	assert.equal(incomeMultiplier(100), 1)
	assert.equal(incomeMultiplier(150), 1)
	assert.equal(incomeMultiplier(0), 0.5)
	assert.equal(incomeMultiplier(-40), 0.5)
})
