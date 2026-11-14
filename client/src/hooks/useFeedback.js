// Shares toast state and dismissal behavior across dashboard pages.
import { useCallback, useEffect, useRef, useState } from 'react'

export default function useFeedback() {
  const [feedback, setFeedback] = useState(null)
  const timeout = useRef(null)

  const dismiss = useCallback(() => {
    if (timeout.current) clearTimeout(timeout.current)
    timeout.current = null
    setFeedback(null)
  }, [])

  const notify = useCallback((message, type = 'success') => {
    if (timeout.current) clearTimeout(timeout.current)
    setFeedback({ id: Date.now(), message, type })
    timeout.current = setTimeout(() => {
      setFeedback(null)
      timeout.current = null
    }, 6000)
  }, [])

  useEffect(() => () => {
    if (timeout.current) clearTimeout(timeout.current)
  }, [])

  return { feedback, notify, dismiss }
}
