export class SceneListSpriteListBox1 {

    plotName = "";
    selected = 0;
    listing = false;
    textRelativeX = 50;
    textRelativeY = 10;
    iconRelativeX = 30;
    iconRelativeY = 18;

    show(spr, items: Array<any>, left = 260, top = 40, width = 180, gap = 30) {
        //console.log("showing the list...");
        let scene = spr.scene;
        let audio = spr.game.lib("audio");
        let idx = 0, posX = left, posY = top;
        let box = spr.scene.sprites["list-box1"];
        if (box) {
            let boxDisplay = box.get("display").object;
            boxDisplay.x = posX;
            boxDisplay.y = posY;
            boxDisplay.width = width;
            if (items && items.length > 0) {
                boxDisplay.height = gap * (items.length + 2) - (gap / 2);
            }
            if (!box.active) {
                audio.sounds["menu-popup"].play();
            }
            box.active = true;
        }

        posY += gap / 2;

        for (let line of items) {
            idx++;
            let item = scene.getFreeSprite("list-item1");
            let text = scene.getFreeSprite("list-label1");
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
                let icon = scene.sprites["list-cursor1"];
                if (!icon.custom) icon.custom = {};
                icon.custom.flag = idx;
                let iconDisplay = icon.get("display").object;
                iconDisplay.x = posX + this.iconRelativeX;
                iconDisplay.y = posY + this.iconRelativeY;
                icon.active = true;
            }
            posY += gap;
        }
        this.plotName = spr.name;
        this.listing = true;
    }

    cleanup() {
        let spr = (this as any).owner;
        //let sprName = spr.origin ? spr.origin.name : spr.name;
        let pool = spr.scene.pools["list-item1"];
        for (let item of pool) {
            item.active = false;
            if (item.custom) item.custom.flag = 0;
        }
        let pool2 = spr.scene.pools["list-label1"];
        for (let item of pool2) item.active = false;
        let icon = spr.scene.sprites["list-cursor1"];
        if (icon.custom) icon.custom.flag = 0;
        icon.active = false;
        if (this.plotName) this.plotName = "";
    }

    close() {
        this.cleanup();
        let spr = (this as any).owner;
        let box = spr.scene.sprites["list-box1"];
        box.active = false;
        this.listing = false;
    }

    getChoice() {
        return this.selected;
    }

    isListing() {
        return this.listing;
    }

    moveCursorTo(spr) {
        if (!spr || !spr.active) return;
        let icon = spr.scene.sprites["list-cursor1"];
        if (!icon || !icon.active) return;
        let iconDisplay = icon.get("display").object;
        let item = spr;
        let itemDisplay = item.get("display").object;
        iconDisplay.x = itemDisplay.x + this.iconRelativeX;
        iconDisplay.y = itemDisplay.y + this.iconRelativeY;
        icon.custom.flag = item.custom.flag;
    }

    moveCursor(dir: string = "down") {
        //console.log("moveCursor");
        let spr = (this as any).owner;
        let icon = spr.scene.sprites["list-cursor1"];
        if (!icon || !icon.active) return;
        let delta = 0;
        if (dir == "down") delta++;
        else if (dir == "up") delta--;
        if (delta == 0) return;
        let idx = 0, gap = 0, firstY = 0, lastY = 0;
        let pool = spr.scene.pools["list-item1"];
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
        spr.game.lib("audio").sounds["move-cursor"].play();
    }

    selectItem(spr = null) {
        let target = spr;
        if (!target) {
            target = (this as any).owner.scene.sprites["list-cursor1"];
        }
        let flag = target && target.custom ? target.custom.flag : 0;
        this.selected = flag;
        if (target && this.plotName) {
            target.scene.sprites[this.plotName].plot.signal();
        }
        if (target) target.game.lib("audio").sounds["menu-select"].play();
        console.log("ListBox1 - onPointerup", target.name, this.selected);
        //this.cleanup();
    }
    
    onPointerup(spr, event) {
        //this.selectItem(spr);
	}

}
