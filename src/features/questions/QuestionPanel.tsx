import type { Question } from './useQuestion'
import styles from './QuestionPanel.module.css'

interface NewQuestionBarProps {
  onNext: () => void
}

export function NewQuestionBar({ onNext }: NewQuestionBarProps) {
  return (
    <div className={styles.newQuestionBar}>
      <button className={styles.button} onClick={onNext}>
        New Question
      </button>
    </div>
  )
}

interface QuestionContentProps {
  question: Question
}

export function QuestionContent({ question }: QuestionContentProps) {
  return (
    <div className={styles.questionContent}>
      <div className={styles.titleRow}>
        <span className={styles.badge}>{question.difficulty}</span>
        <span className={styles.title} data-testid="question-title">{question.title}</span>
      </div>
      <div className={styles.body}>
        {question.context && (
          <p className={styles.context} data-testid="question-context">
            {question.context}
          </p>
        )}
        <div className={styles.askBlock}>
          <span className={styles.askLabel}>Task</span>
          <p className={styles.ask}>{question.ask}</p>
        </div>
      </div>
    </div>
  )
}