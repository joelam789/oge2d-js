//import * as PIXI from "pixi.js"

import { Game } from "../core/game";
import { Scene } from "../core/scene";
import { Sprite } from "../core/sprite";
import { Updater } from "../core/updater";

export class Mouse implements Updater {

    name: string = "mouse";

    private _game: Game = null;
    private _stage: any = null;
    private _interaction = null;

    private _sceneMouseContexts: Map<string, MouseContext> = new Map<string, MouseContext>();
    private _sceneSpriteMouseContexts: Map<string, MouseContext> = new Map<string, MouseContext>();

    private getSceneMouseContext(scene: Scene, action: string): MouseContext {
        let key = scene.name + "-" + action;
        let ctx = this._sceneMouseContexts.get(key);
        if (ctx == undefined || ctx == null) {
            this._sceneMouseContexts.set(key, new MouseContext());
            ctx = this._sceneMouseContexts.get(key);
            ctx.emit = ctx.emit.bind(ctx);
        }
        ctx.target = scene;
        ctx.event = action;
        return ctx;
    }

    private getSceneSpriteMouseContext(sprite: Sprite, action: string, shareable: boolean): MouseContext {
        let key = sprite.scene.name + "-" + sprite.name + "-" + action;
        let ctx = this._sceneSpriteMouseContexts.get(key);
        if (ctx == undefined || ctx == null) {
            this._sceneSpriteMouseContexts.set(key, new MouseContext());
            ctx = this._sceneSpriteMouseContexts.get(key);
            ctx.emit = ctx.emit.bind(ctx);
        }
        ctx.target = sprite;
        ctx.event = action;
        ctx.shareable = shareable;
        return ctx;
    }

    init(game: Game): boolean {

        this._game = game;
        this._stage = game.components["display"].object;
        this._interaction = game.components["display"].plugins.interaction;

        let needPlayDummy = navigator.userAgent.indexOf('Mobile') >= 0 &&
                            (navigator.userAgent.indexOf('iPad') >= 0 || navigator.userAgent.indexOf('iPhone') >= 0);
        needPlayDummy = true; // ...
        if (needPlayDummy) {
            let audiolib = this._game.libraries["audio"];
            if (audiolib) {
                window.addEventListener("touchend", () => {
                    if (this._game.libraries["audio"].isPlayingDummy == false)
                        this._game.libraries["audio"].playDummy();
                });
                window.addEventListener("mousedown", () => {
                    if (this._game.libraries["audio"].isPlayingDummy == false)
                        this._game.libraries["audio"].playDummy();
                });
            }
        }

        return true;
    }

    preset(scene: Scene, callback: ()=>void) {
        let display = scene.components["display"];
        let mouse = scene.components["mouse"];
        if (mouse && display && display.object && display.object instanceof PIXI.Container) {
            if (mouse.enabled) (display.object as PIXI.Container).hitArea = new PIXI.Rectangle(0, 0, 
                this._game.components["display"].width, this._game.components["display"].height);
        }
        if (callback) callback();
    }
	prepare(sprite: Sprite, callback: ()=>void) {
        if (sprite && sprite.components["mouse"]) {
            if (sprite.active) this.enable(sprite);
            else this.disable(sprite);
            let hitbox = sprite.components["mouse"].hitbox;
            if (hitbox) {
                let display = sprite.components["display"];
                if (display && display.object) {
                    display.object.hitArea = new PIXI.Rectangle(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
                }
            }
        }
        if (callback) callback();
    }
	setup(scene: Scene) {
        // ...
    }

    activate(scene: Scene) {
        let display = scene.components["display"];
        let mouse = scene.components["mouse"];
        //let view = display ? display.object as PIXI.Container : null;
        let view = display ? display.object.children[0] as PIXI.Container : null;
        if (mouse && display && display.object && view) {
            if (mouse.enabled) {
                view.interactive = true;
                if (mouse.actions && mouse.actions.length > 0) {
                    for (let action of mouse.actions) {
                        let eventName: string = action.toString();
                        if (eventName.length > 0) {
                            eventName = "on" + eventName.charAt(0).toUpperCase() + eventName.substr(1);
                            let ctx = this.getSceneMouseContext(scene, eventName);
                            if (ctx.active === false) {
                                view.on(action, ctx.emit);
                                ctx.active = true;
                            }
                        }
                    }
                }
            } else {
                view.interactive = false;
            }
        }
    }

    deactivate(scene: Scene) {
        let display = scene.components["display"];
        let mouse = scene.components["mouse"];
        //let view = display ? display.object as PIXI.Container : null;
        let view = display ? display.object.children[0] as PIXI.Container : null;
        if (mouse && display && display.object && view) {
            view.interactive = false;
            if (mouse.actions && mouse.actions.length > 0) {
                for (let action of mouse.actions) {
                    let eventName: string = action.toString();
                    if (eventName.length > 0) {
                        eventName = "on" + eventName.charAt(0).toUpperCase() + eventName.substr(1);
                        let ctx = this.getSceneMouseContext(scene, eventName);
                        if (ctx.active === true) {
                            view.off(action, ctx.emit);
                            ctx.active = false;
                        }
                    }
                }
            }
        }
    }

    include(sprite: Sprite) {
        this.enable(sprite);
    }
	exclude(sprite: Sprite) {
        this.disable(sprite);
    }

    enable(sprite: Sprite) {
        let display = sprite.components["display"];
        let mouse = sprite.components["mouse"];
        let view = display ? display.object as PIXI.DisplayObject : null;
        if (mouse && display && display.object && view) {
            if (mouse.enabled) {
                view.interactive = true;
                if (mouse.actions && mouse.actions.length > 0) {
                    for (let action of mouse.actions) {
                        let eventName: string = action.toString();
                        if (eventName.length > 0) {
                            eventName = "on" + eventName.charAt(0).toUpperCase() + eventName.substr(1);
                            let ctx = this.getSceneSpriteMouseContext(sprite, eventName, mouse.shareable === true);
                            if (ctx.active === false) {
                                view.on(action, ctx.emit);
                                ctx.active = true;
                            }
                        }
                    }
                }
            } else {
                view.interactive = false;
            }
        }
    }
	disable(sprite: Sprite) {
        let display = sprite.components["display"];
        let mouse = sprite.components["mouse"];
        let view = display ? display.object as PIXI.DisplayObject : null;
        if (mouse && display && display.object && view) {
            view.interactive = false;
            if (mouse.actions && mouse.actions.length > 0) {
                for (let action of mouse.actions) {
                    let eventName: string = action.toString();
                    if (eventName.length > 0) {
                        eventName = "on" + eventName.charAt(0).toUpperCase() + eventName.substr(1);
                        let ctx = this.getSceneSpriteMouseContext(sprite, eventName, mouse.shareable === true);
                        if (ctx.active === true) {
                            view.off(action, ctx.emit);
                            ctx.active = false;
                        }
                    }
                }
            }
        }
    }
	
	update(scene: Scene, time: number) {
        // ...
    }

    getPos(eventData?: any) {
        let pos = { x: this._interaction.mouse.global.x, y: this._interaction.mouse.global.y };
        let scene = this._game.scene;
        let display = scene && scene.components["display"] ? scene.components["display"].object : null;
        if (eventData && display) pos = eventData.getLocalPosition(display);
        let stage: any = scene ? scene.systems["stage"] : null;
        if (stage && stage.transform) pos = stage.transform(pos);
        return pos;
    }
}

export class MouseContext {
    event: string = "";
    target: any = null;
    active: boolean = false;
    shareable: boolean = false;
    emit(eventData) {
        eventData.stopped = this.shareable == false;
        if (this.target) {
            let eventSystem: any = this.target.systems 
                                    ? this.target.systems["event"]
                                    : (this.target.scene ? this.target.scene.systems["event"] : null);
            if (eventSystem) eventSystem.addEvent(this.target, this.event, eventData);
        }
    }
}
