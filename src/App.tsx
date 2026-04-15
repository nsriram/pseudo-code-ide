import { useState } from 'react'
import { useQuestion } from './features/questions/useQuestion'
import { NewQuestionBar, QuestionContent } from './features/questions/QuestionPanel'
import { PseudocodeEditor } from './features/editor/PseudocodeEditor'
import { ErrorPanel } from './features/errors/ErrorPanel'
import { EvaluationPanel } from './features/evaluation/EvaluationPanel'
import type { CompileError } from './features/compiler/index'
import { compile } from './features/compiler/index'
import { evaluate } from './features/compiler/evaluate'
import type { TestResult } from './features/compiler/evaluate'
import styles from './App.module.css'

export default function App() {
  const { question, nextQuestion } = useQuestion()
  const [code, setCode] = useState('')
  const [errors, setErrors] = useState<CompileError[] | null>(null)
  const [evalResults, setEvalResults] = useState<TestResult[] | null>(null)

  function handleCompile() {
    const result = compile(code)
    setErrors(result.errors)
    // Auto-evaluate immediately on a clean compile when the question has test cases
    if (result.program && question.testCases?.length) {
      setEvalResults(evaluate(result.program, question.testCases))
    } else {
      setEvalResults(null)
    }
  }

  function handleNewQuestion() {
    nextQuestion()
    setCode('')
    setErrors(null)
    setEvalResults(null)
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
          <div aria-live="polite" aria-atomic="true">
            <ErrorPanel errors={errors ?? []} hasCompiled={errors !== null} hasTestCases={(question.testCases?.length ?? 0) > 0} />
            {evalResults !== null && <EvaluationPanel results={evalResults} />}
          </div>
        </div>
      </main>
    </div>
  )
}