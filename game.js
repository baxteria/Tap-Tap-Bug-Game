// Globals
var FPS = 30;
var gameWidth = 400;
var gameHeight = 600;
var foodWidth = 20;
var blackScore = 5;
var redScore = 3;
var orangeScore = 1;
var pauseSize = 24;

// Game state
var level = 1;
var time = 60;
var score = 0;
var foodEaten = 0;
var paused = false;
var isGameover = false;
var started = false;

// Lists
var bugList = [];
var foodList = [];

// Canvas elements
var canvas = document.getElementById("gamecanvas");
var ctx = canvas.getContext("2d");
var infocanvas = document.getElementById("infocanvas");
var scorectx = infocanvas.getContext("2d");


// Update highscore at start
if (localStorage.getItem("highscoreLevel1") === null){
	localStorage.setItem("highscoreLevel1", 0);
}
if (localStorage.getItem("highscoreLevel2") === null){
	localStorage.setItem("highscoreLevel2", 0);
}
updateHighscore();
document.getElementById("level1button").onclick = function() {level = 1; updateHighscore();};
document.getElementById("level2button").onclick = function() {level = 2; updateHighscore();};


// Initializes the game
function start() {
	document.getElementById("startpage").style.display = "none";
	infocanvas.style.display = "block";
	canvas.style.display = "block";
	paused = false;
	if(!started){
		started = true;
		canvas.addEventListener("mousedown", click, false);
		infocanvas.addEventListener("mousedown", click2, false);
		spawnFood();
		gameloop();
	}
}

// Loops game animation
function gameloop(){
	bugSpawner();
	setInterval(function() {updateGame(); drawGame(); drawInfo(); drawGameover();}, 1000/FPS);
	setInterval(function() {updateTime();}, 1000);
	setInterval(function() {fadeout();}, 100);
}

// Spawns bugs within 1-3 seconds
function bugSpawner(){
	var rand = createRand(1, 3);
    if (!paused && !isGameover){
    	createBug();
    }
    setTimeout(bugSpawner, rand * 1000);
}

// Slowly fades out any dead bugs
function fadeout(){
	var i;
	for (i = 0; i < bugList.length; i++){
		if (!bugList[i].alive && bugList[i].opacity != 0){
			bugList[i].opacity -= 0.05;
			// Account for interval
			if (bugList[i].opacity < 0){
				bugList[i].opacity = 0;
			}
		}
	}
}

// Updates time remaining
function updateTime(){
	if (!paused && !isGameover){
		time--;
	}
	if (time === 0){
		if (level == 1){
			updateHighscore();
			level = 2;
			reset("next");
		}
		else{
			gameover();
		}
	}
}

// Updates and stores high score to local storage
function updateHighscore(){
	if (level == 1 && score > localStorage.getItem("highscoreLevel1")){
		localStorage.setItem("highscoreLevel1", score);
	}
	else if (level == 2 && score > localStorage.getItem("highscoreLevel2")){
		localStorage.setItem("highscoreLevel2", score);
	}
	if (level == 1 || document.getElementById("level1button").checked){
		document.getElementById("score").innerHTML = localStorage.getItem("highscoreLevel1");
	}
	else{
		document.getElementById("score").innerHTML = localStorage.getItem("highscoreLevel2");
	}
}

// Resets the game
function reset(state){
	isGameover = false;
	time = 60;
	score = 0;
	foodEaten = 0;
	bugList = [];
	foodList = [];
	spawnFood();
	if(state != "next"){
		paused = true;
		if (document.getElementById("level1button").checked){
			level = 1;
		}
		else{
			level = 2;
		}
		document.getElementById("startpage").style.display = "block";
		document.getElementById("infocanvas").style.display = "none";
		document.getElementById("gamecanvas").style.display = "none";
	}
}

// Draws the food and bugs
function drawGame(){
	ctx.clearRect(0, 0, gameWidth, gameHeight);
	ctx.save();
	ctx.rect(0, 0, gameWidth, gameHeight);
	ctx.fillStyle = "#66FF66"; 
	ctx.fill();
	ctx.restore();
	var i;
	var j;
		for (i = 0; i < foodList.length; i++){
			if (!foodList[i].isEaten){
				drawFood(foodList[i]);
			}
		}
		for (j = 0; j < bugList.length; j++){
			drawBug(bugList[j]);
		}
}

// Helper function to update the bug's target
function updateGame(){
	if(!isGameover){
		updateTarget();
	}
}

// Records and checks clicks in main game canvas
function click(){
	var mouseX = event.pageX - canvas.offsetLeft;
	var mouseY = event.pageY - canvas.offsetTop;
	checkClick(mouseX, mouseY);
}

// Records and checks clicks in info canvas
function click2(){
	var mouseX2 = event.pageX - infocanvas.offsetLeft;
	var mouseY2 = event.pageY - infocanvas.offsetTop;
	if ((mouseX2 > 189) && (mouseX2 < 189 + pauseSize) && (mouseY2 > 9) && (mouseY2 < 9 + pauseSize) && !isGameover){
		paused = !paused;
	}
}

// Main function to check clicks on bugs and game over button
function checkClick(mouseX, mouseY){
	var i;
	if (!paused && !isGameover){
		for(i = 0; i < bugList.length; i++){
			if ((mouseX > bugList[i].x - 30) && (mouseX < bugList[i].x + 30) && (mouseY > bugList[i].y - 30) && (mouseY < bugList[i].y + 30)){
				bugList[i].alive = false;
				bugList[i].rotating = null;
				fadeout(bugList[i]);
				score += bugList[i].points;
				bugList[i].points = 0;
			}
		}
	}
	if (isGameover){
		if ((mouseX > 140) && (mouseX < 260) && (mouseY > 135 + gameHeight / 3) && (mouseY < 170 + gameHeight / 3)){
			reset();
		}
	}
}

// Continously acquires a target for each bug
function updateTarget(){
	var i;
	for(i = 0; i < bugList.length; i++){
		acquireTarget(bugList[i]);
	}
}

// A food object
function food(x, y) {
 	// Food object attributes
 	this.x = x;
 	this.y = y;
 	this.isEaten = false;
}

// Pushes food into the main food list
function spawnFood(){
	var minY = gameHeight * 0.2;
	var maxY = minY + 50;
	while (foodList.length < 5) {
		var x = createRand(5 + foodWidth, gameWidth - foodWidth - 5);
		var y = createRand(minY, maxY);
		minY += 100;
		maxY += 100;
		foodList.push(new food(x,y));
	}
}

// Draws a food object
function drawFood(food){
	//Food body
	ctx.save();
	ctx.translate(food.x + foodWidth / 2, food.y + foodWidth / 2);
	ctx.beginPath();
	ctx.arc(0,0, foodWidth / 2, 0, 2 * Math.PI);
	ctx.fillStyle = "red"; 
	ctx.fill();
	ctx.stroke();
	ctx.closePath();
	ctx.restore();
	// Leaf
	ctx.save();
	ctx.translate(food.x + 3 * (foodWidth / 5), food.y + foodWidth / 2 - 6);
	ctx.rotate(-45 * Math.PI/180);
	ctx.beginPath();
	ctx.scale(0.3, 1);
	ctx.arc(0, 1.5, 7, 0, Math.PI*2, false);
	ctx.fillStyle = "green"; 
	ctx.fill();
	ctx.stroke();
	ctx.closePath();
	ctx.restore();
}

// A bug object
function bug(x, y, color, speed, points){
	this.x = x;
	this.y = y;
	this.color = color;
	this.speed = speed;
	this.points = points;
	this.targetX = null;
	this.targetY = null;
	this.alive = true;
	this.opacity = 1;
	this.currentAngle = null;
	this.targetAngle = null;
	this.rotating = false;
	this.interval = null;
	this.stopped = false;
}

// Randomly generates a bug
function createBug(){
   var x = createRand(10, 390);
   var y = 0;
   var color;
   var points;
   var speed;
   // To calculate bug chance
   var bugnum = Math.random();
   if (bugnum < 0.3){
   	color = "black";
   	points = blackScore;
   	if (level == 1){
   		speed = 150 / FPS;
   	}
   	else{
   		speed = 200 / FPS;
   	}
   }
   else if (bugnum < 0.6){
   	color = "red";
   	points = redScore;
   	if (level == 1){
   		speed = 75 / FPS;
   	}
   	else{
   		speed = 100 / FPS;
   	}
   }
   else{
   	color = "orange";
   	points = orangeScore;
   	if (level == 1){
   		speed = 60 / FPS;
   	}
   	else{
   		speed = 80 / FPS;
   	}
   }
   bugList.push(new bug(x, y, color, speed, points));
}

// Smoothly rotates a bug to the right
function smoothRotateRight(bug, amount){
	bug.rotating = true;
	if (bug.currentAngle < bug.targetAngle && !paused){
		bug.currentAngle += amount;
	}
	if (bug.currentAngle >= bug.targetAngle && !paused || amount < 0.01){
		bug.currentAngle = bug.targetAngle;
		bug.rotating = false;
		clearInterval(bug.interval);
	}
}

// Smoothly rotates a bug to the left
function smoothRotateLeft(bug, amount){
	bug.rotating = true;
	if (bug.currentAngle > bug.targetAngle && !paused){
		bug.currentAngle -= amount;
	}
	if (bug.currentAngle <= bug.targetAngle && !paused || amount < 0.5){
		bug.currentAngle = bug.targetAngle;
		bug.rotating = false;
		clearInterval(bug.interval);
	}
}

// Checks to see if a bug will overlap and prevents it
function checkOverlap(bug){
	var i;
	for(i = 0; i < bugList.length; i++){
		if(bug != bugList[i]){
			if(bugList[i].x < bug.x + 30 && bugList[i].x > bug.x - 30 && bugList[i].y < bug.y + 30 && bugList[i].y > bug.y - 30 && bugList[i].speed >= bug.speed){
				bug.stopped = true;
			}
		}
		else{
			bug.stopped = false;
		}
	}
}

// Draws a bug object
function drawBug(bug){
	if(bug.opacity != 0){
		var x = bug.x;
		var y = bug.y;

		var moveX = bug.targetX - x;
		var moveY = bug.targetY - y;
		var distance = Math.sqrt(moveX * moveX + moveY * moveY);
		var velX = (moveX / distance) * bug.speed;
		var velY = (moveY / distance) * bug.speed;

		var angle = Math.atan2(bug.targetY - y, bug.targetX - x) * 180 / Math.PI;
		if (bug.currentAngle === null){
			bug.currentAngle = angle;
			bug.targetAngle = angle;
		}
		if (bug.currentAngle + 5 < angle || bug.currentAngle - 5 > angle){
			if (!bug.rotating){
				bug.targetAngle = angle;
				if ((bug.targetAngle - bug.currentAngle) > 180){
					bug.targetAngle -= 360;
				}
				else if((bug.targetAngle - bug.currentAngle) < -180){
					bug.targetAngle += 360;
				}
				var amount = Math.abs(bug.targetAngle - bug.currentAngle) / 8;
				if(bug.currentAngle < bug.targetAngle){
					bug.interval = setInterval(function() {smoothRotateRight(bug, amount);}, FPS);
				}
				else if(bug.currentAngle > bug.targetAngle){
					bug.interval = setInterval(function() {smoothRotateLeft(bug, amount);}, FPS);
				}
			}
		}

		checkOverlap(bug);
		if (distance > 1 && !paused && bug.alive && !isGameover && !bug.rotating && !bug.stopped){
			bug.x += velX;
			bug.y += velY;
		}

		ctx.save();
		ctx.globalAlpha = bug.opacity;
		ctx.translate(x, y);
		ctx.rotate((bug.currentAngle + 270) * Math.PI/180);
		// Body
		ctx.beginPath();
		ctx.scale(0.2, 1);
		ctx.arc(0, -15, 16, 0, Math.PI*2, false);
		ctx.fillStyle = bug.color; 
		ctx.fill();
		ctx.closePath();
		ctx.stroke();
		ctx.stroke();
		ctx.stroke();
		ctx.restore();

		ctx.save();
		ctx.globalAlpha = bug.opacity;
		ctx.translate(x, y);
		ctx.rotate((bug.currentAngle + 270) * Math.PI/180);
		// Head
		ctx.beginPath();
		ctx.arc(0, 0, 4, 0, 2 * Math.PI);
		ctx.fillStyle = bug.color; 
		ctx.fill();
		ctx.stroke();

		// Right Legs
		ctx.moveTo(-7, -30);
		ctx.lineTo(-3, -22);
		ctx.moveTo(-7, -22);
		ctx.lineTo(-3, -14);
		ctx.moveTo(-7, -14);
		ctx.lineTo(-3, -6);
		// Left Legs
		ctx.moveTo(7, -30);
		ctx.lineTo(3, -22);
		ctx.moveTo(7, -22);
		ctx.lineTo(3, -14);
		ctx.moveTo(7, -14);
		ctx.lineTo(3, -6);
		ctx.stroke();
		ctx.restore();
	}
}

// Find the closest food for a bug
function acquireTarget(bug){
	var i;
	var minfood = null;
	for(i = 0; i < foodList.length; i++){
		if (!foodList[i].isEaten){
			if((bug.x < foodList[i].x + foodWidth) && (bug.x > foodList[i].x) && (bug.y < foodList[i].y + foodWidth) && (bug.y > foodList[i].y)){
				foodList[i].isEaten = true;
				foodEaten++;
			}
			else if(minfood === null){
				minfood = foodList[i];
			}
			else{
				if(calcDistance(bug, foodList[i]) < calcDistance(bug, minfood)){
					minfood = foodList[i];
				}
			}
		}
	}
	if (foodEaten == 5){
		gameover();
	}
	else{
		bug.targetX = minfood.x + foodWidth / 2;
		bug.targetY = minfood.y + foodWidth / 2;
	}
}

// Helper function to calculate the distance between two points
function calcDistance(bug, food){
	var bugX = bug.x;
	var bugY = bug.y;
	var foodX = food.x;
	var foodY = food.y;
	return Math.sqrt(((bugX -= foodX) * bugX) + ((bugY -= foodY) * bugY));
}

// Draws the info canvas
function drawInfo(){
	scorectx.save();
	scorectx.clearRect(0, 0, 400, 40);
	scorectx.font ="bold 20px Calibri";
	scorectx.fillText("Time: " + time, 20, 28);
	scorectx.font ="bold 20px Calibri";
	scorectx.fillText("Score: " + score, 300, 28);

	// Pause
	if(!paused){
		scorectx.beginPath();
		scorectx.clearRect(190, 10, pauseSize - 1, pauseSize - 1);
		scorectx.rect(189, 9, pauseSize, pauseSize);
		scorectx.stroke();
		scorectx.closePath();

		scorectx.beginPath();
		scorectx.fillStyle = "black";
		scorectx.rect(195.5, 13, 3, 16);
		scorectx.rect(203.5, 13, 3, 16);
		scorectx.fill();
		scorectx.closePath();
	}
	else{
		scorectx.beginPath();
		scorectx.clearRect(190, 10, pauseSize - 1, pauseSize - 1);
		scorectx.rect(189, 9, pauseSize, pauseSize);
		scorectx.stroke();
		scorectx.closePath();
		scorectx.beginPath();
		scorectx.moveTo(196, 13);
		scorectx.lineTo(208,21);
		scorectx.lineTo(196,29);
		scorectx.closePath();
		scorectx.fill();
	}
	scorectx.restore();
}

// Helper function to generater random int within min and max
function createRand(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Draws the game over screen
function drawGameover(){
	if(isGameover){
		ctx.save();
		ctx.translate(0, gameHeight / 3);
		ctx.beginPath();
		ctx.rect(0, 0, gameWidth, 200);
		ctx.fillStyle = "#3366FF";
		ctx.fill();
		ctx.closePath();

		ctx.beginPath();
		ctx.rect(140, 135, 120, 35);
		ctx.stroke();
		ctx.closePath();

		ctx.beginPath();
		ctx.font ="bold 48px Calibri";
		ctx.fillStyle = "white";
		ctx.textAlign = "center";
		ctx.fillText("Game over", gameWidth / 2, gameHeight / 11);
		ctx.restore();

		ctx.beginPath();
		ctx.font ="bold 16px Calibri";
		ctx.fillStyle = "white";
		ctx.textAlign = "center";
		ctx.fillText("Level 1 High Score: " + localStorage.getItem("highscoreLevel1"), gameWidth / 2, 290);

		ctx.beginPath();
		ctx.font ="bold 16px Calibri";
		ctx.fillStyle = "white";
		ctx.textAlign = "center";
		ctx.fillText("Level 2 High Score: " + localStorage.getItem("highscoreLevel2"), gameWidth / 2, 315);

		ctx.beginPath();
		ctx.font ="bold 24px Calibri";
		ctx.fillStyle = "white";
		ctx.textAlign = "center";
		ctx.fillText("Play again", gameWidth / 2, gameHeight / 5 * 3);
		ctx.restore();
	}
}

// Enter the game over state
function gameover(){
	isGameover = true;
	updateHighscore();
}