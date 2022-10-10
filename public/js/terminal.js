// Copyright 2022 CATCON GAMES
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import xterm from 'xterm'
import { FitAddon } from 'xterm-addon-fit';

export default class Console {
    constructor(runtime) {
        this.runtime = runtime
        this.term;
        this.fitaddon;
        this.command = '';
        this.commands = {};
    }
    loadTerminal() {
        this.term = new xterm.Terminal({
            fontFamily: '"Courier new", "american typewriter"',
            rendererType: "dom",
            allowTransparency: true,
            cursorBlink: true,
            cursorStyle: "bar",
            cursorWidth: 1,
            fontWeight: 600,
            fontSize: 13,
            letterSpacing: 1.5,
        });
        this.term.setOption('theme', {
            background: 'transparent',
            foreground: '#58bf1d',
            cursor: '#58bf1d'
        });
        this.fitaddon = new FitAddon();
        this.term.loadAddon(this.fitaddon);
        this.term.open(document.querySelector('.termscreen'));
        // Make the terminal's size and geometry fit the size of #terminal-container
        this.fitaddon.fit();

        // Cancel wheel events from scrolling the page if the terminal has scrollback
        document.querySelector('.xterm').addEventListener('wheel', e => {
            if (this.term.buffer.active.baseY > 0) {
                e.preventDefault();
            }
        });
        let tt = document.querySelector('sb-console')
        tt.addEventListener('click', e => {
            let action = tt.getAttribute('data-type')
            if (action == 'RESET') {
                this.term.reset()
                
            } else {
                this.submitTerminal(this.term, action)
            }
            
        });
        this.buildCommands()
        this.runTerminal()
        if (typeof roomGate !== 'undefined' && roomGate.status) {
            this.submitTerminal(this.term, "GET")
        }
    }

    reload() {
        if (typeof roomGate !== 'undefined' && roomGate.status) {
            this.submitTerminal(this.term, "GET")
        }
    }

    resize() {
        if (typeof roomGate !== 'undefined' && roomGate.status) {
            let e = this.fitaddon.proposeDimensions();
            if (e !== undefined && !isNaN(e.cols) && !isNaN(e.rows)) {
                this.fitaddon.fit();
            }
        }
    }

    runTerminal() {
        if (this.term._initialized) {
            return;
        }

        this.term._initialized = true;

        this.term.prompt = () => {
            this.term.write('\r\n$> ');
        };

        this.term.onData(e => {
            switch (e) {
                case '\u0003': // Ctrl+C
                    this.term.write('^C\r\n');
                    this.submitTerminal(this.term, "GET")
                    //prompt(term);
                    break;
                case '\r': // Enter
                    this.submitTerminal(this.term, "POST", this.command)
                    this.command = '';
                    break;
                case '\x1b[A': // Up
                    keys[38] = true; //control game
                    break;
                case '\x1b[B': // Down
                    keys[40] = true //control game
                    break;
                case '\x1b[C': // Right
                    keys[39] = true //control game
                    break;
                case '\x1b[D': // Left
                    keys[37] = true; //control game
                    break;
                case '\u007F': // Backspace (DEL)
                    // Do not delete the prompt
                    if (this.command.length > 0) {
                        this.term.write('\b \b');
                        this.command = this.command.substr(0, this.command.length - 1);
                    }
                    break;
                default: // Print all other characters
                    if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7B)) {
                        this.command += e;
                        this.term.write(e);
                    }
            }
        });
    }

    prompt(term) {
        this.command = '';
        this.term.write('\r\n$> ');
    }

    buildCommands() {
        this.commands = {
            help: {
                f: () => {
                    this.term.writeln([
                        'Welcome to xterm.js! Try some of the commands below.',
                        '',
                        ...Object.keys(this.commands).map(e => `  ${e.padEnd(10)} ${this.commands[e].description}`)
                    ].join('\n\r'));
                    this.prompt(this.term);
                },
                description: 'Prints this help message',
            },
            ls: {
                f: () => {
                    this.term.writeln(['a', 'bunch', 'of', 'fake', 'files'].join('\r\n'));
                    this.term.prompt(this.term);
                },
                description: 'Prints a fake directory structure'
            },
        };
    }

    runCommand(text) {
        const command = text.trim().split(' ')[0];
        if (command.length > 0) {
            this.term.writeln('');
            if (command in this.commands) {
                this.commands[command].f();
                return;
            }
            this.term.writeln(`${command}: command not found`);
        }
        this.prompt(this.term);
    }

    submitTerminal(term, type, cmd) {
        let url = roomGate.gate.console
        let xhr = new XMLHttpConsole()
        if (typeof url !== 'string') {
            xhr.printTerminal(term, type, url)
            return
        }
        let data = ""
        if (type === "POST") {
            data = 'response=' + cmd
        } else {
            // term.reset()
            // term.write("Connecting...")
        }
        if (url.length == 0) {
            return
        }
        xhr.open(type, url, true)
        xhr.setRequestHeader("Content-Type", 'application/x-www-form-urlencoded')
        xhr.withCredentials = true
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                let response = JSON.parse(xhr.responseText)
                xhr.printTerminal(term, type, response)
            }
        };
        xhr.send(data)
    }

}

class XMLHttpConsole extends XMLHttpRequest {
    printTerminal(term, type, response) {
        let framescn = document.getElementsByClassName('framescreen')[0];
        let termscn = document.getElementsByClassName('termscreen')[0];
        termscn.style.display = 'block'
        framescn.style.display = 'none'
        for (let i = 0; i < response.length; i++) {
            let prefix = "\r\n";
            if (i === 0 && type === "GET") {
                term.reset()
                prefix = ""; // first line of first call
            }
            let cmd = Object.keys(response[i])[0]
            if (cmd === "print") {
                let text = response[i]["print"]
                if (response[i]["align"] === "center") {
                    term.writeln(`\x1b[${Math.floor((term.cols - text.length + 2) / 2)}G${text}`);
                } else {
                    term.write(prefix + text)
                }
                try {
                    if (soundOn && !ctfScreen && !termSound && roomGate.status) {
                        if (text == "GREETINGS PROFESSOR FALKEN. SHALL WE PLAY A GAME?") {
                            termSound = true
                            setTimeout(() => {
                                termSound = false
                            }, "5000")
                            let audio = new Audio('sounds/greetings.ogg');
                            audio.play();
                        }
                    }
                } catch (e) {}
            } else if (cmd === "clear") {
                term.reset()
            } else if (cmd === "frame") {
                termscn.style.display = 'none'
                let tt = document.querySelector('sb-console')
                let sound = tt.getAttribute('data-sound')
                let url = response[i]["frame"]
                if (sound === "false") {
                    url = url.replace("autoplay=1", "autoplay=0")
                }
                framescn.src = url
                framescn.style.display = 'block'
            }
        }
        term.focus()
    }

}