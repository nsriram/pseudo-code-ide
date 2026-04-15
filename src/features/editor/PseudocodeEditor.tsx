import styles from './PseudocodeEditor.module.css'

interface Props {
  value: string
  onChange: (value: string) => void
  onCompile: () => void
  onRunTests?: () => void
  errorLines: Set<number>
}

export function PseudocodeEditor({ value, onChange, onCompile, onRunTests, errorLines }: Props) {
  const lines = value.split('\n')

  return (
    <div className={styles.container}>
      <div className={styles.editorWrapper}>
        <div className={styles.gutter}>
          {lines.map((_, i) => (
            <div
              key={i}
              className={`${styles.lineNumber} ${errorLines.has(i + 1) ? styles.errorLine : ''}`}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <textarea
          className={styles.textarea}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          placeholder="Write your pseudocode here..."
        />
      </div>
      <div className={styles.toolbar}>
        <button className={styles.compileButton} onClick={onCompile}>
          Compile
        </button>
        {onRunTests && (
          <button className={styles.runTestsButton} onClick={onRunTests}>
            Run Tests
          </button>
        )}
      </div>
    </div>
  )
}