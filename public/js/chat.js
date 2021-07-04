const socket = io()

// socket.on('countUpdated', (count) => {
//     console.log('Count Updated', count)
// })

// document.querySelector('#increment').addEventListener('click', () => {
//     console.log('clicked')
//     socket.emit('increment')
// })

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const join = Qs.parse(location.search, { ignoreQueryPrefix:true })

socket.emit('join', join, (error) => {
    if(error){    
        alert(error)
        location.href = '/'
    }
})

const autoscroll = () => {
    const $newMessage = $messages.lastElementChild

    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = $messages.offsetHeight

    const containerHeight = $messages.scrollHeight

    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= (scrollOffset + 20)){
        $messages.scrollTop = $messages.scrollHeight
        console.log($messages.scrollTop)
    }
}

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    $messageFormButton.setAttribute('disabled', 'disabled')
    const key = e.target.elements.message
    socket.emit('sendMessage', key.value, (error) => {
        $messageFormInput.value = ''
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.focus()
        if(error)
            return console.log(error)
    })
})

$sendLocationButton.addEventListener('click', (e) => {
    if(!navigator.geolocation)
        return alert('Sorry your browser does not support geolocation.')

    $sendLocationButton.setAttribute('disabled', 'disabled')
    
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation',
        {latitude: position.coords.latitude, longitude: position.coords.longitude},
        () => {
            $sendLocationButton.removeAttribute('disabled')
        })
            
    })
})

socket.on('locationMessage', (url) => {
    const html = Mustache.render(locationTemplate, {
        username: url.username,
        url: url.url,
        createdAt: moment(url.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
}, ()=>{

})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})