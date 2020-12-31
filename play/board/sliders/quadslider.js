

/*******************
Name: Quadslider
Pre-condition: The required assets exist and
are ready to be used. Also all 4 shapes must
exist and be created without error 
Post-condition: The function creates a new slider
with five options. There are four sliders (one 
for each shape) and one additional slider
for empty space
*******************/
function Quadslider(dom,config){

	//intialize required variables
	var self = this;
	self.dom = dom;
	self.backgrounds = [];
	self.sliders = [];
	self.values = config.values;

	self.draggingSliderDOM = null;
	self.draggingSliderIndex = -1;

	// Create DOM
	self.dom.className = "ds";
	for(var i=0;i<9;i++){

		var dom = document.createElement("div");
		dom.className = "ds_bg";
		self.dom.appendChild(dom);
		self.backgrounds[8-i] = dom;

		// CSS
		dom.style.backgroundColor = config.backgrounds[8-i].color;
		dom.style.backgroundImage = "url("+config.backgrounds[8-i].icon+")";
		if(i==0) dom.style.width = "100%";

	}
	//CHANGES HERE: changed i for this for loop from 2 to 4, adds two new sliders
	for(var i=0;i<8;i++){
		
		var dom = document.createElement("div");
		dom.className = "ds_slider";
		self.dom.appendChild(dom);
		self.sliders.push(dom);

		// Events
		(function(dom,i,self){
			var onMouseDown = function(){
				self.draggingSliderDOM = dom;
				self.draggingSliderIndex = i;
			};
			dom.addEventListener("mousedown",onMouseDown,true);
			dom.addEventListener("touchstart",onMouseDown,true);
		})(dom,i,self);

	}

	// Slider logic
	/*******************
	Name: onMouseMove
	Pre-condition: The mouse is moving and a corresponding
	value is passed in related to this.
	Post-condition: The sliders are updatedg
	Description: This function updates sliders whenever they
	are moved
	*******************/
	function onMouseMove(x){
	    if(self.draggingSliderDOM){
	    	var val = x/400;

	    	var index = self.draggingSliderIndex;
	    	var sliderWidth = 0;//0.025;
	    //CHANGES HERE: changed how the boundaries of the sliders are calculated. Set it up so sliders can't cross each other
		 if(index==0){
	    		var edge = self.values[1]-sliderWidth;
	    		if(val>edge) val=edge;
	    	}
	    	else if(index==1){
	    		var back_edge = self.values[0]+ sliderWidth;
	    		if(val<back_edge) val=back_edge;
			var front_edge = self.values[2] - sliderWidth;
			if(val > front_edge) val = front_edge;
	    	}
	    	//CHANGES HERE: The two else ifs below. Calculates the boundaries of the new sliders
   	    	else if(index==2){
			 var back_edge = self.values[1]+ sliderWidth;
			 if(val<back_edge) val=back_edge;
			 var front_edge = self.values[3] - sliderWidth;
			 if(val > front_edge) val = front_edge;
		 }
		 else if(index==3){
			 //var back_edge = self.values[2]+ sliderWidth;
			 //if(val<back_edge) val=back_edge;
			 var back_edge = self.values[2]+ sliderWidth;
			 if(val<back_edge) val=back_edge;
			 var front_edge = self.values[4] - sliderWidth;
			 if(val > front_edge) val = front_edge;
		 }
		 else if(index==4){
			 var back_edge = self.values[3]+ sliderWidth;
			 if(val<back_edge) val=back_edge;
			 var front_edge = self.values[5] - sliderWidth;
			 if(val > front_edge) val = front_edge;
		 }
		 else if(index==5){
			 var back_edge = self.values[4]+ sliderWidth;
			 if(val<back_edge) val=back_edge;
			 var front_edge = self.values[6] - sliderWidth;
			 if(val > front_edge) val = front_edge;
		 }
		 else if(index==6){
			 var back_edge = self.values[5]+ sliderWidth;
			 if(val<back_edge) val=back_edge;
			 var front_edge = self.values[7] - sliderWidth;
			 if(val > front_edge) val = front_edge;
		 }
		 else if(index==7){
			 var back_edge = self.values[6]+ sliderWidth;
			 if(val<back_edge) val=back_edge;
		 }

	    	var edge = sliderWidth/2;
    		if(val<edge) val=edge;
	    	var edge = 1-sliderWidth/2;
	    	if(val>edge) val=edge;

	    	self.values[index] = val;
	    	self.updateUI();
	    	config.onChange(self.values);

		}
	}
	//stops the dragging of the sliders when the user stops
	//holding down the mouse
	function onMouseUp(){
		if(self.draggingSliderDOM){
		    self.draggingSliderDOM = null;
		    if(config.onLetGo){
		    	config.onLetGo();
		    }
		}
	}
	//sets up listeners for movement of stoppage
	//of mouse or touch movements
	document.body.addEventListener("mousemove",function(event){
		var x = event.pageX - myX();
		onMouseMove(x);
	},false);
	
	document.body.addEventListener("touchmove",function(event){
		var x = event.changedTouches[0].clientX - myX();
		onMouseMove(x);
	},false);

	document.body.addEventListener("mouseup",onMouseUp,true);
	document.body.addEventListener("touchend",onMouseUp,true);
	var cacheX = null;
	function myX(){
		if(!cacheX) cacheX=findPos(self.dom)[0];
		return cacheX;
	}

	// UI Update
	self.updateUI = function(){

		for(var i=0;i<8;i++){
			var slider = self.sliders[i];
			var val = self.values[i];
			slider.style.left = (400*val - 5)+"px";
		}

		var bg;
		//CHANGES HERE: This section is what sets up the color between the sliders. Not sure if I did it totally correctly
		var v0=self.values[0]*400, v1=self.values[1]*400,  v2=self.values[2]*400,  v3=self.values[3]*400,
			v4=self.values[4]*400, v5=self.values[5]*400, v6=self.values[6]*400, v7=self.values[7]*400;
		bg = self.backgrounds[0];
		bg.style.width = v0+"px";
		bg = self.backgrounds[1];
		bg.style.left = v0+"px";
		bg.style.width = (v1-v0)+"px";
		bg = self.backgrounds[2];
		bg.style.left = v1+"px";
		bg.style.width = (v2-v1)+"px";
		bg = self.backgrounds[3];
		bg.style.left = v2+"px";
		bg.style.width = (v3-v2)+"px";
		//New for dark shapes
		bg = self.backgrounds[4];
		bg.style.left = v3+"px";
		bg.style.width = (v4-v3)+"px";
		bg = self.backgrounds[5];
		bg.style.left = v4+"px";
		bg.style.width = (v5-v4)+"px";
		bg = self.backgrounds[6];
		bg.style.left = v5+"px";
		bg.style.width = (v6-v5)+"px";
		bg = self.backgrounds[7];
		bg.style.left = v6+"px";
		bg.style.width = (v7-v6)+"px";

			 

	};

	// INIT
	self.updateUI();
	config.onChange(self.values);


}

/*******************
Name: findPos
Pre-condition: The sliders exist
Post-condition: The position of the sliders
is recorded for future reference
Description: This function finds the relative position
of the sliders and records that position in order
to execute required functions in the future.
*******************/
function findPos(obj){
    var curleft = 0;
    var curtop = 0;
    if(obj.offsetLeft) curleft += parseInt(obj.offsetLeft);
    if(obj.offsetTop) curtop += parseInt(obj.offsetTop);
    if(obj.scrollTop && obj.scrollTop > 0) curtop -= parseInt(obj.scrollTop);
    if(obj.offsetParent) {
        var pos = findPos(obj.offsetParent);
        curleft += pos[0];
        curtop += pos[1];
    }/* else if(obj.ownerDocument) {
        var thewindow = obj.ownerDocument.defaultView;
        if(!thewindow && obj.ownerDocument.parentWindow)
            thewindow = obj.ownerDocument.parentWindow;
        if(thewindow) {
            if(thewindow.frameElement) {
                var pos = findPos(thewindow.frameElement);
                curleft += pos[0];
                curtop += pos[1];
            }
        }
    }*/

    return [curleft,curtop];
}
