import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App', () => {
  it('renders a question title on load', () => {
    render(<App />)
    expect(screen.getByTestId('question-title')).toBeInTheDocument()
  })

  it('renders the pseudocode textarea', () => {
    render(<App />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders the Compile button', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /compile/i })).toBeInTheDocument()
  })

  it('renders the New Question button', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /new question/i })).toBeInTheDocument()
  })

  it('compiling valid code shows no errors', async () => {
    render(<App />)
    await userEvent.type(screen.getByRole('textbox'), 'DECLARE x : INTEGER\nINPUT x\nOUTPUT x')
    await userEvent.click(screen.getByRole('button', { name: /compile/i }))
    expect(screen.getByText(/no errors found/i)).toBeInTheDocument()
  })

  it('compiling invalid code shows an error', async () => {
    render(<App />)
    await userEvent.type(screen.getByRole('textbox'), 'OUTPUT undeclared')
    await userEvent.click(screen.getByRole('button', { name: /compile/i }))
    expect(screen.queryByText(/no errors found/i)).not.toBeInTheDocument()
  })

  it('clicking New Question changes the displayed question', async () => {
    render(<App />)
    const titleBefore = screen.getByTestId('question-title').textContent
    await userEvent.click(screen.getByRole('button', { name: /new question/i }))
    const titleAfter = screen.getByTestId('question-title').textContent
    expect(titleAfter).not.toBe(titleBefore)
  })

  it('clicking New Question clears the editor', async () => {
    render(<App />)
    await userEvent.type(screen.getByRole('textbox'), 'OUTPUT x')
    await userEvent.click(screen.getByRole('button', { name: /new question/i }))
    expect(screen.getByRole('textbox')).toHaveValue('')
  })

  it('shows idle prompt before any compilation', () => {
    render(<App />)
    expect(screen.getByText(/write your pseudocode/i)).toBeInTheDocument()
    expect(screen.queryByText(/no errors found/i)).not.toBeInTheDocument()
  })

  it('clicking New Question resets the output panel to idle after a compilation', async () => {
    render(<App />)
    // compile something with an error so the output panel has content
    await userEvent.type(screen.getByRole('textbox'), 'OUTPUT undeclared')
    await userEvent.click(screen.getByRole('button', { name: /compile/i }))
    expect(screen.queryByText(/no errors found/i)).not.toBeInTheDocument()
    // now click New Question — output should reset to the idle state (not "no errors found")
    await userEvent.click(screen.getByRole('button', { name: /new question/i }))
    expect(screen.getByText(/write your pseudocode/i)).toBeInTheDocument()
    expect(screen.queryByText(/no errors found/i)).not.toBeInTheDocument()
  })
})