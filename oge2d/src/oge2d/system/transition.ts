import { Game } from "../core/game";
import { Scene } from "../core/scene";
import { Sprite } from "../core/sprite";
import { Updater } from "../core/updater";

export class Transition implements Updater {

    name: string = "transition";

    private _game: Game = null;
    private _stage: any = null;
    private _dark: PIXI.Sprite = null;
    private _target: string = "";

    init(game: Game): boolean {
        this._game = game;
        this._stage = game.components["display"].object;
        let graph = new PIXI.Graphics();
        //graph.x = graph.y = 0;
        //graph.width = graph.height = 1;
        graph.beginFill(0);
        graph.drawRect(0, 0, 1, 1);
        graph.endFill();
        this._dark = new PIXI.Sprite(graph.generateCanvasTexture());
        //this._dark.x = this._dark.y = 0;
        //this._dark.width = this._dark.height = 1;
        this._dark.scale.set(game.width, game.height);
        let layers = game.components["display"].layers;
        let keys = layers ? Object.keys(layers) : [];
        if (keys.length > 0) this._dark.displayGroup = new PIXI.DisplayGroup(keys.length + 1, false);
        return true;
    }

    isWorking(): boolean {
        return this._target && this._target.length > 0;
    }

    callScene(sceneName: string, onReady?: (nextScene: Scene)=>void, time?: number) {
        let duration = time ? time / 2 : 1000;
        if (this._target && this._target.length > 0) return;
        let tweenOut: any = this._game.scene.systems["tween"];
        if (tweenOut && sceneName && this._game.scene.name != sceneName) {
            this._target = sceneName;
            this._dark.alpha = 0.0;
            this._stage.addChild(this._dark);
            tweenOut.get(this._dark).to({alpha: 1.0}, duration).call(() => {
                if (this._target && this._target == sceneName) {
                    this._game.loadScene(sceneName, (scene) => {
                        if (scene) {
                            if (onReady) onReady(scene);
                            this._stage.removeChild(this._dark);
                            this._game.scene = scene;
                            let tweenIn: any = this._game.scene.systems["tween"];
                            if (tweenIn) {
                                this._dark.alpha = 1.0;
                                this._stage.addChild(this._dark);
                                tweenIn.get(this._dark).to({alpha: 0.0}, duration).call(() => {
                                    this._stage.removeChild(this._dark);
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

