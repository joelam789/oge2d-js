
export class SceneMenu {
	onInit(scene) {
		console.log("on scene init: " + scene.name);
	}

	onActivate(scene) {
		console.log("on scene activate: " + scene.name);
		scene.reset();
		scene.sprites["plot1"].active = true;
	}

	onDeactivate(scene) {
		scene.game.libraries["audio"].musics["menu"].stop();
	}

	onKeyPress(scene, keyName) {
		console.log("scene onKeyPress: " + scene.name + " - " + keyName);
		if (keyName == "Enter") {
			let cursor = scene.spr("cursor1");
			if (cursor && cursor.active) {
				let transition: any = scene.systems["transition"];
				if (transition && !transition.isWorking()) {
					transition.callScene("stage1");
					let menuitem = scene.spr("menu-item1");
					let tween: any = scene.systems["tween"];
					tween.blink(menuitem.components.display.object);
					scene.game.lib("audio").sounds["select"].play();
				}
			}
		}
	}

}
