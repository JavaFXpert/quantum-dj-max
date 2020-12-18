/**
 * Quantum DJ device user interface
 */
var r2 = 0.70710678118;

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

var curCircNodeType = CircuitNodeTypes.EMPTY;

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

	post('numWires: ' + numWires);
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
post('in process args');
if (jsarguments.length>1) {
	//vfrgb[0] = jsarguments[1]/255.;
}

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
			printCircGrid();
			createQuantumCircuitFromGrid();

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
		}
	}
	printCircGrid();
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
		circle(0.5);

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


/**
 * Analyze the circuit grid and return a QuantumCircuit
 */
function createQuantumCircuitFromGrid() {
	var numCircuitWires = computeNumWires();
	post('numCircuitWires: ' + numCircuitWires);
	var qc = new QuantumCircuit(numCircuitWires, numCircuitWires);

	for (var colIdx = 0; colIdx < NUM_GRID_COLS; colIdx++) {
		for (var rowIdx = 0; rowIdx < numCircuitWires; rowIdx++) {
			addGateFromGrid(qc, rowIdx, colIdx);
		}
	}

	var statevector = simulate(qc, 0, 'statevector');
	post('\n');
	post('statevector: ' + statevector);
}


/**
 * Creates a quantum gate from an element in the circuit grid
 * and adds it to the supplied QuantumCircuit instance
 * // TODO: Support CNOT gates
 */
function addGateFromGrid(quantumCircuit, gridRow, gridCol) {
	var circNodeType = circGrid[gridRow][gridCol];

	if (circNodeType == CircuitNodeTypes.H) {
		quantumCircuit.h(gridRow);
	}
	else if (circNodeType == CircuitNodeTypes.X) {
		quantumCircuit.x(gridRow);
	}
	else if (circNodeType == CircuitNodeTypes.Z) {
		quantumCircuit.z(gridRow);
	}
	else if (circNodeType == CircuitNodeTypes.S) {
		quantumCircuit.s(gridRow);
	}
	else if (circNodeType == CircuitNodeTypes.SDG) {
		quantumCircuit.sdg(gridRow);
	}
	else if (circNodeType == CircuitNodeTypes.T) {
		quantumCircuit.t(gridRow);
	}
	else if (circNodeType == CircuitNodeTypes.TDG) {
		quantumCircuit.tdg(gridRow);
	}

	return quantumCircuit;
}


// This is a JavaScript version of Qiskit. For the full version, see qiskit.org.
// It has many more features, and access to real quantum computers.
function QuantumCircuit(n, m) {
	this.numQubits = n;
	this.numClbits = m;
	this.data = [];
}
(QuantumCircuit.prototype).x = function (q) {
	this.data.push(['x', q]);
	return this;
};
(QuantumCircuit.prototype).rx = function(theta, q) {
	this.data.push(['rx', theta, q]);
	return this;
};
(QuantumCircuit.prototype).h = function(q) {
	this.data.push(['h', q]);
	return this;
};
(QuantumCircuit.prototype).cx = function(s, t) {
	this.data.push(['cx', s, t]);
	return this;
};
(QuantumCircuit.prototype).rz = function(theta, q) {
	this.h(q);
	this.rx(theta, q);
	this.h(q);
	return this;
};
(QuantumCircuit.prototype).ry = function(theta, q) {
	this.rx(Math.PI / 2, q);
	this.rz(theta, q);
	this.rx(-Math.PI / 2, q);
	return this;
};
(QuantumCircuit.prototype).z = function(q) {
	this.rz(Math.PI, q);
	return this;
};
(QuantumCircuit.prototype).s = function(q) {
	this.rz(Math.PI / 2, q);
	return this;
};
(QuantumCircuit.prototype).sdg = function(q) {
	this.rz(-Math.PI / 2, q);
	return this;
};
(QuantumCircuit.prototype).t = function(q) {
	this.rz(Math.PI / 4, q);
	return this;
};
(QuantumCircuit.prototype).tdg = function(q) {
	this.rz(-Math.PI / 4, q);
	return this;
};
(QuantumCircuit.prototype).y = function(q) {
	this.rz(Math.PI, q);
	this.x(q);
	return this;
};
(QuantumCircuit.prototype).measure = function(q, b) {
	if (q >= this.numQubits) {
		throw 'Index for qubit out of range.';
	}
	if (b >= this.numClbits) {
		throw 'Index for output bit out of range.';
	}
	this.data.push(['m', q, b]);
	return this;
};
var simulate = function (qc, shots, get) {
	var superpose = function (x, y) {
		var sup = [
			[(x[0] + y[0]) * r2, (x[1] + y[1]) * r2],
			[(x[0] - y[0]) * r2, (x[1] - y[1]) * r2]
		];
		return sup;
	};
	var turn = function(x, y, theta) {
		var trn = [
			[
				x[0] * Math.cos(theta / 2) + y[1] * Math.sin(theta / 2),
				x[1] * Math.cos(theta / 2) - y[0] * Math.sin(theta / 2)
			],
			[
				y[0] * Math.cos(theta / 2) + x[1] * Math.sin(theta / 2),
				y[1] * Math.cos(theta / 2) - x[0] * Math.sin(theta / 2)
			]
		];
		return trn;
	};
	var k = [];
	for (j = 0; j < Math.pow(2, qc.numQubits); j++) {
		k.push([0, 0]);
	}
	k[0] = [1.0, 0.0];
	var outputMap = {};
	for (var idx = 0; idx < qc.data.length; idx++) {
		var gate = qc.data[idx];
		if (gate[0] == 'm') {
			outputMap[gate[2]] = gate[1];
		} else if (gate[0] == "x" || gate[0] == "h" || gate[0] == "rx") {
			var j = gate.slice(-1)[0];
			for (var i0 = 0; i0 < Math.pow(2, j); i0++) {
				for (var i1 = 0; i1 < Math.pow(2, qc.numQubits - j - 1); i1++) {
					var b0 = i0 + Math.pow(2, (j + 1)) * i1;
					var b1 = b0 + Math.pow(2, j);
					if (gate[0] == 'x') {
						var temp0 = k[b0];
						var temp1 = k[b1];
						k[b0] = temp1;
						k[b1] = temp0;
					} else if (gate[0] == 'h') {
						var sup = superpose(k[b0], k[b1]);
						k[b0] = sup[0];
						k[b1] = sup[1];
					} else {
						var theta = gate[1];
						var trn = turn(k[b0], k[b1], theta);
						k[b0] = trn[0];
						k[b1] = trn[1];
					}
				}
			}
		}
		else if (gate[0] == 'cx') {
			var s = gate[1];
			var t = gate[2];
			var l = Math.min(s, t);
			var h = Math.max(s, t);
			for (var i0 = 0; i0 < Math.pow(2, l); i0++) {
				for (var i1 = 0; i1 < Math.pow(2, (h - l - 1)); i1++) {
					for (var i2 = 0; i2 < Math.pow(2, (qc.numQubits - h - 1)); i2++) {
						var b0 = i0 + Math.pow(2, l + 1) * i1 + Math.pow(2, h + 1) * i2 + Math.pow(2, s);
						var b1 = b0 + Math.pow(2, t);
						var tmp0 = k[b0];
						var tmp1 = k[b1];
						k[b0] = tmp1;
						k[b1] = tmp0;
					}
				}
			}
		}
	}
	if (get == 'statevector') {
		return k;
	}
	else {
		var m = [];
		for (var idx = 0; idx < qc.numQubits; idx++) {
			m.push(false);
		}
		for (var i = 0; i < qc.data.length; i++) {
			var gate = qc.data[i];
			for (var j = 0; j < qc.numQubits; j++) {
				if (((gate.slice(-1)[0] == j) && m[j])) {
					throw ('Incorrect or missing measure command.');
				}
				m[j] = (gate[0] == 'm' && gate[1] == j && gate[2] == j);
			}
		}
		var probs = [];
		for (var i = 0; i < k.length; i++) {
			probs.push((Math.pow(k[i][0], 2) + Math.pow(k[i][1], 2)));
		}
		if (get == 'counts' || get == 'memory') {
			var me = [];
			for (var idx = 0; idx < shots; idx++) {
				var cumu = 0.0;
				var un = true;
				var r = Math.random();
				for (var j = 0; j < probs.length; j++) {
					var p = probs[j];
					cumu += p;
					if (r < cumu && un) {
						var bitStr = j.toString(2);
						var padStr = Math.pow(10, qc.numQubits - bitStr.length).toString().substr(1, qc.numQubits);
						var rawOut = padStr + bitStr;
						var outList = [];
						for (var i = 0; i < qc.numClbits; i++) {
							outList.push('0');
						}
						for (var bit in outputMap) {
							outList[qc.numClbits - 1 - bit] =
								rawOut[qc.numQubits - 1 - outputMap[bit]];
						}
						var out = outList.join("");
						me.push(out);
						un = false;
					}
				}
			}
			if (get == 'memory') {
				return m;
			} else {
				var counts = {};
				for (var meIdx = 0; meIdx < me.length; meIdx++) {
					var out = me[meIdx];
					if (counts.hasOwnProperty(out)) {
						counts[out] += 1;
					} else {
						counts[out] = 1;
					}
				}
				return counts;
			}
		}
	}
};

