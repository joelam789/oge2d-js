export class SceneDialogSpriteAnswerBox1 {

    selected = 0;
    answering = false;
    textRelativeX = 50;
    textRelativeY = 20;
    iconRelativeX = 30;
    iconRelativeY = 28;

    show(spr, lines: Array<string>, left = 150, top = 40, gap = 80) {
        //console.log("showing answers...");
        let scene = spr.scene;
        let chatmsg = scene.sprites["dialog-msg1"];
        if (chatmsg && chatmsg.custom) {
            chatmsg.custom.more = false;
            chatmsg.custom.history = "";
        }
        let chatbox = spr.scene.sprites["dialog-box1"];
        if (chatbox && chatbox.custom) chatbox.custom.status = "wait";
        let idx = 0, posX = left, posY = top;
        for (let line of lines) {
            idx++;
            let item = scene.getFreeSprite("answer-box1");
            let text = scene.getFreeSprite("answer-msg1");
            let itemDisplay = item.get("display").object;
            let textDisplay = text.get("display").object;
            itemDisplay.x = posX;
            itemDisplay.y = posY;
            if (!item.custom) item.custom = {};
            item.custom.flag = idx;
            item.active = true;
            textDisplay.x = posX + this.textRelativeX;
            textDisplay.y = posY + this.textRelativeY;
            textDisplay.text = line;
            text.active = true;
            if (idx == 1) {
                let icon = scene.sprites["answer-icon1"];
                if (!icon.custom) icon.custom = {};
                icon.custom.flag = idx;
                let iconDisplay = icon.get("display").object;
                iconDisplay.x = posX + this.iconRelativeX;
                iconDisplay.y = posY + this.iconRelativeY;
                icon.active = true;
            }
            posY += gap;
        }
        this.answering = true;
    }

    close() {
        let spr = (this as any).owner;
        //let sprName = spr.origin ? spr.origin.name : spr.name;
        let pool = spr.scene.pools["answer-box1"];
        for (let item of pool) {
            item.active = false;
            if (item.custom) item.custom.flag = 0;
        }
        let pool2 = spr.scene.pools["answer-msg1"];
        for (let item of pool2) item.active = false;
        let icon = spr.scene.sprites["answer-icon1"];
        icon.custom.flag = 0;
        icon.active = false;
        this.answering = false;
    }

    getChoice() {
        return this.selected;
    }

    isAnswering() {
        return this.answering;
    }

    moveCursor(dir: string = "down") {
        let spr = (this as any).owner;
        let icon = spr.scene.sprites["answer-icon1"];
        if (!icon || !icon.active) return;
        let delta = 0;
        if (dir == "down") delta++;
        else if (dir == "up") delta--;
        if (delta == 0) return;
        let idx = 0, gap = 0, firstY = 0, lastY = 0;
        let pool = spr.scene.pools["answer-box1"];
        for (let item of pool) {
            if (item.active && item.custom && item.custom.flag > 0) {
                idx++;
                let itemDisplay = item.get("display").object;
                if (idx == 1) firstY = itemDisplay.y + this.iconRelativeY;
                if (idx == 2) gap = itemDisplay.y - lastY;
                lastY = itemDisplay.y;
            }
        }
        lastY += this.iconRelativeY;
        let iconDisplay = icon.get("display").object;
        if (delta < 0) {
            let newY = iconDisplay.y - gap;
            if (newY < firstY) {
                newY = lastY;
                iconDisplay.y = newY;
                icon.custom.flag = idx;
            } else {
                iconDisplay.y = newY;
                icon.custom.flag -= 1;
            }
        } else if (delta > 0) {
            let newY = iconDisplay.y + gap;
            if (newY > lastY) {
                newY = firstY;
                iconDisplay.y = newY;
                icon.custom.flag = 1;
            } else {
                iconDisplay.y = newY;
                icon.custom.flag += 1;
            }
        }
    }

    selectAnswer(spr) {
        let flag = spr && spr.custom ? spr.custom.flag : 0;
        //console.log("AnswerBox1 - onPointerup", spr.name, flag);
        this.selected = flag;
        this.close();
        let chatmsg = spr.scene.sprites["dialog-msg1"];
        if (chatmsg) chatmsg.code.onDisplayDone(false);
        let chatbox = spr.scene.sprites["dialog-box1"];
        if (chatbox) chatbox.code.next();
    }
    
    onPointerup(spr, event) {
        this.selectAnswer(spr);
	}

}
