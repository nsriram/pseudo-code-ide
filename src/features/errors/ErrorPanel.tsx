import type { CompileError } from '../compiler/index'
import styles from './ErrorPanel.module.css'

export type { CompileError }

interface Props {
  errors: CompileError[]
  hasCompiled: boolean
  hasTestCases?: boolean
}

const SOURCE_LABEL: Record<CompileError['source'], string> = {
  lexer: 'Syntax',
  parser: 'Structure',
  validator: 'Semantic',
}

function PanelBody({ errors, hasCompiled, hasTestCases }: Props) {
  if (!hasCompiled) {
    return <p className={styles.idle}>Write your pseudocode and click Compile.</p>
  }
  if (errors.length === 0) {
    return (
      <>
        <p className={styles.success}>No syntax errors found.</p>
        {!hasTestCases && (
          <p className={styles.hint}>Manually verify your output matches the expected result.</p>
        )}
      </>
    )
  }
  return (
    <ul className={styles.errorList}>
      {errors.map((err, i) => (
        <li key={i} className={styles.errorItem}>
          <div className={styles.errorMeta}>
            <span className={styles.location}>
              Line {err.line}, Col {err.column}
            </span>
            <span className={styles.sourceTag}>{SOURCE_LABEL[err.source]}</span>
          </div>
          <span className={styles.message}>{err.message}</span>
        </li>
      ))}
    </ul>
  )
}

export function ErrorPanel({ errors, hasCompiled, hasTestCases }: Props) {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span>Output</span>
        {errors.length > 0 && (
          <span className={styles.errorCount}>
            {errors.length} error{errors.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className={styles.body}>
        <PanelBody errors={errors} hasCompiled={hasCompiled} hasTestCases={hasTestCases} />
      </div>
    </div>
  )
}