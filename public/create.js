addEventListener('load', async () => {
  document.querySelector('form').addEventListener('submit', event => {
    event.preventDefault()
  })
  document.querySelector('input[type=submit]').addEventListener('click', async event => {
    const response = await fetch('/poll', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question: document.querySelector('#question-field').value,
        options: Array.from(document.querySelectorAll('.answer-field')).map(el => el.value).filter(el => el !== '')
      })
    })
    const body = await response.json()
    if (body.error) {
      alert('An error occured, please try again.')
    } else {
      const element = document.querySelector('input[type="submit"]')
      element.type = 'text'
      element.value = location.protocol + '/' + location.host + '/poll/' + body.url
      element.select()
      element.setSelectionRange(0, 99999)
      console.log(document.execCommand('copy'))
      console.log(body.url)
    }
  })

  async function addNew() {
    if (Array.from(document.querySelectorAll('.answer-field')).map(el => el.value).filter(el => el === '').length === 0) {
      const clone = document.querySelector('.answer-field').cloneNode()
      clone.value = ''
      clone.addEventListener('input', addNew)
      document.querySelector('input[type="submit"]').insertAdjacentElement('beforebegin', clone)
    }
  }
  document.querySelectorAll('.answer-field').forEach(el => el.addEventListener('input', addNew))
})
