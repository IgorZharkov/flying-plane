//var game = new Phaser.Game(window.screen.availWidth * window.devicePixelRatio, window.screen.availHeight * window.devicePixelRatio, Phaser.CANVAS, 'game');

var targetWidth = 640, // идеальная ширина приложения (под неё рисуем спрайты и т.п.)
targetHeight = 960, // 640х960 - это iPhone 4, под меньшее разрешение наверно нет смысла делать

deviceRatio = window.innerWidth / window.innerHeight,
newRatio = (targetHeight / targetWidth) * deviceRatio,
    
newWidth = targetWidth * newRatio,
newHeight = targetHeight,

game = new Phaser.Game(newWidth, newHeight, Phaser.CANVAS, ''); // последний аргумент - родитель (если пусто, значит canvas создастся в body)

var plane;
var sky;
var cursors;
var newGameButton;
var speedYtop, speedYbottom;
var planeSpeed;
var pipeInterval = 1800;
var pipeHole = 370;
var scoreText;
var score;
var topScore;
var planeUpAngle, planeDownAngle;
var pipeGroup;

var gameCenterX = Math.round(newWidth * 0.5);
var gameCenterY = Math.round(newHeight * 0.5);

var play = function(game){}

play.prototype = {
	preload:function() {
		game.load.image('boom', 'assets/boom.png');
		game.load.image('newgame', 'assets/restgame1.png');
		game.load.image('pipe', 'assets/pipe2.png');
		game.load.spritesheet('plane', 'assets/plane.png', 88, 73);
		game.load.image('background', 'assets/c29bf435b98b.jpg');
	},
	create:function() {
		speedYtop = -420;
		speedYbottom = 520;
		planeSpeed = 170;
		planeUpAngle = -7;
		planeDownAngle = 7;

		this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		this.scale.pageAlignHorisontally = true; // можно не выравнивать, но я остаил
		this.scale.pageAlignVertically = true;
		this.scale.forcePortrait = true;

		game.physics.startSystem(Phaser.Physics.ARCADE);	// Устанавливаем физику игры
		sky = game.add.tileSprite(0, 0, 3000, 1500, 'background');


		pipeGroup = game.add.group();	// Создаем группу труб/препятствий

		score=0;
		topScore = localStorage.getItem("topPlaneScore")==null?0:localStorage.getItem("topPlaneScore");
		scoreText = game.add.text(10,10,"-",{font:"bold 16px Arial"});
		updateScore();

		plane = game.add.sprite(50, gameCenterY, 'plane');	// Добавляем вертолетик
		game.physics.arcade.enable(plane);	// Устанавливаем физику вертолета
	    plane.animations.add('fly', [0, 1, 2], 10, true);	// Создаем анимацию вертолета

	    cursors = game.input.keyboard.createCursorKeys();	// Захватываем кнопки
	    newGame = game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);	// Устанавливаем переменную newGame равную нажатию пробела
	    newGameButton = game.add.sprite(gameCenterX, gameCenterY, 'newgame');	// Добавляем кнопку начала новой игры
	    newGameButton.anchor.set(0.5);
	    newGameButton.visible = false;
	    newGameButton.inputEnabled = true;
	    newGameButton.events.onInputDown.add(restart, this);

	    game.time.events.loop(pipeInterval, addPipe); 
		addPipe();
	},
	update:function() {
		plane.body.velocity.y = speedYbottom;	// Устанавливаем скорость для вертолета

		game.physics.arcade.collide(plane, pipeGroup, die);	// die при соприкосновением с трубами
		if(plane.y>game.height-150 || plane.y<0){	// Вызываем die если вертолет достигает вертикальных границ карты
				die();
			}

		if (game.input.activePointer.isDown)	// При нажатии на мышку
	    {
	    	plane.animations.play('fly');	//	Запускаем анимацию полета
	        plane.body.velocity.y = speedYtop;	// Летим вверх
	        plane.angle = planeUpAngle;	// Наклоняем самолетик
	    }
	    else
	    {
	    	plane.animations.stop('fly');
	    	plane.angle = planeDownAngle;
	    }

	    if (newGame.isDown)	// Вызываем restat при нажатии кнопки
	    {
	    	restart();
	    }
	},
}

game.state.add("Play",play);
game.state.start("Play");

function updateScore(){
	scoreText.text = "Score: "+score+"\nBest: "+topScore;	
}

var getModifiedSpeed = function getModifiedSpeed() {
	return planeSpeed + score * 500;
};

function addPipe(){
	var pipeHolePosition = game.rnd.between(50,800-pipeHole);
	var upperPipe = new Pipe(game,game.width,pipeHolePosition-480,-planeSpeed);
	game.add.existing(upperPipe);
	pipeGroup.add(upperPipe);
	upperPipe.body.immovable = true;
	var lowerPipe = new Pipe(game,game.width,pipeHolePosition+pipeHole,-planeSpeed);
	game.add.existing(lowerPipe);
	pipeGroup.add(lowerPipe);
	lowerPipe.body.immovable = true;
	return upperPipe;
}

function die() {
	plane.loadTexture('boom');
	speedYtop = 800;
	speedYbottom = 800;
	planeSpeed = 0;
	planeUpAngle = 7;
	planeDownAngle = 7;
	newGameButton.visible = true;
	localStorage.setItem("topPlaneScore",Math.max(score,topScore));
}

Pipe = function (game, x, y, speed) {
	Phaser.Sprite.call(this, game, x, y, "pipe");
	game.physics.enable(this, Phaser.Physics.ARCADE);
	this.body.velocity.x = speed;
	this.giveScore = true;	
};

Pipe.prototype = Object.create(Phaser.Sprite.prototype);
Pipe.prototype.constructor = Pipe;

Pipe.prototype.update = function() {
	if(this.x+this.width<plane.x && this.giveScore){
		score+=0.5;
		updateScore();
		this.giveScore = false;
	}
	if(this.x<-this.width){
		this.destroy();
	}
}

function restart() {
	game.state.start("Play");	//Начинаем заново (устанавливаем игре статус Play)
}
