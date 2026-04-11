import { describe, it, expect } from 'vitest'
import questions from '../src/features/questions/questions.json'

const VALID_DIFFICULTIES = ['simple', 'intermediate', 'complex'] as const
type Difficulty = (typeof VALID_DIFFICULTIES)[number]

interface Question {
  id: string
  difficulty: Difficulty
  title: string
  context: string
  ask: string
}

describe('questions.json', () => {
  it('contains exactly 50 questions', () => {
    expect(questions).toHaveLength(50)
  })

  it('contains 20 simple questions', () => {
    expect(questions.filter((q) => q.difficulty === 'simple')).toHaveLength(20)
  })

  it('contains 20 intermediate questions', () => {
    expect(questions.filter((q) => q.difficulty === 'intermediate')).toHaveLength(20)
  })

  it('contains 10 complex questions', () => {
    expect(questions.filter((q) => q.difficulty === 'complex')).toHaveLength(10)
  })

  it('all questions have unique ids', () => {
    const ids = questions.map((q) => q.id)
    expect(new Set(ids).size).toBe(questions.length)
  })

  it('all questions have unique titles', () => {
    const titles = questions.map((q) => q.title)
    expect(new Set(titles).size).toBe(questions.length)
  })

  it.each(questions as Question[])('question $id has all required fields', (q) => {
    expect(q.id).toBeTruthy()
    expect(q.difficulty).toBeTruthy()
    expect(q.title).toBeTruthy()
    expect(q.context).toBeTruthy()
    expect(q.ask).toBeTruthy()
  })

  it.each(questions as Question[])('question $id has a valid difficulty', (q) => {
    expect(VALID_DIFFICULTIES).toContain(q.difficulty)
  })

  it.each(questions as Question[])('question $id has non-empty ask text', (q) => {
    expect(q.ask.trim().length).toBeGreaterThan(10)
  })

  it.each(questions as Question[])('question $id has a multi-sentence context', (q) => {
    expect(q.context.trim().length).toBeGreaterThan(30)
  })

  it('ids follow the q001–q050 format', () => {
    const idPattern = /^q0[0-4]\d$|^q050$/
    questions.forEach((q) => {
      expect(q.id).toMatch(idPattern)
    })
  })

  it('questions are ordered by id', () => {
    const ids = questions.map((q) => q.id)
    const sorted = [...ids].sort()
    expect(ids).toEqual(sorted)
  })
})