
import { App } from "./oge2d/core/app";

import { Display } from "./oge2d/system/display";
import { Stage } from "./oge2d/system/stage";
import { Tween } from "./oge2d/system/tween";
import { Transition } from "./oge2d/system/transition";
import { Motion } from "./oge2d/system/motion";
import { Collision } from "./oge2d/system/collision";
import { Mouse } from "./oge2d/system/mouse";
import { Keyboard } from "./oge2d/system/keyboard";
import { GameController } from "./oge2d/system/game-controller";
import { EventLoop } from "./oge2d/system/event-loop";

import { Json } from "./oge2d/library/json";
import { Audio } from "./oge2d/library/audio";
import { Texture } from "./oge2d/library/texture";
import { Script } from "./oge2d/library/script";
import { Preload } from "./oge2d/library/preload";

export const app = new App({
    systems:
	{
		display: new Display(),
		stage: new Stage(),
		tween: new Tween(),
		transition: new Transition(),
		motion: new Motion(),
		collision: new Collision(),
		mouse: new Mouse(),
		keyboard: new Keyboard(),
		gamepad: new GameController(),
		event: new EventLoop()
	},
	libraries:
	{
		json: new Json(),
		audio: new Audio(),
		image: new Texture(),
		script: new Script(),
		preload: new Preload()
	}
});

