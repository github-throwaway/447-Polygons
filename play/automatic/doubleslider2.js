/***

new DoubleSlider(dom,{

	backgrounds:[
		{color:"#cc2727"},
		{color:"#bada55"},
		{color:"#2095dc"}
	],

	values:[0.1,0.9]

});

***/
function DoubleSlider2(dom,config){

	var self = this;
	self.dom = dom;
	self.backgrounds = [];
	self.sliders = [];
	self.values = config.values;

	self.draggingSliderDOM = null;
	self.draggingSliderIndex = -1;

	// Create DOM
	self.dom.className = "ds";
	for(var i=0;i<4;i++){

		var dom = document.createElement("div");
		dom.className = "ds_bg";
		self.dom.appendChild(dom);
		self.backgrounds[3-i] = dom;

		// CSS
		dom.style.backgroundColor = config.backgrounds[3-i].color;
		dom.style.backgroundImage = "url("+config.backgrounds[3-i].icon+")";
		if(i==0) dom.style.width = "100%";

	}
	for(var i=0;i<4;i++){
		
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
	function onMouseMove(x){
	    if(self.draggingSliderDOM){
	    	var val = x/400;

	    	var index = self.draggingSliderIndex;
	    	var sliderWidth = 0;//0.025;
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
   	    else if(index==2){
	    	var back_edge = self.values[1]+ sliderWidth;
	    		if(val<back_edge) val=back_edge;
			var front_edge = self.values[3] - sliderWidth;
			if(val > front_edge) val = front_edge;
	    }
	    else if(index==3){
	    		var front_edge = self.values[2]+ sliderWidth;
	    		if(val<front_edge) val=back_edge;
			
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
	function onMouseUp(){
		if(self.draggingSliderDOM){
		    self.draggingSliderDOM = null;
		    if(config.onLetGo){
		    	config.onLetGo();
		    }
		}
	}
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

		for(var i=0;i<4;i++){
			var slider = self.sliders[i];
			var val = self.values[i];
			slider.style.left = (400*val - 5)+"px";
		}

		var bg;
		var v0=self.values[0]*400, v1=self.values[1]*400,  v2=self.values[2]*400,  v3=self.values[3]*400, v4=self.values[4]*400;
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
			 

	};

	// INIT
	self.updateUI();
	config.onChange(self.values);


}

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
