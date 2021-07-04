const path = require('path')
const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/message')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const publicPath = path.join(__dirname, '../public')

const app = express()
const server = http.createServer(app)

const io = socketio(server)

app.use(express.static(publicPath))

const port = process.env.PORT || 3000

let count = 0

io.on('connection', (socket) => {  //server side event listener

    socket.on('join', ({username, room}, callback) => {
        const {error, user} = addUser({id:socket.id, username, room})

        if(error)
            return callback(error)

        socket.join(user.room)
        io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)})

        socket.emit('message', generateMessage('Admin', 'Welcome!'))

        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`)) //server to all clients except socket
        callback()
    })

    socket.on('disconnect', () => { //triggers when socket disconnects
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`))
            io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)})
        } 
    })

    // socket.emit('countUpdated', count) //server to connection only

    // socket.on('increment', () => { //server side event listener responding to one connection
    //     count++
    //     io.emit('countUpdated', count) // server to every connection
    // })
    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter()

        if(filter.isProfane(message))
            return callback('Profanity not allowed')
        
        const user = getUser(socket.id)
        if(user)
            io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id)
        if(user)
            io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`))
        callback()
    })
})

server.listen(port, (req, res) => {
    console.log('Server started on', port)
})