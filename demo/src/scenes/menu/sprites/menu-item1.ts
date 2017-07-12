
export class SceneMenuSpriteMenuItem1 {
    onPointerup(sprite, event) {
        let transition: any = sprite.scene.systems["transition"];
        if (transition.isWorking()) return;
        transition.callScene("stage1");
        let tween: any = sprite.scene.systems["tween"];
        tween.blink(sprite.components.display.object);
        sprite.game.lib("audio").sounds["select"].play();
    }
}
