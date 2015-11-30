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
 
 
 //CHANGES HERE: Lines 18, 19. Although I don't think these are used. At least their default values. They get passed in from 
 //automatic_sandbox.html
 window.RATIO_TRIANGLES = 0.20;
 window.RATIO_SQUARES = 0.20;
 window.RATIO_CIRCLES = 0.20;
 window.RATIO_PENTAGONS = 0.20;
 window.EMPTINESS = 0.20;
 
 
 
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
 //CHANGES HERE: Lines 42-47
 addAsset("yayTriangle","../img/yay_triangle.png");
 addAsset("mehTriangle","../img/meh_triangle.png");
 addAsset("sadTriangle","../img/sad_triangle.png");
 addAsset("yaySquare","../img/yay_square.png");
 addAsset("mehSquare","../img/meh_square.png");
 addAsset("sadSquare","../img/sad_square.png");
 addAsset("yayCircle","../img/yay_circle.png");
 addAsset("mehCircle","../img/meh_circle.png");
 addAsset("sadCircle","../img/sad_circle.png");
 addAsset("yayPentagon","../img/yay_pentagon.png");
 addAsset("mehPentagon","../img/meh_pentagon.png");
 addAsset("sadPentagon","../img/sad_pentagon.png");
 
 var IS_PICKING_UP = false;
 var lastMouseX, lastMouseY;
 
 function Draggable(x,y){
 	
 	var self = this;
 	self.x = x;
 	self.y = y;
 	self.gotoX = x;
 	self.gotoY = y;
 
 	var offsetX, offsetY;
 	var pickupX, pickupY;
 	self.pickup = function(){
 		console.log(RATIO_TRIANGLES);
 		console.log(RATIO_SQUARES);
 		console.log(RATIO_CIRCLES);
 		console.log(RATIO_PENTAGONS);
 		IS_PICKING_UP = true;
 
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
 
 	self.drop = function(){
 
 		IS_PICKING_UP = false;
 
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
 	self.update = function(){
 
 		// Shakiness?
 		self.shaking = false;
 		self.bored = false;
 
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
 			if(neighbors==0){
 				self.shaking = false;
 			}
 		}
 
 		// Dragging
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
 		if(self.color="triangle"){
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
 		//CHANGES HERE: lines 216-233
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
 window.reset = function(){
 
 	STATS = {
 		steps:0,
 		offset:0
 	};
 	START_SIM = false;
 
 	stats_ctx.clearRect(0,0,stats_canvas.width,stats_canvas.height);
 
 	draggables = [];
 	for(var x=0;x<GRID_SIZE;x++){
 		for(var y=0;y<GRID_SIZE;y++){
 			if(Math.random()<(1-window.EMPTINESS)){
 				//CHANGES HERE: Lines 268-283 - This is where the board is initialized
 				//currently it is messy nd not working right
 				var draggable = new Draggable((x+0.5)*TILE_SIZE, (y+0.5)*TILE_SIZE);
 				//The original code works a little differently. It's worth checking out the original for this. 
-				//rand = Math.random();
-				//if(rand < window.RATIO_TRIANGLES){ 
-				//	draggable.color = "square"; 
-				//}
-				//else if (rand < window.RATIO_TRIANGLES + window.RATIO_SQUARES) {
-				//	draggable.color = "square";
-				//}
-				//else if (rand < window.RATIO_SQUARES + window.RATIO_CIRCLES + window.RATIO_TRIANGLES) {
-				//	draggable.color = "circle";
-				//}
-				//else {
+				/rand = Math.random();
+				if(rand < window.RATIO_TRIANGLES){ 
+					draggable.color = "square"; 
+				}
+				else if (rand < window.RATIO_TRIANGLES + window.RATIO_SQUARES) {
+					draggable.color = "square";
+				}
+				else if (rand < window.RATIO_SQUARES + window.RATIO_CIRCLES + window.RATIO_TRIANGLES) {
+					draggable.color = "circle";
+				}
+				else {
 				draggable.color = "pentagon";
-				//}
+				}
 				draggables.push(draggable);
 			}
 		}
