export class SpriteBar {
	prepareTexture(sprite) {
		let texId = sprite.scene.name + "." + (sprite.origin ? sprite.origin.name : sprite.name);
        let texObj = sprite.game.lib("image").getTexture(texId);
		if (texObj) return texObj;
		
		let bgcolor = -1;
		let colorCode: string = "#FFFFFF";
		if (sprite.components["custom-display"] && sprite.components["custom-display"].color) {
			colorCode = sprite.components["custom-display"].color.toString();
			if (colorCode.length > 1 && colorCode.charAt(0) == '#') {
				bgcolor = parseInt(colorCode.substring(1), 16);
			}
		}

		//let graph = new PIXI.Graphics();
		//graph.beginFill(bgcolor);
		//graph.drawRect(0, 0, 1, 1);
		//graph.endFill();
		//texObj = graph.generateCanvasTexture();

		//let canv = document.createElement('canvas');
        //canv.width = canv.height = 1;
        //let ctx = canv.getContext('2d');
        //ctx.fillStyle = colorCode;
        //ctx.fillRect(0, 0, 1, 1);
		//texObj = PIXI.Texture.from(canv);
		
		let pixi = sprite.game.get("display").pixi;
		let rect = new PIXI.Graphics();
        rect.beginFill(bgcolor, 1);
        rect.drawRect(0, 0, 1, 1);
        rect.endFill();
        texObj = pixi.renderer.generateTexture(rect, PIXI.SCALE_MODES.NEAREST, 1);

		sprite.game.lib("image").setTexture(texId, texObj);
        return texObj;
	}
}
