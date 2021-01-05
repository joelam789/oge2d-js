
export class ScenePreload {

	nextSceneName = "map1";
	preloadScenes = ["info", "dialog", "list", "map1", "battle1"];
	preloadPackFiles = ["pack2.pack", "pack3.pack"];
	signs = [".", "..", "...", "....", ".....", "......"];

	times = 0;
	moveon = false;
	progress = 0;
	message = "Loading";

	onInit(scene) {
		console.log("on scene init: " + scene.name);
	}

	onActivate(scene) {
		console.log("on scene activate: " + scene.name);
		this.times = 0;
		this.moveon = false;
		this.progress = 0;
		this.message = "Loading";
		let progressbar = scene.spr("progress1");
		progressbar.get("display").object.scale.x = 10;
		let preload = scene.game.lib("preload");
		preload.loadPacks(this.preloadPackFiles, () => {
			console.log("finished loading packages");
			scene.game.loadScenes(this.preloadScenes, () => {
				console.log("finished loading scenes");
				this.progress = 100;
				this.message = "Done";
				//let needClickToContinue = navigator.userAgent.indexOf('iPad') >= 0
				//							 || navigator.userAgent.indexOf('iPhone') >= 0;
				let needClickToContinue = true; // ...
				if (needClickToContinue) {
					scene.spr("label2").active = true;
					scene.spr("button1").active = true;
					scene.components.event["onPointerdown"] = () => {
						let transition: any = scene.systems["transition"];
						if (transition && !transition.isWorking())
							transition.callScene(this.nextSceneName);
					}
					//msgspr.get("display").object.text += " (click here to continue)";
				} else {
					let transition: any = scene.systems["transition"];
        			if (transition && !transition.isWorking())
						transition.callScene(this.nextSceneName);
				}
			}, (percentage) => {
				let progress = 0.5 + percentage / 200.0;
				progressbar.get("display").object.scale.x = 420 * progress;
				this.message = "Loading scenes";
				this.progress = Math.round(progress * 100);
			});
		}, (current: number, total: number) => {
			if (current > 0 && total > 0) {
				let progress = current / total / 2.0;
				progressbar.get("display").object.scale.x = 420 * progress;
				this.message = "Loading packages";
				this.progress = Math.round(progress * 100);
			}
		});
		this.moveon = true;
	}

	onUpdate(scene) {
		if (this.moveon) {
			this.times += 1;
			this.moveon = false;
			let msgspr = scene.spr("label1");
			let numspr = scene.spr("number1");
			if (!this.message) msgspr.get("display").object.text = "";
			else {
				let msg = this.message;
				if (this.progress < 100) msg += this.signs[this.times % this.signs.length];
				msgspr.get("display").object.text = msg;
			}
			numspr.get("display").object.text = this.progress + "%";
			scene.timeout(100, () => this.moveon = true);
		}
	}

}
