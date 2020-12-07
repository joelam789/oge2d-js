export class SceneDialogSpriteDialogMsg1 {

    updateText(speed:number = 50, more: boolean = false) {
        let textSpeed = speed;
        if (!textSpeed || textSpeed < 1) textSpeed = 1;
        if (textSpeed > 100) textSpeed = 100;
        let spr = (this as any).owner;
        if (spr.custom && spr.custom.content) {
            let displayText = spr.get("display").object.text;
            let len = displayText.length;
            if (spr.custom.content.length > len) {
                //let currentText = spr.custom.history ? spr.custom.history : "";
                spr.get("display").object.text = spr.custom.content.substr(0, len+1);
                spr.scene.timeout(10 * (100/textSpeed), () => this.updateText(textSpeed, more));
            } else if (spr.custom.content.length == len) {
                spr.custom.more = more;
                spr.custom.history = more ? spr.custom.history + spr.custom.current : "";
                spr.custom.content = "";
                this.onDisplayDone();
            }
        }
        
    }

    onDisplayDone(showIcon: boolean = true) {
        let spr = (this as any).owner;
        let chatbox = spr.scene.sprites["dialog-box1"];
        let chaticon = spr.scene.sprites["dialog-icon1"];
        if (chatbox && chaticon) {
            //console.log("onDisplayDone - ", spr.custom);
            if (spr.custom && spr.custom.more) {
                chatbox.custom.status = "more";
                chatbox.code.next();
            } else {
                if (showIcon) chaticon.active = true;
                chatbox.custom.status = "done";
            }
        }
    }

}
