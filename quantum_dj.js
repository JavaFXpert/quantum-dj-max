/*

Quantum DJ device user interface

arguments: fgred fggreen fgblue bgred bggreen bgblue dialred dialgreen dialblue

*/

this.inlets = 2;

var CircuitNodeTypes = {
    EMPTY: -1,
    IDEN: 0,
    X: 1,
    Y: 2,
    Z: 3,
    S: 4,
    SDG: 5,
    T: 6,
    TDG: 7,
    H: 8,
    SWAP: 9,
    BARRIER: 10,
    CTRL: 11, // "control" part of multi-qubit gate
    TRACE: 12, // In the path between a gate part and a "control" or "swap" part
    MEASURE_Z: 13
}

var curNodeType = CircuitNodeTypes.EMPTY;

var NUM_GRID_ROWS = 8;
var NUM_GRID_COLS = 5;

var lowMidiPitch = 36;
var highMidiPitch = NUM_GRID_ROWS * NUM_GRID_COLS + lowMidiPitch - 1;
post('highMidiPitch: ' + highMidiPitch);

var circGrid = [
    [-1, -1, -1, -1,-1],
    [-1, -1, -1, -1,-1],
    [-1, -1, -1, -1,-1],
    [-1, -1, -1, -1,-1],
    [-1, -1, -1, -1,-1],
    [-1, -1, -1, -1,-1],
    [-1, -1, -1, -1,-1],
    [-1, -1, -1, -1,-1]
];


sketch.default2d();
var val = 0;
var vbrgb = [1.,1.,1.,1.];
var vfrgb = [0.5,0.5,0.5,1.];
var vrgb2 = [0.7,0.7,0.7,1.];
var last_x = 0;
var last_y = 0;

// process arguments
post('in process args');
if (jsarguments.length>1)
	vfrgb[0] = jsarguments[1]/255.;
if (jsarguments.length>2)
	vfrgb[1] = jsarguments[2]/255.;
if (jsarguments.length>3)
	vfrgb[2] = jsarguments[3]/255.;
if (jsarguments.length>4)
	vbrgb[0] = jsarguments[4]/255.;
if (jsarguments.length>5)
	vbrgb[1] = jsarguments[5]/255.;
if (jsarguments.length>6)
	vbrgb[2] = jsarguments[6]/255.;
if (jsarguments.length>7)
	vrgb2[0] = jsarguments[7]/255.;
if (jsarguments.length>8)
	vrgb2[1] = jsarguments[8]/255.;
if (jsarguments.length>9)
	vrgb2[2] = jsarguments[9]/255.;

draw();


function msg_int(n)
{
    //post('n: ' + n);    
}


function list(lst) 
{
	//post('from inlet: ' + inlet);
	//post('arguments.length: ' + arguments.length);
	//post('arguments[0]: ' + arguments[0] + ', arguments[1]: ' + arguments[1]);
	
	if (inlet == 0) { 
    	setCircGridGate(arguments);
    }
	else if (inlet == 1) { 
        setCurNodeType(arguments);
    }
}


/*
Given an array with midi pitch and velocity, 
populates the corresponding circuit grid element
*/
function setCircGridGate(notePitchVelocity) {
	//post('notePitchVel: ' + notePitchVel[0]);
	if (notePitchVelocity.length >= 2) {
	    var pitch = notePitchVelocity[0];
	    var velocity = notePitchVelocity[1];
	
	    if (pitch >= lowMidiPitch && pitch <= highMidiPitch) {
		    //var circNodeType = CircuitNodeTypes.EMPTY;
            //if (velocity > 0) {
		    //    circNodeType  = CircuitNodeTypes.H;
		    //}
		    
            var gridCol = (highMidiPitch - pitch) % NUM_GRID_COLS;
            gridCol = NUM_GRID_COLS - gridCol - 1;

            //post('highMidiPitch: ' + highMidiPitch);
            //post('pitch: ' + pitch);
            //post('gridCol: ' + gridCol);

            var gridRow = Math.floor((highMidiPitch - pitch) / NUM_GRID_COLS);
            //post('gridRow: ' + gridRow);

            //circGrid[gridRow][gridCol] = circNodeType;
            circGrid[gridRow][gridCol] = curNodeType;

		}
		
			
        printCircGrid();

	}
	else {
		post('Unexpected notePitchVelocity.length: ' + notePitchVelocity.length);
	}
}


/*
Given an array with controller number and value, 
sets the current circuit node type for when
a node is placed on the circuit
*/
function setCurNodeType(controllerNumValue) {
	//post('controllerNumValue: ' + controllerNumValue[0]);
	if (controllerNumValue.length >= 2) {
	    var contNum = controllerNumValue[0];
	    var contVal = controllerNumValue[1];
	
	    if (contVal > 0) {
		    if (contNum == 43) {
			    curNodeType = CircuitNodeTypes.H;
			}
			else if (contNum == 42) {
				curNodeType = CircuitNodeTypes.X;
			}
			else if (contNum == 41) {
				curNodeType = CircuitNodeTypes.Z;
			}
			else if (contNum == 40) {
				curNodeType = CircuitNodeTypes.S;
			}
			else if (contNum == 39) {
				curNodeType = CircuitNodeTypes.SDG;
			}
			else if (contNum == 38) {
				curNodeType = CircuitNodeTypes.T;
			}
			else if (contNum == 37) {
				curNodeType = CircuitNodeTypes.TDG;
			}
			else if (contNum == 36) {
				curNodeType = CircuitNodeTypes.EMPTY;
			}
			
            post('curNodeType is now ' + curNodeType); 
		}
	

	}
	else {
		post('Unexpected controllerNumValue.length: ' + controllerNumValue.length);
	}
}



function printCircGrid() {
	post('\n');
    for (rowIdx = 0; rowIdx < NUM_GRID_ROWS; rowIdx++) {
        for (colIdx = 0; colIdx < NUM_GRID_COLS; colIdx++) {
	        post(circGrid[rowIdx][colIdx] + ' ');
	    }	
	    post('\n');
	}	
}	


function draw()
{
	var theta;
	var width = box.rect[2] - box.rect[0];
	
	with (sketch) {
		shapeslice(180,1);
		// erase background
		glclearcolor(vbrgb[0],vbrgb[1],vbrgb[2],vbrgb[3]);
		glclear();			
		moveto(0,0);
		// fill bgcircle
		glcolor(vrgb2);
		circle(0.8);
		// draw arc outline
		glcolor(0,0,0,1);
		circle(0.8,-90-val*360,-90);						
		// fill arc			
		glcolor(vfrgb);
		circle(0.7,-90-val*360,-90);						
		// draw rest of outline
		if (width<=32)
			gllinewidth(1);
		else
			gllinewidth(2);
		glcolor(0,0,0,1);
		moveto(0,0);
		lineto(0,-0.8);
		moveto(0,0);
		theta = (0.75-val)*2*Math.PI;
		lineto(0.8*Math.cos(theta),0.8*Math.sin(theta));
	}
}

function bang()
{
	draw();
	refresh();
	outlet(0,val);
}

function msg_float(v)
{
	val = Math.min(Math.max(0,v),1);
	notifyclients();
	bang();
}

function set(v)
{
	val = Math.min(Math.max(0,v),1);
	notifyclients();
	draw();
	refresh();
}

function fsaa(v)
{
	sketch.fsaa = v;
	bang();
}

function frgb(r,g,b)
{
	vfrgb[0] = r/255.;
	vfrgb[1] = g/255.;
	vfrgb[2] = b/255.;
	draw();
	refresh();
}

function rgb2(r,g,b)
{
	vrgb2[0] = r/255.;
	vrgb2[1] = g/255.;
	vrgb2[2] = b/255.;
	draw();
	refresh();
}

function brgb(r,g,b)
{
	vbrgb[0] = r/255.;
	vbrgb[1] = g/255.;
	vbrgb[2] = b/255.;
	draw();
	refresh();
}

function setvalueof(v)
{
	msg_float(v);
}

function getvalueof()
{
	return val;
}

// all mouse events are of the form: 
// onevent <x>, <y>, <button down>, <cmd(PC ctrl)>, <shift>, <capslock>, <option>, <ctrl(PC rbutton)>
// if you don't care about the additonal modifiers args, you can simply leave them out.
// one potentially confusing thing is that mouse events are in absolute screen coordinates, 
// with (0,0) as left top, and (width,height) as right, bottom, while drawing 
// coordinates are in relative world coordinates, with (0,0) as the center, +1 top, -1 bottom,
// and x coordinates using a uniform scale based on the y coordinates. to convert between screen 
// and world coordinates, use sketch.screentoworld(x,y) and sketch.worldtoscreen(x,y,z).

function onclick(x,y,but,cmd,shift,capslock,option,ctrl)
{
	// cache mouse position for tracking delta movements
	last_x = x;
	last_y = y;
}
onclick.local = 1; //private. could be left public to permit "synthetic" events

function ondrag(x,y,but,cmd,shift,capslock,option,ctrl)
{
	var f,dy;
	
	// calculate delta movements
	dy = y - last_y;
	if (shift) { 
		// fine tune if shift key is down
		f = val - dy*0.001; 
	} else {
		f = val - dy*0.01;
	}
	msg_float(f); //set new value with clipping + refresh
	// cache mouse position for tracking delta movements
	last_x = x;
	last_y = y;
}
ondrag.local = 1; //private. could be left public to permit "synthetic" events

function ondblclick(x,y,but,cmd,shift,capslock,option,ctrl)
{
	last_x = x;
	last_y = y;
	msg_float(0); // reset dial?
}
ondblclick.local = 1; //private. could be left public to permit "synthetic" events

function forcesize(w,h)
{
	if (w!=h) {
		h = w;
		box.size(w,h);
	}
}
forcesize.local = 1; //private

function onresize(w,h)
{
	forcesize(w,h);
	draw();
	refresh();
}
onresize.local = 1; //private
