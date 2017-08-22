import { autoinject } from 'aurelia-framework';
import { DialogController } from 'aurelia-dialog';

import { ipcRenderer } from "electron";

@autoinject
export class SelectTilesetDlg {

    message: any = null;
    multiple: boolean = false;
	tilesets: Array<any> = [];

    constructor(public controller: DialogController) {
        //controller.settings.centerHorizontalOnly = true;
    }

    activate(message) {
        this.message = message;
        if (message && message.multiple) this.multiple = true;
        
    }

    deactivate() {

    }
	
	attached() {
		ipcRenderer.once("get-tileset-list-return", (event, list) => {
            if (list && list.length > 0) {
                for (let item of list) this.tilesets.push({name: item, selected: false});
            }
        });
        ipcRenderer.send("get-tileset-list");
	}

    get currentSelectedTilesets() {
        let list = [];
        for (let item of this.tilesets) {
            if (item.selected) list.push(item.name);
        }
        if (list.length <= 0 && this.tilesets.length == 1 && this.multiple == false) {
            list.push(this.tilesets[0].name);
        }
        return list;
    }
	
	selectTileset(tilesetName: string) {
        for (let item of this.tilesets) {
            if (item.name == tilesetName) item.selected = !item.selected;
            else if (this.multiple == false) item.selected = false;
        }
	}
}
