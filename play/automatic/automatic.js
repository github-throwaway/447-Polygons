/*******************
Name: automatic.js
Pre-condition: none
Post-condition: The program has been/is running
Description: This file serves as the main controller
of the program. It handles all the logic, algorithms,
and functionality required to run this program
*******************/

//setup a canvas for the grid
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var stats_canvas = document.getElementById("stats_canvas");
var stats_ctx = stats_canvas.getContext("2d");
var NONCONFORM = 1.00;
var BIAS = 0.33;
var TILE_SIZE = 30;
var PEEP_SIZE = 30;
var GRID_SIZE = 20;
var DIAGONAL_SQUARED = (TILE_SIZE+5)*(TILE_SIZE+5) + (TILE_SIZE+5)*(TILE_SIZE+5);
var MAX_MOVES = 10000;

//Ratios for shapes and initialization of counters
window.NUM_TRIANGLES_MOVED = 0;
window.NUM_SQUARES_MOVED = 0;
window.NUM_CIRCLES_MOVED = 0;
window.NUM_PENTAGONS_MOVED = 0;
window.TOTAL_MOVES = 0;
window.RATIO_TRIANGLES = 0.20;
window.RATIO_SQUARES = 0.20;
window.RATIO_CIRCLES = 0.20;
window.RATIO_PENTAGONS = 0.20;
window.EMPTINESS = 0.20;

//load images
var assetsLeft = 0;
var onImageLoaded = function(){
	assetsLeft--;
};

var images = {};
function addAsset(name,src){
	assetsLeft++;
	images[name] = new Image();
	images[name].onload = onImageLoaded;
	images[name].src = src;
}

//import image files
addAsset("yayTriangle","../img/yay_triangle.png");
addAsset("mehTriangle","../img/meh_triangle.png");
addAsset("sadTriangle","../img/sad_triangle.png");
addAsset("yaySquare","../img/yay_square.png");
addAsset("mehSquare","../img/meh_square.png");
addAsset("sadSquare","../img/sad_square.png");
//The new shape images
addAsset("yayCircle","../img/yay_circle.png");
addAsset("mehCircle","../img/meh_circle.png");
addAsset("sadCircle","../img/sad_circle.png");
addAsset("yayPentagon","../img/yay_pentagon.png");
addAsset("mehPentagon","../img/meh_pentagon.png");
addAsset("sadPentagon","../img/sad_pentagon.png");

//handles mouse actions
var IS_PICKING_UP = false;
var lastMouseX, lastMouseY;


/*******************
Name: Draggable function
Pre-condition: all required assets have been imported
Post-condition: A new draggable shape has been created
Description: This function creates a new draggable shape
each time it is called. Draggable shapes can be manually
moved by the user. It also handles the logic of what happens
when a user picks up or drops a draggable.
*******************/
function Draggable(x,y){
	
	//setup coordinates
	var self = this;
	self.x = x;
	self.y = y;
	self.gotoX = x;
	self.gotoY = y;

	var offsetX, offsetY;
	var pickupX, pickupY;

	//called when user picks up a draggable
	self.pickup = function(){

		IS_PICKING_UP = true;

		//handles coordinates
		pickupX = (Math.floor(self.x/TILE_SIZE)+0.5)*TILE_SIZE;
		pickupY = (Math.floor(self.y/TILE_SIZE)+0.5)*TILE_SIZE;
		offsetX = Mouse.x-self.x;
		offsetY = Mouse.y-self.y;
		self.dragged = true;

		// Dangle
		self.dangle = 0;
		self.dangleVel = 0;

		// Draw on top
		var index = draggables.indexOf(self);
		draggables.splice(index,1);
		draggables.push(self);

	};

	//called when a user drops a draggable
	self.drop = function(){

		IS_PICKING_UP = false;

		//handles coordinates
		var px = Math.floor(Mouse.x/TILE_SIZE);
		var py = Math.floor(Mouse.y/TILE_SIZE);
		if(px<0) px=0;
		if(px>=GRID_SIZE) px=GRID_SIZE-1;
		if(py<0) py=0;
		if(py>=GRID_SIZE) py=GRID_SIZE-1;
		var potentialX = (px+0.5)*TILE_SIZE;
		var potentialY = (py+0.5)*TILE_SIZE;

		var spotTaken = false;
		for(var i=0;i<draggables.length;i++){
			var d = draggables[i];
			if(d==self) continue;
			var dx = d.x-potentialX;
			var dy = d.y-potentialY;
			if(dx*dx+dy*dy<10){
				spotTaken=true;
				break;
			}
		}
		//if the spot is taken, move on
		//otherwise put it in the new spot
		if(spotTaken){
			self.gotoX = pickupX;
			self.gotoY = pickupY;
		}else{
			
			STATS.steps++;
			writeStats();

			self.gotoX = potentialX;
			self.gotoY = potentialY;
		}

		self.dragged = false;

	}

	var lastPressed = false;

	//this function updates the grid UI
	//after a change occurs
	self.update = function(){

		// Shakiness?
		self.shaking = false;
		self.bored = false;
		self.nonconform = false;
		self.sameness = 0;

		//if the shape was NOT dragged
		//calculate sameness
		//else calculate a different way
		if(!self.dragged){
			var neighbors = 0;
			var same = 0;
			for(var i=0;i<draggables.length;i++){
				var d = draggables[i];
				if(d==self) continue;
				var dx = d.x-self.x;
				var dy = d.y-self.y;
				if(dx*dx+dy*dy<DIAGONAL_SQUARED){
					neighbors++;
					if(d.color==self.color){
						same++;
					}
				}
			}
			if(neighbors>0){
				self.sameness = (same/neighbors);
			}else{
				self.sameness = 1;
			}
			if(self.sameness<BIAS || self.sameness>NONCONFORM){
				self.shaking = true;
			}
			if(self.sameness>0.99){
				self.bored = true;
			}
			if(self.sameness > NONCONFORM) {
				self.nonconform = true;
			}
			if(neighbors==0){
				self.shaking = false;
			}
			
		}

		// Handles situations where the shape was or was not dragged
		if(!self.dragged){
			if((self.shaking||window.PICK_UP_ANYONE) && Mouse.pressed && !lastPressed){
				var dx = Mouse.x-self.x;
				var dy = Mouse.y-self.y;
				if(Math.abs(dx)<PEEP_SIZE/2 && Math.abs(dy)<PEEP_SIZE/2){
					self.pickup();
				}
			}
		}else{
			self.gotoX = Mouse.x - offsetX;
			self.gotoY = Mouse.y - offsetY;
			if(!Mouse.pressed){
				self.drop();
			}
		}
		lastPressed = Mouse.pressed;

		// Going to where you should
		self.x = self.x*0.5 + self.gotoX*0.5;
		self.y = self.y*0.5 + self.gotoY*0.5;

	};

	self.frame = 0;

	//this function draws the actual grid
	self.draw = function(){
		ctx.save();
		ctx.translate(self.x,self.y);
		
		if(self.shaking){
			self.frame+=0.07;
			ctx.translate(0,20);
			ctx.rotate(Math.sin(self.frame-(self.x+self.y)/200)*Math.PI*0.05);
			ctx.translate(0,-20);
		}

		// Draw thing
		var img;
		if(self.color=="triangle"){
			if(self.shaking){
				img = images.sadTriangle;
			}else if(self.bored){
				img = images.mehTriangle;
			}else{
				img = images.yayTriangle;
			}
		}else if(self.color=="square"){
			if(self.shaking){
				img = images.sadSquare;
			}else if(self.bored){
				img = images.mehSquare;
			}else{
				img = images.yaySquare;
			}
		//sets up image associations corresponding to the new shapes
		}else if(self.color=="circle"){
			if(self.shaking){
				img = images.sadCircle;
			}else if(self.bored){
				img = images.mehCircle;
			}else{
				img = images.yayCircle;
			}
		}else{
			if(self.shaking){
				img = images.sadPentagon;
			}else if(self.bored){
				img = images.mehPentagon;
			}else{
				img = images.yayPentagon;
			}
		}

		// Dangle
		if(self.dragged){
			self.dangle += (lastMouseX-Mouse.x)/100;
			ctx.rotate(-self.dangle);
			self.dangleVel += self.dangle*(-0.02);
			self.dangle += self.dangleVel;
			self.dangle *= 0.9;
		}

		ctx.drawImage(img,-PEEP_SIZE/2,-PEEP_SIZE/2,PEEP_SIZE,PEEP_SIZE);
		ctx.restore();
	};

}

window.START_SIM = false;

var draggables;
var STATS;

/*******************
Name: window.reset()
Pre-condition: all required assets are imported
Post-condition: a new board is created
Description: This function creates a brand new
board whenever the reset button is pressed
*******************/
window.reset = function(){

	//reset counters and setup corresponding HTML
	window.NUM_TRIANGLES_MOVED = 0;
	window.NUM_SQUARES_MOVED = 0;
	window.NUM_CIRCLES_MOVED = 0;
	window.NUM_PENTAGONS_MOVED = 0;
	window.TOTAL_MOVES = 0;
	document.getElementById("triangles_moved").innerHTML = window.NUM_TRIANGLES_MOVED;
	document.getElementById("squares_moved").innerHTML = window.NUM_SQUARES_MOVED;
	document.getElementById("circles_moved").innerHTML = window.NUM_CIRCLES_MOVED;
	document.getElementById("pentagons_moved").innerHTML = window.NUM_PENTAGONS_MOVED;

	//reset stats
	STATS = {
		steps:0,
		offset:0
	};
	START_SIM = false;

	stats_ctx.clearRect(0,0,stats_canvas.width,stats_canvas.height);
	draggables = [];

	//sets up ratios of shapes based upon the default values
	for(var x=0;x<GRID_SIZE;x++){
		for(var y=0;y<GRID_SIZE;y++){
			rand = Math.random();
			//randomly includes shapes within the grid. Determines shape type randomly based on percentage of shapes
			//determined by the sliders on the page
			if(rand < (1-window.EMPTINESS)){
				var draggable = new Draggable((x+0.5)*TILE_SIZE, (y+0.5)*TILE_SIZE);
				
				if(rand < window.RATIO_TRIANGLES){ 
					draggable.color = "triangle"; 
				}
				else if (rand < window.RATIO_TRIANGLES + window.RATIO_SQUARES) {
					draggable.color = "square";
				}
				else if (rand < window.RATIO_TRIANGLES + window.RATIO_SQUARES + window.RATIO_CIRCLES) {
					draggable.color = "circle";
				}
				else if (rand < window.RATIO_TRIANGLES + window.RATIO_SQUARES + window.RATIO_CIRCLES + window.RATIO_PENTAGONS){
					draggable.color = "pentagon";
				}
				draggables.push(draggable);
			}
		}
	}

	// Write stats for first time
	for(var i=0;i<draggables.length;i++){
		draggables[i].update();
	}
	writeStats();

}

/*******************
Name: window.render
Pre-condition: The grid is fully setup and ready to go
Post-condition: one or more moves has been stepped through
Description: This function handles the actual stepping of shapes
and what changes each time a move is executed
*******************/
window.render = function(){

	if(assetsLeft>0 || !draggables) return;
	
	// Is Stepping?
	if(START_SIM){
		step();
	}

	// Draw
	Mouse.isOverDraggable = IS_PICKING_UP;
	ctx.clearRect(0,0,canvas.width,canvas.height);
	for(var i=0;i<draggables.length;i++){
		var d = draggables[i];
		d.update();

		if(d.shaking || window.PICK_UP_ANYONE){
			var dx = Mouse.x-d.x;
			var dy = Mouse.y-d.y;
			if(Math.abs(dx)<PEEP_SIZE/2 && Math.abs(dy)<PEEP_SIZE/2){
				Mouse.isOverDraggable = true;
			}
		}

	}
	for(var i=0;i<draggables.length;i++){
		draggables[i].draw();
	}

	// Done stepping?
	if(isDone()){
		doneBuffer--;
		if(doneBuffer==0){
			doneAnimFrame = 30;
			START_SIM = false;
			console.log("DONE");
			writeStats();
		}
	}else if(START_SIM){
		
		STATS.steps++;
		doneBuffer = 30;

		// Write stats
		writeStats();

	}
	if(doneAnimFrame>0){
		doneAnimFrame--;
		var opacity = ((doneAnimFrame%15)/15)*0.2;
		canvas.style.background = "rgba(255,255,255,"+opacity+")";
	}else{
		canvas.style.background = "none";
	}

	// Mouse
	lastMouseX = Mouse.x;
	lastMouseY = Mouse.y;

}

//initialize stats
var stats_text = document.getElementById("stats_text");

var tmp_stats = document.createElement("canvas");
tmp_stats.width = stats_canvas.width;
tmp_stats.height = stats_canvas.height;

/*******************
Name: window.writeStats
Pre-condition: the program is fully setup and
ready to go
Post-condition: The stats panel is setup and ready to go
Description: This function sets up the stats
panel, which will continually update as the program is
run.
*******************/
window.writeStats = function(){

	//if there are no draggables (i.e. empty space)
	if(!draggables || draggables.length==0) return;

	// Average Sameness Ratio
	var total = 0;
	var totTriangles = 0;
	var totSquares = 0;
	var totCircles = 0;
	var totPentagons = 0;
	
	var numTriangles = 0;
	var numSquares = 0;
	var numCircles = 0;
	var numPentagons = 0;
	
	for(var i=0;i<draggables.length;i++){
		var d = draggables[i];
		total += d.sameness || 0;
		if (d.color == "triangle") {
			totTriangles += d.sameness || 0;
			numTriangles++;
		}
		else if (d.color == "square") {
			totSquares += d.sameness || 0;
			numSquares++;
		}
		else if (d.color == "circle") {
			totCircles += d.sameness || 0;
			numCircles++;
		}
		else if (d.color == "pentagon") {
			totPentagons += d.sameness || 0;
			numPentagons++;
		}
	}
	var avg = total/draggables.length;
	var triAvg = totTriangles / numTriangles;
	
	if(isNaN(avg)) debugger;

	// If stats oversteps, bump back
	if(STATS.steps>320+STATS.offset){
		STATS.offset += 120;
		var tctx = tmp_stats.getContext("2d");
		tctx.clearRect(0,0,tmp_stats.width,tmp_stats.height);
		tctx.drawImage(stats_canvas,0,0);
		stats_ctx.clearRect(0,0,stats_canvas.width,stats_canvas.height);
		stats_ctx.drawImage(tmp_stats,-119,0);
	}

	// AVG -> SEGREGATION
	var segregation = (avg-0.25)*(4/3);
	if(segregation<0) segregation=0;

	// AVG -> SEGREGATION
	var triSeg = (avg-0.25)*(4/3);
	if(triSeg<0) triSeg=0;

	// Graph it
	stats_ctx.fillStyle = "#cc2727";
	var x = STATS.steps - STATS.offset;
	var y = 250 - segregation*250+10;
	stats_ctx.fillRect(x,y,1,5);
	
	// Graph it
	stats_ctx.fillStyle = "#2cff27";
	var x = STATS.steps - STATS.offset;
	var y = 250 - triSeg*250+10;
	stats_ctx.fillRect(x,y,1,5);

	// Text
	stats_text.innerHTML = Math.floor(segregation*100)+"%";
	stats_text.style.top = Math.round(y-15)+"px";
	stats_text.style.left = Math.round(x+35)+"px";

	// Button
	if(START_SIM){
		document.getElementById("moving").classList.add("moving");
	}else{
		document.getElementById("moving").classList.remove("moving");
	}

}

var doneAnimFrame = 0;
var doneBuffer = 30;

/*******************
Name: isDone
Pre-condition: The program is running
Post-condition: The program is terminated or
continues to run
Description: This function checks whether
the program has completed. It terminates the program
when it is near the maximum number of moves. Otherwise,
it keeps the program running.
*******************/
function isDone(){
	//the below line cuts off the simulation when it reaches
	//29 moves below the maximum
	//this allows the simulation to finish moves already in
	//progress and stop very near the max
	if(window.TOTAL_MOVES >= MAX_MOVES-29) return true;

	if(Mouse.pressed) return false;
	for(var i=0;i<draggables.length;i++){
		var d = draggables[i];
		if(d.shaking) return false;
	}
	return true;
}

/*******************
Name: step
Pre-condition: The simulation is in progress
Post-condition: A move has been stepped through
Description: This function handles individual shapes
in individual movements. It is true to the name
of "step" in that this function executes
a singular move.
*******************/
function step(){

	// Get all shakers
	var shaking = [];
	for(var i=0;i<draggables.length;i++){
		var d = draggables[i];
		if(d.shaking) shaking.push(d);
	}

	// Pick unhappiest shape
	if(shaking.length==0) return;
	//OLD VERSION
	var shaker = shaking[0];

	var minShaker = shaking[0];
	var maxShaker = shaking[0];

	//algorithm for moving the unhappiest shapes first
	//it calculates the happiest and unhappiest shakers
	//by going through a list of shakers
	for (var i = 0; i < shaking.length; i++){
		if (shaking[i].sameness < minShaker.sameness) {
			minShaker = shaking[i];
		}
		else if(shaking[i].nonconform && shaking[i].sameness > maxShaker.sameness) {
			maxShaker = shaking[i];
		}
	}
	
	if(minShaker.sameness < BIAS && NONCONFORM < maxShaker.sameness && Math.abs(BIAS - minShaker.sameness) < Math.abs(maxShaker.sameness - NONCONFORM)) {
		shaker = maxShaker;
	}
	else if (minShaker.sameness < BIAS && NONCONFORM < maxShaker.sameness && Math.abs(BIAS - minShaker.sameness) >= Math.abs(maxShaker.sameness - NONCONFORM)) {
		shaker = minShaker;
	}
	else if (NONCONFORM < maxShaker.sameness) {
		shaker = maxShaker;
	}
	else { 
		shaker = minShaker;
	}
	
	// Go through every spot, get all empty ones
	var empties = [];
	for(var x=0;x<GRID_SIZE;x++){
		for(var y=0;y<GRID_SIZE;y++){

			var spot = {
				x: (x+0.5)*TILE_SIZE,
				y: (y+0.5)*TILE_SIZE
			}

			var spotTaken = false;
			for(var i=0;i<draggables.length;i++){
				var d = draggables[i];
				var dx = d.gotoX-spot.x;
				var dy = d.gotoY-spot.y;
				if(dx*dx+dy*dy<10){
					spotTaken=true;
					break;
				}
			}

			if(!spotTaken){
				empties.push(spot);
			}

		}
	}

	// Go to a random empty spot
	var spot = empties[Math.floor(Math.random()*empties.length)];
	if(!spot) return;
	shaker.gotoX = spot.x;
	shaker.gotoY = spot.y;

	//update the individual counters for each shape
	if (shaker.color == "triangle"){
		window.NUM_TRIANGLES_MOVED++;
		window.TOTAL_MOVES++;
		document.getElementById("triangles_moved").innerHTML = window.NUM_TRIANGLES_MOVED;

	}
	else if (shaker.color == "square"){
		window.NUM_SQUARES_MOVED++;
		window.TOTAL_MOVES++;
		document.getElementById("squares_moved").innerHTML = window.NUM_SQUARES_MOVED;
	}
	else if (shaker.color == "circle"){
		window.NUM_CIRCLES_MOVED++;
		window.TOTAL_MOVES++;
		document.getElementById("circles_moved").innerHTML = window.NUM_CIRCLES_MOVED;
	}
	else if (shaker.color == "pentagon"){
		window.NUM_PENTAGONS_MOVED++;
		window.TOTAL_MOVES++;
		document.getElementById("pentagons_moved").innerHTML = window.NUM_PENTAGONS_MOVED;
	}
}


////////////////////
// ANIMATION LOOP //
////////////////////
window.requestAnimFrame = window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	function(callback){ window.setTimeout(callback, 1000/60); };
(function animloop(){
	requestAnimFrame(animloop);
	if(window.IS_IN_SIGHT){
		render();
	}
})();

window.IS_IN_SIGHT = false;  /////////CRUCIAL ELEMENT RIGHT HERE. Needs to be true in order to test on a local machine

window.onload=function(){
	reset();
}
