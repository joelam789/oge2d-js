import { autoinject } from 'aurelia-framework';
import { DialogController } from 'aurelia-dialog';

import { ipcRenderer } from "electron";

@autoinject
export class SelectTilemapDlg {

    message: any = null;
	tilemaps: Array<any> = [];

    constructor(public controller: DialogController) {
        //controller.settings.centerHorizontalOnly = true;
    }

    activate(message) {
        this.message = message;
        
    }

    deactivate() {

    }
	
	attached() {
		ipcRenderer.once("get-tilemap-list-return", (event, list) => {
            if (list && list.length > 0) {
                for (let item of list) this.tilemaps.push({name: item, selected: false});
            }
        });
        ipcRenderer.send("get-tilemap-list");
	}

    get currentSelectedTilemap() {
        let list = [];
        for (let item of this.tilemaps) {
            if (item.selected) list.push(item.name);
        }
        if (list.length <= 0 && this.tilemaps.length == 1) {
            list.push(this.tilemaps[0].name);
        }
        return list;
    }
	
	selectTilemap(tilemapName: string) {
        for (let item of this.tilemaps) {
            if (item.name == tilemapName) item.selected = !item.selected;
            else item.selected = false;
        }
	}
}
