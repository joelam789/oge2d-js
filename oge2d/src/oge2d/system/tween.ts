import { Game } from "../core/game";
import { Scene } from "../core/scene";
import { Sprite } from "../core/sprite";
import { Updater } from "../core/updater";

export class Tween implements Updater {

    name: string = "tween";

    private _game: Game = null;
    private _ticker: any = null;

    getTween() {
        return createjs.Tween;
    }

    init(game: Game): boolean {
        this._game = game;
        if (game.components.display) this._ticker = game.components.display.ticker;
        return true;
    }

    activate(scene: Scene) {
        createjs.Tween.removeAllTweens(); // clean-up
    }

    deactivate(scene: Scene) {
        createjs.Tween.removeAllTweens(); // clean-up
    }
	
	update(scene: Scene, time: number) {
        //createjs.Tween.tick(this._ticker ? this._ticker.deltaTime : 1, scene.paused);
        let ticker = (createjs as any).Ticker;
        if (ticker) {
            if (ticker.paused != scene.paused) ticker.paused = scene.paused;
        } else {
            createjs.Tween.tick(this._ticker ? this._ticker.deltaTime : 1, scene.paused);
        }
    }

    get(target: any, options: any = undefined, override: boolean = true) {
        return createjs.Tween.get(target, options, undefined, override);
    }

    blink(target: any, ms?: number, speed?: number, callback?: (targetObj?: any)=>void) {
        let speedLevel = speed ? speed : 1;
        if (speedLevel < 1) speedLevel = 1;
        if (speedLevel > 5) speedLevel = 5;
        createjs.Tween.get(target, {loop:true})
                        .to({alpha: 1.0})
                        .wait(50/speedLevel)
                        .to({alpha: 0.0})
                        .wait(50/speedLevel);
        if (!isNaN(ms) && ms > 0) {
            this._game.scene.timeout(ms, (obj) => {
                createjs.Tween.removeTweens(obj);
                obj.alpha = 1.0;
                if (callback) callback(obj);
            }, target);
        }
    }

    clear(target?: any) {
        if (target) createjs.Tween.removeTweens(target);
        else createjs.Tween.removeAllTweens();
    }

    moveTo(target: any, x: number, y: number, speed: number) {
        let endpos = {x: x, y: y};
        let distance = Math.sqrt( (target.x - x) * (target.x - x) + (target.y - y) * (target.y - y) );
        let time = distance / (speed <= 0 ? 1 : speed) * 1000;
        return createjs.Tween.get(target, {override:true}).to({x: x, y: y}, time);
    }
	
}

