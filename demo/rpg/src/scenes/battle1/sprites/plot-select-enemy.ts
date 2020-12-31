
export class PlotSelectEnemy {

    * onUpdate(sprite) {

        let scene = sprite.scene;
        let tween = scene.sys("tween");
        let motion = scene.sys("motion");
        let profile = scene.game.get("rpg");
        let sceneInfo = scene.get("rpg");

        console.log("plot started - " + sprite.name);

        //yield sprite.plot.wait(100);

        let menu1 = scene.spr("list-box1").code;
        let menuItems = [];
        menuItems.push(...sceneInfo.enemyTeam);
        menuItems.push("Go Back");

        menu1.show(sprite, menuItems);
        console.log("Please select an enemy");
        
        while (true) {

            yield sprite.plot.wait();
            console.log("Selected - " + menu1.selected);

            if (menu1.selected == 1) {
                menu1.close();
                sceneInfo.fighter = "fighter1";
                sceneInfo.target = "enemy1";
                scene.spr("plot-fight").active = true;
                break;
            } else if (menu1.selected == menuItems.length) {
                menu1.cleanup();
                scene.spr(sceneInfo.previous).active = true;
                break;
            } else {
                console.log("Please select a correct enemy");
            }

        }

        sprite.active = false;
    }

}
