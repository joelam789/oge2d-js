
export class SpriteFps {
	onUpdate(sprite) {
		let display = sprite.components["display"];
		if (display && display.object) display.object.text = Math.round(sprite.game.fps).toString();
	}
}
