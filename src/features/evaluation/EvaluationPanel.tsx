import type { TestResult } from '../compiler/evaluate'
import styles from './EvaluationPanel.module.css'

interface Props {
  results: TestResult[]
}

function resultDetail(result: TestResult): string {
  if (result.error) return `Runtime error: ${result.error}`
  const inputStr = result.inputs.join(', ')
  if (result.passed) return `Inputs: [${inputStr}] → Output: "${result.actual}"`
  return `Inputs: [${inputStr}] — Expected: "${result.expected}", Got: "${result.actual}"`
}

function ResultRow({ result, index }: { result: TestResult; index: number }) {
  const label = result.label ?? `Test ${index + 1}`
  return (
    <li className={result.passed ? styles.pass : styles.fail}>
      <span className={styles.icon}>{result.passed ? '✓' : '✗'}</span>
      <span className={styles.label}>{label}</span>
      <span className={styles.detail}>{resultDetail(result)}</span>
    </li>
  )
}

export function EvaluationPanel({ results }: Props) {
  const passed = results.filter((r) => r.passed).length
  const total = results.length
  const allPassed = passed === total

  return (
    <section className={styles.panel} aria-label="Evaluation results">
      <header className={styles.header}>
        <span>Tests</span>
        <span className={allPassed ? styles.badgePass : styles.badgeFail}>
          {passed}/{total} passed
        </span>
      </header>
      <ul className={styles.list}>
        {results.map((r, i) => (
          <ResultRow key={i} result={r} index={i} />
        ))}
      </ul>
    </section>
  )
}