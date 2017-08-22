import { autoinject } from 'aurelia-framework';
import { DialogController } from 'aurelia-dialog';

import { ipcRenderer } from "electron";

@autoinject
export class NewTilemapDlg {

    message: any = null;
    setting: any = {
        name: "tilemap1",
        tilesetNames: [],
        tileWidth: 32,
        tileHeight: 32,
        columnCount: 20, // width = 32 * 20 = 640
        rowCount: 15,    // height = 32 * 15 = 480
        bgcolor: "#000000", // black
        bgcolorOpacity: 1.0
    };

    tilesets: Array<any> = [];

    constructor(public controller: DialogController) {
        //controller.settings.centerHorizontalOnly = true;
    }

    activate(message) {
        this.message = message;
        ipcRenderer.once("get-tileset-list-return", (event, list) => {
            if (list && list.length > 0) {
                for (let item of list) this.tilesets.push({name: item, selected: false});
            }
        });
        ipcRenderer.send("get-tileset-list");
    }

    deactivate() {

    }

    get currentSetting() {
        this.setting.tilesetNames = [];
        for (let item of this.tilesets) {
            if (item.selected) this.setting.tilesetNames.push(item.name);
        }
        if (this.setting.tilesetNames.length <= 0 && this.tilesets.length > 0) {
            this.setting.tilesetNames.push(this.tilesets[0].name);
        }
        let result = JSON.parse(JSON.stringify(this.setting));
        result.tileWidth = parseInt(this.setting.tileWidth);
        result.tileHeight = parseInt(this.setting.tileHeight);
        result.columnCount = parseInt(this.setting.columnCount);
        result.rowCount = parseInt(this.setting.rowCount);
        let alpha = Math.round(0xff * parseFloat(result.bgcolorOpacity)).toString(16);
        if (alpha.length == 1) alpha = "0" + alpha;
        result.bgcolor = (result.bgcolor + alpha).toLowerCase();
        delete result.bgcolorOpacity;
        return result;
    }

    selectTileset(tilesetName: string) {
        for (let item of this.tilesets) {
            if (item.name == tilesetName) item.selected = !item.selected;
        }
	}

}
