import { autoinject } from 'aurelia-framework';
import { DialogController } from 'aurelia-dialog';

import { ipcRenderer } from "electron";

@autoinject
export class SaveTilesetDlg {

    message: any = null;
    tilesetName: string = "";

    constructor(public controller: DialogController) {
        //controller.settings.centerHorizontalOnly = true;
    }

    activate(message) {
        this.message = message;
		this.tilesetName = message ? message.toString() : "";
        
    }

    deactivate() {

    }

    get currentTilesetName() {
		let result = this.tilesetName ? this.tilesetName.toString() : "";
        return result;
    }
}
