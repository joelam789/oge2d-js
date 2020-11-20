export class SceneDialogSpriteDialogIcon1 {

    onActivate(spr) {
		//console.log("DialogIcon1 - onActivate: " + spr.name);
		let chatbox = spr.scene.sprites["dialog-box1"];
		if (chatbox && chatbox.active) {
			spr.scene.timeout(500, () => {
				spr.active = false;
				spr.scene.timeout(300, () => {
					spr.active = chatbox.active && chatbox.custom.status == "done";
				});
			});
		}
		
    }

}
