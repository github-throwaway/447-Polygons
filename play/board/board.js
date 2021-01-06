/*******************
Name: board.js
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

//var NONCONFORM = 1.00;
var NONCONFORM_TRIANGLE = 1.00;
var NONCONFORM_SQUARE = 1.00;
var NONCONFORM_CIRCLE = 1.00;
var NONCONFORM_PENTAGON = 1.00;

var mapNonconform = new Map([
	["triangle", NONCONFORM_TRIANGLE],
	["square", NONCONFORM_SQUARE],
	["circle", NONCONFORM_CIRCLE],
	["pentagon", NONCONFORM_PENTAGON]
]);

//var BIAS = 0.33;
var BIAS_TRIANGLE = 0.33;
var BIAS_SQUARE = 0.33;
var BIAS_CIRCLE = 0.33;
var BIAS_PENTAGON = 0.33;

var mapBias = new Map([
	["triangle", BIAS_TRIANGLE],
	["square", BIAS_SQUARE],
	["circle", BIAS_CIRCLE],
	["pentagon", BIAS_PENTAGON]
]);

var TILE_SIZE = 30;
var PEEP_SIZE = 30;
var GRID_SIZE = 20; //board size
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
// Dark shape images
addAsset("yayTriangleDark","../img/yay_triangle_dark.png");
addAsset("mehTriangleDark","../img/meh_triangle_dark.png");
addAsset("sadTriangleDark","../img/sad_triangle_dark.png");
addAsset("yaySquareDark","../img/yay_square_dark.png");
addAsset("mehSquareDark","../img/meh_square_dark.png");
addAsset("sadSquareDark","../img/sad_square_dark.png");
addAsset("yayPentagonDark","../img/yay_pentagon_dark.png");
addAsset("mehPentagonDark","../img/meh_pentagon_dark.png");
addAsset("sadPentagonDark","../img/sad_pentagon_dark.png");
addAsset("yayCircleDark","../img/yay_circle_dark.png");
addAsset("mehCircleDark","../img/meh_circle_dark.png");
addAsset("sadCircleDark","../img/sad_circle_dark.png");

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
					if(d.color==self.color || d.value == self.value){	// !! Bias logic. Currently same shape OR same value will count as "like me"
						same++;
					}
				}
			}
			if(neighbors>0){
				self.sameness = (same/neighbors);
			}else{
				self.sameness = 1;
			}
			//Map code doesn't work, using switch for now
			/*if(self.sameness < mapBias.get(self.color) || self.sameness > mapNonconform.get(self.color)){
				self.shaking = true;
			}*/
			switch (self.color) {
				case "triangle":
					if(self.sameness<BIAS_TRIANGLE || self.sameness>NONCONFORM_TRIANGLE)
						self.shaking = true;
					break;
				case "square":
					if(self.sameness<BIAS_SQUARE || self.sameness>NONCONFORM_SQUARE)
						self.shaking = true;
					break;
				case "circle":
					if(self.sameness<BIAS_CIRCLE || self.sameness>NONCONFORM_CIRCLE)
						self.shaking = true;
					break;
				case "pentagon":
					if(self.sameness<BIAS_PENTAGON || self.sameness>NONCONFORM_PENTAGON)
						self.shaking = true;
			}
			//if(self.sameness<BIAS || self.sameness>NONCONFORM){
			//	self.shaking = true;
			//}
			if(self.sameness>0.99){
				self.bored = true;
			}
			switch (self.color) {
				case "triangle":
					if(self.sameness>NONCONFORM_TRIANGLE)
						self.nonconform = true;
					break;
				case "square":
					if(self.sameness>NONCONFORM_SQUARE)
						self.nonconform = true;
					break;
				case "circle":
					if(self.sameness>NONCONFORM_CIRCLE)
						self.nonconform = true;
					break;
				case "pentagon":
					if(self.sameness>NONCONFORM_PENTAGON)
						self.nonconform = true;
			}
			//if(self.sameness > NONCONFORM) {
			//	self.nonconform = true;
			//}
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
				if(self.value == "dark") img = images.sadTriangleDark;
				else img = images.sadTriangle;
			}else if(self.bored){
				if(self.value == "dark") img = images.mehTriangleDark;
				else img = images.mehTriangle;
			}else{
				if(self.value == "dark") img = images.yayTriangleDark;
				else img = images.yayTriangle;
			}
		}else if(self.color=="square"){
			if(self.shaking){
				if(self.value == "dark") img = images.sadSquareDark;
				else img = images.sadSquare;
			}else if(self.bored){
				if(self.value == "dark") img = images.mehSquareDark;
				else img = images.mehSquare;
			}else{
				if(self.value == "dark") img = images.yaySquareDark;
				else img = images.yaySquare;
			}
		//sets up image associations corresponding to the new shapes
		}else if(self.color=="circle"){
			if(self.shaking){
				if(self.value == "dark") img = images.sadCircleDark;
				else img = images.sadCircle;
			}else if(self.bored){
				if(self.value == "dark") img = images.mehCircleDark;
				else img = images.mehCircle;
			}else{
				if(self.value == "dark") img = images.yayCircleDark;
				else img = images.yayCircle;
			}
		}else{
			if(self.shaking){
				if(self.value == "dark") img = images.sadPentagonDark;
				else img = images.sadPentagon;
			}else if(self.bored){
				if(self.value == "dark") img = images.mehPentagonDark;
				else img = images.mehPentagon;
			}else{
				if(self.value == "dark") img = images.yayPentagonDark;
				else img = images.yayPentagon;
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
window.reset = function(size){

	if (size == "large"){
		parent.document.getElementById('playableFrame').width = "1350";
		document.getElementById('container').style.width = "1330px";
		document.getElementById('canvas').width = "900";
		document.getElementById('canvas').height = "900";
		GRID_SIZE = 30;
	} else if (size == "small"){
		parent.document.getElementById('playableFrame').width = "1050";
		document.getElementById('container').style.width = "1030px";
		document.getElementById('canvas').width = "600";
		document.getElementById('canvas').height = "600";
		GRID_SIZE = 20;
	}
	if (size != null) {
		setupSliders();

	}

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
	console.log("height"+document.getElementById('canvas').style.height);
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
					draggable.value = "light";
				}
				else if (rand < window.RATIO_TRIANGLES + window.RATIO_TRIANGLES_DARK) {
					draggable.color = "triangle";
					draggable.value = "dark";
				}
				else if (rand < window.RATIO_TRIANGLES + window.RATIO_TRIANGLES_DARK + window.RATIO_SQUARES) {
					draggable.color = "square";
					draggable.value = "light";
				}
				else if (rand < window.RATIO_TRIANGLES + window.RATIO_TRIANGLES_DARK + window.RATIO_SQUARES + window.RATIO_SQUARES_DARK) {
					draggable.color = "square";
					draggable.value = "dark";
				}
				else if (rand < window.RATIO_TRIANGLES + window.RATIO_TRIANGLES_DARK + window.RATIO_SQUARES + window.RATIO_SQUARES_DARK + window.RATIO_CIRCLES) {
					draggable.color = "circle";
					draggable.value = "light";
				}
				else if (rand < window.RATIO_TRIANGLES + window.RATIO_TRIANGLES_DARK + window.RATIO_SQUARES + window.RATIO_SQUARES_DARK + window.RATIO_CIRCLES + window.RATIO_CIRCLES_DARK) {
					draggable.color = "circle";
					draggable.value = "dark";
				}
				else if (rand < window.RATIO_TRIANGLES + window.RATIO_TRIANGLES_DARK + window.RATIO_SQUARES + window.RATIO_SQUARES_DARK + window.RATIO_CIRCLES + window.RATIO_CIRCLES_DARK + window.RATIO_PENTAGONS){
					draggable.color = "pentagon";
					draggable.value = "light";
				}
				else if (rand < window.RATIO_TRIANGLES + window.RATIO_TRIANGLES_DARK + window.RATIO_SQUARES + window.RATIO_SQUARES_DARK + window.RATIO_CIRCLES + window.RATIO_CIRCLES_DARK + window.RATIO_PENTAGONS + window.RATIO_PENTAGONS_DARK) {
					draggable.color = "pentagon";
					draggable.value = "dark";
				}
				draggables.push(draggable);
			}
		}
	}

	// Write stats for first time
	// Check amount of unhappy polygons
	var unhappyPolygons = 0;
	for(var i=0;i<draggables.length;i++){
		draggables[i].update();
		if (draggables[i].shaking == true) unhappyPolygons++;
	}
	writeStats();
	console.log("Number of unhappy polygons: " + unhappyPolygons);

};


function setupSliders(){
	var sliderTriangle = new DoubleSlider(document.getElementById("slider_triangle"), {
		backgrounds: [
			{color: "#555", icon: "sliders/ds_sad.png"},
			{color: "#aaa", icon: "sliders/ds_happy.png"},
			{color: "#555", icon: "sliders/ds_sad.png"}
		],
		values: [0.20, 1],
		onChange: function (values) {
			window.BIAS_TRIANGLE = Math.round((values[0] + Number.EPSILON) * 100) / 100;
			window.NONCONFORM_TRIANGLE = Math.round((values[1] + Number.EPSILON) * 100) / 100;
			// Write stats
			START_SIM = false;
			window.writeStats();
			bias_text_triangle.innerHTML = Math.round(window.BIAS_TRIANGLE * 100) + "%";
			nonconform_text_triangle.innerHTML = Math.round(window.NONCONFORM_TRIANGLE * 100) + "%";
		}
	});

	var sliderSquare = new DoubleSlider(document.getElementById("slider_square"), {
		backgrounds: [
			{color: "#555", icon: "sliders/ds_sad.png"},
			{color: "#aaa", icon: "sliders/ds_happy.png"},
			{color: "#555", icon: "sliders/ds_sad.png"}
		],
		values: [0.20, 1],
		onChange: function (values) {
			window.BIAS_SQUARE = Math.round((values[0] + Number.EPSILON) * 100) / 100;
			window.NONCONFORM_SQUARE = Math.round((values[1] + Number.EPSILON) * 100) / 100;
			// Write stats
			START_SIM = false;
			window.writeStats();
			bias_text_square.innerHTML = Math.round(window.BIAS_SQUARE * 100) + "%";
			nonconform_text_square.innerHTML = Math.round(window.NONCONFORM_SQUARE * 100) + "%";
		}
	});

	var sliderCircle = new DoubleSlider(document.getElementById("slider_circle"), {
		backgrounds: [
			{color: "#555", icon: "sliders/ds_sad.png"},
			{color: "#aaa", icon: "sliders/ds_happy.png"},
			{color: "#555", icon: "sliders/ds_sad.png"}
		],
		values: [0.20, 1],
		onChange: function (values) {
			window.BIAS_CIRCLE = Math.round((values[0] + Number.EPSILON) * 100) / 100;
			window.NONCONFORM_CIRCLE = Math.round((values[1] + Number.EPSILON) * 100) / 100;
			// Write stats
			START_SIM = false;
			window.writeStats();
			bias_text_circle.innerHTML = Math.round(window.BIAS_CIRCLE * 100) + "%";
			nonconform_text_circle.innerHTML = Math.round(window.NONCONFORM_CIRCLE * 100) + "%";
		}
	});

	var sliderPentagon = new DoubleSlider(document.getElementById("slider_pentagon"), {
		backgrounds: [
			{color: "#555", icon: "sliders/ds_sad.png"},
			{color: "#aaa", icon: "sliders/ds_happy.png"},
			{color: "#555", icon: "sliders/ds_sad.png"}
		],
		values: [0.20, 1],
		onChange: function (values) {
			window.BIAS_PENTAGON = Math.round((values[0] + Number.EPSILON) * 100) / 100;
			window.NONCONFORM_PENTAGON = Math.round((values[1] + Number.EPSILON) * 100) / 100;
			// Write stats
			START_SIM = false;
			window.writeStats();
			bias_text_pentagon.innerHTML = Math.round(window.BIAS_PENTAGON * 100) + "%";
			nonconform_text_pentagon.innerHTML = Math.round(window.NONCONFORM_PENTAGON * 100) + "%";
		}
	});

	var whatever = new Quadslider(document.getElementById("slider2"), {
		backgrounds: [
			//added backgrounds for the new shape colors on the slider bar
			{color: "#FFDD56", icon: "sliders/ds_happy.png"},
			{color: "#aa9439", icon: "sliders/ds_happy.png"},
			{color: "#567DFF", icon: "sliders/ds_happy.png"},
			{color: "#3b56af", icon: "sliders/ds_happy.png"},
			{color: "#C342FF", icon: "sliders/ds_happy.png"},
			{color: "#8300ff", icon: "sliders/ds_happy.png"},
			{color: "#56FF9C", icon: "sliders/ds_happy.png"},
			{color: "#39aa69", icon: "sliders/ds_happy.png"},
			{color: "#000", icon: "sliders/ds_sad.png"}
		],
		//sets up the initial position of the sliders on the bar
		values: [0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80],
		onChange: function (values) {
			// stores the position of each slider on the bar
			var VALUE_1 = values[0];
			var VALUE_2 = values[1];
			var VALUE_3 = values[2];
			var VALUE_4 = values[3];
			var VALUE_5 = values[4];
			var VALUE_6 = values[5];
			var VALUE_7 = values[6];
			var VALUE_8 = values[7];
			//calculates the ratio of each shape
			window.EMPTINESS = 1 - VALUE_8;
			window.RATIO_TRIANGLES = VALUE_1;
			window.RATIO_TRIANGLES_DARK = VALUE_2 - VALUE_1;
			window.RATIO_SQUARES = VALUE_3 - VALUE_2;
			window.RATIO_SQUARES_DARK = VALUE_4 - VALUE_3;
			window.RATIO_CIRCLES = VALUE_5 - VALUE_4;
			window.RATIO_CIRCLES_DARK = VALUE_6 - VALUE_5;
			window.RATIO_PENTAGONS = VALUE_7 - VALUE_6;
			window.RATIO_PENTAGONS_DARK = VALUE_8 - VALUE_7;
			// Write stats
			START_SIM = false;
			//determines the ratio of each shape on the board
			document.getElementById("ratio_text_triangles").innerHTML = Math.round(window.RATIO_TRIANGLES * 100);
			document.getElementById("ratio_text_triangles_dark").innerHTML = Math.round(window.RATIO_TRIANGLES_DARK * 100);
			document.getElementById("ratio_text_squares").innerHTML = Math.round(window.RATIO_SQUARES * 100);
			document.getElementById("ratio_text_squares_dark").innerHTML = Math.round(window.RATIO_SQUARES_DARK * 100);
			document.getElementById("ratio_text_circles").innerHTML = Math.round(window.RATIO_CIRCLES * 100);
			document.getElementById("ratio_text_circles_dark").innerHTML = Math.round(window.RATIO_CIRCLES_DARK * 100);
			document.getElementById("ratio_text_pentagons").innerHTML = Math.round(window.RATIO_PENTAGONS * 100);
			document.getElementById("ratio_text_pentagons_dark").innerHTML = Math.round(window.RATIO_PENTAGONS_DARK * 100);
			document.getElementById("empty_text").innerHTML = Math.round(window.EMPTINESS * 100) + "%";
		},
		onLetGo: function () {
			reset();
		}
	});
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
var triangle_stats = document.getElementById("triangle_stats");
var square_stats = document.getElementById("square_stats");
var circle_stats = document.getElementById("circle_stats");
var pentagon_stats = document.getElementById("pentagon_stats");
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
	for(let i=0;i<draggables.length;i++){
		var d = draggables[i];
		total += d.sameness || 0;
	}
	var avg = total/draggables.length;
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
	// var segregation = (avg-0.25)*(4/3);
	// Previous segregation calculation doesn't hold for the flexible percentages of polygon types and the introduction of a second attribute (dark)
	// Segregation is now the percentage of polygons with 100% neighbors like themselves.

	var segregatedPolygons = 0;
	for(let i=0;i<draggables.length;i++){
		if (draggables[i].sameness == 1) segregatedPolygons++;
	}
	var segregation = segregatedPolygons/draggables.length;
	if(segregation<0) segregation=0;

	// Graph it
	stats_ctx.fillStyle = "#cc2727";
	var x = STATS.steps - STATS.offset;
	var y = 250 - segregation*250+10;
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
	//it calculates the shapes with highest diversity and highest sameness environment
	//by going through a list of shakers
	for (var i = 0; i < shaking.length; i++){
		if (shaking[i].sameness < minShaker.sameness) {
			minShaker = shaking[i];
		}
		else if(shaking[i].nonconform && shaking[i].sameness > maxShaker.sameness) {
			maxShaker = shaking[i];
		}
	}
	//this determines which shape is unhappiest. It is either the shape with highest sameness or highest diversity. 
	//the distance from the tolerance level is what determines which one is the unhappiest.

	//Define bias and nonconform for specific shapes
	let minShakerBias = mapBias[minShaker.color];
	let maxShakerNonconform = mapNonconform[maxShaker.color];

	if(minShaker.sameness < minShakerBias && maxShakerNonconform < maxShaker.sameness && Math.abs(minShakerBias - minShaker.sameness) < Math.abs(maxShaker.sameness - maxShakerNonconform)) {
		shaker = maxShaker;
	}
	else if (minShaker.sameness < minShakerBias && maxShakerNonconform < maxShaker.sameness && Math.abs(minShakerBias - minShaker.sameness) >= Math.abs(maxShaker.sameness - maxShakerNonconform)) {
		shaker = minShaker;
	}
	else if (maxShakerNonconform < maxShaker.sameness) {
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

	//update the individual counters for each shapez
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

window.IS_IN_SIGHT = true;  /////////CRUCIAL ELEMENT RIGHT HERE. Needs to be true in order to test on a local machine

window.onload=function(){
	reset(false);
}
