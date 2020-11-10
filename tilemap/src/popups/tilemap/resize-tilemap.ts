import { autoinject } from 'aurelia-framework';
import { DialogController } from 'aurelia-dialog';

import { ipcRenderer } from "electron";

@autoinject
export class ResizeTilemapDlg {

    message: any = null;
    setting: any = {
        columnCount: 20, // width = 32 * 20 = 640
        rowCount: 15    // height = 32 * 15 = 480
    };

    constructor(public controller: DialogController) {
        //controller.settings.centerHorizontalOnly = true;
    }

    activate(message) {
        this.message = message;
        if (message) {
            let settings = message.toString().split(",");
            if (settings && settings.length >= 2) {
                this.setting.rowCount = parseInt(settings[0]);
                this.setting.columnCount = parseInt(settings[1]);
            }
        }
    }

    deactivate() {

    }

    get currentSetting() {
        let result = JSON.parse(JSON.stringify(this.setting));
        result.columnCount = parseInt(this.setting.columnCount);
        result.rowCount = parseInt(this.setting.rowCount);
        return result;
    }

}
