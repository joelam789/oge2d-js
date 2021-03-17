
export class SceneDialogSpriteDialogMsg1 {

    history = [];
    current = [];

    defaultX = 35;
    defaultY = 45;
    lineHeight = 20;

    prepareCurrent(words: Array<string>, more: boolean, color: string) {
        let msgspr = (this as any).owner;
        let x = this.defaultX, y = this.defaultY;
        for (let item of this.current) item.spr.active = false;
        for (let i = 0; i < this.history.length; i++) {
            let item = this.history[i];
            item.spr.active = true;
            if (item.spr.nline) {
                x = this.defaultX;
                y += this.lineHeight;
            } else {
                let mt = PIXI.TextMetrics.measureText(item.content, item.spr.get("display").object.style);
                x = this.defaultX + mt.width;
                //console.log(x, y);
            }
        }
        this.current = [];
        for (let i = 0; i < words.length; i++) {
            let line = words[i];
            let txtspr = msgspr.scene.getFreeSprite("dialog-msg1");
            let item = {
                spr: txtspr,
                content: line,
                nline: i != words.length - 1 || !more
            }
            txtspr.get("display").object.text = "";
            txtspr.get("display").object.style.fill = color;
            txtspr.get("display").object.x = x;
            txtspr.get("display").object.y = y;
            txtspr.active = true;
            x = this.defaultX;
            y += this.lineHeight;
            this.current.push(item);
        }
    }

    disableCurrent() {
        for (let item of this.current) {
            item.spr.active = false;
            item.spr.get("display").object.text = "";
        }
    }

    enableCurrent() {
        for (let item of this.current) {
            item.spr.active = true;
            item.spr.get("display").object.text = item.content;
        }
    }

    appendHistory() {
        this.history.push(...this.current);
    }

    clearHistory() {
        for (let item of this.history) item.spr.active = false;
        this.history = [];
    }

    updateText(speed:number = 50, more: boolean = false) {
        let textSpeed = speed;
        if (!textSpeed || textSpeed < 1) textSpeed = 1;
        if (textSpeed > 100) textSpeed = 100;
        let msgspr = (this as any).owner;
        for (let i = 0; i < this.current.length; i++) {
            let item = this.current[i];
            if (item.spr) {
                if (!item.spr.active) item.spr.active = true;
                let displayText = item.spr.get("display").object.text;
                let len = displayText.length;
                if (item.content.length > len) {
                    //let currentText = spr.custom.history ? spr.custom.history : "";
                    item.spr.get("display").object.text = item.content.substr(0, len+1);
                    item.spr.scene.timeout(10 * (100/textSpeed), () => this.updateText(textSpeed, more));
                    break;
                } else if (item.content.length == len) {
                    if (i < this.current.length - 1) continue;
                    else {
                        let chatbox = msgspr.scene.sprites["dialog-box1"];
                        chatbox.custom.more = more;
                        this.onDisplayDone();
                    }
                    
                }
            }
        }
        
    }

    onDisplayDone(showIcon: boolean = true) {
        let spr = (this as any).owner;
        let chatbox = spr.scene.sprites["dialog-box1"];
        let chaticon = spr.scene.sprites["dialog-icon1"];
        if (chatbox && chaticon) {
            //console.log("onDisplayDone - ", spr.custom);
            if (chatbox.custom && chatbox.custom.more) {
                chatbox.custom.status = "more";
                chatbox.code.next();
            } else {
                if (showIcon) chaticon.active = true;
                chatbox.custom.status = "done";
            }
        }
    }

}
