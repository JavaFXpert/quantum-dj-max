/**
 * Button that represents a quantum gate on a Push 2 matrix
 */
include('common.js');

var r2 = 0.70710678118;

this.inlets = 2;
this.outlets = 1;

this.midiNum = 0;
this.qasmPadObj = this.patcher.getnamed("qasmpad");

// var CircuitNodeTypes = {
//     EMPTY: -1,
//     IDEN: 0,
//     X: 1,
//     Y: 2,
//     Z: 3,
//     S: 4,
//     SDG: 5,
//     T: 6,
//     TDG: 7,
//     H: 8,
//     SWAP: 9,
//     BARRIER: 10,
//     CTRL: 11, // "control" part of multi-qubit gate
//     TRACE: 12, // In the path between a gate part and a "control" or "swap" part
//     MEASURE_Z: 13
// }

var curCircNodeType = CircuitNodeTypes.EMPTY;

var NUM_GRID_ROWS = 8;
var NUM_GRID_COLS = 5;

var lowMidiPitch = 36;
var highMidiPitch = NUM_GRID_ROWS * NUM_GRID_COLS + lowMidiPitch - 1;
//post('highMidiPitch: ' + highMidiPitch);


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

/**
 * Determine how many wires are represented on the circGrid
 */
function computeNumWires() {
	var numWires = 1;
	var foundPopulatedRow = false;
	var rowIdx = NUM_GRID_ROWS - 1;

	while (!foundPopulatedRow && rowIdx > 0) {
		for (var colIdx = 0; colIdx < NUM_GRID_COLS; colIdx++) {
			if (circGrid[rowIdx][colIdx] != CircuitNodeTypes.EMPTY) {
				numWires = rowIdx + 1;
				foundPopulatedRow = true;
			}
		}
		rowIdx--;
	}

	//post('numWires: ' + numWires);
	return numWires;
}


sketch.default2d();
var val = 0;
var vbrgb = [1.,1.,1.,1.];
var vfrgb = [0.5,0.5,0.5,1.];
var vrgb2 = [0.7,0.7,0.7,1.];
var last_x = 0;
var last_y = 0;

// process arguments
//post('processing args');
if (jsarguments.length > 1) {
	this.midiNum = jsarguments[1];
	//post('\njsarguments[1]: ' + jsarguments[1]);

	//this.varname = 'circbtn' + this.midiNum;
	//post('this.varname: ' + this.varname);
}


function msg_int(n)
{
    //post('n: ' + n);    
}


function list(lst) 
{
	// post('from inlet: ' + inlet);
	// post('arguments.length: ' + arguments.length);
	// post('arguments[0]: ' + arguments[0] + ', arguments[1]: ' + arguments[1]);
	
	if (inlet == 0) { 
		setCircGridGate(arguments);
	}
	else if (inlet == 1) {
		setCurCircNodeType(arguments);
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
	
		if (pitch >= lowMidiPitch && pitch <= highMidiPitch & velocity > 0) {
			var gridCol = (highMidiPitch - pitch) % NUM_GRID_COLS;
			gridCol = NUM_GRID_COLS - gridCol - 1;

      var gridRow = Math.floor((highMidiPitch - pitch) / NUM_GRID_COLS);

      circGrid[gridRow][gridCol] = curCircNodeType;
			//printCircGrid();
			createQasmFromGrid();

		}
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
function setCurCircNodeType(controllerNumValue) {
	//post('controllerNumValue: ' + controllerNumValue[0]);
	if (controllerNumValue.length >= 2) {
	    var contNum = controllerNumValue[0];
	    var contVal = controllerNumValue[1];
	
	    if (contVal > 0) {
		    if (contNum == 43) {
			    curCircNodeType = CircuitNodeTypes.H;
			}
			else if (contNum == 42) {
				curCircNodeType = CircuitNodeTypes.X;
			}
			else if (contNum == 41) {
				curCircNodeType = CircuitNodeTypes.Z;
			}
			else if (contNum == 40) {
				curCircNodeType = CircuitNodeTypes.S;
			}
			else if (contNum == 39) {
				curCircNodeType = CircuitNodeTypes.SDG;
			}
			else if (contNum == 38) {
				curCircNodeType = CircuitNodeTypes.T;
			}
			else if (contNum == 37) {
				curCircNodeType = CircuitNodeTypes.TDG;
			}
			else if (contNum == 36) {
				if (curCircNodeType == CircuitNodeTypes.EMPTY){
					// User pressed EMPTY key twice, so clear grid
					resetCircGrid();
				}
				curCircNodeType = CircuitNodeTypes.EMPTY;
			}
			
      post('curCircNodeType is now ' + curCircNodeType);
		}
	

	}
	else {
		post('Unexpected controllerNumValue.length: ' + controllerNumValue.length);
	}
}


function draw()
{
	this.qasmPadObj = this.patcher.getnamed("qasmpad");

	var theta;
	var width = box.rect[2] - box.rect[0];


	with (sketch) {
		shapeslice(180,1);
		// erase background
		glclearcolor(vbrgb[0],vbrgb[1],vbrgb[2],vbrgb[3]);
		glclear();

		glcolor(0,0,0,1);

		var curNodeType = qasmPadObj.js.curCircNodeType;
		post('in draw(), curNodeType:  ' + curNodeType);
    if (curNodeType == CircuitNodeTypes.EMPTY || curNodeType == 0) {
			// Draw empty circuit wire
    	moveto(-1.0, 0.0);
			lineto(1.0, 0.0);
		}
    else {
			moveto(-0.8, -0.8);

			// Draw square
			lineto(0.8, -0.8);
			lineto(0.8, 0.8);
			lineto(-0.8, 0.8);
			lineto(-0.8, -0.8);

			// Draw connector
			moveto(-1.0, 0.0);
			lineto(-0.8, -0.0);
			moveto(0.8, 0.0);
			lineto(1.0, 0.0);
		}

		if (curNodeType == CircuitNodeTypes.H) {
			moveto(-0.32, -0.4);
			text("H");
		}
		else if (curNodeType == CircuitNodeTypes.X) {
			moveto(-0.32, -0.4);
			text("X");
		}
		else if (curNodeType == CircuitNodeTypes.Z) {
			moveto(-0.32, -0.4);
			text("Z");
		}
		else if (curNodeType == CircuitNodeTypes.S) {
			moveto(-0.32, -0.4);
			text("S");
		}
		else if (curNodeType == CircuitNodeTypes.SDG) {
			moveto(-0.6, -0.32);
			text("S\u2020");
		}
		else if (curNodeType == CircuitNodeTypes.T) {
			moveto(-0.32, -0.4);
			text("T");
		}
		else if (curNodeType == CircuitNodeTypes.TDG) {
			moveto(-0.6, -0.32);
			text("T\u2020");
		}
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
	post('In onclick');
	messnamed('alice', this.midiNum, 127);

	//ob = this.patcher.getnamed("qasmpad");
	//post('ob.curCircNodeType: ' + ob.curCircNodeType);
	// this.qasmPadObj = this.patcher.getnamed("qasmpad");
	// post('qasmPadObj.js.curCircNodeType: ' + qasmPadObj.js.curCircNodeType);
	// post('qasmPadObj.varname: ' + qasmPadObj.varname);
	//
	// post('this.varname: ' + this.varname);

	draw();
	refresh();
}
onclick.local = 1; //private. could be left public to permit "synthetic" events


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


