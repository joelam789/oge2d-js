export class SpriteBoy {
	prepareSpriteAsync(sprite, callback) {

        let spineConfig = sprite.components["spine"];

        //let app: PIXI.Application = sprite.game.components["display"].pixi;

        sprite.game.lib("image").loadImageByType(spineConfig.png, 1, (imgObj) => {
            if (!imgObj) callback(null);
            sprite.game.lib("json").loadString(spineConfig.atlas, (atlasObj) => {
                if (!atlasObj) callback(null);
                sprite.game.lib("json").loadJson(spineConfig.json, (jsonObj) => {
                    if (!jsonObj) callback(null);

                    let rawSkeletonData = jsonObj['spineboy']; //your skeleton.json file here
                    let rawAtlasData = atlasObj; //your atlas file 

                    let spineAtlas = new PIXI.spine.core.TextureAtlas(rawAtlasData, (line, addTextureFunc) => {
                        addTextureFunc(imgObj);
                    });
        
                    let spineAtlasLoader = new PIXI.spine.core.AtlasAttachmentLoader(spineAtlas);
                    let spineJsonParser = new PIXI.spine.core.SkeletonJson(spineAtlasLoader);
        
                    //spineJsonParser.scale = 2.0;
        
                    let spineData = spineJsonParser.readSkeletonData(rawSkeletonData);
        
                    let spineSpr = new PIXI.spine.Spine(spineData);
        
                    //spineSpr.position.set(300, 600);
                    //spineSpr.scale.set(0.3, 0.3);
        
                    if (spineSpr.state.hasAnimation('walk')) {
                        spineSpr.state.setAnimation(0, 'walk', true);
                    }

                    callback(spineSpr);

                });
            
            });
        });
        
    }
    
}
