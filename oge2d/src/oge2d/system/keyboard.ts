import { Game } from "../core/game";
import { Scene } from "../core/scene";
import { Sprite } from "../core/sprite";
import { Updater } from "../core/updater";

export class Keyboard implements Updater {

    name: string = "keyboard";

    private _game: Game = null;
    private _event: any = null;

	keys: { [name: string]: boolean }  = { };
	ticks: { [name: string]: number }  = { };

    init(game: Game): boolean {

        this._game = game;

        document.body.addEventListener("keydown", (event) => {
            this.keys[event.key] = true;
        });
        document.body.addEventListener("keyup", (event) => {
            this.keys[event.key] = false;
            if (this._game.scene && this._event) {
                this._event.addEvent(this._game.scene, "onKeyPress", event.key);
            }
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
        //if (scene.paused) return;
    }

    reset() {
        let keys = Object.keys(this.keys);
        for (let key of keys) {
            this.keys[key] = false;
			this.ticks[key] = 0;
        }
	}
	
}

