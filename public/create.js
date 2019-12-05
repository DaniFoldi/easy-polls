addEventListener('load', async () => {
  document.querySelector('button').addEventListener('click', async event => {
    const response = await fetch('/poll', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question: document.querySelector('#question').value,
        options: Array.from(document.querySelectorAll('.answer')).map(el => el.value).filter(el => el !== '')
      })
    })
    const body = await response.json()
    if (body.error) {
      alert('An error occured, please try again.')
    } else {
      const button = document.querySelector('button')
      const element = document.createElement('input')
      element.type = 'text'
      element.readonly = true
      element.value = location.protocol + '//' + location.host + '/poll/' + body.url
      button.insertAdjacentElement('afterend', element)
      element.select()
      element.setSelectionRange(0, 99999)
      button.parentNode.removeChild(button)
    }
  })

  async function addNew() {
    if (Array.from(document.querySelectorAll('.answer')).map(el => el.value).filter(el => el === '').length === 0) {
      const clone = document.querySelector('.answer').cloneNode()
      clone.value = ''
      clone.addEventListener('input', addNew)
      document.querySelector('button').insertAdjacentElement('beforebegin', clone)
    }
  }
  document.querySelectorAll('.answer').forEach(el => el.addEventListener('input', addNew))
})
