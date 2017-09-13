import { Game } from "../core/game";
import { Scene } from "../core/scene";
import { Sprite } from "../core/sprite";
import { Updater } from "../core/updater";

export class Motion implements Updater {

    name: string = "motion";

    private _game: Game = null;
    private _event: any = null;

    init(game: Game): boolean {
        this._game = game;
		this._event = game.systems["event"]; // use it to emit events for sprites
        return true;
    }
	
	update(scene: Scene, time: number) {
        if (scene.paused) return;
        let spriteList = scene.spriteList;
        for (let sprite of spriteList) {

            let motion = sprite.active ? sprite.components["motion"] : null;
            if (motion == undefined || motion == null) continue;
            
            if (motion.state == 0) continue;
            if (motion.state == 1 && motion.speed > 0) {
                
                let pos = this.getSpritePos(sprite);
                if (pos == undefined || pos == null) continue;

                if (motion.style == 0) {
                    let posX = pos.x;
                    let posY = pos.y;
                    let dataX: Array<number> = [];
                    let dataY: Array<number> = [];
                    this.generateBeeline(posX, posY, motion.targetX, motion.targetY, dataX, dataY);
                    motion.dataX = dataX;
                    motion.dataY = dataY;
                    
                    if (dataX.length > 0) motion.state = 2;
                    else motion.state = 0;
                    
                    if (motion.state == 2) motion.current = 0;
                    
                } else {
                    motion.state = 0; // ... 
                }
            }
            if (motion.state == 2 && motion.speed > 0) {
                
                let pos = this.getSpritePos(sprite);
                if (pos == undefined || pos == null) continue;
                
                let dataX: Array<number> = motion.dataX;
                let dataY: Array<number> = motion.dataY;
                
                let idx: number = motion.current;
                
                if (idx < dataX.length) {
                    pos.x = dataX[idx];
                    pos.y = dataY[idx];
                    if (motion.onStep) motion.onStep(sprite, idx, dataX.length);
                    motion.current += motion.speed;
                } else {
                    pos.x = dataX[dataX.length - 1];
                    pos.y = dataY[dataY.length - 1];
                    motion.state = 3;
                }
                
            }
            if (motion.state == 3) {
                
                motion.state = 0;
                
                let callback: (spr:Sprite)=>void = motion.onEnd;
                if (callback) callback(sprite);
                else if (this._event) this._event.addEvent(sprite, "onMotionDone");
                
                if (motion.state == 0) motion.callback = null;
            }
        }
    }

    createMotionData() {
		return {
			state: 0,
			style: 0,
			speed: 0,
			current: 0,
			segment: 0,
			middleX: 0,
			middleY: 0,
			targetX: 0,
			targetY: 0,
			dataX: [],
			dataY: [],
			onStep: null,
			onEnd: null
		};
	}
	
	createPathData() {
		return {
			state: 0,
			speed: 0,
			current: 0,
			offsetX: 0,
			offsetY: 0,
			listX: [],
			listY: [],
			nodes: []
		};
	}

    getSpritePos(sprite: Sprite): any {
        let pos = sprite.components["stage"];
        if (pos) return pos;
        pos = sprite.components["display"];
        if (pos) return pos.object;
        return null;
    }

    moveTo(sprite: Sprite, x: number, y: number, speed: number,
			onEnd?: (spr:Sprite)=>void, onStep?: (spr:Sprite, currentX:number, currentY:number)=>void) {
		let pos = this.getSpritePos(sprite);
		if (pos == undefined || pos == null || (pos.x == x && pos.y == y)) {
			if (onEnd) onEnd(sprite);
			return;
		}
        return this.pathTo(sprite, x, y, speed, null, null, onEnd, onStep);
    }

    pathTo(sprite: Sprite, x: number, y: number, speed: number, dataX?: Array<number>, dataY?: Array<number>, 
			onEnd?: (spr:Sprite)=>void, onStep?: (spr:Sprite, currentX:number, currentY:number)=>void) {
        
		let motion = sprite.components["motion"];
		if (motion == undefined || motion == null) motion = this.createMotionData();

		motion.targetX = x;
		motion.targetY = y;
		motion.speed = speed;
		motion.state = 1;
		motion.onStep = onStep;
		motion.onEnd = onEnd;
		
		if (dataX) motion.dataX = dataX;
		if (dataY) motion.dataY = dataY;
		if (dataX) {
			motion.state = dataX.length > 0 ? 2 : 0;
			if (motion.state == 2) motion.current = 0;
		}

        sprite.components["motion"] = motion;
	}

    moveToNode(sprite: Sprite, nodeIndex: number, onEnd?: (spr:Sprite)=>void, 
                onNode?: (spr:Sprite,nodeIdx:number,toX:number,toY:number)=>void) {
        
		let motionPath = sprite.components["path"];
        if (motionPath) {
            if (motionPath.state <= 0 || nodeIndex * 2 >= motionPath.nodes.length) {
                motionPath.state = 0;
                if (onEnd) onEnd(sprite);
                return;
            }
        } else {
            if (onEnd) onEnd(sprite);
			return;
        }
		let targetX: number = motionPath.nodes[nodeIndex * 2] + motionPath.offsetX;
		let targetY: number = motionPath.nodes[nodeIndex * 2 + 1] + motionPath.offsetY;
		if (onNode) onNode(sprite, nodeIndex - 1, targetX, targetY);
		this.pathTo(sprite, targetX, targetY, motionPath.speed, 
            motionPath.listX[nodeIndex], motionPath.listY[nodeIndex], (spr) => {
			this.moveToNode(spr, nodeIndex + 1, onEnd, onNode);
		});
	}
	
	applyPath(sprite: Sprite, offsetX: number, offsetY: number, speed: number, nodes: Array<number>, 
				onEnd?: (spr:Sprite)=>void, onNode?: (spr:Sprite,nodeIdx:number,toX:number,toY:number)=>void) {
                
		let motionPath = sprite.components["path"];
		if (motionPath == undefined || motionPath == null) motionPath = this.createPathData();

        sprite.components["path"] = motionPath;

		motionPath.state = 0;
		motionPath.offsetX = offsetX;
		motionPath.offsetY = offsetY;
		
		if (nodes == null || nodes.length <= 1) return;
		
		let data: Array<number> = nodes;
		if (speed < 0) {
			data = [];
			let idx = 0;
			let len = nodes.length;
			while (idx < len) {
				data[idx] = nodes[len - idx - 2];
				data[idx + 1] = nodes[len - idx - 1];
				idx += 2;
			}
		}
		
		motionPath.nodes = data;
		motionPath.speed = speed > 0 ? speed : 0 - speed;
		
		let pos = this.getSpritePos(sprite);
		if (pos == undefined || pos == null) return;
		
		pos.x = offsetX + data[0];
		pos.y = offsetY + data[1];
		
		if (data.length <= 2) {
			if (onEnd) onEnd(sprite);
			return;
		}
		
		let x1 = offsetX + data[0];
		let y1 = offsetY + data[1];
		let count = Math.floor(data.length / 2);
		let listX = new Array<Array<number>>();
		let listY = new Array<Array<number>>();
		listX.push([]); // first node should have no data
		listY.push([]); // first node should have no data
		for (let i=1; i<count; i++) {
			let dataX = new Array<number>();
			let dataY = new Array<number>();
			this.generateBeeline(x1, y1, offsetX + data[i * 2], offsetY + data[i * 2 + 1], dataX, dataY);
			listX.push(dataX);
			listY.push(dataY);
			x1 = offsetX + data[i * 2];
			y1 = offsetY + data[i * 2 + 1];
		}
		
		motionPath.listX = listX;
		motionPath.listY = listY;
		
		motionPath.state = 1;
		this.moveToNode(sprite, 1, onEnd, onNode);
	}
	
	getMotionAngle(currentX: number, currentY: number, targetX: number, targetY: number): number {
		
		//return Math.atan2(targetY - currentY, targetX - currentX);
		
		let dx = Math.abs(targetX - currentX);
		let dy = Math.abs(targetY - currentY);
		
		let angle:number = dx == 0 ? 90 : Math.atan(dy / dx) * 180 / Math.PI;
		
		if (targetX <= currentX && targetY <= currentY) angle = 180 - angle;
		else if (targetX <= currentX && targetY >= currentY) angle = 180 + angle;
		else if (targetX >= currentX && targetY >= currentY) angle = 0 - angle;
		
		if (angle < 0) angle += 360;
		if (angle > 360) angle -= 360;
		
		return angle;
		
	}
	
	moveOutside(sprite: Sprite, speed: number, angle: number, 
                left: number, top: number, right: number, bottom: number,
                onEnd?: (spr:Sprite)=>void, onStep?: (spr:Sprite, currentX:number, currentY:number)=>void) {

		let pos = this.getSpritePos(sprite);
		if (pos == undefined || pos == null) return;

		let posX: number = pos.x;
		let posY: number = pos.y;
		let targetX: number = 0;
		let targetY: number = 0;
		if ((angle >= 0 && angle <= 45) || (angle > 315 && angle <= 360)) {
			targetX = right;
			targetY = posY - Math.abs(targetX - posX) * Math.tan(angle * Math.PI / 180);
		} else if (angle > 45 && angle <= 135) {
			targetY = top;
			targetX = posX + Math.abs(posY - targetY) / Math.tan(angle * Math.PI / 180);
		} else if (angle > 135 && angle <= 225) {
			targetX = left;
			targetY = posY + Math.abs(targetX - posX) * Math.tan(angle * Math.PI / 180);
		} else if (angle > 225 && angle <= 315) {
			targetY = bottom;
			targetX = posX - Math.abs(posY - targetY) / Math.tan(angle * Math.PI / 180);
		}
		this.moveTo(sprite, targetX, targetY, speed, onEnd, onStep);
	}
	
	generateBeeline(x1: number, y1: number, x2: number, y2: number,
					dataX: Array<number>, dataY: Array<number>) {

		let d, count, dinc1, dinc2, xinc1, xinc2, yinc1, yinc2;

		let x0 = Math.floor(Math.max(Math.min(x1,x2), 0));
		let y0 = Math.floor(Math.max(Math.min(y1,y2), 0));

		let deltax = Math.floor(Math.abs(x2 - x1));
		let deltay = Math.floor(Math.abs(y2 - y1));

		// Initialize all vars based on which is the independent variable
		if (deltax >= deltay) {
			// x is independent variable
			count = deltax + 1;
			d = (2 * deltay) - deltax;
			dinc1 = deltay * 2;
			dinc2 = (deltay - deltax) * 2;
			xinc1 = 1;
			xinc2 = 1;
			yinc1 = 0;
			yinc2 = 1;
		} else {
			// y is independent variable
			count = deltay + 1;
			d = (2 * deltax) - deltay;
			dinc1 = deltax * 2;
			dinc2 = (deltax - deltay) * 2;
			xinc1 = 0;
			xinc2 = 1;
			yinc1 = 1;
			yinc2 = 1;
		}

		// Make sure x and y move in the right directions
		if (x1 > x2) {
			xinc1 = 0 - xinc1;
			xinc2 = 0 - xinc2;
		}
		if (y1 > y2) {
			yinc1 = 0 - yinc1;
			yinc2 = 0 - yinc2;
		}

		// Start from the 2nd point
		let x = Math.floor(x1) + (d < 0 ? xinc1 : xinc2);
		let y = Math.floor(y1) + (d < 0 ? yinc1 : yinc2);
		
		d = d + (d < 0 ? dinc1 : dinc2);

		for (let i=2; i<count-1; i++) {
			if (d < 0) {
				d += dinc1;
				x += xinc1;
				y += yinc1;
			} else {
				d += dinc2;
				x += xinc2;
				y += yinc2;
			}
			dataX.push(x);
			dataY.push(y);
		}

		// add last point ...
		if (x1 != x2 || y1 != y2) {
			dataX.push(x2);
			dataY.push(y2);
		}
		
	}
	
}

