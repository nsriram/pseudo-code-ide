import type { Question } from './useQuestion'
import styles from './QuestionPanel.module.css'

interface Props {
  question: Question
  onNext: () => void
}

export function QuestionPanel({ question, onNext }: Props) {
  return (
    <div className={styles.panel}>
      <div className={styles.titleBar}>
        <div className={styles.titleRow}>
          <span className={styles.badge}>{question.difficulty}</span>
          <span className={styles.title}>{question.title}</span>
        </div>
        <button className={styles.button} onClick={onNext}>
          New Question
        </button>
      </div>
      <div className={styles.body}>
        {question.context && (
          <p className={styles.context} data-testid="question-context">{question.context}</p>
        )}
        <div className={styles.askBlock}>
          <span className={styles.askLabel}>Task</span>
          <p className={styles.ask}>{question.ask}</p>
        </div>
      </div>
    </div>
  )
}