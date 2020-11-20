
export class Plot1 {

    * onUpdate(sprite) {

        let scene = sprite.scene;
        let stage = scene.sys("stage");
        let tween = scene.sys("tween");
        let motion = scene.sys("motion");
        let profile = scene.game.get("rpg");

        console.log("plot started - " + sprite.name);

        yield sprite.plot.wait(1000);

        let following = scene.get("stage").follow;
        console.log("following - " + following);
        
        /*
        if (profile) profile.controllable = false; // let's diable controlling at first
        stage.follow(scene, null); // let's disable following too

        // then let viewport move
        motion.moveTo(scene, 96, 0, 1, () => sprite.plot.signal());
        yield sprite.plot.wait();
        motion.moveTo(scene, 96, 96, 1, () => sprite.plot.signal());
        yield sprite.plot.wait();
        motion.moveTo(scene, 0, 96, 1, () => sprite.plot.signal());
        yield sprite.plot.wait();
        motion.moveTo(scene, 0, 0, 1, () => sprite.plot.signal());
        yield sprite.plot.wait();

        if (following) stage.follow(scene, following); // resume following
        if (profile) profile.controllable = true; // resume controlling
        */

        console.log("plot ended - " + sprite.name);

        sprite.active = false;
    }

}
