import { Game } from "../core/game";
import { Scene } from "../core/scene";
import { Sprite } from "../core/sprite";
import { Updater } from "../core/updater";

export class Collision implements Updater {

    name: string = "collision";

    private _game: Game = null;
    private _event: any = null;

    onCollision: (spr1: Sprite, spr2: Sprite)=>void = null;

    init(game: Game): boolean {
        this._game = game;
        this._event = game.systems["event"]; // use it to emit events for sprites
        return true;
    }
	
	update(scene: Scene, time: number) {
        if (scene.paused) return;
        let spriteList = scene.spriteList;
        let sprites: Array<Sprite> = [];
        let boundRects: Array<any> = [];
        for (let sprite of spriteList) {
            if (sprite.active && sprite.components["collision"]
                && sprite.components["collision"].enabled === true 
                && sprite.components["display"]
                && sprite.components["display"].object 
                ) {
                sprites.push(sprite);
                let rect = sprite.components["display"].object.getBounds(false);
                let hitbox = sprite.components["collision"].hitbox;
                if (hitbox) {
                    let anchor = sprite.components["display"].object.anchor;
                    boundRects.push({ x: rect.x+rect.width*anchor.x+hitbox.x, 
                                        y: rect.y+rect.height*anchor.y+hitbox.y, 
                                        width: hitbox.width, height: hitbox.height});
                } else boundRects.push(rect);
                
            }
        }
        for (let i=0; i<sprites.length; i++) {
            for (let j=i+1; j<sprites.length; j++) {
                if (this.hitTestRect(boundRects[i], boundRects[j])) {
                    if (this.onCollision) this.onCollision(sprites[i], sprites[j]);
                    else if (this._event) {
                        this._event.addEvent(sprites[i], "onCollision", sprites[j]);
                        this._event.addEvent(sprites[j], "onCollision", sprites[i]);
                    }
                }
            }
        }
    }

    hitTestRect(r1, r2) { // reference https://github.com/kittykatattack/learningPixi#collision

        //Define the variables we'll need to calculate
        let hw1 = r1.width / 2;
        let hh1 = r1.height / 2;
        let hw2 = r2.width / 2;
        let hh2 = r2.height / 2;

        //Calculate the distance vector between the sprites
        let vx = (r1.x + hw1) - (r2.x + hw2);
        let vy = (r1.y + hh1) - (r2.y + hh2);

        //Figure out the combined half-widths and half-heights
        let hw = hw1 + hw2;
        let hh = hh1 + hh2;

        return Math.abs(vx) < hw ? Math.abs(vy) < hh : false;
    }

}
