import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NewQuestionBar, QuestionContent } from './QuestionPanel'
import type { Question } from './useQuestion'

const mockQuestion: Question = {
  id: 'q001',
  difficulty: 'simple',
  title: 'Sum of Two Numbers',
  context: 'A student needs a program to add two numbers together.',
  ask: 'Write pseudocode to input two integers and output their sum.',
}

const mockQuestionNoContext: Question = {
  id: 'q002',
  difficulty: 'intermediate',
  title: 'Find Maximum',
  context: '',
  ask: 'Write pseudocode to find the largest value in an array.',
}

describe('NewQuestionBar', () => {
  it('renders the New Question button', () => {
    render(<NewQuestionBar onNext={vi.fn()} />)
    expect(screen.getByRole('button', { name: /new question/i })).toBeInTheDocument()
  })

  it('calls onNext when New Question button is clicked', async () => {
    const onNext = vi.fn()
    render(<NewQuestionBar onNext={onNext} />)
    await userEvent.click(screen.getByRole('button', { name: /new question/i }))
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('New Question button is visible', () => {
    render(<NewQuestionBar onNext={vi.fn()} />)
    expect(screen.getByRole('button', { name: /new question/i })).toBeVisible()
  })
})

describe('QuestionContent', () => {
  it('renders the question title', () => {
    render(<QuestionContent question={mockQuestion} />)
    expect(screen.getByText('Sum of Two Numbers')).toBeInTheDocument()
  })

  it('renders the difficulty badge', () => {
    render(<QuestionContent question={mockQuestion} />)
    expect(screen.getByText('simple')).toBeInTheDocument()
  })

  it('renders the context text', () => {
    render(<QuestionContent question={mockQuestion} />)
    expect(screen.getByText(mockQuestion.context)).toBeInTheDocument()
  })

  it('renders the ask text', () => {
    render(<QuestionContent question={mockQuestion} />)
    expect(screen.getByText(mockQuestion.ask)).toBeInTheDocument()
  })

  it('renders the Task label above the ask', () => {
    render(<QuestionContent question={mockQuestion} />)
    expect(screen.getByText('Task')).toBeInTheDocument()
  })

  it('does not render context paragraph when context is empty', () => {
    render(<QuestionContent question={mockQuestionNoContext} />)
    expect(screen.queryByTestId('question-context')).not.toBeInTheDocument()
  })
})