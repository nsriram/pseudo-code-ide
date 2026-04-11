import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useQuestion } from './useQuestion'
import questions from './questions.json'

describe('useQuestion', () => {
  it('initialises with the first question', () => {
    const { result } = renderHook(() => useQuestion())
    expect(result.current.question.id).toBe(questions[0].id)
  })

  it('nextQuestion returns a different question when bank has more than one', () => {
    const { result } = renderHook(() => useQuestion())
    const initial = result.current.question.id
    act(() => result.current.nextQuestion())
    expect(result.current.question.id).not.toBe(initial)
  })

  it('question has required fields', () => {
    const { result } = renderHook(() => useQuestion())
    const q = result.current.question
    expect(q).toHaveProperty('id')
    expect(q).toHaveProperty('title')
    expect(q).toHaveProperty('context')
    expect(q).toHaveProperty('ask')
    expect(q).toHaveProperty('difficulty')
  })
})