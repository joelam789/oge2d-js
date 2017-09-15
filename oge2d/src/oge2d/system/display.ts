
import { Game } from "../core/game";
import { Scene } from "../core/scene";
import { Sprite } from "../core/sprite";
import { Updater } from "../core/updater";

export class Display implements Updater {

    name: string = "display";

    private _pauses: { [name: string]: boolean }  = { };

    private _game: Game = null;
    private _event: any = null;
    private _pixi: PIXI.Application = null;
    private _ticker: PIXI.ticker.Ticker = null;

    init(game: Game): boolean {
        this._game = game;
        this._event = game.systems["event"];
        let display = game.components["display"];
        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
        //PIXI.settings.PRECISION_FRAGMENT = PIXI.PRECISION.HIGH;
        this._pixi = new PIXI.Application(display.width, display.height);
        this._pixi.renderer.roundPixels = true;
        this._game.width = this._pixi.screen.width;
        this._game.height = this._pixi.screen.height;
        if (game.container) game.container.appendChild(this._pixi.view);
        else document.body.appendChild(this._pixi.view);
        display.object = this._pixi.stage;
        display.plugins = this._pixi.renderer.plugins;
        if (display.layers) {
            let idx = 0, layers: { [name: string]: any }  = { };
            this._pixi.stage.displayList = new PIXI.DisplayList();
            for (let key of Object.keys(display.layers)) {
                if (key.length > 0) {
                    idx++;
                    if (display.layers[key] == "default") {
                        layers[key] = new PIXI.DisplayGroup(idx, (spr) => {
                            spr.zOrder = -spr.y * 10000 - spr.x;
                        });
                    } else {
                        if (display.layers[key] && game.script && game.script[display.layers[key]]) {
                            layers[key] = new PIXI.DisplayGroup(idx, true);
                            layers[key].on('add', game.script[display.layers[key]]);
                        } else {
                            layers[key] = new PIXI.DisplayGroup(idx, false);
                        }
                    }
                }
            }
            display.layers = layers;
        }
        this._ticker = this._pixi.ticker.add((deltaTime) => {
            this._game.fps = this._ticker.FPS;
            this._game.update(this._ticker.elapsedMS);
        });
        display.ticker = this._ticker;
        game.components["display"] = display;
        return true;
    }

    preset(scene: Scene, callback: ()=>void) {
        if (scene) {
            let display = scene.components["display"];
            if (display == undefined || display == null) {
                scene.components["display"] = { };
                display = scene.components["display"];
            }
            if (display && (display.object == undefined || display.object == null)) display.object = new PIXI.Container();
            this._pauses[scene.name] = false;
        }
        if (callback) callback();
        
    }

	prepare(sprite: Sprite, callback: ()=>void) {

        let display = sprite.components["display"];
        if (display && display.object) {
            if (callback) callback();
            return;
        }

        let container = null;
        display = sprite.scene.components["display"];
        if (display && display.object) container = display.object;
        if (container) display = sprite.components["display"];
        if (container && display) {
            if (display.object == undefined || display.object == null) {
                let text = sprite.components["text"];
                let graphic = sprite.components["graphic"];
                let animation = sprite.components["animation"];
                if (text) {
                    let textContent: string = text.content && text.content.length > 0 
                                            ? (Array.isArray(text.content) ? text.content.join("\n") : text.content.toString()) : "";
                    text.content = textContent;
                    let pixispr = new PIXI.Text(textContent, text.style ? text.style : undefined);
                    this.applySpriteProperties(pixispr, display);
                    display.object = pixispr;
                    if (callback) callback();
                    return;
                } else if (graphic && graphic.image && graphic.area) {
                    //console.log("load graphic: " + sprite.name);
                    let imgName: string = graphic.image.toString();
                    if (imgName.indexOf('.') < 0) imgName += ".png";
                    let imagelib = sprite.game.libraries["image"];
                    if (imagelib) {
                        imagelib.loadTexture("img/" + imgName, graphic.area, (tex) => {
                            if (tex) {
                                let pixispr = graphic.slice && graphic.slice.length >= 4 
                                                ? new PIXI.mesh.NineSlicePlane(tex, graphic.slice[0], graphic.slice[1], graphic.slice[2], graphic.slice[3])
                                                : new PIXI.Sprite(tex);
                                this.applySpriteProperties(pixispr, display);
                                display.object = pixispr;
                            }
                            if (callback) callback();
                            return;
                        });
                        return;
                    }
                } else if (animation && animation.image && animation.sheets) {
                    //console.log("load animation: " + sprite.name);
                    let imgName: string = animation.image.toString();
                    if (imgName.indexOf('.') < 0) imgName += ".png";
                    let imagelib = sprite.game.libraries["image"];
                    if (imagelib) {
                        let sheetNames: Array<string> = [];
                        let sheetUrls: Map<string, Array<string>> = new Map<string, Array<string>>();
                        let sheetAreas: Map<string, Array<any>> = new Map<string, Array<any>>();
                        let framesets = animation.sheets;
                        let animationContainer = new AnimationContainerPixi();
                        let animationNames = Object.keys(framesets);
                        for (let animationName of animationNames) {
                            let frameset = framesets[animationName];
                            let frameCount = Math.floor(frameset.length / 4);
                            let imageNames = [];
                            let animationFrames = [];
                            for (let i=0; i<frameCount; i++) {
                                imageNames.push("img/" + imgName);
                                animationFrames.push({x: frameset[4*i], y: frameset[4*i+1], width: frameset[4*i+2], height: frameset[4*i+3]});
                            }
                            sheetNames.push(animationName);
                            sheetUrls.set(animationName, imageNames);
                            sheetAreas.set(animationName, animationFrames);
                        } // end for animation names

                        imagelib.loadSheets(sheetNames, sheetUrls, sheetAreas, (sheets) => {

                            if (sheets && sheets.size > 0) {
                                sheets.forEach((value, key) => animationContainer.items.set(key, value));
                                if (animation.current && animationContainer.items.has(animation.current.toString())) {
                                    animationContainer.current = animation.current.toString();
                                } else animationContainer.current = animationNames[0];
                                let pixispr = new PIXI.extras.AnimatedSprite(animationContainer.items.get(animationContainer.current), true);
                                this.applySpriteProperties(pixispr, display);
                                if (animation.hasOwnProperty("loop")) pixispr.loop = animation.loop;
                                if (animation.hasOwnProperty("speed")) pixispr.animationSpeed = animation.speed;
                                
                                animationContainer.owner = sprite;
                                animationContainer.sprite = pixispr;
                                animationContainer.events = this._event;
                                display.object = pixispr;
                                display.animation = animationContainer;
                                pixispr.onComplete = animationContainer.done.bind(animationContainer);
                                pixispr.play();
                            }
                            if (callback) callback();
                            return;
                        });
                        return;
                        
                    } // end if img lib ok

                } else if (sprite.script) {
                    let texfunc = this.getScriptFunction(sprite.script, "prepareTexture");
                    let tex: PIXI.Texture = texfunc ? texfunc(sprite) : null;
                    if (tex) {
                        let pixispr = new PIXI.Sprite(tex);
                        this.applySpriteProperties(pixispr, display);
                        display.object = pixispr;
                    }
                    if (callback) callback();
                    return;
                }

            } // end if display.object is empty

        } // end if display/container ok

        if (callback) callback();

    }

	setup(scene: Scene) {
        this.updateDisplayParentNode(scene);
        this.updateAnimationState(scene);
    }

    activate(scene: Scene) {
        let display = scene.components["display"];
        if (display) {
            if (display.object == undefined || display.object == null) display.object = new PIXI.Container();
            if (display.object) this._pixi.stage.addChild(display.object as PIXI.Container);
            if (display.bgcolor) {
                let colorCode: string = display.bgcolor.toString();
                if (colorCode.length > 1 && colorCode.charAt(0) == '#') {
                    this._pixi.renderer.backgroundColor = parseInt(colorCode.substring(1), 16);
                }
            }
        }
    }

    deactivate(scene: Scene) {
        let display = scene.components["display"];
        if (display && display.object && display.object instanceof PIXI.Container) {
            this._pixi.stage.removeChild(display.object as PIXI.Container);
        }
    }
	
	include(sprite: Sprite) {
        let container = null;
        let display = sprite.scene.components["display"];
        if (display && display.object) container = display.object;
        this.updateSpriteParentNode(sprite, container);
    }

	exclude(sprite: Sprite) {
        let display = sprite.components["display"];
        if (display && display.object) {
            let container = null;
            display = sprite.scene.components["display"];
            if (display && display.object) container = display.object;
            if (container) display = sprite.components["display"];
            if (container && display && display.object) {
                if (container == display.object.parent) container.removeChild(display.object);
            }
        }
        //if (sprite.components["display"]) sprite.components["display"].object = null;
    }

    enable(sprite: Sprite) {
        let display = sprite.components["display"];
        if (display && display.object) {
            display.object.visible = true;
        }
    }
	disable(sprite: Sprite) {
        let display = sprite.components["display"];
        if (display && display.object) {
            display.object.visible = false;
        }
    }

    refresh(scene: Scene) {
        let display = scene.components["display"];
        if (display) {
            let sprites = scene.spriteList;
            for (let sprite of sprites) {
                let display = sprite.components["display"];
                if (display && display.object) {
                    let text = sprite.components["text"];
                    //let graphic = sprite.components["graphic"];
                    let animation = sprite.components["animation"];
                    this.applySpriteProperties(display.object, display);
                    if (text) {
                        let textContent: string = text.content && text.content.length > 0 
                                            ? (Array.isArray(text.content) ? text.content.join("\n") : text.content.toString()) : "";
                        text.content = textContent;
                        if (textContent != display.object.text) display.object.text = textContent;
                    } else if (animation) {
                        if (animation.hasOwnProperty("loop"))
                            display.object.loop = animation.loop;
                        if (animation.hasOwnProperty("speed"))
                            display.object.animationSpeed = animation.speed;
                        if (animation.current && display.animation) display.animation.set(animation.current.toString());
                        else if (animation.sheets && display.animation) {
                            let animationNames = Object.keys(animation.sheets);
                            if (animationNames.length > 0) display.animation.set(animationNames[0]);
                        }
                        //if (sprite.active) display.object.play();
                    }
                    //display.object.visible = sprite.active;
                }
            }
            this.updateDisplayParentNode(scene);
            this.updateAnimationState(scene);
        }
    }
	
	update(scene: Scene, time: number) {
        this.updateAnimationState(scene);
    }

    applySpriteProperties(pixispr: PIXI.Sprite | PIXI.mesh.NineSlicePlane, properties: any) {
        for (let item of Object.keys(properties)) {
            if (item == "object") continue;
            if (item == "animation") continue;
            if (item == "parent") continue;
            if (item == "angle") {
                pixispr.rotation = properties[item] * Math.PI / 180; // converts from degrees to radians
                continue;
            }
            if (item == "tint" && typeof properties[item] == "string") {
                let colorCode: string = properties[item].toString();
                if (colorCode.length > 1 && colorCode.charAt(0) == '#') {
                    pixispr.tint = parseInt(colorCode.substring(1), 16);
                }
                continue;
            }
            if (item == "layer") {
                if (this._game.components["display"].layers 
                    && this._game.components["display"].layers[properties[item].toString()]) {
                    pixispr.displayGroup = this._game.components["display"].layers[properties[item].toString()];
                }
                continue;
            }
            if (pixispr[item] != undefined) {
                if (typeof properties[item] == "object") {
                    for (let subitem of Object.keys(properties[item])) {
                        if (pixispr[item][subitem] != undefined) {
                            if (typeof properties[item][subitem] == "object") {
                                for (let subitem2 of Object.keys(properties[item][subitem]))
                                    pixispr[item][subitem][subitem2] = properties[item][subitem][subitem2];
                            } else pixispr[item][subitem] = properties[item][subitem];
                        }
                    }
                } else pixispr[item] = properties[item];
            }
        }
    }

    updateAnimationState(scene: Scene) {
        if (this._pauses[scene.name] != scene.paused) {
            let sprites = scene.spriteList;
            for (let spr of sprites) {
                if (!spr.active) continue;
                let display = spr.components["display"];
                if (display && display.object) {
                    if (display.animation) {
                        if (scene.paused) display.object.stop();
                        else display.object.play();
                    }
                }
            }
            this._pauses[scene.name] = scene.paused;
        }
    }

    updateSpriteParentNode(sprite: Sprite, defaultContainer: any) {
        let display = sprite.components["display"];
        if (display && display.object) {
            let parent = null;
            let parentName: string = null;
            let parentSprite: Sprite = null;
            if (display.parent) parentName = display.parent as string;
            if (parentName && parentName.length > 0) parentSprite = sprite.scene.sprites[parentName];
            if (parentSprite && parentSprite.components["display"]) parent = parentSprite.components["display"].object;
            if (parent == undefined || parent == null)  parent = defaultContainer;
            if (parent && parent != display.object.parent) parent.addChild(display.object);
            display.object.visible = sprite.active;
        }
    }

    updateDisplayParentNode(scene: Scene) {
        let container = null;
        let display = scene.components["display"];
        if (display && display.object) container = display.object;
        for (let sprite of scene.spriteList) {
            this.updateSpriteParentNode(sprite, container);
        }
    }

    getScriptFunction(script: any, functionName: string): any {
        if (script) {
            if (script[functionName]) return script[functionName];
            else return this.getScriptFunction(script.base, functionName);
        } else return null;
    }

}

export class AnimationContainerPixi {
    owner: Sprite = null;
    events: any = null;
    current: string = "";
    sprite: PIXI.extras.AnimatedSprite = null;
    items: Map<string, Array<PIXI.Texture>> = new Map<string, Array<PIXI.Texture>>();
    onComplete: (spr?: Sprite)=>void = null;
    set(animationName: string, force?: boolean) {
        if (force !== true && this.current == animationName) return;
        if (this.sprite && this.items.get(animationName)) {
            this.sprite.textures = this.items.get(animationName);
            this.current = animationName;
            this.sprite.play();
        }
    }
    reset(animationName?: string, force?: boolean) {
        if (this.sprite) {
            this.sprite.gotoAndStop(0);
            if (animationName) {
                if (force !== true && this.current == animationName) return;
                if (this.items.get(animationName)) {
                    this.sprite.textures = this.items.get(animationName);
                    this.sprite.texture = this.sprite.textures[0];
                    this.current = animationName;
                }
            }
        }
    }
    play(loop: boolean = true) {
        if (this.sprite) {
            this.sprite.loop = loop;
            this.sprite.play();
        }
    }
    done() {
        if (this.sprite && !this.sprite.loop && this.events && this.owner) {
            if (this.onComplete) this.onComplete(this.owner);
            else this.events.addEvent(this.owner, "onAnimationComplete");
        }
    }
}
