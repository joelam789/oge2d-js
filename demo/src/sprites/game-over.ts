export class SpriteGameOver {

	* onUpdate(sprite) {

		console.log("plot started - " + sprite.name);

		let game = sprite.game;
		let plot = sprite.plot;
		let scene = sprite.scene;
		let tween = scene.systems["tween"];
		let motion = scene.systems["motion"];
		let profile = game.components.shooting;
		let player = scene.sprites["player1"];

		yield plot.wait(100);

		let battlebgm = scene.game.libraries["audio"].musics["battle"];
		let bossbgm = scene.game.libraries["audio"].musics["boss"];
		let winbgm = scene.game.libraries["audio"].musics["win"];
		let losebgm = scene.game.libraries["audio"].musics["lose"];

		if (profile.progress != 0) {
			if (player) player.components.collision.enabled = false;
			if (battlebgm.isPlaying()) {
				tween.get(battlebgm).to({volume: 0}, 2000).call(() => {
					battlebgm.stop();
					plot.signal("bgm-fadeout");
				});
				yield plot.wait("bgm-fadeout");
			} else if(bossbgm.isPlaying()) {
				tween.get(bossbgm).to({volume: 0}, 2000).call(() => {
					bossbgm.stop();
					plot.signal("bgm-fadeout");
				});
				yield plot.wait("bgm-fadeout");
			}
		}
		if (profile.progress > 0) {
			winbgm.play(1);
			scene.spr("info1").get("display").object.text = "STAGE CLEAR";
			scene.spr("info1").active = true;
		} else if (profile.progress < 0) {
			losebgm.play(1);
			scene.spr("info1").get("display").object.text = "GAME OVER";
			scene.spr("info1").active = true;
		}

		if (profile.progress != 0) {
			yield plot.wait(6000);
			let transition: any = sprite.scene.systems["transition"];
			if (transition) transition.callScene("menu");
		}

		sprite.active = false;
	}

}
