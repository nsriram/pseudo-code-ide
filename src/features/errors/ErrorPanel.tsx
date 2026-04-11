import type { CompileError } from '../compiler/index'
import styles from './ErrorPanel.module.css'

export type { CompileError }

interface Props {
  errors: CompileError[]
}

const SOURCE_LABEL: Record<CompileError['source'], string> = {
  lexer: 'Syntax',
  parser: 'Structure',
  validator: 'Semantic',
}

export function ErrorPanel({ errors }: Props) {
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
        {errors.length === 0 ? (
          <p className={styles.success}>No errors found.</p>
        ) : (
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
        )}
      </div>
    </div>
  )
}