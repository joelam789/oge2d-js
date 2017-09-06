
export class ScenePreload {

	onInit(scene) {
		console.log("on scene init: " + scene.name);
	}

	onActivate(scene) {
		console.log("on scene activate: " + scene.name);
		let message = scene.spr("label1");
		let progressbar = scene.spr("progress1");
		progressbar.get("display").object.scale.x = 10;
		let preload = scene.game.lib("preload");
		preload.loadPacks(["pack2.pack", "pack3.pack"], () => {
			console.log("finished loading packages");
			scene.game.loadScenes(["menu", "stage1"], () => {
				console.log("finished loading scenes");
				if (navigator.userAgent.indexOf('iPad') >= 0 || navigator.userAgent.indexOf('iPhone') >= 0) {
					scene.components.event["onPointerdown"] = () => scene.game.scene = scene.game.scenes["menu"];
					message.get("display").object.text += " (click here to continue)";
				} else scene.game.scene = scene.game.scenes["menu"];
			}, (percentage) => {
				let progress = 0.5 + percentage / 200.0;
				progressbar.get("display").object.scale.x = 420 * progress;
				message.get("display").object.text = "Loading scenes ... " + Math.round(progress * 100) + "%";
			});
		}, (current: number, total: number) => {
			if (current > 0 && total > 0) {
				let progress = current / total / 2.0;
				progressbar.get("display").object.scale.x = 420 * progress;
				message.get("display").object.text = "Loading packages ... " + Math.round(progress * 100) + "%";
			}
		});

	}

}
