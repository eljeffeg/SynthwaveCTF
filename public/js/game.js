
var soundOn = false //Game sound is playing or not
var userAction = false //Detect user action for sound
var paused = true



var audio = {
    background: new Audio(),
}

//Get all the audio by its name
for (let au in audio) {
    audio[au].src = 'sounds/' + au + '.ogg'
    if (au === 'blank') {
        audio[au].loop = false
    } else {
        audio[au].loop = true
    }
    audio[au].volume = 0.30
    audio[au].name = au
    audio[au].load()
}


window.onkeyup = function(e) {
    if (paused) return
    keys[e.keyCode] = false //Remove the key from the object when the user stops pressing
}
//Add the key to the object when the user starts pressing
window.onkeydown = function(e) {
    if (!userAction) {
        userAction = true
        checkSound()
    }
    if (paused) return
    keys[e.keyCode] = true
}
//Add the mouse object when the user clicks mouse
window.onmouseup = function(e) {
    let page = window.location.hash.slice(1) || 'home'
    let [content, id] = page.split('/')
    if (paused && !userAction && content !== 'home') {
        let isHovered = document.getElementById('soundImg').matches(':hover')
        if (!isHovered) {
            userAction = true
            soundIconReset()
        }
    } else if (paused) {
        checkSound()
        return
    } else {
        mPos = getMousePos(e, ctx.canvas)
        if (
            mPos.x > 15 &&
            mPos.x < 25 + sprites.soundOn.width &&
            mPos.y < 10 + sprites.soundOn.height &&
            mPos.y > 10
        ) {
            soundToggle()
            soundIconReset()
        }
        
        userAction = true
    }
    checkSound()

}

canvas.onmousemove = function(e) {
    mPos = getMousePos(e, ctx.canvas)
    let hoverItem = false;

    if (!paused &&
        mPos.x > 15 &&
        mPos.x < 25 + sprites.soundOn.width &&
        mPos.y < 10 + sprites.soundOn.height &&
        mPos.y > 10
    ) {
        hoverItem = true;  //Sound Icon
    }
    if (hoverItem) {
        document.body.style.cursor = 'pointer'
    } else if (document.body.style.cursor == 'pointer') {
        document.body.style.cursor = 'auto'
    }
}

window.addEventListener('resize', function() {
    soundIconReset()
})

ctx = canvas.getContext('2d') //Create canvas ctx

function triggerTerminal(type) {
    let tt = document.querySelector('sb-console')
    tt.setAttribute('data-type', type)
    tt.setAttribute('data-sound', soundOn)
    tt.click()
}
//Get the position of the mouse on canvas
function getMousePos(evt, canvas) {
    if (evt.clientX !== undefined) {
        let rect = canvas.getBoundingClientRect()
        let xOffset = canvas.width / canvas.offsetWidth
        let yOffset = canvas.height / canvas.offsetHeight
        mPos.x = (evt.clientX - rect.left) * xOffset
        mPos.y = (evt.clientY - rect.top) * yOffset
    }
    return mPos
}

function getFilenameFromUrl(url) {
    const pathname = new URL(url).pathname;
    const index = pathname.lastIndexOf('\%2F') + 2;
    return (-1 !== index) ? pathname.substring(index + 1) : pathname;
}

function downloadFile(url) {
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = () => {
        document.body.style.cursor = 'wait'
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            document.body.style.cursor = 'auto'
            const blobUrl = window.URL.createObjectURL(xmlHttp.response);
            const e = document.createElement('a');
            e.href = blobUrl;
            e.download = getFilenameFromUrl(url);
            document.body.appendChild(e);
            e.click();
            document.body.removeChild(e);
        }
    };
    xmlHttp.responseType = 'blob';
    xmlHttp.open('GET', url, true);
    xmlHttp.send(null);
}


function soundIcon() {
    let xOffset = canvas.width / canvas.offsetWidth
    let yOffset = canvas.height / canvas.offsetHeight
    let soundAction = {
        'width': 60 / xOffset,
        'height': 60 / yOffset,
        'xOffset': xOffset,
        'yOffset': yOffset
    }
    if (soundOn && userAction) {
        soundAction['icon'] = 'soundOn'
    } else if (soundOn) {
        soundAction['icon'] = 'soundPause'
    } else {
        soundAction['icon'] = 'soundOff'
    }
    return soundAction
}

// Clears the canvas content
function clearCanvas() {
    canvas.width = canvas.width
}


function soundToggle() {
    if (soundOn && userAction) {
        soundOn = false
    } else {
        soundOn = true
    }
    userAction = true
}

function soundIconReset() {
    let soundAction = soundIcon()
    let soundImage = document.getElementById('soundImg')
    
    soundImage.src = 'images/' + soundAction.icon + '.png'
    soundImage.width = soundAction.width
    soundImage.height = soundAction.height
    let page = this.window.location.hash.slice(1) || 'home'
    let [content, id] = page.split('/')
    if (content === 'home') {
        soundImage.style.display = 'none'
    } else {
        soundImage.style.display = 'block'  
    }
}

function checkSound() {
    if (soundOn) {
        if (userAction && audio.background.readyState === 4) {
            //Make sure the audio is ready to play and user has interacted with page
            audio.background.play()
        }
    } else {
        audio.background.pause()
    }
}


function checkMouse() {
    canvas.dispatchEvent(new Event('mousemove'))
}

function checkScreens() {
    let element = document.getElementById('ctf_screen')
    if (ctfScreen) {
        element.classList.remove('scn_up_now')
        element.classList.remove('scn_up')
        element.classList.add('scn_down')
        paused = true
        window.setTimeout(checkMouse, 1300)
    } else if (!userAction) {
        element.classList.remove('scn_up')
        element.classList.remove('scn_down')
        element.classList.add('scn_up_now')
        paused = false
        checkMouse()
    } else {
        element.classList.remove('scn_up_now')
        element.classList.remove('scn_down')
        element.classList.add('scn_up')
        paused = false
        window.setTimeout(checkMouse, 1300)
    }
}
