import { useState } from 'react'
import { useQuestion } from './features/questions/useQuestion'
import { NewQuestionBar, QuestionContent } from './features/questions/QuestionPanel'
import { PseudocodeEditor } from './features/editor/PseudocodeEditor'
import { ErrorPanel } from './features/errors/ErrorPanel'
import type { CompileError } from './features/compiler/index'
import { compile } from './features/compiler/index'
import styles from './App.module.css'

export default function App() {
  const { question, nextQuestion } = useQuestion()
  const [code, setCode] = useState('')
  const [errors, setErrors] = useState<CompileError[] | null>(null)

  function handleCompile() {
    const result = compile(code)
    setErrors(result.errors)
  }

  function handleNewQuestion() {
    nextQuestion()
    setCode('')
    setErrors(null)
  }

  const errorLines = new Set((errors ?? []).map((e) => e.line))

  return (
    <div className={styles.layout}>
      <div className={styles.newQuestionBar}>
        <NewQuestionBar onNext={handleNewQuestion} />
      </div>
      <div className={styles.questionContent}>
        <QuestionContent question={question} />
      </div>
      <main className={styles.bottom}>
        <div className={styles.editorPane}>
          <PseudocodeEditor
            value={code}
            onChange={setCode}
            onCompile={handleCompile}
            errorLines={errorLines}
          />
        </div>
        <div className={styles.errorPane}>
          <ErrorPanel errors={errors ?? []} hasCompiled={errors !== null} />
        </div>
      </main>
    </div>
  )
}