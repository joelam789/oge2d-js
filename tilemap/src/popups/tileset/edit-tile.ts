import { autoinject } from 'aurelia-framework';
import { DialogController } from 'aurelia-dialog';

@autoinject
export class EditTileDlg {

	message: any = null;
	image: HTMLImageElement = null;
	tileCanvas: HTMLCanvasElement = null;
	tileWidth: number = 0;
	tileHeight: number = 0;
	frame: number = 0;
	frames = [];
    tile: any = {
        id: 0,
		cost: 0,
		speed: 0,
		frames: 0,
        offsets: ""
	};
	
	animationTimer: any = null;

    constructor(public controller: DialogController) {
        //controller.settings.centerHorizontalOnly = true;
    }

    activate(message) {
        this.message = message;
		if (message) {
			this.image = message.image;
			this.tileWidth = message.tileWidth;
			this.tileHeight = message.tileHeight;
			this.tile.id = message.tile.id;
			this.tile.cost = message.tile.cost;
			this.tile.speed = message.tile.speed;
			this.tile.frames = Math.ceil(message.tile.offsets.length / 2 );
			for (let i=0; i<message.tile.offsets.length; i++) {
				if (i == 0) this.tile.offsets = message.tile.offsets[i];
				else this.tile.offsets += "," + message.tile.offsets[i];
				if (i % 2 == 0) this.frames.push({x: message.tile.offsets[i], y: 0});
				else this.frames[this.frames.length - 1].y = message.tile.offsets[i];
			}	
		}
    }

    deactivate() {

	}
	
	attached() {
        console.log("EditTileDlg - attached");
		this.tileCanvas = document.getElementById("tile-canvas") as HTMLCanvasElement;
		if (this.tileCanvas) {
			this.tileCanvas.width = this.tileWidth;
			this.tileCanvas.height = this.tileHeight;
		}
		if (this.animationTimer != null) {
            clearInterval(this.animationTimer);
            this.animationTimer = null;
        }
        this.animationTimer = setInterval(() => this.refreshCanvas(), Math.round(1000/(60 * this.tile.speed)));
    }

    detached() {
		console.log("EditTileDlg - detached");
		if (this.animationTimer != null) {
            clearInterval(this.animationTimer);
            this.animationTimer = null;
        }
	}
	
	refreshCanvas() {
		if (this.image && this.tileCanvas && this.frame >= 0 && this.frame < this.frames.length) {
			let ctx = this.tileCanvas ? this.tileCanvas.getContext('2d') : null;
			if (ctx) {
				ctx.clearRect(0, 0, this.tileCanvas.width, this.tileCanvas.height);
				ctx.drawImage(this.image, this.frames[this.frame].x, this.frames[this.frame].y, this.tileWidth, this.tileHeight,
								0, 0, this.tileWidth, this.tileHeight);
			}
			this.frame++;
			if (this.frame >= this.frames.length) this.frame = 0;
		}
	}

	onSpeedChanged() {
		if (this.animationTimer != null) {
            clearInterval(this.animationTimer);
            this.animationTimer = null;
		}
		if (this.tile.speed > 0) {
			this.animationTimer = setInterval(() => this.refreshCanvas(), Math.round(1000/(60 * this.tile.speed)));
		} else {
			this.frame = 0;
			this.refreshCanvas();
		}
        
	}

    get currentTile() {
		let result = {
			id: parseInt(this.tile.id),
			cost: parseInt(this.tile.cost),
			speed: parseFloat(this.tile.speed),
			offsets: []
		};
		let offsets = this.tile.offsets.split(',');
		for (let offset of offsets) result.offsets.push(parseInt(offset.trim()));
        return result;
    }
}
