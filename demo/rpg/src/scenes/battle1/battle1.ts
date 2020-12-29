
export class Scene1 {

    scene: any = null;
    path: Array<any> = [];

    onInit(scene) {
        console.log("on scene init: " + scene.name);
    }

    onActivate(scene) {
        this.scene = scene;
        console.log("on scene activate: " + scene.name);
        //console.log(scene.game.systems);
        //console.log(scene.sprites);
    }

    onPointerdown(scene, event) {
        let pos = event.data.getLocalPosition(scene.components["display"].object);
        console.log("scene onPointerdown: " + scene.name + " - x=" + pos.x + " , y=" + pos.y);
    }

    onUpdate(scene) {
        // ...
    }

}

