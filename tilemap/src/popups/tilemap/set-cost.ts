import { autoinject } from 'aurelia-framework';
import { DialogController } from 'aurelia-dialog';

import { ipcRenderer } from "electron";

@autoinject
export class SetCostDlg {

    message: any = null;
    tileCost: number = 0;

    constructor(public controller: DialogController) {
        //controller.settings.centerHorizontalOnly = true;
    }

    activate(message) {
        this.message = message;
		this.tileCost = message ? parseInt(message.toString(), 10) : 0;
        
    }

    deactivate() {

    }

    get currentTileCost() {
		let result = this.tileCost ? parseInt(this.tileCost.toString(), 10) : 0;
        return result;
    }
}
