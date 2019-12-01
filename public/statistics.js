addEventListener('load', async () => {
  const id = location.pathname.split('/')[2]
  const socket = io()
  socket.emit('selectpoll', {
    id
  })
  const chart = new Chart(document.querySelector('#results').getContext('2d'), {
    type: 'horizontalBar',
    data: {
      labels: [],
      datasets: []
    },
    options: {
      elements: {
        rectangle: {
          borderWidth: 0
        }
      },
      responsive: true,
      legend: {
        display: false
      },
      title: {
        display: true,
        text: '',
        fontSize: 32,
        fontFamily: 'Raleway',
        fontStyle: '600',
        fontColor: '#191923'
      },
      scales: {
        xAxes: [{
          ticks: {
            beginAtZero: true,
            maxTicksLimit: 5,
            stepSize: 1,
            fontFamily: 'Raleway',
            fontStyle: '300',
            fontColor: '#191923',
            fontSize: 20
          }
        }],
        yAxes: [{
          ticks: {
            fontFamily: 'Raleway',
            fontStyle: '300',
            fontColor: '#191923',
            fontSize: 20
          }
        }]
      },
      tooltips: {
        titleFontFamily: 'Raleway',
        titleFontSize: 18,
        titleFontColor: '#FBFEF9',
        bodyFontFamily: 'Raleway',
        bodyFontSize: 18,
        bodyFontColor: '#FBFEF9',
        displayColors: false
      }
    }
  })
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
  window.chart = chart
  chart.titleBlock.options.text = body.question
  chart.config.data.labels = body.options
  chart.config.data.datasets[0] = {
    label: '',
    data: body.answers,
    backgroundColor: '#BF1363'
  }
  chart.update()

  socket.on('poll', data => {
    chart.titleBlock.options.text = data.question
    chart.config.data.labels = data.options
    chart.config.data.datasets[0] = {
      label: '',
      data: data.answers,
      backgroundColor: '#BF1363'
    }
    chart.update()
  })
})
