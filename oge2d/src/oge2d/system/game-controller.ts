import { Game } from "../core/game";
import { Scene } from "../core/scene";
import { Sprite } from "../core/sprite";
import { Updater } from "../core/updater";

export class GameController implements Updater {

    name: string = "gamepad";

    private _game: Game = null;
    private _event: any = null;

    ids: Array<number> = [];
    gamepads: { [name: string]: any }  = { };
    
    axeSensitiveLevel = 2;

    init(game: Game): boolean {

        this._game = game;

        window.addEventListener("gamepadconnected", (event) => {
            let evt = event as any;
            let idx = evt.gamepad.index.toString();
            console.info("Gamepad detected: " + idx);
            if (!this.gamepads[idx]) {
                this.gamepads[idx] = {
                    keys: {}, 
                    ticks: {}
                };
            }
            if (this.ids.indexOf(evt.gamepad.index) < 0) {
                this.ids.push(evt.gamepad.index);
                this.ids.sort((a, b) => a - b);
            }
        });

        window.addEventListener("gamepaddisconnected", (event) => {
            let evt = event as any;
            let idx = evt.gamepad.index.toString();
            console.info("Gamepad disconnected: " + idx);
            this.gamepads[idx] = null;
            this.ids = this.ids.filter((ele, idx) => {
                return ele != evt.gamepad.index;
            });
        });
        
        return true;
    }

    activate(scene: Scene) {
        this._event = scene.systems["event"]; // use it to emit events for the scene
        this.reset(); // clear key states
    }

    deactivate(scene: Scene) {
        this.reset(); // clear key states
    }
	
	update(scene: Scene, time: number) {
        this.checkGamepads();
    }

    reset() {
        let keys = Object.keys(this.gamepads);
        for (let key of keys) {
            let gamepad = this.gamepads[key];
            if (!gamepad) continue;
            if (gamepad.keys) {
                let arr = Object.keys(gamepad.keys);
                for (let item of arr) gamepad.keys[item] = 0;
            }
            if (gamepad.ticks) {
                let arr = Object.keys(gamepad.ticks);
                for (let item of arr) gamepad.ticks[item] = 0;
            }
        }
    }

    getGamepadIds() {
        let ret = [];
        for (let id of this.ids) ret.push(id.toString());
        return ret;
    }

    getFirstGamepad() {
        if (this.ids.length <= 0) return null;
        let idx = this.ids[0].toString();
        return this.gamepads[idx];
    }
    
    checkGamepads() {
        let gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (let i = 0; i < gamepads.length; i++) {
            let idx = i.toString();
            let gamepad = gamepads[i];
            if (!gamepad) continue;
            if (!this.gamepads[idx]) {
                this.gamepads[idx] = {
                    keys: {}, 
                    ticks: {}
                };
                if (this.ids.indexOf(i) < 0) {
                    this.ids.push(i);
                    this.ids.sort((a, b) => a - b);
                }
            }
            let pad = this.gamepads[idx];
            if (gamepad.buttons) {
                for (let j = 0; j < gamepad.buttons.length; j++) {
                    //console.log(j, gamepad.buttons[j]);
                    pad.keys["b" + j] = gamepad.buttons[j].pressed;
                }
            }
            pad.keys["up"] = false;
            pad.keys["down"] = false;
            pad.keys["left"] = false;
            pad.keys["right"] = false;
            if (gamepad.axes) {
                let x = 0, y = 0;
                let slevel = this.axeSensitiveLevel;
                if (slevel < 1) slevel = 1;
                if (slevel > 10) slevel = 10;
                for (let j = 0; j < gamepad.axes.length; j++) {
                    let val = gamepad.axes[j];
                    if (Math.abs(val) < (0.1 / slevel)) continue; // do not want it to be too sensitive
                    if (j % 2 === 0) x = val;
                    if (j % 2 === 1) y = 0 - val; // ...
                }
                if (x != 0 || y != 0) {
                    let a = Math.atan2(y, x) * (180/Math.PI);
                    if (a < 0) a += 360;
                    //console.log(a);
                    if (a <= 22.5 || a > 360 - 22.5) {
                        pad.keys["right"] = true;
                    } else if (a > 22.5 && a <= 22.5 + 45) {
                        pad.keys["right"] = true;
                        pad.keys["up"] = true;
                    } else if (a > 22.5 + 45 && a <= 22.5 + 90) {
                        pad.keys["up"] = true;
                    } else if (a > 22.5 + 90 && a <= 22.5 + 135) {
                        pad.keys["left"] = true;
                        pad.keys["up"] = true;
                    } else if (a > 22.5 + 135 && a <= 22.5 + 180) {
                        pad.keys["left"] = true;
                    } else if (a > 22.5 + 180 && a <= 22.5 + 225) {
                        pad.keys["down"] = true;
                        pad.keys["left"] = true;
                    } else if (a > 22.5 + 225 && a <= 22.5 + 270) {
                        pad.keys["down"] = true;
                    } else if (a > 22.5 + 270 && a <= 22.5 + 315) {
                        pad.keys["right"] = true;
                        pad.keys["down"] = true;
                    }
                }
            }
        }
    }
	
}

