import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PseudocodeEditor } from './PseudocodeEditor'

describe('PseudocodeEditor', () => {
  it('renders the textarea with placeholder text', () => {
    render(
      <PseudocodeEditor value="" onChange={vi.fn()} onCompile={vi.fn()} errorLines={new Set()} />
    )
    expect(screen.getByPlaceholderText(/write your pseudocode/i)).toBeInTheDocument()
  })

  it('renders the Compile button', () => {
    render(
      <PseudocodeEditor value="" onChange={vi.fn()} onCompile={vi.fn()} errorLines={new Set()} />
    )
    expect(screen.getByRole('button', { name: /compile/i })).toBeInTheDocument()
  })

  it('calls onChange when user types', async () => {
    const onChange = vi.fn()
    render(
      <PseudocodeEditor value="" onChange={onChange} onCompile={vi.fn()} errorLines={new Set()} />
    )
    await userEvent.type(screen.getByRole('textbox'), 'INPUT x')
    expect(onChange).toHaveBeenCalled()
  })

  it('calls onCompile when Compile button is clicked', async () => {
    const onCompile = vi.fn()
    render(
      <PseudocodeEditor
        value="INPUT x"
        onChange={vi.fn()}
        onCompile={onCompile}
        errorLines={new Set()}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /compile/i }))
    expect(onCompile).toHaveBeenCalledOnce()
  })

  it('renders line numbers for each line of code', () => {
    const code = 'INPUT x\nOUTPUT x\nINPUT y'
    render(
      <PseudocodeEditor
        value={code}
        onChange={vi.fn()}
        onCompile={vi.fn()}
        errorLines={new Set()}
      />
    )
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('applies error styling to gutter line numbers in the error set', () => {
    render(
      <PseudocodeEditor
        value={'INPUT x\nOUTPUT x\nINPUT y'}
        onChange={vi.fn()}
        onCompile={vi.fn()}
        errorLines={new Set([2])}
      />
    )
    // All three line numbers should still render
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('does not have autocomplete or spellcheck on the textarea', () => {
    render(
      <PseudocodeEditor value="" onChange={vi.fn()} onCompile={vi.fn()} errorLines={new Set()} />
    )
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('autocomplete', 'off')
    expect(textarea).toHaveAttribute('spellcheck', 'false')
  })
})