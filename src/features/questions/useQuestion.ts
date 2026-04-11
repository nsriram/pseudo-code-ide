import { useState } from 'react'
import questions from './questions.json'

export interface Question {
  id: string
  difficulty: 'simple' | 'intermediate' | 'complex'
  title: string
  context: string
  ask: string
}

function pickRandom(current: Question): Question {
  const others = (questions as Question[]).filter((q) => q.id !== current.id)
  const pool = others.length > 0 ? others : (questions as Question[])
  return pool[Math.floor(Math.random() * pool.length)]
}

export function useQuestion() {
  const [question, setQuestion] = useState<Question>((questions as Question[])[0])

  function nextQuestion() {
    setQuestion((current) => pickRandom(current))
  }

  return { question, nextQuestion }
}
