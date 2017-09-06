
import Game = OGE2D.Game;

export class GameDemo {
	onInit(game: Game) {
		console.log("on game init: " + game.name);
		console.log("screen size: " + game.width + "x" + game.height);
	}
	sortObjects(obj) {
		obj.zOrder = obj.y;
	}
}
