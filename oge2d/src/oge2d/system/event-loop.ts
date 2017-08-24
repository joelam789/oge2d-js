import { Game } from "../core/game";
import { Scene } from "../core/scene";
import { Sprite, Plot } from "../core/sprite";
import { Updater } from "../core/updater";

export class EventLoop implements Updater {

    name: string = "event";

    private _game: Game = null;

    init(game: Game): boolean {
        let event = game.components["event"];
        if (event) event.queue = [];
        this._game = game;
        return true;
    }

    preset(scene: Scene, callback: ()=>void) {
        let event = scene.components["event"];
        if (event) event.queue = [];
        if (callback) callback();
    }
	prepare(sprite: Sprite, callback: ()=>void) {
        if (callback) callback();
    }
	setup(scene: Scene) {
        // ...
    }

    activate(scene: Scene) {
        let event = scene.components["event"];
        if (event) event.queue = [];
    }

    deactivate(scene: Scene) {
        let event = scene.components["event"];
        if (event) event.queue = [];
    }
	
	include(sprite: Sprite) {
        let event = sprite.components["event"];
        if (event) {
            if (event.queue == undefined || event.queue == null) event.queue = [];
            else if (event.queue.length > 0) event.queue = [];
        }
    }

	exclude(sprite: Sprite) {
        let event = sprite.components["event"];
        if (event) {
            if (event.queue == undefined || event.queue == null) event.queue = [];
            else if (event.queue.length > 0) event.queue = [];
        }
    }

    enable(sprite: Sprite) {
        let event = sprite.components["event"];
        if (event) {
            if (event.queue == undefined || event.queue == null) event.queue = [];
            else if (event.queue.length > 0) event.queue = [];
        }
        if (sprite.components["plot"] != undefined && sprite.components["plot"] === true) {
            if (sprite.active && event) {
                if (sprite.plot) sprite.plot.reset();
                else {
                    let callbackFunc = event["onUpdate"];
                    let callbackType = callbackFunc ? typeof callbackFunc : null;
                    if (callbackType == "string" && sprite.script) {
                        let callback = this.getScriptCallback(sprite.script, callbackFunc);
                        if (callback) {
                            let func = callback as GeneratorFunction;
                            let plot = func ? new Plot(sprite, func) : null;
                            if (plot && plot.available) sprite.plot = plot;
                        }
                    }
                }
            }
        }
        
    }
	disable(sprite: Sprite) {
        let event = sprite.components["event"];
        if (event) {
            if (event.queue == undefined || event.queue == null) event.queue = [];
            else if (event.queue.length > 0) event.queue = [];
        }
        //sprite.plot = null;
    }
	
	update(scene: Scene, time: number) {
        //if (scene.paused) return;
        let sprites = scene.spriteList;
        for (let spr of sprites) {
            let event = spr.components["event"];
            if (spr.active && event) {
                if (event.queue && event.queue.length > 0) {
                    for (let evt of event.queue) {
                        if (evt.data && typeof evt.data == "function") evt.data(spr);
                        else {
                            let callbackFunc = event[evt.name];
                            let callbackType = callbackFunc ? typeof callbackFunc : null;
                            if (callbackType == "string" && spr.script) {
                                this.callScript(spr, spr.script, callbackFunc, evt.data);
                            } else if (callbackType == "function") {
                                callbackFunc(spr, evt.data);
                            }
                        }
                    }
                }
                if (event) {
                    if (spr.plot) {
                        if (spr.plot.done == false) spr.plot.next();
                    } else {
                        let callbackFunc = event["onUpdate"];
                        let callbackType = callbackFunc ? typeof callbackFunc : null;
                        if (callbackType == "string" && spr.script) {
                            this.callScript(spr, spr.script, callbackFunc);
                        } else if (callbackType == "function") {
                            callbackFunc(spr);
                        }
                    }
                }
            }
            if (event) {
                if (event.queue == undefined || event.queue == null) event.queue = [];
                else if (event.queue.length > 0) event.queue = [];
            }
        }

        let sceneEvent = scene.components["event"];
        if (sceneEvent && sceneEvent.queue) {
            for (let evt of sceneEvent.queue) {
                if (evt.data && typeof evt.data == "function") evt.data(scene);
                else {
                    let callbackFunc = sceneEvent[evt.name];
                    let callbackType = callbackFunc ? typeof callbackFunc : null;
                    if (callbackType == "string" && scene.script) {
                        if (scene.script[callbackFunc]) {
                            scene.script[callbackFunc](scene, evt.data);
                        }
                    } else if (callbackType == "function") {
                        callbackFunc(scene, evt.data);
                    }
                }
            }
        }
        if (sceneEvent) {
            let callbackFunc = sceneEvent["onUpdate"];
            let callbackType = callbackFunc ? typeof callbackFunc : null;
            if (callbackType == "string" && scene.script) {
                if (scene.script[callbackFunc]) scene.script[callbackFunc](scene);
            } else if (callbackType == "function") {
                callbackFunc(scene);
            }
        }
        if (sceneEvent) {
            if (sceneEvent.queue == undefined || sceneEvent.queue == null) sceneEvent.queue = [];
            else if (sceneEvent.queue.length > 0) sceneEvent.queue = [];
        }
    }
	

    addEvent(target: any, eventName: string, eventData?: any) {
        if (target && target.components) {
            let event = target.components["event"];
            if (event) {
                if (event.queue == undefined || event.queue == null) event.queue = [];
                event.queue.push( { name: eventName, data: eventData } );
            }
        }
    }

    callEvent(target: any, eventName: string, eventData?: any) {
        if (target && target.components) {
            let event = target.components["event"];
            if (event) {
                let callbackFunc = event[eventName];
                let callbackType = callbackFunc ? typeof callbackFunc : null;
                if (callbackType == "string" && target.script) {
                    this.callScript(target, target.script, callbackFunc, eventData);
                } else if (callbackType == "function") {
                    callbackFunc(target, eventData);
                }
            }
        }
    }

    callScript(owner: any, script: any, method: string, args?: any) {
        if (script) {
            if (script[method]) script[method](owner, args);
            else this.callScript(owner, script.base, method, args);
        }
    }

    getScriptCallback(script: any, method: string): any {
        if (script) {
            if (script[method]) return script[method];
            else return this.getScriptCallback(script.base, method);
        } else return null;
    }
}

