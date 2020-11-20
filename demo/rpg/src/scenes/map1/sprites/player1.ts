
export class Map1Player1 {

	onUpdate(sprite) {
		//...
	}

	onSceneActivate(sprite) {
		console.log("Player - onSceneActivate: " + sprite.name);
		//let script = sprite.game.lib("script");
		//script.call(sprite.script.base, "onSceneActivate", sprite);
		sprite.base.onSceneActivate(sprite);
	}

}
