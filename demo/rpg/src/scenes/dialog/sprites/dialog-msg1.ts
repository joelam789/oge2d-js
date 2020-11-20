export class SceneDialogSpriteDialogMsg1 {

    updateText(spr, speed:number = 50, more: boolean = false) {
        let textSpeed = speed;
        if (!textSpeed || textSpeed < 1) textSpeed = 1;
        if (textSpeed > 100) textSpeed = 100;
        if (spr.custom && spr.custom.content) {
            let displayText = spr.get("display").object.text;
            let len = displayText.length;
            if (spr.custom.content.length > len) {
                //let currentText = spr.custom.history ? spr.custom.history : "";
                spr.get("display").object.text = spr.custom.content.substr(0, len+1);
                spr.scene.timeout(10 * (100/textSpeed), () => this.updateText(spr, textSpeed, more));
            } else if (spr.custom.content.length == len) {
                spr.custom.more = more;
                spr.custom.history = more ? spr.custom.history + spr.custom.current : "";
                spr.custom.content = "";
                this.onDisplayDone(spr);
            }
        }
        
    }

    onDisplayDone(spr) {
        let chatbox = spr.scene.sprites["dialog-box1"];
        let chaticon = spr.scene.sprites["dialog-icon1"];
        if (chatbox && chaticon) {
            if (spr.custom && spr.custom.more) {
                chatbox.custom.status = "more";
                chatbox.code.next(chatbox);
            } else {
                chaticon.active = true;
                chatbox.custom.status = "done";
            }
        }
    }

}
