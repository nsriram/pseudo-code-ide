import { useRef } from 'react'
import styles from './PseudocodeEditor.module.css'

interface Props {
  value: string
  onChange: (value: string) => void
  onCompile: () => void
  errorLines: Set<number>
}

export function PseudocodeEditor({ value, onChange, onCompile, errorLines }: Props) {
  const lines = value.split('\n')
  const gutterRef = useRef<HTMLDivElement>(null)

  return (
    <div className={styles.container}>
      <div className={styles.editorWrapper}>
        <div className={styles.gutter} ref={gutterRef}>
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
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault()
              onCompile()
            }
          }}
          onScroll={(e) => {
            if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop
          }}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          placeholder="Write your pseudocode here..."
        />
      </div>
      <div className={styles.toolbar}>
        <button type="button" className={styles.compileButton} onClick={onCompile}>
          Compile
        </button>
      </div>
    </div>
  )
}