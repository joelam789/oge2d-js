
export class Map1Npc1 {

	onUpdate(sprite) {
		//...
	}

	onSceneActivate(sprite) {
		console.log("Npc - onSceneActivate: " + sprite.name);
		sprite.base.onSceneActivate(sprite);
	}

}
