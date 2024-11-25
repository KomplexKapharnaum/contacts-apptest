if (window.location.host == "contest.kxkm.net" || window.location.host.includes('localhost')) {
    // add border to body
    document.body.style.border = "3px solid yellow";
}

var LAST_EMIT_TIME = 0;

// PASSWORD
//
if (!Cookies.get('pass')) {
    pass = prompt("Password", "")
    Cookies.set('pass', pass, { expires: 10 })
}
var password = Cookies.get('pass')

// LOG
//
function log(...msg) {
    console.log(...msg)
    document.getElementById('logs').innerHTML += msg.join(', ') + "<br>"
    document.getElementById('logs').scrollTop = document.getElementById('logs').scrollHeight;
}

// MODAL FORM
//
function modalForm(title, callback) {
    var modal = $('<div>').addClass('modal').appendTo('body')
    var modalDialog = $('<div>').addClass('modal-dialog').appendTo(modal)
    var modalContent = $('<div>').addClass('modal-content').appendTo(modalDialog)
    var modalHeader = $('<div>').addClass('modal-header').appendTo(modalContent)
    var modalTitle = $('<h5>').addClass('modal-title').text(title).appendTo(modalHeader)
    var modalBody = $('<div>').addClass('modal-body').appendTo(modalContent)
    var modalFooter = $('<div>').addClass('modal-footer').appendTo(modalContent)
    var modalSubmit = $('<button>').addClass('btn btn-primary').text('Submit').appendTo(modalFooter)
    var modalClose = $('<button>').addClass('btn btn-secondary').text('Close').appendTo(modalFooter)

    modalClose.on('click', () => { modal.remove() })
    modalSubmit.on('click', () => { callback(modal, modal) })
    return modal
}

// SOCKETIO INIT
//
const socket = io();

// SOCKET SEND
//
function ctrl(name, args = false) {

    if (args && !args.params.grpChoice) args.params.grpChoice = '';

    socket.emit('ctrl', {
        name: name,
        args: args?args:{}
    });
}

function query(name, args) {
    var resid = Math.random().toString(36).substring(2);
    socket.emit('query', {
        name: name,
        args: args,
        resid: resid
    });
    return new Promise((resolve, reject) => {
        socket.once('ok-' + resid, (data) => { resolve(data) })
        socket.once('ko-' + resid, (data) => { try { reject(data) } catch (e) { log("ERROR: ", data) } })
    })
}

// LISTS
//
function updateSessions() {
    query("Session.list")
        .then((sessions) => {
            console.log(sessions)
            $('#sessions').empty()
            var table = $('<table>').appendTo('#sessions')
            var thead = $('<thead>').appendTo(table)
            var tbody = $('<tbody>').appendTo(table)
            var tr = $('<tr>').appendTo(thead)

            $('<th>').text('id').appendTo(tr)
            $('<th>').text('name').appendTo(tr)
            $('<th>').text('starting_at').appendTo(tr)
            $('<th>').text('ending_at').appendTo(tr)
            $('<th>').text('').appendTo(tr)

            sessions.forEach((session) => {
                var tr = $('<tr>').appendTo(tbody)
                $('<td>').text(session.id).appendTo(tr)

                $('<td>').text(session.name).appendTo(tr).on('click', () => {
                    var name = prompt("Session name", session.name).trim()
                    if (name) query("Session.update", [session.id, { name: name }]).then(updateSessions)
                })

                $('<td>').appendTo(tr).append(
                    $('<input>').attr('type', 'datetime-local').val(session.starting_at).on('change', (e) => {
                        query("Session.update", [session.id, { starting_at: e.target.value }]).then(updateSessions)
                    })
                )

                $('<td>').appendTo(tr).append(
                    $('<input>').attr('type', 'datetime-local').val(session.ending_at).on('change', (e) => {
                        query("Session.update", [session.id, { ending_at: e.target.value }]).then(updateSessions)
                    }
                    ))

                $('<td>').text('delete').addClass('delete').appendTo(tr).on('click', () => {
                    confirm("Delete session " + session.name + " ?") &&
                        query("Session.delete", session.id).then(updateSessions)
                })
            })
        })
}

function updateGroups() {
    query("Group.list")
        .then((groups) => {
            $('#groups').empty()
            var table = $('<table>').appendTo('#groups')
            var thead = $('<thead>').appendTo(table)
            var tbody = $('<tbody>').appendTo(table)
            var tr = $('<tr>').appendTo(thead)

            $('<th>').text('id').appendTo(tr)
            $('<th>').text('name').appendTo(tr)
            $('<th>').text('description').appendTo(tr)
            $('<th>').text('session_id').appendTo(tr)
            $('<th>').text('').appendTo(tr)

            groups.forEach((group) => {
                var tr = $('<tr>').appendTo(tbody)
                $('<td>').text(group.id).appendTo(tr)

                $('<td>').text(group.name).appendTo(tr).on('click', () => {
                    var name = prompt("Group name", group.name).trim()
                    if (name) query("Group.update", [group.id, { name: name }]).then(updateGroups)
                })

                $('<td>').text(group.description).appendTo(tr).on('click', () => {
                    var description = prompt("Description", group.description).trim()
                    if (description) query("Group.update", [group.id, { description: description }]).then(updateGroups)
                })

                $('<td>').text(group.session_id).appendTo(tr)

                $('<td>').text('delete').addClass('delete').appendTo(tr).on('click', () => {
                    confirm("Delete group " + group.name + " ?") &&
                        query("Group.delete", group.id).then(updateGroups)
                })
            })
        })
}

var usersCounter = {}

function updateUsers() {
    
    usersCounter = {
        total: 0,
        connected: 0,
    }

    query("User.list")
        .then((users) => {

            usersCounter.total = users.length

            $('#users').empty()
            var table = $('<table>').appendTo('#users')
            var thead = $('<thead>').appendTo(table)
            var tbody = $('<tbody>').appendTo(table)
            var tr = $('<tr>').appendTo(thead)

            $('<th>').text('id').appendTo(tr)
            $('<th>').text('uuid').appendTo(tr)
            $('<th>').text('name').appendTo(tr)
            $('<th>').text('phone').appendTo(tr)
            $('<th>').text('group').appendTo(tr)
            $('<th>').text('selected_avatar').appendTo(tr)
            $('<th>').text('sessions').appendTo(tr)
            $('<th>').text('last_read').appendTo(tr)
            $('<th>').text('is_connected').appendTo(tr)
            $('<th>').text('').appendTo(tr)

            users.forEach((user) => {

                if (user.is_connected) usersCounter.connected++

                var tr = $('<tr>').appendTo(tbody)
                $('<td>').text(user.id).appendTo(tr)
                $('<td>').text(user.uuid).appendTo(tr)
                $('<td>').text(user.name).appendTo(tr)
                $('<td>').text(user.phone).appendTo(tr)

                // $('<td>').text(user.groups).appendTo(tr).on('click', () => {
                //     var group = prompt("Group", user.group).trim()
                //     if (group) query("User.update", [user.uuid, { group: group }]).then(updateUsers)
                // })
                var groups = $('<td>').appendTo(tr)

                $('<td>').text(user.selected_avatar).appendTo(tr)

                var sessions = $('<td>').appendTo(tr)
                query("User.getfull", { uuid: user.uuid }).then((data) => {
                    data.sessions.forEach((session) => {
                        $('<span>').text(session.name + ' ').appendTo(sessions).on('click', () => {
                            if (confirm("Unregister user " + user.name + " from session " + session.name + " ?"))
                                query("User.unregister", [user.uuid, session.id]).then(updateUsers)
                        })
                    })

                    data.groups.forEach((group) => {
                        $('<span>').text(group.name + ' ').appendTo(groups)
                    })
                })

                let last_read = new Date(user.last_read)
                if (!user.last_read) last_read = "never"
                else last_read = last_read.toLocaleString()

                var lr = $('<td>').text(last_read).appendTo(tr).on('click', () => {
                    // query("User.update", [{id: user.id}, { last_read: null }]).then(updateUsers)
                })

                if (user.last_read == LAST_EMIT_TIME) lr.css('background-color', 'green')


                $('<td>').text(user.is_connected).appendTo(tr)

                $('<td>').text('delete').addClass('delete').appendTo(tr).on('click', () => {
                    confirm("Delete user id = " + user.id + " ?") &&
                        query("User.delete", {
                            id: user.id
                        }).then(() => {
                            updateAvatars()
                            updateUsers()
                        })
                })
            })

            $('#user-counter').text(usersCounter.connected + "/" + usersCounter.total)
        })
}

function updateAvatars() {
    query("Avatar.list")
        .then((avatars) => {
            $('#avatars').empty()
            var table = $('<table>').appendTo('#avatars')
            var thead = $('<thead>').appendTo(table)
            var tbody = $('<tbody>').appendTo(table)
            var tr = $('<tr>').appendTo(thead)

            $('<th>').text('id').appendTo(tr)
            $('<th>').text('user_id').appendTo(tr)
            $('<th>').text('url').appendTo(tr)
            $('<th>').text('').appendTo(tr)

            avatars.forEach((avatar) => {
                var tr = $('<tr>').appendTo(tbody)
                $('<td>').text(avatar.id).appendTo(tr)
                $('<td>').text(avatar.user_id).appendTo(tr)
                $('<td>').text(avatar.url).appendTo(tr)
                $('<td>').text('delete').addClass('delete').appendTo(tr).on('click', () => {
                    confirm("Delete avatar " + avatar.url + " ?") &&
                        query("Avatar.delete", avatar.id).then(updateAvatars)
                })
            })
        }
        )
}

function updatePresets() {
    query("Preset.list")
        .then((presets) => {
            $('#presets').empty()
            var table = $('<table>').appendTo('#presets')
            var thead = $('<thead>').appendTo(table)
            var tbody = $('<tbody>').appendTo(table)
            var tr = $('<tr>').appendTo(thead)

            $('<th>').text('id').appendTo(tr)
            $('<th>').text('name').appendTo(tr)
            $('<th>').text('data').appendTo(tr)
            $('<th>').text('group').appendTo(tr)
            $('<th>').text('').appendTo(tr)

            presets.forEach((preset) => {
                var tr = $('<tr>').appendTo(tbody)
                $('<td>').text(preset.id).appendTo(tr)
                $('<td>').text(preset.name).appendTo(tr)
                    .on('click', () => {
                        var name = prompt("Preset name", preset.name).trim()
                        if (name) query("Preset.update", [preset.id, { name: name }]).then(updatePresets)
                    })
                
                $('<td>').text(preset.data).appendTo(tr)
                    .on('click', () => {
                        var data = prompt("Preset data", preset.data).trim()
                        if (data) query("Preset.update", [preset.id, { data: data }]).then(updatePresets)
                    })

                $('<td>').text(preset.group).appendTo(tr)
                    .on('click', () => {
                        var group = prompt("Preset group", preset.group).trim()
                        if (group) query("Preset.update", [preset.id, { group: group }]).then(updatePresets)
                    })

                $('<td>').text('delete').addClass('delete').appendTo(tr).on('click', () => {
                    confirm("Delete preset " + preset.name + " ?") &&
                        query("Preset.delete", preset.id).then(updatePresets)
                })
            })
        })
}

function updateMessages() {
    query("Message.list")
        .then((messages) => {
            $('#messages').empty()
            var table = $('<table>').appendTo('#messages')
            var thead = $('<thead>').appendTo(table)
            var tbody = $('<tbody>').appendTo(table)
            var tr = $('<tr>').appendTo(thead)

            $('<th>').text('id').appendTo(tr)
            $('<th>').text('data').appendTo(tr)
            $('<th>').text('emit_time').appendTo(tr)
            $('<th>').text('message').appendTo(tr)
            $('<th>').text('session_id').appendTo(tr)
            $('<th>').text('group_id').appendTo(tr)
            $('<th>').text('').appendTo(tr)

            messages.forEach((message) => {
                var tr = $('<tr>').appendTo(tbody)
                $('<td>').text(message.id).appendTo(tr)
                $('<td>').text(message.data).appendTo(tr)

                if (message.emit_time > LAST_EMIT_TIME) LAST_EMIT_TIME = message.emit_time

                var emit_time = new Date(message.emit_time)
                emit_time = emit_time.toLocaleString()

                $('<td>').text(emit_time).appendTo(tr)

                var msg = $('<td>').text(message.message).appendTo(tr)
                msg.on('click', () => {
                    msg.off('click')
                    msg.empty()

                    var textarea = $('<textarea cols="100" rows="3">').val(message.message).appendTo(msg)
                    textarea.focus()

                    textarea.on('blur', () => {
                        query("Message.update", [message.id, { message: textarea.val() }]).then(updateMessages)
                    })
                })

                $('<td>').text(message.session_id).appendTo(tr)
                $('<td>').text(message.group_id).appendTo(tr)
                $('<td>').text('delete').addClass('delete').appendTo(tr).on('click', () => {
                    confirm("Delete message " + message.message + " ?") &&
                        query("Message.delete", message.id).then(updateMessages)
                })
            })
        })
}

let LIVE_EVENT;
function updateEvents() {
    query("Event.list")
        .then((events) => {
            $('#events').empty()
            var table = $('<table>').appendTo('#events')
            var thead = $('<thead>').appendTo(table)
            var tbody = $('<tbody>').appendTo(table)
            var tr = $('<tr>').appendTo(thead)

            $('<th>').text('id').appendTo(tr)
            $('<th>').text('name').appendTo(tr)
            $('<th>').text('starting_at').appendTo(tr)
            $('<th>').text('ending_at').appendTo(tr)
            $('<th>').text('location').appendTo(tr)
            $('<th>').text('description').appendTo(tr)
            $('<th>').text('session_id').appendTo(tr)
            /*$('<th>').text('actions').appendTo(tr)*/
            $('<th>').text('').appendTo(tr)

            let enableRegie = false;

            events.forEach((event) => {
                var tr = $('<tr>').appendTo(tbody)

                const start = new Date(event.starting_at);
                const end = new Date(event.ending_at);
                const now = new Date();
                const isEventLive = start < now && now < end;
                if (isEventLive) LIVE_EVENT = event;
                enableRegie = enableRegie || isEventLive;
                
                if (isEventLive) tr.css('background-color', 'darkgreen');

                $('<td>').text(event.id).appendTo(tr)
                $('<td>').text(event.name).appendTo(tr).on('click', () => {
                    var name = prompt("Event name", event.name).trim()
                    if (name) query("Event.update", [event.id, { name: name }]).then(updateEvents)
                })

                $('<td>').appendTo(tr).append(
                    $('<input>').attr('type', 'datetime-local').val(event.starting_at).on('change', (e) => {
                        query("Event.update", [event.id, { starting_at: e.target.value }]).then(updateEvents)
                    })
                )
                $('<td>').appendTo(tr).append(
                    $('<input>').attr('type', 'datetime-local').val(event.ending_at).on('change', (e) => {
                        query("Event.update", [event.id, { ending_at: e.target.value }]).then(updateEvents)
                    })
                )

                $('<td>').text(event.location).appendTo(tr).on('click', () => {
                    var location = prompt("Location", event.location).trim()
                    if (location) query("Event.update", [event.id, { location: location }]).then(updateEvents)
                })

                $('<td>').text(event.description).appendTo(tr).on('click', () => {
                    var description = prompt("Description", event.description).trim()
                    if (description) query("Event.update", [event.id, { description: description }]).then(updateEvents)
                })
            
                $('<td>').text(event.session_id).appendTo(tr)

                $('<td>').text('delete').addClass('delete').appendTo(tr).on('click', () => {
                    confirm("Delete event " + event.name + " ?") &&
                        query("Event.delete", event.id).then(updateEvents)
                })
            })

            if (enableRegie) {
                $('#regie').addClass('active')
            } else {
                $('#regie').removeClass('active')
            }

        })
}


function updateGenjobs() {
    query("Genjob.list")
        .then((genjobs) => {
            $('#genjobs').empty()
            var table = $('<table>').appendTo('#genjobs')
            var thead = $('<thead>').appendTo(table)
            var tbody = $('<tbody>').appendTo(table)
            var tr = $('<tr>').appendTo(thead)

            $('<th>').text('id').appendTo(tr)
            $('<th>').text('userid').appendTo(tr)
            $('<th>').text('status').appendTo(tr)
            $('<th>').text('workflow').appendTo(tr)
            $('<th>').text('userdata').appendTo(tr)
            $('<th>').text('input').appendTo(tr)
            $('<th>').text('output').appendTo(tr)
            $('<th>').text('').appendTo(tr)

            genjobs.forEach((genjob) => {
                var tr = $('<tr>').appendTo(tbody)
                $('<td>').text(genjob.id).appendTo(tr)
                $('<td>').text(genjob.userid).appendTo(tr)
                $('<td>').text(genjob.status).appendTo(tr).on('click', () => {
                    query("Genjob.retry", genjob.id).then(updateGenjobs)
                })

                $('<td>').text(genjob.workflow).appendTo(tr)
                $('<td>').text(genjob.userdata).appendTo(tr)
                $('<td>').text(genjob.input).appendTo(tr)
                $('<td>').text(genjob.output).appendTo(tr)

                $('<td>').text('delete').addClass('delete').appendTo(tr).on('click', () => {
                    confirm("Delete genjob " + genjob.id + " ?") &&
                        query("Genjob.delete", genjob.id).then(updateGenjobs)
                })
            })
        })

}

// SOCKET RECEIVE
//
socket.on('hello', () => {
    document.getElementById('logs').innerHTML = ""
    log("hello")

    socket.emit('login', password);
    updateSessions()
    updateEvents()
    updatePresets()
    // updateUsers()
    updateMessages()
    updateGroups()
    // updateAvatars()
    // updateGenjobs()
})

socket.on('log', (msg) => { log(msg) })

socket.on('auth', (msg) => {
    if (msg == "ok") log("auth ok")
    else {
        Cookies.remove('pass')
        alert("You are not logged in !")
        location.reload()
    }
})


// SESSIONS
//

document.getElementById('session-new').addEventListener('click', () => {
    var name = prompt("Session name", "").trim()

    query("Session.new", { name: name }).then(updateSessions)
})

// GROUPS
//

document.getElementById('group-new').addEventListener('click', () => {
    var name = prompt("Group name", "").trim()
    var session_id = prompt("Session id", "").trim()

    query("Group.new", { name: name, session_id: session_id }).then(updateGroups)
})

// EVENTS
//

document.getElementById('event-new').addEventListener('click', () => {
    var name = prompt("Event name", "").trim()
    var session_id = prompt("Session id", "").trim()

    query("Event.new", { name: name, session_id: session_id }).then(updateEvents)
})

// PRESETS
//

document.getElementById('preset-new').addEventListener('click', () => {
    var name = prompt("Preset name", "").trim()
    var group = prompt("Preset group", "").trim()

    query("Preset.new", { name: name, group: group }).then(updatePresets)
})


// LOAD USERS
document.getElementById('user-load').addEventListener('click', updateUsers)

// LOAD AVATARS
document.getElementById('avatar-load').addEventListener('click', updateAvatars)

// LOAD GENJOBS
document.getElementById('genjob-load').addEventListener('click', updateGenjobs)
document.getElementById('genjob-clear-done').addEventListener('click', () => {

    // delete genjob where status = done
    query("Genjob.remove", { status: 'done' }).then(updateGenjobs)
})
// USER-EVENTS REGIE
// 

const event_buttons = document.querySelectorAll("#regie-buttons>button")
const event_blocs = document.querySelectorAll("#regie-events>div")

event_buttons.forEach((button) => {
    button.addEventListener('click', () => {
        
        event_blocs.forEach((bloc) => {
            bloc.classList.remove('active')
        })

        const target = button.dataset.eventBloc;
        if (!target) return;
        document.getElementById(target).classList.add('active')

    });
});

query("Group.list").then((group) => {
    $('<option>', { text: "*",value: "" }).appendTo("#grp")
    group.forEach((g) => {
        $('<option>', { text: g.name,value: g.id }).appendTo("#grp")
    })
})

// Color event

const param_colors = ["#F00", "#0F0", "#00F", "#FF0", "#F0F", "#0FF", "#FFF"];

param_colors.forEach((color) => {
    const btn = document.createElement("div");
    btn.classList.add("color");
    btn.style.backgroundColor = color;
    btn.onclick = () => {
        btn.classList.toggle("selected");
    }
    document.getElementById("color-list").appendChild(btn);
});

document.getElementById('send-color-event').addEventListener('click', () => {
    const random = document.getElementById('color-event-param-random').checked
    const flash = document.getElementById('color-event-param-flash').checked
    
    let colors = []
    document.getElementById("color-list").querySelectorAll(".selected").forEach((color) => {
        colors.push(color.style.backgroundColor)
    })
    // ctrl("color", { colors: promptColor, params: { flash: flashing, random: autoselect , grpChoice: grpChoice}})

    const grpChoice = document.getElementById("grp").value
    ctrl("color", { colors: colors, params: { flash: flash, random: random , grpChoice: grpChoice}})
})

// Text event

const addtext_btn = document.querySelector("#input_addtext button")
const input_txt = document.getElementById("text-event-input")
const template_text = document.getElementById("template_text_input")
const textlist = document.getElementById("text-list")

addtext_btn.addEventListener('click', () => {
    const txt = input_txt.value
    const tem = template_text.cloneNode(true).content.querySelector(".input_text_item");
    console.log(tem)
    tem.querySelector("input").value = txt
    tem.querySelector("button").addEventListener('click', () => {
        textlist.removeChild(tem)
    })
    textlist.appendChild(tem)
})

document.getElementById("send-text-event").addEventListener("click", () => {
    let txts = []
    textlist.querySelectorAll(".input_text_item").forEach(t => {
        const val = t.querySelector("input").value;
        txts.push(val)
    })

    const random = document.getElementById("text-event-param-random").checked;
    const rotate = document.getElementById("text-event-param-rotate").checked;

    const grpChoice = document.getElementById("grp").value
    ctrl("text", { texts: txts, params: {random: random ,rotate: rotate, grpChoice: grpChoice}})
})

// Image event

const addimageURL_btn = document.querySelector("#input_add_image_url button")
const input_image = document.getElementById("image-event-input")
const imgList = document.getElementById("image-list")

addimageURL_btn.addEventListener('click', () => {
    const txt = input_image.value

    const img = document.createElement("img");
    img.src = txt
    imgList.appendChild(img);

    img.addEventListener('click', () => {
        imgList.removeChild(img)
    })
    imgList.appendChild(img)
})

document.getElementById("send-image-event").addEventListener("click", () => {
    let imgs = []
    imgList.querySelectorAll("img").forEach(i => {
        const val = i.src;
        imgs.push(val)
    })

    const random = document.getElementById("image-event-param-random").checked;

    const grpChoice = document.getElementById("grp").value
    ctrl("image", { images: imgs, params: {random: random , grpChoice: grpChoice}})
})

// Info event

document.getElementById("send-info-event").addEventListener("click", () => {
    const val = document.getElementById("info_event_input").value;

    const grpChoice = document.getElementById("grp").value
    ctrl("info", { message: val, params: {grpChoice: grpChoice}})
})

// End event

document.getElementById("end-event").addEventListener("click", () => {
    ctrl("end");
})

document.getElementById("reload-event").addEventListener("click", () => {
    ctrl("reload");
    console.log("reload")
})

// MESSAGERIE
//

function sendMsg(msg, session, group, checked) {
    socket.emit("chat_msg", msg, session, group, checked)
}
let CURRENT_SESSION = 1;

query("Session.next")
    .then((val) => {
        CURRENT_SESSION = val
    });

query("Group.list").then((group) => {
    $('<option>', { text: "*",value: "" }).appendTo("#sendmessgae-group")
    group.forEach((g) => {
        $('<option>', { text: g.name,value: g.id }).appendTo("#sendmessgae-group")
    })
})

document.getElementById("sendmessage-send").addEventListener("click", () => {
    const message = document.getElementById("sendmessage-input").value
    const checked = document.getElementById("message-param-checked").checked

    sendMsg(message, CURRENT_SESSION, document.getElementById("sendmessgae-group").value, checked)
})

socket.on("new_chatMessage", (msg, emit_time) => {
    updateMessages()
})

// Stop event button

const terminate_event = document.getElementById("terminate-event");

terminate_event.addEventListener("click", () => {
    if (!confirm("Are you sure you want to terminate this event ?")) return;
    if (!LIVE_EVENT) return;

    const time = new Date(Date.now() - 60000).toISOString().slice(0, 16);
    query("Event.update", [LIVE_EVENT.id, { ending_at: time }]).then(() => {
        ctrl("reload");
    })
});