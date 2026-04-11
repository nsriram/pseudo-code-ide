import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuestionPanel } from './QuestionPanel'
import type { Question } from './useQuestion'

const mockQuestion: Question = {
  id: 'q001',
  difficulty: 'simple',
  title: 'Sum of Two Numbers',
  context: 'A student needs a program to add two numbers.',
  ask: 'Write pseudocode to input two integers and output their sum.',
}

describe('QuestionPanel', () => {
  it('renders the question title', () => {
    render(<QuestionPanel question={mockQuestion} onNext={vi.fn()} />)
    expect(screen.getByText('Sum of Two Numbers')).toBeInTheDocument()
  })

  it('renders the ask text', () => {
    render(<QuestionPanel question={mockQuestion} onNext={vi.fn()} />)
    expect(screen.getByText(mockQuestion.ask)).toBeInTheDocument()
  })

  it('renders the difficulty badge', () => {
    render(<QuestionPanel question={mockQuestion} onNext={vi.fn()} />)
    expect(screen.getByText('simple')).toBeInTheDocument()
  })

  it('calls onNext when New Question button is clicked', async () => {
    const onNext = vi.fn()
    render(<QuestionPanel question={mockQuestion} onNext={onNext} />)
    await userEvent.click(screen.getByRole('button', { name: /new question/i }))
    expect(onNext).toHaveBeenCalledOnce()
  })
})