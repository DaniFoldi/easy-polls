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
  if (body.error) {
    if (body.errorMessage) {
      alert(body.errorMessage)
    } else {
      alert('An error has occured')
    }
    return
  }
  document.querySelector('#question').textContent = body.question
  if (body.multiple) {
    const multipleNode = document.createElement('p')
    multipleNode.textContent = 'Multiple choices allowed'
    document.querySelector('#question').insertAdjacentElement('afterend', multipleNode)
  }
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
      el.classList.toggle('selected')
      if (!body.multiple) {
        const selectedNodes = document.querySelectorAll('.selected')
        if (selectedNodes.length > 1) {
          selectedNodes.forEach(el => {
            el.classList.remove('selected')
          })
          el.classList.add('selected')
        }
      }
    })
  })
  document.querySelector('#submit').addEventListener('click', async () => {
    const chosen = []
    document.querySelectorAll('.answer').forEach((el, i) => {
      if (el.classList.contains('selected'))
        chosen.push(i)
    })
    const response = await fetch('/answer', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id,
        answers: chosen
      })
    })
    const body = await response.json()
    if (response.error) {
      if (response.errorMessage) {
        alert(response.errorMessage)
      } else {
        alert('An error has occured. Please try again')
      }
      return
    }
    location.reload()
  })
  document.querySelector('#show-results').addEventListener('click', async () => {
    window.location = window.location.href + '?results'
  })
})
