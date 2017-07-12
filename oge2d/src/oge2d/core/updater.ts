
import { Game } from "./game";
import { Scene } from "./scene";
import { Sprite } from "./sprite";

export interface Updater {

    name: string;

    init?(game: Game): boolean; // init updater for the game

    preset?(scene: Scene, callback: ()=>void); // get ready to attach to a scene
	prepare?(sprite: Sprite, callback: ()=>void); // get sprite ready to be included
	setup?(scene: Scene); // attach to the scene

	activate?(scene: Scene); // when a scene is activated
	deactivate?(scene: Scene); // when a scene is deactivated
	
	include?(sprite: Sprite); // when add a sprite to a scene
	exclude?(sprite: Sprite); // when remove a sprite from a scene

	enable?(sprite: Sprite); // when a sprite is activated (sprite.active = true)
	disable?(sprite: Sprite);// when a sprite is deactivated (sprite.active = false)

	refresh?(scene: Scene); // when need to sync with a scene manually
	
	update?(scene: Scene, time: number); // when update a scene

}
