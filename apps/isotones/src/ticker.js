// A steady 25 ms tick for the step schedulers. It runs in a worker because
// browsers slow down timers in background windows, which would make the beat
// stumble when two linked windows sit side by side.

const WORKER = `let id
onmessage = (e) => {
  clearInterval(id)
  if (e.data > 0) id = setInterval(() => postMessage(0), e.data)
}`

export function startTicker(fn, ms = 25) {
  try {
    const worker = new Worker(URL.createObjectURL(new Blob([WORKER], { type: 'text/javascript' })))
    worker.onmessage = fn
    worker.postMessage(ms)
    return worker
  } catch {
    return setInterval(fn, ms) // workers unavailable: fall back to a plain timer
  }
}
