audiodir = 'sounds/'

function direction(x1,y1,x2,y2){
    return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
}
function distance(x1,y1,x2,y2){
    return Math.sqrt( (x2-=x1)*x2 + (y2-=y1)*y2 );
}

var disablemovement = false;

document.body.requestPointerLock =  document.body.requestPointerLock     ||
									document.body.mozRequestPointerLock  ||
									document.body.webkitRequestPointerLock;

document.body.exitPointerLock =     document.body.exitPointerLock        ||
									document.body.mozExitPointerLock     ||
									document.body.webkitExitPointerLock;


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
		this.soundlist = [];
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
	}
	this[e].prototype.play = function(name){
		this._time[ name ] = new Date;
		sounds[ name ].pos(this.x, this.y, this.z)
		this.soundlist.push( [ sounds[ name ], sounds[ name ].play() ] )
	}
	this[e].prototype.stop = function(name){
		sounds[ name ].stop();
	}
	this[e].prototype.getDuration = function(name){
		return sounds[ name ].duration() * 1000
	}
	this[e].prototype.getDelta = function(name){
		return new Date - (this._time[ name ] || 0)
	}
	this[e].prototype.setPosition = function(x, y, z){
		this.x = x; this.y = y; this.z = z;
		for(var i = 0; i < this.soundlist.length; i++){
			if( this.soundlist[i][0].playing( this.soundlist[i][1] ) ){
				this.soundlist[i][0].pos(this.x, this.y, this.z)
			}
		}
	}
	this[e].prototype.move = function(x, y, z){
		this.setPosition(this.x + x, this.y + y, this.z + z)
	}

	return this[e]
}

function load(filename, o){
	o.src = [audiodir + filename]
	o.onloaderror = function(e){
		throw e
	}
	var sound = new Howl(o)
	sound.name = filename.match(/(.+?)(\.[^.]*$|$)/)[1]
	return sound;
}

s = {};
;(function(){
	var soundlist = [
		'step1.wav', 'step2.wav',
		//NOTES
		'D1.wav','D2.wav',
		'D_E1.wav','D_E2.wav',
		'D_F1.wav','D_F2.wav',
		'D_G1.wav','D_G2.wav',
		'A1.wav','A2.wav',
		'A_B1.wav','A_B2.wav',
		'A_C1.wav','A_C2.wav',
		'A_D1.wav','A_D2.wav',
		//OTHER
		'choo_choo.wav', 'train_tracks.wav', 'train_tracks2.wav', 'train_background.wav',

		//MONSTER
		'breathing.wav', 'beast_running.wav', 'monster_snoring.wav',

		//COMPANION
		'companion_footsteps.wav', 'companion_breathing.wav',
		'quickly.wav', 'this_way.wav', 'itakeyoutomaster.wav', 'playmusic.wav', 'followme.wav',

		//MASTER
		'master.wav',

		//DISTANCE MOOD SOUNDS
		'sleigh_bells.wav', 'wind_chime.wav', 'flute.wav', 'ukelele.wav', 'thumb_piano.wav', 'running_far_off.wav', 'drums.wav', 'drums2.wav', 'deep_rumbling.wav', 'deep_rumbling2.wav', 'vocal_background.wav', 'church.wav', 'sword_swipe.wav'
	];
	var loaded = 0;
	for(var i = 0; i < soundlist.length; i++){
		var sound = load(soundlist[i], {onload: function(){
			loaded++;
			if(loaded == soundlist.length){
				game.start();
			}
		}})
		s[ sound.name ] = sound
	}
})();

var toRad = function(n) {
	return n * Math.PI / 180;
}

var fixDegrees = function(n){
	return ( 360 + ( n % 360 ) ) % 360
}


var game = {
	events: new Events(),
	keysdown: {},
	map: [
		{n:'shadowbeast',o:{x:25,z:50,awake:false}},
		{n:'shadowbeast',o:{x:15,z:75}},

		{n:'moodmachine',o:{x:-90,z:25,sound:'flute'}},
		//{n:'moodmachine',o:{x:200,z:75,sound:'sleigh_bells'}},
		{n:'moodmachine',o:{x:-25,z:-25,sound:'wind_chime'}},
		{n:'moodmachine',o:{x:75,z:100,sound:'wind_chime'}},
		{n:'moodmachine',o:{x:90,z:50,sound:'ukelele'}},
		{n:'moodmachine',o:{x:25,z:300,sound:'church'}},
		{n:'moodmachine',o:{x:200,z:150,sound:'sword_swipe'}},
	],
	path: [
		[15,15], // starting position
		[25,5], // go to player
		[40,50], // sleeping shadowbeast
		[25,75], // awake shadowbeast
		[35,125],// beehive thing
		[20,175],// snakes!
		[25,225] // BOSS
	]
}

;(function(ptime){
	var time = new Date
	var callee = arguments.callee
	requestAnimationFrame(function(){ callee(time) })
	var dt = time - ptime
	game.events.emit('update',dt)
})()

game.start = function(){
	console.log('start')
	document.body.addEventListener('mousedown', game.mousedown);
	document.body.addEventListener('mousemove', game.mousemove);
	document.body.addEventListener('mouseup'  , game.mouseup  );
	document.body.addEventListener('keydown'  , game.keydown  );
	document.body.addEventListener('keyup'    , game.keyup    );

	game.player = new (new Entity([s.step1, s.step2, s.D1, s.D2, s.D_E1, s.D_E2, s.D_F1, s.D_F2, s.D_G1, s.D_G2, s.A1, s.A2, s.A_B1, s.A_B2, s.A_C1, s.A_C2, s.A_D1, s.A_D2], {
		step: 0,
		direction: -90,
		footstepinterval: 800,
		speed: 2,
		init: function(){
			this.setPosition(25,0,5)
			Howler.pos(25, 0, 5)
		},
		update: function(dt){
			var orientationX = Math.cos( toRad( this.direction ) )
			var orientationZ = Math.sin( toRad( this.direction ) )
			Howler.orientation(
				orientationX, // x (face direction)
				0, 			  // y (face direction)
				orientationZ, // z (face direction)
				0, // x (top of head)
				1, // y (top of head)
				0  // z (top of head)
			)
			var interval = 800;
			if(game.keysdown[ 38 ] || game.keysdown[ 87 ] && !disablemovement){
				var posx = this.x - orientationX * (dt / 1000 * this.speed);
				var posz = this.z - orientationZ * (dt / 1000 * this.speed);
				this.setPosition(posx,0,posz);
				Howler.pos(posx,0,posz)
				if(this.getDelta('step1') > this.footstepinterval && this.getDelta('step2') > this.footstepinterval){
					this.play( ['step1','step2'][this.step] )
					this.step = !this.step+0;
					this.footstepinterval = Math.round(600+Math.random()*250)
				}
			}
			
			var keys = [90, 88,   67,   86,   66, 78,   77,   188  ]
			var notes= ['D','D_E','D_F','D_G','A','A_B','A_C','A_D']

			for(var i = 0; i < keys.length; i++){
				var note = notes[i]
				if( game.keysdown[ keys[i] ] ){
					var n = (Math.floor(Math.random()*2)+1)
					if( this.getDelta( note + n ) > 500){
						this.play(note+n)
					}
				}
			}
		}
	}))

	game.companion = new (new Entity([s.companion_footsteps, s.companion_breathing, s.quickly, s.this_way, s.itakeyoutomaster, s.followme, s.playmusic], {
		destination:1,
		atdestination:false,
		speed: 2,
		speechprog:0,
		init: function(){
			this.setPosition(game.path[0][0], 0, game.path[0][1])
		},
		update: function(dt){
			var dir = direction(this.x, this.z, game.path[this.destination][0], game.path[this.destination][1])
			var distx = distance(this.x, 0, game.path[this.destination][0], 0)
			var distz = distance(0, this.z, 0, game.path[this.destination][1])
			var distp = distance(this.x, this.z, game.player.x, game.player.z)
			if(this.destination > 1 && distp > 5){
				var voice = ['quickly', 'this_way','followme']
				var chosen = voice[ Math.floor( Math.random() * voice.length ) ]
				var smallestdelta = Infinity;
				for(var i = 0 ; i < voice.length; i++){
					var delta = this.getDelta( voice[i] )
					if(delta < smallestdelta){
						smallestdelta = delta
					}
				}
				if( smallestdelta > 5000 ){
					this.play(chosen)
				}
			}else{
				this.setPosition(
					this.x + Math.min(Math.cos( toRad( dir ) ) * ( dt / 1000 * this.speed ), distx),
					0,
					this.z + Math.min(Math.sin( toRad( dir ) ) * ( dt / 1000 * this.speed ), distz)
				)
			}
			
			if(this.x == game.path[this.destination][0] && this.z == game.path[this.destination][1]){
				this.atdestination = true;
				console.log(true)
			}

			/*if(this.getDelta('companion_breathing') > this.getDuration('companion_breathing')){
				this.play('companion_breathing')
			}*/
			if(this.getDelta('companion_footsteps') > this.getDuration('companion_footsteps') && !this.atdestination){
				this.play('companion_footsteps')
			}
			if(this.atdestination){
				this.stop('companion_footsteps')
				if(this.destination == 1){
					if(this.getDelta('playmusic') > 999999){
						this.play('playmusic')
						var t = this;
						setTimeout(function(){
							t.play('itakeyoutomaster')
							setTimeout(function(){
								t.play('followme')
								t.destination = 2;
								t.atdestination = false;
							},5000)
						},5000)
					}
				}else if(this.destination == 2){
					this.destination = 3;
					this.atdestination = false;
				}
			}
		}
	}))

	game.master = new (new Entity([s.master, s.D1, s.D2, s.D_E1, s.D_E2, s.D_F1, s.D_F2, s.D_G1, s.D_G2, s.A1, s.A2, s.A_B1, s.A_B2, s.A_C1, s.A_C2, s.A_D1, s.A_D2], {
		saidstuff:false,
		x:25,
		z:90,
		musicprogress1:0,
		musicprogress2:0,
		music1: ['D1','D_E1','D_F1','D_G1','A1','A_B1','A_C1','A_D1'],
		update: function(dt){
			if(game.companion.destination == 3 && this.saidstuff == false){
				this.play('master')
				this.saidstuff = true;
			}
			if(this.saidstuff == true && this.getDelta('master') > 15000){
				var rprog = Math.floor(this.getDelta('master') / 800)
				if( rprog > this.musicprogress1 ){
					this.play(this.music1[rprog])
					this.musicprogress1 == rprog;
				}
			}
		}
	}))

	game.shadowbeast = new Entity([s.breathing, s.monster_snoring], {
		awake:true,
		init: function(){
			
		},
		update: function(dt){
			if(this.getDelta('breathing') > this.getDuration('breathing')){
				this.play('breathing')
			}
			if(this.awake == false && this.getDelta('monster_snoring') > this.getDuration('monster_snoring')){
				this.play('monster_snoring');
			}
		}
	})

	game.moodmachine = new Entity([s.sleigh_bells, s.wind_chime, s.flute, s.ukelele, s.thumb_piano, s.running_far_off, s.drums, s.drums2, s.deep_rumbling, s.deep_rumbling2, s.vocal_background, s.church, s.sword_swipe], {
		sound: '',
		duration: 0,
		init: function(){
			this.duration = this.getDuration(this.sound)
		},
		update: function(dt){

			if( this.getDelta(this.sound) > this.duration ){
				this.play(this.sound)
			}
		}
	})

	for(var i = 0; i < game.map.length; i++){
		var ent = game.map[i];
		new game[ ent.n ]( ent.o )
	}
}

game.mousedown = function(e){
	this.requestPointerLock()
}

game.mousemove = function(e){
	if( document.pointerLockElement  != null ||
		document.webkitPointerLockElement  != null ||
		document.mozPonterLockElement != null ){
		var movementX = e.movementX ||
						e.mozMovementX ||
						e.webkitMovementX ||
						0;
		var movementY = e.movementY ||
						e.mozMovementY ||
						e.webkitMovementY ||
						0;

		game.player.direction = fixDegrees( game.player.direction - movementX )
	}
}

game.mouseup = function(e){
	//do stuff
}

game.keydown = function(e){
	console.log(e.keyCode)
	game.keysdown[ e.keyCode ] = true;
}

game.keyup = function(e){
	game.keysdown[ e.keyCode ] = false;
}

/*function setcontrols(s){
	var header = document.querySelector('header');
	var centered = document.querySelector('.centered');
	if(s == 'mouse'){
		document.body.requestPointerLock();
	}else if(s == 'keyboard'){

	}
	header.style.opacity = 0;
	centered.style.opacity = 0;
	setTimeout(function(){
		header.style.display = 'none'
		centered.style.display = 'none'
	},1000)
}*/



/*new Entity(['boing.wav'],{
	update: function(){
		// called on update
	}
})*/

game.events.on('update', function(){
	//do stuff
})


