import type { Question } from './useQuestion'
import styles from './QuestionPanel.module.css'

interface Props {
  question: Question
  onNext: () => void
}

export function QuestionPanel({ question, onNext }: Props) {
  return (
    <div className={styles.panel}>
      <div className={styles.content}>
        <span className={styles.badge}>{question.difficulty}</span>
        <span className={styles.title}>{question.title}</span>
        <span className={styles.ask}>{question.ask}</span>
      </div>
      <button className={styles.button} onClick={onNext}>
        New Question
      </button>
    </div>
  )
}