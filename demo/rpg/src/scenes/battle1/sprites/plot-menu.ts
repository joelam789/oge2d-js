
export class PlotMenu {

    * onUpdate(sprite) {

        let scene = sprite.scene;
        let tween = scene.sys("tween");
        let motion = scene.sys("motion");
        let profile = scene.game.get("rpg");
        let sceneInfo = scene.get("rpg");

        console.log("plot started - " + sprite.name);

        yield sprite.plot.wait(100);

        let menu1 = scene.spr("list-box1").code;

        menu1.show(sprite, [
            "Attack",
            "Magic",
            "Items",
            "Defend",
            "Escape"
        ]);

        
        console.log("Please select an item");
        
        while (true) {

            yield sprite.plot.wait();
            console.log("Selected - " + menu1.selected);

            if (menu1.selected == 1) {
                menu1.cleanup();
                sceneInfo.previous = sprite.name;
                scene.spr("plot-select-enemy").active = true;
                break;
            } else if (menu1.selected == 5) {
                menu1.close();
                console.log("Okay... you selected to give up");
                break;
            } else {
                console.log("Please select a correct item");
            }

        }

        console.log("plot ended - " + sprite.name);

        sprite.active = false;

        if (menu1.selected == 5) {
            let transition: any = sprite.scene.systems["transition"];
            if (transition.isWorking()) return;
            transition.callScene("map1");
        }
    }

}
