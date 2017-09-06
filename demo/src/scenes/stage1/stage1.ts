
export class SceneStage1 {
    
	onInit(scene) {
		console.log("on scene init: " + scene.name);
	}

	onActivate(scene) {

		console.log("on scene activate: " + scene.name);

		let profile = scene.game.components.shooting;
		profile.progress = 0;
		profile.score = 0;
		profile.lives = 2;

		scene.reset();

		scene.systems["stage"].setPos(0, 6688);
		scene.systems["stage"].scroll(0, -1);
		scene.sprites["plot1"].active = true;

	}

	onDeactivate(scene) {

		console.log("on scene deactivate: " + scene.name);

		scene.game.libraries["audio"].musics["battle"].stop();
		scene.game.libraries["audio"].musics["boss"].stop();
		scene.game.libraries["audio"].musics["win"].stop();
		scene.game.libraries["audio"].musics["lose"].stop();

	}

	onKeyPress(scene: OGE2D.Scene, keyName: string) {
		//console.log("scene onKeyPress: " + scene.name + " - " + keyName);
		if (keyName == "Enter") {
			scene.paused = !scene.paused;
			let battlebgm = scene.game.lib("audio").musics["battle"];
			let bossbgm = scene.game.lib("audio").musics["boss"];
			if (scene.paused) {
				scene.get("stage").scrolling = false;
				if (battlebgm.isPlaying()) battlebgm.pause();
				if (bossbgm.isPlaying()) bossbgm.pause();
				scene.game.lib("audio").sounds["pause"].play();
			} else {
				scene.get("stage").scrolling = true;
				if (battlebgm.isPaused()) battlebgm.resume();
				if (bossbgm.isPaused()) bossbgm.resume();
			}
		}
	}
}
