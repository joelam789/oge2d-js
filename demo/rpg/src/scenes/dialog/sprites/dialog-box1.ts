export class SceneDialogSpriteDialogBox1 {

    show(spr, lines: Array<string>, speed: number = 50, more: boolean = false) {
        //let game = spr.game;
        let tween = spr.scene.sys("tween");
        let chatbox = spr.scene.sprites["dialog-box1"];
        let chatmsg = spr.scene.sprites["dialog-msg1"];
        let chaticon = spr.scene.sprites["dialog-icon1"];
		if (chatbox && chatmsg && chaticon) {

            let showing = chatbox.active;
            let display = chatbox.get("display").object;

            if (!chatbox.custom) {
                chatbox.custom = {};
                if (display) {
                    chatbox.custom.posY = display.y;
                    chatbox.custom.maxH = display.height;
                    chatbox.custom.minH = 40;
                }
            }
            if (!chatmsg.custom) chatmsg.custom = {};

            chatbox.custom.status = "open";
            chatbox.custom.plot = spr.name;

            let history = chatmsg.custom.history ? chatmsg.custom.history : "";
            chatmsg.custom.current = lines.join("\n");
            chatmsg.get("text").content = history + chatmsg.custom.current;
            chatmsg.get("display").object.text = history;
            chatmsg.custom.content = history + chatmsg.custom.current;

            let canShowAnima = !showing && tween && display && chatbox.custom.posY 
                                && chatbox.custom.maxH && chatbox.custom.minH;
            if (canShowAnima) {
                display.y = chatbox.custom.posY + (chatbox.custom.maxH - chatbox.custom.minH) / 2 ;
                display.height = chatbox.custom.minH;
            }

            chatbox.active = true;
            chatmsg.active = chatmsg.custom.history ? true : false;
            chaticon.active = false;

            if (canShowAnima) {
                tween.get(display)
                    .to({y: chatbox.custom.posY, height: chatbox.custom.maxH}, 120)
                    .call(() => {
                        chatmsg.active = true;
                        chatmsg.code.updateText(speed, more);
                });
            } else {
                chatmsg.active = true;
                spr.scene.timeout(150, () => chatmsg.code.updateText(speed, more));
            }

        }
    }

    next() {
        let spr = (this as any).owner;
        let chatbox = spr.scene.sprites["dialog-box1"];
        let chatstate = chatbox && chatbox.custom ? chatbox.custom.status : "";
        if (chatstate == "done" || chatstate == "more" ) {
            let plotctx = spr.scene.sprites[chatbox.custom.plot];
            if (plotctx) plotctx.plot.signal();
        }
    }

    close() {
        let spr = (this as any).owner;
        let tween = spr.scene.sys("tween");
        let chatbox = spr.scene.sprites["dialog-box1"];
        let chatmsg = spr.scene.sprites["dialog-msg1"];
        let chaticon = spr.scene.sprites["dialog-icon1"];
        if (chatbox && chatmsg && chaticon) {

            chatmsg.active = false;
            chaticon.active = false;

            let showing = chatbox.active;
            let display = chatbox.get("display").object;
            let canShowAnima = showing && tween && display && chatbox.custom.posY 
                                && chatbox.custom.maxH && chatbox.custom.minH;
            if (canShowAnima) {
                tween.get(display)
                    .to({ y: chatbox.custom.posY + (chatbox.custom.maxH - chatbox.custom.minH) / 2, 
                            height: chatbox.custom.minH }, 120)
                    .call(() => {
                        chatbox.active = false;
                        display.y = chatbox.custom.posY;
                        display.height = chatbox.custom.maxH;
                        let rpg = spr.scene.sys("rpg");
                        if (rpg) rpg.stopNpcWaiting(spr.scene);
                    });
            } else {
                chatbox.active = false;
                let rpg = spr.scene.sys("rpg");
                if (rpg) rpg.stopNpcWaiting(spr.scene);
            }
        } else {
            let rpg = spr.scene.sys("rpg");
            if (rpg) rpg.stopNpcWaiting(spr.scene);
        }
    }
    
    onPointerup(spr, event) {
        //console.log("DialogBox1 - onPointerup: " + spr.name);
        this.next();
	}

}
