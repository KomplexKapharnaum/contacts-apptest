
CHAT = {};

CHAT.enableDebug = true

CHAT.debug = (...args) => {
    if (CHAT.enableDebug == false) return
    console.log(...args)
}

CHAT.feed = []

CHAT.send = (msg, important) => {
    if (!userData.uuid) return
    socket.emit('livechat-send', userData.uuid, msg, important);
}

CHAT.receive = (packet) => {
    if (!userData.uuid) return
    CHAT.showMessage(packet)
    CHAT.feed.push(packet)
}

CHAT.load = () => {
    CHAT.clear()
    if (!userData.uuid) return
    CHAT.debug("loading chat...")
    socket.emit('livechat-getall', userData.uuid)
    socket.once('livechat-getall', (data) => {
        CHAT.feed = data
        CHAT.debug("chat data loaded !", "packets are processing...")
        data.forEach(packet => {
            CHAT.showMessage(packet)
        });
    })
}

socket.on('livechat-get', CHAT.receive);

/* Dom implementation */

const chat_send = document.getElementById('chat-send')
const chat_messages = document.getElementById('chat-messages')
const chat_input = document.getElementById('chat-input')

chat_send.addEventListener('click', () => {
    CHAT.send(chat_input.value)
    chat_input.value = ''
})


CHAT.showMessage = (packet) => {
    CHAT.debug("chat-message", packet)

    let message = document.createElement('div')
    message.classList.add('chat-message')

    let date = new Date(packet.date)
    const hour = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
    const min = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();

    let msg = `[${hour}:${min}] ${packet.username}: ${packet.msg}`
    
    if (packet.important) { 
        message.classList.add('important')
        msg = `[${hour}:${min}] ${packet.msg}`
    } 

    message.innerHTML = msg
    chat_messages.appendChild(message)
}

CHAT.clear = () => {
    CHAT.feed = []
    chat_messages.innerHTML = ''
    CHAT.debug("cleared chat")
}