
//import * as PIXI from "pixi.js"
//import * as PIXI_LAYER from "pixi-layers"

import { Game } from "../core/game";
import { Scene } from "../core/scene";
import { Sprite } from "../core/sprite";
import { Updater } from "../core/updater";

export class Display implements Updater {

    name: string = "display";

    private _pauses: { [name: string]: boolean }  = { };

    private _objects: Map<string, PIXI.DisplayObject> = null;

    private _game: Game = null;
    private _event: any = null;
    private _pixi: PIXI.Application = null;
    private _ticker: PIXI.Ticker = null;

    init(game: Game): boolean {
        this._game = game;
        this._objects = new Map<string, PIXI.Sprite>();
        this._event = game.systems["event"];
        let display = game.components["display"];
        // LINEAR - Smooth scaling (default)
        // NEAREST - Pixelating scaling (but fast?)
        if (!display.scale || display.scale != "smooth")
            PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
        //PIXI.settings.PRECISION_FRAGMENT = PIXI.PRECISION.HIGH;
        // sharper image quality but movement may appear less smooth
        if (!display.move || display.move != "smooth")
            PIXI.settings.ROUND_PIXELS = true;
        this._pixi = new PIXI.Application({ width: display.width, height: display.height });
        this._pixi.stage = new PIXI.display.Stage();
        this._game.width = this._pixi.screen.width;
        this._game.height = this._pixi.screen.height;
        if (game.container) game.container.appendChild(this._pixi.view);
        else document.body.appendChild(this._pixi.view);
        display.pixi = this._pixi;
        display.object = this._pixi.stage;
        display.plugins = this._pixi.renderer.plugins;
        if (display.layers) {
            let idx = 0, layers: { [name: string]: any }  = { };
            if (Array.isArray(display.layers)) {
                let layerNames = [ ];
                layerNames.push(...display.layers);
                display.layers = { };
                for (let layerName of layerNames) {
                    display.layers[layerName] = "";
                }
            }
            (this._pixi.stage as any).group.enableSort = true;
            let bglayer = new PIXI.display.Group(0, false); // idx = 0
            this._pixi.stage.addChild(new PIXI.display.Layer(bglayer));
            display.bglayer = bglayer;
            for (let key of Object.keys(display.layers)) {
                if (key.length > 0) {
                    idx++;
                    //console.log("[" + idx + "] = " + key);
                    if (display.layers[key] == "default") {
                        layers[key] = new PIXI.display.Group(idx, (spr) => {
                            spr.zOrder = spr.y * 10000 + spr.x;
                        });
                        this._pixi.stage.addChild(new PIXI.display.Layer(layers[key]));
                    } else {
                        if (display.layers[key] && display.layers[key].length > 0
                            && game.script && game.script[display.layers[key]]) {
                            layers[key] = new PIXI.display.Group(idx, true);
                            layers[key].on('sort', game.script[display.layers[key]]);
                            this._pixi.stage.addChild(new PIXI.display.Layer(layers[key]));
                        } else {
                            layers[key] = new PIXI.display.Group(idx, false);
                            this._pixi.stage.addChild(new PIXI.display.Layer(layers[key]));
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
        //display.pixi.start(); // ??
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

            if (display.object && scene.game) {
                let gameDisplay = scene.game.components["display"];
                if (gameDisplay.bglayer && (display.bgcontainer == undefined || display.bgcontainer == null)) {
                    let container = new PIXI.Container();
                    container.parentGroup = gameDisplay.bglayer;
                    (display.object as PIXI.Container).addChild(container);
                    display.bgcontainer = container;
                }
            }

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
                let fullName = sprite.scene.name + "." + sprite.name;
                let existingSpr = this._objects.get(fullName);
                if (existingSpr) {
                    display.object = existingSpr;
                    if (callback) callback();
                    return;
                }
                //console.log(fullName);
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
                    this._objects.set(fullName, pixispr);
                    if (callback) callback();
                    return;
                } else if (graphic && graphic.image) {
                    //console.log("load graphic: " + sprite.name);
                    let imgName: string = graphic.image.toString();
                    if (imgName.indexOf('.') < 0) imgName += ".png";
                    let imagelib = sprite.game.libraries["image"];
                    if (imagelib) {
                        let imgUrl = imgName.startsWith("http://") || imgName.startsWith("https://") 
                                    ? imgName : "img/" + imgName;
                        imagelib.loadTexture(imgUrl, graphic.area, (tex) => {
                            if (tex) {
                                let pixispr = graphic.slice && graphic.slice.length >= 4 
                                                ? new PIXI.NineSlicePlane(tex, graphic.slice[0], graphic.slice[1], graphic.slice[2], graphic.slice[3])
                                                : new PIXI.Sprite(tex);
                                this.applySpriteProperties(pixispr, display);
                                display.object = pixispr;
                                this._objects.set(fullName, pixispr);
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
                    if (!imgName.startsWith("http://") && !imgName.startsWith("https://"))
                        imgName = "img/" + imgName;
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
                                imageNames.push(imgName);
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
                                let pixispr = new PIXI.AnimatedSprite(animationContainer.items.get(animationContainer.current), true);
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
                                this._objects.set(fullName, pixispr);
                            }
                            if (callback) callback();
                            return;
                        });
                        return;
                        
                    } // end if img lib ok

                } else if (sprite.script) {
                    let texFunc = this.getScriptFunction(sprite.script, "prepareTexture");
                    let texAsyncFunc = this.getScriptFunction(sprite.script, "prepareTextureAsync");
                    let sprFunc = this.getScriptFunction(sprite.script, "prepareSprite");
                    let sprAsyncFunc = this.getScriptFunction(sprite.script, "prepareSpriteAsync");
                    if (texFunc) {
                        let tex: PIXI.Texture = texFunc ? texFunc(sprite) : null;
                        if (tex) {
                            //let pixispr = new PIXI.Sprite(tex);
                            let pixispr = graphic && graphic.slice && graphic.slice.length >= 4 
                                                ? new PIXI.NineSlicePlane(tex, graphic.slice[0], graphic.slice[1], graphic.slice[2], graphic.slice[3])
                                                : new PIXI.Sprite(tex);
                            this.applySpriteProperties(pixispr, display);
                            display.object = pixispr;
                            this._objects.set(fullName, pixispr);
                        }
                        if (callback) callback();
                    } else if (texAsyncFunc) {
                        texAsyncFunc(sprite, (tex) => {
                            if (tex) {
                                //let pixispr = new PIXI.Sprite(tex);
                                let pixispr = graphic && graphic.slice && graphic.slice.length >= 4 
                                                ? new PIXI.NineSlicePlane(tex, graphic.slice[0], graphic.slice[1], graphic.slice[2], graphic.slice[3])
                                                : new PIXI.Sprite(tex);
                                this.applySpriteProperties(pixispr, display);
                                display.object = pixispr;
                                this._objects.set(fullName, pixispr);
                            }
                            if (callback) callback();
                        });
                    } else if (sprFunc) {
                        let pixispr = sprFunc(sprite);
                        if (pixispr) {
                            this.applySpriteProperties(pixispr, display);
                            display.object = pixispr;
                            this._objects.set(fullName, pixispr);
                        }
                        if (callback) callback();
                            
                    } else if (sprAsyncFunc) {
                        sprAsyncFunc(sprite, (spr) => {
                            if (spr) {
                                let pixispr = spr;
                                this.applySpriteProperties(pixispr, display);
                                display.object = pixispr;
                                this._objects.set(fullName, pixispr);
                            }
                            if (callback) callback();
                        });
                    } else {
                        let pixispr = new PIXI.Sprite(PIXI.Texture.EMPTY);
                        this.applySpriteProperties(pixispr, display);
                        display.object = pixispr;
                        this._objects.set(fullName, pixispr);
                        if (callback) callback();
                    }
                    return;

                } else {
                    // still try to create the sprite tho no textures defined...
                    let pixispr = new PIXI.Sprite(PIXI.Texture.EMPTY);
                    this.applySpriteProperties(pixispr, display);
                    this._objects.set(fullName, pixispr);
                    display.object = pixispr;
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

    applySpriteProperties(pixispr: PIXI.Sprite | PIXI.NineSlicePlane, properties: any) {
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
                    pixispr.parentGroup = this._game.components["display"].layers[properties[item].toString()];
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
        let sprites = scene.spriteList;
        let stage = scene.components["stage"];
        let display = scene.components["display"];
        let sceneContainer = null, stageContainer = null;
        if (stage && stage.display) stageContainer = stage.display;
        if (display && display.object) sceneContainer = display.object;
        for (let sprite of sprites) {
            this.updateSpriteParentNode(sprite,
                sprite.components.stage && stageContainer ? stageContainer : sceneContainer);
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
    sprite: PIXI.AnimatedSprite = null;
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
