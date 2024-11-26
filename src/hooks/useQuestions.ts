import { useUserStore } from '@/stores/user'
import type { Question, QuestionResponse, Response } from '@/types'
import { ref, shallowRef } from 'vue'
import axios from '@/axios'

export function useQuestions(historyID: number) {
  const { name } = useUserStore()

  const isFetching = ref(true)
  const questions = shallowRef([] as Question[])
  const error = ref('')

  const controller = new AbortController()
  const signal = controller.signal

  axios
    .get<Response<QuestionResponse[]>>(`/questions`, {
      method: 'get',
      data: { history_id: historyID, username: name },
      signal,
    })
    .then((response) => {
      return response.data.data.map((question) => ({
        id: question.qid,
        content: question.content,
        explanation: question.explanation,
        difficulty: question.difficulty,
        time_required: question.time_require,
        answer: question.correct_answers,
        options: [question.option1, question.option2, question.option3, question.option4],
        note: question.note,
        type: question.type,
      }))
    })
    .then((q) => {
      questions.value = q
    })
    .catch((err) => {
      error.value = err.toString()
    })
    .finally(() => {
      isFetching.value = false
    })

  const cancel = () => {
    if (controller) {
      controller.abort()
    }
  }

  return { questions, error, isFetching, cancel }
}
