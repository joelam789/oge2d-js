//import * as PIXI from "pixi.js"
//import * as PIXI_CG from "@pixi/canvas-graphics"

export class RpgTransition implements OGE2D.Updater {

    name: string = "rpg-transition";

    private _game: OGE2D.Game = null;
    private _player: OGE2D.Sprite = null;
    private _stage: any = null;
    private _bright: PIXI.Sprite = null;
    private _pixi: PIXI.Application = null;
    private _target: string = "";

    init(game: OGE2D.Game): boolean {
        this._game = game;
        this._pixi = game.components["display"].pixi;
        this._stage = game.components["display"].object;

        //let graph = new PIXI.Graphics();
        ////graph.x = graph.y = 0;
        ////graph.width = graph.height = 1;
        //graph.beginFill(0);
        //graph.drawRect(0, 0, 1, 1);
        //graph.endFill();
        //this._dark = new PIXI.Sprite(graph.generateCanvasTexture());

        //let canv = document.createElement('canvas');
        //canv.width = canv.height = 1;
        //let ctx = canv.getContext('2d');
        //ctx.fillStyle = 'rgba(255, 255, 255, 1)';  // white
        //ctx.fillRect(0, 0, 1, 1);
        //this._bright = new PIXI.Sprite(PIXI.Texture.from(canv));

        let rect = new PIXI.Graphics();
        rect.beginFill(0xFFFFFF); // white
        rect.drawRect(0, 0, 1, 1);
        rect.endFill();
        let tex = this._pixi.renderer.generateTexture(rect, PIXI.SCALE_MODES.NEAREST, 1);
        this._bright = new PIXI.Sprite(tex);

        this._bright.scale.set(game.width, game.height);

        let layers = game.components["display"].layers;
        let keys = layers ? Object.keys(layers) : [];
        if (keys.length > 0) {
            this._bright.parentGroup = new PIXI.display.Group(keys.length + 1, false);
            this._stage.addChild(new PIXI.display.Layer(this._bright.parentGroup));
        }
        return true;
    }

    activate(scene: OGE2D.Scene) {
		this._player = null;
		let rpg = scene.components["rpg"];
		if (rpg) {
			if (rpg.player) this._player = scene.sprites[rpg.player];
        }
        let stage = scene.sys("stage") as any;
        if (stage) stage.zoom(scene, false);
	}

    isWorking(): boolean {
        return this._target && this._target.length > 0;
    }

    callScene(sceneName: string, onReady?: (nextScene: OGE2D.Scene)=>void, timeFadeOut?: number, timeFadeIn?: number) {
        let durationFadeOut = timeFadeOut ? timeFadeOut : 1000;
        let durationFadeIn = timeFadeIn ? timeFadeIn : 1000;
        if (this._target && this._target.length > 0) return;
        let tweenOut: any = this._game.scene.systems["tween"];
        if (tweenOut && sceneName && this._game.scene.name != sceneName) {
            this._target = sceneName;
            this._bright.alpha = 0.0;
            this._stage.addChild(this._bright);

            if (this._player) {
                let pos = {x: this._player.get("stage").x, y: this._player.get("stage").y};
                let stage = this._game.scene.sys("stage") as any;
                pos = stage.transform(pos, false);
                stage.zoomTo(this._game.scene, 2.0, 2.0, pos.x, pos.y, durationFadeOut, () => {
                    console.log("done");
                    //stage.zoom(this._game.scene, false);
                });
            }

            tweenOut.get(this._bright).to({alpha: 1.0}, durationFadeOut).call(() => {
                if (this._target && this._target == sceneName) {
                    this._game.loadScene(sceneName, (scene) => {
                        if (scene) {
                            if (onReady) onReady(scene);
                            this._stage.removeChild(this._bright);
                            this._game.scene = scene;
                            let tweenIn: any = this._game.scene.systems["tween"];
                            if (tweenIn) {
                                this._bright.alpha = 1.0;
                                this._stage.addChild(this._bright);
                                tweenIn.get(this._bright).to({alpha: 0.0}, durationFadeIn).call(() => {
                                    this._stage.removeChild(this._bright);
                                });
                            }
                        }
                        this._target = "";
                    });
                }
            });
        }
        
    }
	
}

