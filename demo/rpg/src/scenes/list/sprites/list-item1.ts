export class SceneListSpriteItem1 {

    onPointerdown(spr, event) {
        let list = spr.scene.sprites["list-box1"];
        if (list) list.code.moveCursorTo(spr);
    }
    
    onPointerup(spr, event) {
        let list = spr.scene.sprites["list-box1"];
        if (list) list.code.selectItem(spr);
	}

}
