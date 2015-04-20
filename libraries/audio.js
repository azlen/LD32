window.AudioContext = (
  window.AudioContext ||
  window.webkitAudioContext ||
  null
);

var canvas, ctx;

if (!AudioContext) {
  throw new Error("AudioContext not supported!");
}

// Create a new audio context.
var audio = new AudioContext();

audio.directory = ''
var DEBUG = false;
function direction(x1,y1,x2,y2){
    return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
}
function distance(x1,y1,x2,y2){
    return Math.sqrt( (x2-=x1)*x2 + (y2-=y1)*y2 );
}

window.addEventListener('load',function(){
	if(DEBUG == true){
		canvas = document.createElement('canvas')
		canvas.id = 'DEBUG'
		canvas.width = 300;
		canvas.height = 300;
		document.body.appendChild(canvas)

		ctx = canvas.getContext('2d')
	}
})

var filter = audio.createBiquadFilter()
filter.type = 'highpass';
filter.frequency.value = 440;
filter.connect(audio.destination)

var compressor = audio.createDynamicsCompressor()
compressor.threshold.value = -50;
compressor.knee.value = 40;
compressor.ratio.value = 12;
compressor.reduction.value = -20;
compressor.attack.value = 0;
compressor.release.value = 0.25;
compressor.connect(filter)

// Create a AudioGainNode to control the main volume.
var mainVolume = audio.createGain();
// Connect the main volume node to the context destination.
mainVolume.connect(compressor);


function load(soundFileName, options, callback){
	// Create an object with a sound source and a volume control.
	var sound = {};
	sound.name = soundFileName.match(/(.+?)(\.[^.]*$|$)/)[1]

	//sound.isPlaying = false;
	sound.loop = options != undefined ? options.loop || false : false;

	sound.x = options != undefined ? options.x || 0 : 0;
	sound.y = options != undefined ? options.y || 0 : 0;
	sound.z = options != undefined ? options.z || 0 : 0;

	var request = new XMLHttpRequest();
	request.open("GET", audio.directory + soundFileName, true);
	request.responseType = "arraybuffer";

	request.onload = function(e) {
		// Create a buffer from the response ArrayBuffer.
		sound.buffer = this.response;

		// Make the sound source use the buffer and start playing it.
		if (callback != undefined){
			callback.bind(sound)()
		}
	};
	request.send();

	sound.play = function(o){
		this.source = audio.createBufferSource();
		this.volume = audio.createGain();

		this.compressor = audio.createDynamicsCompressor();
		this.compressor.threshold.value = 440;
		this.compressor.knee.value = 40;
		this.compressor.ratio.value = 12;
		this.compressor.reduction.value = -20;
		this.compressor.attack.value = 0;
		this.compressor.release.value = 0.25;

		this.filter = audio.createBiquadFilter();
		this.filter.type = 'highpass';
		this.filter.frequency.value = 440;

		if(o != undefined){
			if(o.volume != undefined){
				this.volume.volume = o.volume;
			}
		}

		// Connect the sound source to the volume control.
		this.source.connect(this.volume);
		// Hook up the sound volume control to the main volume.
		// sound.volume.connect(mainVolume);

		// Make the sound source loop.
		this.source.loop = this.loop;

		// Load a sound file using an ArrayBuffer XMLHttpRequest.
		this.panner = audio.createPanner();
		// Instead of hooking up the volume to the main volume, hook it up to the panner.
		this.volume.connect(this.panner);
		// And hook up the panner to the main volume.
		this.panner.connect(mainVolume);
		this.panner.setPosition(this.x, this.y, this.z);

		//this.filter.connect(mainVolume)
		//this.compressor.connect(mainVolume)

		var done = false;
		audio.decodeAudioData(sound.buffer,function(audioBuffer){
			if(!done){
				sound.duration = audioBuffer.duration;

				done = true;
				sound.source.buffer = audioBuffer;
				sound.source.start(0);
			}
		})
	}
	sound.stop = function(){
		this.source.stop(0);
	}
	sound.setPosition = function(x, y, z){
		this.x = x;
		this.y = y;
		this.z = z;
		if(this.panner){
			this.panner.setPosition(this.x, this.y, this.z);
		}
	}
	sound.toggle = function(){
		if (this.isPlaying){
			this.stop();
		}else{
			this.play(this.x, this.y, this.z);
		}
	}
	return sound
}


function Entity(a, o){ // sounds, object
	var sounds = {};
	if(a != undefined){
		for(var i = 0; i < a.length; i++){
			file = a[i]
			if(typeof file == 'string'){
				var sound = load(file)
				sounds[ sound.name ] = sound
			}else if(typeof file == 'object'){
				sounds[ file.name ] = file
			}
			
		}
	}
	var e = 'Entity';
	this[e] = function(o2){
		this._time = {};
		this.x = 0; this.y = 0; this.z = 0;

		if(o != undefined){
			for(var i in o){
				this[i] = o[i]
			}
		}
		if(o2 != undefined){
			for(var i in o2){
				this[i] = o2[i]
			}
		}
		this.setPosition(this.x, this.y, this.z)
		game.events.on('update',this.update.bind(this))

		if(typeof this.init == 'function'){
			this.init.bind(this)();
		}
		if(DEBUG){
			game.events.on('DEBUG',this._DEBUG.bind(this))
		}
	}
	this[e].prototype.play = function(name, o){
		this._time[ name ] = new Date;
		sounds[ name ].setPosition(this.x, this.y, this.z)
		sounds[ name ].play(o)
	}
	this[e].prototype.stop = function(name){
		sounds[ name ].stop();
	}
	this[e].prototype.getDuration = function(name){
		if(sounds[ name ].duration != undefined){
			return sounds[ name ].duration
		}else{
			this.play(name)
			this.stop(name)
			return sounds[ name ].duration
		}
	}
	this[e].prototype.getDelta = function(name){
		return new Date - (this._time[ name ] || 0)
	}
	this[e].prototype.setPosition = function(x, y, z){
		this.x = x; this.y = y; this.z = z;
	}
	this[e].prototype.move = function(x, y, z){
		this.setPosition(this.x + x, this.y + y, this.z + z)
	}
	this[e].prototype._DEBUG = function(){
		ctx.fillStyle = '#fff'
		var size = 10;
		var x = this.x*10 - game.player.x*10;
		var y = this.z*10 - game.player.z*10;
		var rx = canvas.width/2  - size/2 + distance(0, 0, x, y) * Math.cos( toRad( fixDegrees( game.player.direction + direction(0, 0, x, y) - 90 ) ) ) 
		var ry = canvas.height/2 - size/2 + distance(0, 0, x, y) * Math.sin( toRad( fixDegrees( game.player.direction + direction(0, 0, x, y) - 90 ) ) ) 
		ctx.fillRect(rx, ry, size, size)
	}

	return this[e]
}

/*function clone(obj) {
	if(obj == null || typeof(obj) != 'object')
		return obj;

	var temp = new obj.constructor(); // changed

	for(var key in obj) {
		if(obj.hasOwnProperty(key)) {
			temp[key] = clone(obj[key]);
		}
	}
	return temp;
}*/

