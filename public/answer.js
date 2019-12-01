addEventListener('load', async () => {
  const id = location.pathname.split('/')[2]
  const response = await fetch(`/poll/${id}/details`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  })
  const body = await response.json()
  if (body.error)
    return alert('An error has occured')
  document.querySelector('#question').textContent = body.question
  let answerNode = document.querySelector('.answer')
  answerNode.textContent = body.options[0]
  for (let i = 1; i < body.options.length; i++) {
    const option = answerNode.cloneNode()
    option.textContent = body.options[i]
    answerNode.insertAdjacentElement('afterend', option)
    answerNode = option
  }
  document.querySelectorAll('.answer').forEach(async (el, i) => {
    el.addEventListener('click', async () => {
      const response = await fetch('/answer', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id,
          answer: i
        })
      })
      location.reload()
    })
  })
  document.querySelector('#show-results').addEventListener('click', async () => {
    window.location = window.location.href + '?results'
  })
})
