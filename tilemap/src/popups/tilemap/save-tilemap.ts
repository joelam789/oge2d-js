import { autoinject } from 'aurelia-framework';
import { DialogController } from 'aurelia-dialog';

import { ipcRenderer } from "electron";

@autoinject
export class SaveTilemapDlg {

    message: any = null;
    tilemapName: string = "";

    constructor(public controller: DialogController) {
        //controller.settings.centerHorizontalOnly = true;
    }

    activate(message) {
        this.message = message;
		this.tilemapName = message ? message.toString() : "";
        
    }

    deactivate() {

    }

    get currentTilemapName() {
		let result = this.tilemapName ? this.tilemapName.toString() : "";
        return result;
    }
}
