
export class SpriteTriangle {

    prepareTexture(sprite) {
        let texId = sprite.scene.name + "." + (sprite.origin ? sprite.origin.name : sprite.name);
        let texObj = sprite.game.lib("image").getTexture(texId);
        if (texObj) return texObj;

        let canv = document.createElement('canvas');
        canv.width = 20;
        canv.height = 20;
        let ctx = canv.getContext('2d');
		
		ctx.clearRect(0, 0, 20, 20);
		
        // the triangle
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(20, 0);
		ctx.lineTo(10, 10);
		ctx.closePath();

		// the fill color
		ctx.fillStyle = "#FFFFFF";
		ctx.fill();
		
        texObj = PIXI.Texture.from(canv);

        sprite.game.lib("image").setTexture(texId, texObj);
        return texObj;
    }

    /*
    prepareTextureAsync(sprite, callback) {

        let texId = sprite.scene.name + "." + (sprite.origin ? sprite.origin.name : sprite.name);

        sprite.game.lib("image").loadImage(texId, (texObj) => {
            if (texObj) callback(texObj);
            else {
                let canv = document.createElement('canvas');
                canv.width = 2;
                canv.height = 2;
                let ctx = canv.getContext('2d');
                ctx.fillStyle = '#FFFFFF';  // white
                ctx.fillRect(0, 0, 2, 2);
                texObj = PIXI.Texture.from(canv);

                sprite.game.lib("image").setTexture(texId, texObj);
                callback(texObj);
            }
        });

    }
    */

}
