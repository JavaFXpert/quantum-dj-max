/**
 * Quantum DJ device circuit pad that may be used when
 * a Push 2 device is not connected.
 */
include('common.js');

this.inlets = 2;
this.outlets = 1;

var curCircNodeType = CircuitNodeTypes.EMPTY;

var NUM_GRID_ROWS = 8;
var NUM_GRID_COLS = 5;

var lowMidiPitch = 36;
var highMidiPitch = NUM_GRID_ROWS * NUM_GRID_COLS + lowMidiPitch - 1;

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
var last_x = 0;
var last_y = 0;

resetCircGrid();

draw();
refresh();


function list(lst)
{
	if (inlet == 0) {
		setCircGridGate(arguments);
	}
	else if (inlet == 1) {
		setCurCircNodeType(arguments);
	}
}


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

	return numWires;
}


/**
 * Set all elements to EMPTY
 */
function resetCircGrid() {
	for (rowIdx = 0; rowIdx < NUM_GRID_ROWS; rowIdx++) {
		for (colIdx = 0; colIdx < NUM_GRID_COLS; colIdx++) {
			circGrid[rowIdx][colIdx] = CircuitNodeTypes.EMPTY;

			informCircuitBtn(rowIdx, colIdx);
		}
	}
	//printCircGrid();
}

/**
 * Ask the relevant circuit button to ascertain and update its state
 *
 * @param rowIdx Zero-based row number on circuit grid
 * @param colIdx Zero-based column number on circuit grid
 */
function informCircuitBtn(gridRowIdx, gridColIdx) {
	var midiPitch = lowMidiPitch + (gridRowIdx * NUM_GRID_COLS) + gridColIdx;
	var circBtnObj = this.patcher.getnamed('circbtn' + midiPitch);
	circBtnObj.js.updateDisplay();
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

			var rowIdx = NUM_GRID_ROWS - gridRow - 1;
			var colIdx = gridCol;

			informCircuitBtn(rowIdx, colIdx);

			// printCircGrid();
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

		glcolor(0, 0, 0, 1);

		moveto(-2.5, -0.4);
		fontsize(12);
		text("Push 2 proxy");
	}
}


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

	// Send message to outlet
  outlet(0, 'svsim', qasm);
}


/**
 * Creates a quantum gate from an element in the circuit grid
 * and adds it to the supplied QuantumCircuit instance
 * // TODO: Support CNOT and some other gates
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
