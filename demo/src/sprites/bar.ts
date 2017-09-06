export class SpriteBar {
	prepareTexture(sprite) {
		let bgcolor = -1;
		if (sprite.components["custom-display"] && sprite.components["custom-display"].color) {
			let colorCode: string = sprite.components["custom-display"].color.toString();
			if (colorCode.length > 1 && colorCode.charAt(0) == '#') {
				bgcolor = parseInt(colorCode.substring(1), 16);
			}
		}
		let graph = new PIXI.Graphics();
		graph.beginFill(bgcolor);
		graph.drawRect(0, 0, 1, 1);
		graph.endFill();
		return graph.generateCanvasTexture();
	}
}
