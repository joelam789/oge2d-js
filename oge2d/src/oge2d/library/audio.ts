
import { Loader } from "./loader"

export class Audio {

    name: string = "audio";

    static readonly STATE_UNPLAYABLE =  0;
	static readonly STATE_READY      =  1;
	static readonly STATE_PLAYING    =  2;
	static readonly STATE_PAUSED     =  3;
	static readonly STATE_ENDED      =  4;

    private _context: AudioContext = null;

	private _isPlayingDummy: boolean = false;
	private _dummyAudioSource: AudioBufferSourceNode = null;
	private _dummyAudioBuffer: AudioBuffer = null;
	private _dummyGain: GainNode = null;

	private _musicsToLoad: number = 0;
	private _loadedMusics: Array<Music> = [];
	private _loadingMusicUrls: Array<string> = [];

	private _soundsToLoad: number = 0;
	private _loadedSounds: Array<Sound> = [];
	private _loadingSoundUrls: Array<string> = [];

    musics: { [name: string]: Music }  = { };
    sounds: { [name: string]: Sound }  = { };

    constructor() {
        let win: any = window as any;
		if (win.Oge2dGlobal && win.Oge2dGlobal.audioContext) {
			this._context = win.Oge2dGlobal.audioContext as AudioContext;
		}
		if (this._context == undefined || this._context == null) {
			let audioCtxClass = win.AudioContext       ||
								win.webkitAudioContext ||
								win.mozAudioContext    ||
								win.oAudioContext      ||
								win.msAudioContext;
			if (audioCtxClass) this._context = new audioCtxClass();
		}
        if (this._context == undefined || this._context == null)
			console.error("No Web Audio API Supported");
	}
	
	static setGainValue(gain, value, ctx) {
		if (gain.setValueAtTime && ctx) {
			gain.setValueAtTime(value, ctx.currentTime);
		} else gain.value = value;
	}

	playDummy() { // would use it to unlock web audio ...
		this._isPlayingDummy = true;
		if (this._dummyAudioSource == null) {
			this._dummyAudioBuffer = this._context.createBuffer(2, 1, this._context.sampleRate);
			this._dummyAudioSource = this._context.createBufferSource();
			this._dummyAudioSource.buffer = this._dummyAudioBuffer;
			this._dummyGain = this._context.createGain();
			this._dummyAudioSource.connect(this._dummyGain);
			this._dummyGain.connect(this._context.destination);
			Audio.setGainValue(this._dummyGain.gain, 0, this._context); // make sure no noise comes form it
			if (this._dummyAudioSource) this._dummyAudioSource.start();
		}
	}
		
	stopDummy() {
		if (this._dummyAudioSource) {
			this._dummyAudioSource.stop();
			this._dummyAudioSource.disconnect();
			this._dummyGain.disconnect();
			this._dummyAudioBuffer = null;
			this._dummyAudioSource = null;
			this._dummyGain = null;
		}
		this._isPlayingDummy = false;
	}

	get isPlayingDummy(): boolean {
		return this._isPlayingDummy;
	}

	locked(): boolean {
		return this._isPlayingDummy === false;
	}
	unlock() {
		this.playDummy();
	}

	getNameFromUrl(url: string): string {
		let name = "";
		//let path = url.replace(/\\/g, "/");
		let startPos = url.lastIndexOf("/"), endPos = url.lastIndexOf(".");
		if (endPos > startPos && endPos > 0) {
			if (startPos < 0) startPos = -1;
			name = url.substring(startPos+1, endPos);
		} else if (startPos >= 0) {
			startPos = url.lastIndexOf("=");
			if (startPos > 0) name = url.substring(startPos+1).trim();
		}
		return name;
	}

	loadMusics(urls: Array<string>, callback: (objs: Array<Music>)=>void, progress?: (current: number, total: number)=>void) {
		if (this._context && urls && urls.length > 0) {
            this._loadedMusics = [];
			this._loadingMusicUrls = [];
			this._loadingMusicUrls.push(...urls);
			this._musicsToLoad = this._loadingMusicUrls.length;
			this.loadMusicsOneByOne(callback, progress);
        } else {
			callback([]);
		}
	}

	private loadMusicsOneByOne(callback: (loaded: Array<Music>)=>void, progress?: (current: number, total: number)=>void) {
		if (this._loadingMusicUrls.length <= 0) {
            let list = [];
			list.push(...this._loadedMusics);
            this._loadedMusics = [];
            callback(list);
        } else {
            let url = this._loadingMusicUrls.shift();
            this.loadMusic(url, (obj) => {
				if (progress) progress(this._musicsToLoad - this._loadingMusicUrls.length, this._musicsToLoad);
                if (obj) this._loadedMusics.push(obj);
                this.loadMusicsOneByOne(callback, progress);
            });
        }
	}

    loadMusic(url: string, callback: (obj: Music)=>void) {
        if (this._context == undefined || this._context == null) {
            callback(null);
            return;
        }
		let musicName = this.getNameFromUrl(url);
		if (musicName.length <= 0) {
			callback(null);
            return;
		}
        let music = this.musics[musicName];
        if (music) {
            callback(music);
            return;
        }
        Loader.loadBuffer(url, (buffer) => {
            if (this.musics[musicName]) return; // not support multiple reqests to load same thing, so just do nothing ...
            if (buffer) {
                let newMusic = new Music(this._context);
                newMusic.loadBuffer(buffer, () => {
                    if (newMusic.isReady()) {
                        this.musics[musicName] = newMusic;
                        callback(newMusic);
                        return;
                    }
                    callback(null);
                });
            } else callback(null);
        });
    }

	loadSounds(urls: Array<string>, callback: (objs: Array<Sound>)=>void, progress?: (current: number, total: number)=>void) {
		if (this._context && urls && urls.length > 0) {
            this._loadedSounds = [];
			this._loadingSoundUrls = [];
			this._loadingSoundUrls.push(...urls);
			this._soundsToLoad = this._loadingSoundUrls.length;
			this.loadSoundsOneByOne(callback, progress);
        } else {
			callback([]);
		}
	}

	private loadSoundsOneByOne(callback: (loaded: Array<Sound>)=>void, progress?: (current: number, total: number)=>void) {
		if (this._loadingSoundUrls.length <= 0) {
            let list = [];
			list.push(...this._loadedSounds);
            this._loadedSounds = [];
            callback(list);
        } else {
            let url = this._loadingSoundUrls.shift();
            this.loadSound(url, (obj) => {
				if (progress) progress(this._soundsToLoad - this._loadingSoundUrls.length, this._soundsToLoad);
                if (obj) this._loadedSounds.push(obj);
                this.loadSoundsOneByOne(callback, progress);
            });
        }
	}

    loadSound(url: string, callback: (obj: Sound)=>void) {
        if (this._context == undefined || this._context == null) {
            callback(null);
            return;
        }
		let soundName = this.getNameFromUrl(url);
		if (soundName.length <= 0) {
			callback(null);
            return;
		}
        let sound = this.sounds[soundName];
        if (sound) {
            callback(sound);
            return;
        }
        Loader.loadBuffer(url, (buffer) => {
            if (this.sounds[soundName]) return; // not support multiple reqests to load same thing, so just do nothing ...
            if (buffer) {
                let newSound = new Sound(this._context);
                newSound.loadBuffer(buffer, () => {
                    if (newSound.isReady()) {
                        this.sounds[soundName] = newSound;
                        callback(newSound);
                        return;
                    }
                    callback(null);
                });
            } else callback(null);
        });
    }

    
}

export class Music {

    private _context: AudioContext = null;

    private _state: number = 0;
    private _volume: number = 1;

    private _times: number = 1;

    private _buffer: AudioBuffer = null;
	private _channel: AudioBufferSourceNode = null;
	private _gain: GainNode = null;
	private _startTime: number = 0;
	private _pauseTime: number = 0;

    constructor(ctx: AudioContext) {
        this._context = ctx;
        this._state = Audio.STATE_UNPLAYABLE;
    }

    isReady(): boolean {
		return this._state == Audio.STATE_READY;
	}
	
	isCompleted(): boolean {
		return this._state == Audio.STATE_ENDED;
	}
	
	isPlaying(): boolean {
		return this._state == Audio.STATE_PLAYING;
	}
	
	isPaused(): boolean {
		return this._state == Audio.STATE_PAUSED;
	}
	
	resume() {
		if (this._state == Audio.STATE_PAUSED) this.play(this._times);
	}

    get volume() {
        return this._volume;
    }
	
	set volume(value: number) {
		let volumeValue = value < 0 ? 0 : (value > 1 ? 1 : value);
		if (this._volume == volumeValue) return;
		if (this._gain) Audio.setGainValue(this._gain.gain, volumeValue, this._context);
		this._volume = volumeValue;
	}

    loadBuffer(buffer: ArrayBuffer, callback: ()=>void) {
        if (this._context == undefined || this._context == null) {
			if (callback) callback();
			return;
		}
		this._context.decodeAudioData(buffer, (buf) => {
			this._buffer = buf;
			if (this._buffer && this._buffer.length > 0) this._state = Audio.STATE_READY;
			if (callback) callback();
            return;
		}, () => {
			console.error("Failed to decode Web Audio Data");
			if (callback) callback();
            return;
		});
    }

    private turnoff() {
		if (this._channel) {
			this._channel.disconnect();
			this._channel = null;
		}
		if (this._gain) {
			this._gain.disconnect();
			this._gain = null;
		}
	}
	private turnon() {
		if (this._context == undefined || this._context == null) return;
		if (this._buffer == undefined || this._buffer == null) return;
		this.turnoff();
		this._channel = this._context.createBufferSource();
		if (this._channel == undefined || this._channel == null) return;
		this._channel.buffer = this._buffer;
		this._channel.onended = () => {
			if (this._state == Audio.STATE_PLAYING) {
				if (this._times >= 0) {
					if (this._times > 0) this._times--;
					if (this._times == 0) {
						this.turnoff();
						this._state = Audio.STATE_ENDED;
					} else {
						this._pauseTime = 0;
						this._startTime = this._context.currentTime;
						this.turnon();
					}
				} else {
					this._pauseTime = 0;
					this._startTime = this._context.currentTime;
					this.turnon();
				}
			}
		};
        this._gain = this._context.createGain();
		if (this._gain == undefined || this._gain == null) return;
		this._channel.connect(this._gain);
		this._gain.connect(this._context.destination);
		Audio.setGainValue(this._gain.gain, this._volume, this._context);
		if (this._pauseTime > 0) {
			this._startTime = this._context.currentTime - this._pauseTime;
            this._channel.start(0, this._pauseTime);
		} else {
			this._startTime = this._context.currentTime;
			this._channel.start(0);
		}
	}

    play(times?: number) {
        if (this._context == undefined || this._context == null) return;
		if (this._buffer == undefined || this._buffer == null) return;
		if (this._state == Audio.STATE_UNPLAYABLE || this._state == Audio.STATE_PLAYING) return;
		else if (this._state == Audio.STATE_READY || this._state == Audio.STATE_PAUSED || this._state == Audio.STATE_ENDED) {
			if (times) this._times = times <= 0 ? -1 : times;
			else if (this._state == Audio.STATE_READY) this._times = -1; // always loop by default
			this._state = Audio.STATE_PLAYING;
			this.turnon();
		}
	}
	
	stop() {
		if (this._state == Audio.STATE_UNPLAYABLE) return;
		if (this._context && this._channel) {
            this._channel.stop(0);
            this.turnoff();
            this._pauseTime = 0;
            this._startTime = 0;
            this._state = Audio.STATE_READY;
        }
	}
	
	pause() {
		if (this._state != Audio.STATE_PLAYING) return;
		if (this._context && this._channel) {
            this._pauseTime = this._context.currentTime - this._startTime;
            this._channel.stop(0);
            this.turnoff();
		    this._state = Audio.STATE_PAUSED;
        }
	}
	
	reset() {
		if (this._state == Audio.STATE_ENDED) {
			this._pauseTime = 0;
			this._startTime = 0;
			this._state = Audio.STATE_READY;
		} else stop();
	}
	
	dispose() {
		stop();
		this._state = Audio.STATE_UNPLAYABLE;
		if (this._buffer) this._buffer = null;
	}

}

export class Sound {

    private _context: AudioContext = null;

    private _state: number = 0;
    private _volume: number = 1;

    private _buffer: AudioBuffer = null;
	private _channels: Array<AudioBufferSourceNode> = [];
	private _gains: Map<AudioBufferSourceNode, GainNode> = new Map<AudioBufferSourceNode, GainNode>();

    constructor(ctx: AudioContext) {
        this._context = ctx;
        this._state = Audio.STATE_UNPLAYABLE;
    }

    isReady(): boolean {
		return this._state == Audio.STATE_READY;
	}
	
    get volume() {
        return this._volume;
    }
	
	set volume(value: number) {
		let volumeValue = value < 0 ? 0 : (value > 1 ? 1 : value);
		if (this._volume == volumeValue) return;
		this._gains.forEach((gain, key) => Audio.setGainValue(gain.gain, volumeValue, this._context));
		this._volume = volumeValue;
	}

    loadBuffer(buffer: ArrayBuffer, callback: ()=>void) {
        if (this._context == undefined || this._context == null) {
			if (callback) callback();
			return;
		}
		this._context.decodeAudioData(buffer, (buf) => {
			this._buffer = buf;
			if (this._buffer && this._buffer.length > 0) this._state = Audio.STATE_READY;
			if (callback) callback();
            return;
		}, () => {
			console.error("Failed to decode Web Audio Data");
			if (callback) callback();
            return;
		});
    }

    private turnoff(channel: AudioBufferSourceNode) {
		let gain: GainNode = null;
		if (channel) {
			gain = this._gains.get(channel);
			channel.disconnect();
		}
		if (gain) gain.disconnect();
		if (channel) this._gains.delete(channel);
	}
	private turnon() {
		if (this._context == undefined || this._context == null) return;
		if (this._buffer == undefined || this._buffer == null) return;

		let channel = this._context.createBufferSource();
		if (channel == undefined || channel == null) return;
		channel.buffer = this._buffer;
		channel.onended = (ev) => {
            this.turnoff(ev.target as AudioBufferSourceNode);
        };

        let gain = this._context.createGain();
		if (gain == undefined || gain == null) return;
		channel.connect(gain);
		gain.connect(this._context.destination);
		Audio.setGainValue(gain.gain, this._volume, this._context);
        this._gains.set(channel, gain);

        channel.start(0);
	}
	
	play() {
		if (this._state == Audio.STATE_UNPLAYABLE) return;
		if (this._buffer) this.turnon();
	}
	
	stop() {
        if (this._state == Audio.STATE_UNPLAYABLE) return;
		if (this._buffer == undefined || this._buffer == null) return;
		let nodes = new Array<AudioBufferSourceNode>();
        this._gains.forEach((value, key) => nodes.push(key));
		while (nodes.length > 0) {
			let channel = nodes.pop();
			if (channel) {
				channel.stop(0);
				this.turnoff(channel);
			}
		}
	}
	
	dispose() {
		this.stop();
		this._state = Audio.STATE_UNPLAYABLE;
		if (this._buffer) this._buffer = null;
        this._gains.clear();
        this._channels = [];
	}

}
