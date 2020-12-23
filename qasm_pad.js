/**
 * Quantum DJ device user interface
 */
include('common.js');

var r2 = 0.70710678118;

this.inlets = 2;
this.outlets = 1;


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
//post('in process args');
if (jsarguments.length>1) {
	//vfrgb[0] = jsarguments[1]/255.;
}

resetCircGrid();


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

			// TODO: Make the object redraw when updating
			var rowIdx = NUM_GRID_ROWS - gridRow - 1;
			var colIdx = gridCol;

			var midiPitch = lowMidiPitch + (rowIdx * NUM_GRID_COLS) + colIdx;
			post('midiPitch: ' + midiPitch);
			var circBtnObj = this.patcher.getnamed('circbtn' + midiPitch);
			post('circBtnObj: ' + circBtnObj);
			circBtnObj.js.updateDisplay();


			printCircGrid();
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


/**
 * Set all elements to EMPTY
 */
function resetCircGrid() {
	for (rowIdx = 0; rowIdx < NUM_GRID_ROWS; rowIdx++) {
		for (colIdx = 0; colIdx < NUM_GRID_COLS; colIdx++) {
			circGrid[rowIdx][colIdx] = CircuitNodeTypes.EMPTY;

			var midiPitch = lowMidiPitch + (rowIdx * NUM_GRID_COLS) + colIdx;
			//post('midiPitch: ' + midiPitch);
			var circBtnObj = this.patcher.getnamed('circbtn' + midiPitch);
			circBtnObj.js.updateDisplay();
		}
	}
	//printCircGrid();
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

		glcolor(0,0,0,1);

		// for (let wireIdx = 0; wireIdx < NUM_GRID_ROWS; wireIdx++) {
		// 	moveto(-0.8, 0);
		// }

		moveto(-2.5, -0.4);
		//font("plex");
		fontsize(12);
		text("Push 2 proxy");

		// draw arc outline
		// glcolor(0,0,0,1);
		// circle(0.8,-90-val*360,-90);

		/*
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

		 */
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
	// if (w!=h) {
	// 	h = w;
	// 	box.size(w,h);
	// }
}
forcesize.local = 1; //private

function onresize(w,h)
{
	forcesize(w,h);
	draw();
	refresh();
}
onresize.local = 1; //private


/**
 * Analyze the circuit grid and return a QuantumCircuit
 */
function createQasmFromGrid() {
	var numCircuitWires = computeNumWires();
	post('numCircuitWires: ' + numCircuitWires);

	var qasmHeaderStr = 'qreg q[' + numCircuitWires + '];' + ' creg c[' + numCircuitWires + '];';

	var qasmGatesStr = '';

	for (var colIdx = 0; colIdx < NUM_GRID_COLS; colIdx++) {
		for (var rowIdx = 0; rowIdx < numCircuitWires; rowIdx++) {
			qasmGatesStr = addGateFromGrid(qasmGatesStr, rowIdx, colIdx);
		}
	}

	// If circuit is empty, add an identity gate
	if (qasmGatesStr.trim().length == 0) {
		qasmGatesStr = ' id q[0];'
	}

	qasm = qasmHeaderStr + qasmGatesStr;

	post('\nqasm: ' + qasm);

	// Send message to outlet
  outlet(0, 'svsim', qasm);

	// var statevector = simulate(qc, 0, 'statevector');
	// post('\n');
	// post('statevector: ' + statevector);
}


/**
 * Creates a quantum gate from an element in the circuit grid
 * and adds it to the supplied QuantumCircuit instance
 * // TODO: Support CNOT gates
 */
function addGateFromGrid(qasmStr, gridRow, gridCol) {
	var circNodeType = circGrid[gridRow][gridCol];

	if (circNodeType == CircuitNodeTypes.H) {
		qasmStr += ' h q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.X) {
		qasmStr += ' x q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.Z) {
		qasmStr += ' z q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.S) {
		qasmStr += ' s q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.SDG) {
		qasmStr += ' sdg q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.T) {
		qasmStr += ' t q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.TDG) {
		qasmStr += ' tdg q[' + gridRow + '];';
	}

	return qasmStr;
}
