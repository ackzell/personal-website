// The topic search WebMCP agents run over videos and episodes (app/utils/topicMatch.ts).
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { matchesTopic } from '../app/utils/topicMatch.ts'

test('every word must turn up, in any of the texts', () => {
  assert.ok(matchesTopic('vue testing', ['Testing in Vue', 'Season 2']))
  assert.ok(matchesTopic('nuxt', ['Episode 4', 'Intro', 'Moving to Nuxt']))
  assert.ok(!matchesTopic('vue react', ['Testing in Vue']))
})

test('case and accents do not matter', () => {
  assert.ok(matchesTopic('animacion', ['Animación con CSS']))
  assert.ok(matchesTopic('ANIMACIÓN', ['animacion con css']))
})

test('an empty query matches everything', () => {
  assert.ok(matchesTopic('  ', ['anything']))
})
