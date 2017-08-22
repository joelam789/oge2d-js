import { autoinject } from 'aurelia-framework';
import { DialogController } from 'aurelia-dialog';

import { ipcRenderer } from "electron";

@autoinject
export class NewTilesetDlg {

    message: any = null;
    setting: any = {
        name: "tileset1",
        tileWidth: 32,
        tileHeight: 32,
        image: ""
    };

    constructor(public controller: DialogController) {
        //controller.settings.centerHorizontalOnly = true;
    }

    activate(message) {
        this.message = message;
        
    }

    deactivate() {

    }

    get currentSetting() {
        let result = JSON.parse(JSON.stringify(this.setting));
        result.tileWidth = parseInt(this.setting.tileWidth);
        result.tileHeight = parseInt(this.setting.tileHeight);
        return result;
    }

    openSelectFileDlg() {
        ipcRenderer.once("select-img-dlg-return", (event, path) => {
            if (path && path.length > 0) this.setting.image = path;
        });
        ipcRenderer.send("show-select-img-dlg");
    }
}
