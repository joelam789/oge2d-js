
export class SceneMenuSpritePlot1 {
    
	* onUpdate(sprite: OGE2D.Sprite) {
		
		let game = sprite.game;
		let plot = sprite.plot;
		let scene = sprite.scene;

		let tween: any = scene.systems["tween"];
		let motion: any = scene.systems["motion"];

		let bgm = game.libraries["audio"].musics["menu"];
		bgm.volume = 1.0;
		bgm.play(1);

		let title = scene.spr("title1");
		title.components.display.object.alpha = 0;
		title.active = true;

		tween.get(title.components.display.object).to({alpha: 1.0}, 50).call(() => plot.signal("fadein"));
		yield plot.wait("fadein");

		let menuitem = scene.spr("menu-item1");
		menuitem.components.display.object.x = 270;
		menuitem.components.display.object.y = 600;
		menuitem.active = true;

		motion.moveTo(menuitem, 270, 220, 5, () => plot.signal("menuitem"));
		yield plot.wait("menuitem");

		yield plot.wait(500);

		let cursor = scene.spr("cursor1");
		cursor.active = true;

		sprite.active = false;

	}
}
