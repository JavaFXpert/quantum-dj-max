/*
 * Copyright 2021 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * Quantum DJ device circuit pad that may be used even when
 * a Push 2 device is not connected.
 *
 * TODO: Modify resolution everywhere to pi/8
 *  - Change NUM_PITCHES to 16
 *  - Add constants and rotations
 *  - Identify color scheme that accommodate pi/8
 *
 * TODO: Inquire surface number for Push
 * TODO: Replace rx and crx with p and cp
 */
include('common.js');

// Inlet 0 receives note messages that include velocity.
// Inlet 1 receives bang message to update clips
// Inlet 2 receives gate rotation messages
this.inlets = 3;

// Outlet 0 sends message to a simulator with generated QASM
// Outlet 1 sends messages to the midi clips list box
// Outlet 2 sends messages the clip selector dial
// Outlet 3 sends messages the gate rotator dial
this.outlets = 4;


// Flag that indicates whether the currently displayed pads/notes
// are dirty.
var padNoteNamesDirty = true;


// Flag that tracks whether the circuit should be cleared
// when the CircuitNodeTypes.EMPTY key is net pressed
var clearCircuitWhenEmptyKeyNextPressed = false;

var curCircNodeType = CircuitNodeTypes.H;

var highMidiPitch = (NUM_GRID_ROWS - 1) * CONTR_MAT_COLS + NUM_GRID_COLS + LOW_MIDI_PITCH - 1;
//post('highMidiPitch: ' + highMidiPitch);

// TODO: Allocate the array and call refreshPadNoteNames method?
var padNoteNames = [];
refreshPadNoteNames();


// TODO: Dynamically initialize this array
var circGrid = [
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1]
];


var gateGrid = [
	[ 8, 72],
	[38, 74],
	[58, 78],
	[11, 82],
	[-1, 84],
	[9, -1],
	[60, -1],
	[14, -1]
];


// Currently selected row/column on grid
var selCircGridRow = -1;
var selCircGridCol = -1;

// Associates clip name to path
var clipsPaths = [];


// Tracks number of consecutive QFT gates in a column
var numConsecutiveQftRowsInCol = 0;


function bang() {
	if (inlet == 1) {
		// bang received to refresh list of clips
		populateMidiClipsList();
	}
}


function msg_int(val) {
	if (inlet == 2) {
		var piOver8Rotation = val;
		post('\npiOver8Rotation: ' + piOver8Rotation);

		if (selCircGridRow >= 0 &&
			selCircGridRow < NUM_GRID_ROWS &&
			selCircGridCol >= 0 &&
			selCircGridCol < NUM_GRID_COLS) {

			var selNodeType = circGrid[selCircGridRow][selCircGridCol];
			var newNodeType = CircuitNodeTypes.EMPTY;

			if ((selNodeType >= CircuitNodeTypes.RX_0 && selNodeType <= CircuitNodeTypes.RX_15) ||
				selNodeType == CircuitNodeTypes.CTRL_X) {

				newNodeType = CircuitNodeTypes.RX_0 + piOver8Rotation;
			}
			else if (selNodeType >= CircuitNodeTypes.RY_0 &&
				selNodeType <= CircuitNodeTypes.RY_15) {

				newNodeType = CircuitNodeTypes.RY_0 + piOver8Rotation;
			}
			else if (selNodeType >= CircuitNodeTypes.RZ_0 &&
				selNodeType <= CircuitNodeTypes.RZ_15) {

				newNodeType = CircuitNodeTypes.RZ_0 + piOver8Rotation;
			}

			if (newNodeType != CircuitNodeTypes.EMPTY) {
				circGrid[selCircGridRow][selCircGridCol] = newNodeType;
				informCircuitBtn(selCircGridRow, selCircGridCol);
				createQasmFromGrid();
			}
		}
	}
}



function getPathByClipNameIdx(clipNameIdx) {
	//post('In getPathByClipNameIdx, clipNameIdx: ' + clipNameIdx);
	if (clipNameIdx < clipsPaths.length) {
		var caratPos = clipsPaths[clipNameIdx].indexOf('^');
		if (caratPos > 0) {
			var clipPath = clipsPaths[clipNameIdx].substring(caratPos + 1);
			return clipPath;
		}
		else {
			return "";
		}
	}
	else {
		return "";
	}
}


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
		//createQasmFromGrid();
	}
}


/**
 * Set all elements to EMPTY
 */
function resetCircGrid() {
	for (rowIdx = 0; rowIdx < NUM_GRID_ROWS; rowIdx++) {
		for (colIdx = 0; colIdx < NUM_GRID_COLS; colIdx++) {
			circGrid[rowIdx][colIdx] = CircuitNodeTypes.EMPTY;

			selCircGridRow = -1;
			selCircGridCol = -1;

			informCircuitBtn(rowIdx, colIdx);
		}
	}
}


/**
 * Given an array with midi pitch and velocity,
 * populates the corresponding circuit grid element
 *
 * @param notePitchVelocity Array containing midi pitch and velocity
 */
function setCircGridGate(notePitchVelocity) {
	post('\nIn TEMP setCircGridGate');
	//post('\notePitchVelocity[0]: ' + notePitchVelocity[0]);
	//post('notePitchVelocity[1]: ' + notePitchVelocity[1]);
	if (notePitchVelocity.length >= 2) {
		var pitch = notePitchVelocity[0];
		var velocity = notePitchVelocity[1];

		//post('\nA pitch: ' + pitch);

		// Only process noteup events (when user releases controller button)
		if (velocity > 0 ) {
			return;
		}

		//post('\nB pitch: ' + pitch);

		if (pitch >= LOW_MIDI_PITCH && pitch <= highMidiPitch + 4) {
			var gridRow = Math.floor((highMidiPitch - pitch) / CONTR_MAT_COLS);
			var gridCol = (highMidiPitch - pitch) % CONTR_MAT_COLS;

			//post('\npitch: ' + pitch);
			//post('\ngridRow: ' + gridRow);
			//post('\ngridCol: ' + gridCol);

			if (gridCol >= 0 && gridCol < NUM_GRID_COLS) {

				gridCol = NUM_GRID_COLS - gridCol - 1;
				//post('\nB gridRow: ' + gridRow);
				//post('\nB gridCol: ' + gridCol);
				// User is placing on the circuit
				clearCircuitWhenEmptyKeyNextPressed = false;

				if (circGrid[gridRow][gridCol] == CircuitNodeTypes.EMPTY ||
					curCircNodeType == CircuitNodeTypes.EMPTY) {
					circGrid[gridRow][gridCol] = curCircNodeType;
				}
				else {
					post('\nGate already present');
				}

				selCircGridRow = gridRow;
				selCircGridCol = gridCol;

				var newPiOver8Rotation = 0;
				if (circGrid[gridRow][gridCol] >= CircuitNodeTypes.RX_0 &&
					circGrid[gridRow][gridCol] <= CircuitNodeTypes.RX_15) {

					newPiOver8Rotation = circGrid[gridRow][gridCol] - CircuitNodeTypes.RX_0;
				}
				else if (circGrid[gridRow][gridCol] >= CircuitNodeTypes.RY_0 &&
					circGrid[gridRow][gridCol] <= CircuitNodeTypes.RY_15) {

					newPiOver8Rotation = circGrid[gridRow][gridCol] - CircuitNodeTypes.RY_0;
				}
				else if (circGrid[gridRow][gridCol] >= CircuitNodeTypes.RZ_0 &&
					circGrid[gridRow][gridCol] <= CircuitNodeTypes.RZ_15) {

					newPiOver8Rotation = circGrid[gridRow][gridCol] - CircuitNodeTypes.RZ_0;
				}
				// Set the current rotation on the gate rotator dial
				outlet(3, 'int', newPiOver8Rotation);

				informCircuitBtn(gridRow, gridCol);
				createQasmFromGrid();
			}
			else {
				//post('\nin else, pitch: ' + pitch);
				// User is choosing a gate
			  if (pitch == 43) {
					curCircNodeType = CircuitNodeTypes.EMPTY;
					if (clearCircuitWhenEmptyKeyNextPressed){
						resetCircGrid();
						createQasmFromGrid();
						clearCircuitWhenEmptyKeyNextPressed = false;
					}
					else {
						clearCircuitWhenEmptyKeyNextPressed = true;
					}
				}
				else {
					clearCircuitWhenEmptyKeyNextPressed = false;

					if (pitch == 98) {
						curCircNodeType = CircuitNodeTypes.H;
					}
					else if (pitch == 99) {
						curCircNodeType = CircuitNodeTypes.RZ_2;
					}

					else if (pitch == 90) {
						curCircNodeType = CircuitNodeTypes.RX_8;
					}
					else if (pitch == 91) {
						curCircNodeType = CircuitNodeTypes.RZ_4;
					}

					else if (pitch == 82) {
						curCircNodeType = CircuitNodeTypes.RY_8;
					}
					else if (pitch == 83) {
						curCircNodeType = CircuitNodeTypes.RZ_8;
					}

					else if (pitch == 74) {
						curCircNodeType = CircuitNodeTypes.CTRL;
					}
					else if (pitch == 75) {
						curCircNodeType = CircuitNodeTypes.RZ_12;
					}

					else if (pitch == 67) {
						curCircNodeType = CircuitNodeTypes.RZ_14;
					}

					else if (pitch == 58) {
						curCircNodeType = CircuitNodeTypes.SWAP;
					}

					else if (pitch == 50) {
						curCircNodeType = CircuitNodeTypes.QFT;
					}

					else if (pitch == 42) {
						curCircNodeType = CircuitNodeTypes.IDEN;
					}
				}
				refreshControllerPads();
				//post('\nIn setCircGridGate, curCircNodeType is now ' + curCircNodeType);
			}
		}
	}
	else {
		post('Unexpected notePitchVelocity.length: ' + notePitchVelocity.length);
	}
}


/**
 * Analyze the circuit grid and create QASM code, sending
 * a statevector simulator message to an outlet.
 */
function createQasmFromGrid() {
	var numCircuitWires = computeNumWires();
	var qasmHeaderStr = 'qreg q[' + numCircuitWires + '];' + ' creg c[' + numCircuitWires + '];';
	var qasmGatesStr = '';

	for (var colIdx = 0; colIdx < NUM_GRID_COLS; colIdx++) {
		numConsecutiveQftRowsInCol = 0;
		for (var rowIdx = 0; rowIdx < numCircuitWires; rowIdx++) {
			qasmGatesStr = addGateFromGrid(qasmGatesStr, rowIdx, colIdx);
		}
	}

	// If circuit is empty, add an identity gate
	if (qasmGatesStr.trim().length == 0) {
		qasmGatesStr = ' id q[0];'
	}

	qasm = qasmHeaderStr + qasmGatesStr;
  //post('\nqasm: ' + qasm);

	refreshControllerPads();

	// Send statevector simulator message with QASM to outlet
  outlet(0, 'svsim', qasm);
}


/**
 * Creates a quantum gate from an element in the circuit grid
 * and adds it to the supplied QuantumCircuit instance
 * TODO: Support additional CNOT-type gates, including with ANTI_CTRL,
 *       and some other gates
 *
 * @param qasmStr Current QASM string
 * @param gridRow Zero-based row number on circuit grid
 * @param gridCol Zero-based column number on circuit grid
 * @returns QASM string for the gate
 */
function addGateFromGrid(qasmStr, gridRow, gridCol) {
	//post('\nIn addGateFromGrid, gridRow: ' + gridRow + ', gridCol: ' + gridCol);
	var circNodeType = circGrid[gridRow][gridCol];

	//post('\n  circNodeType: ' + circNodeType);
	//post('\n  numConsecutiveQftRowsInCol: ' + numConsecutiveQftRowsInCol);

	// TODO: DRY
  if (circNodeType == CircuitNodeTypes.QFT) {
		numConsecutiveQftRowsInCol++;
		//post('\n      numConsecutiveQftRowsInCol now: ' + numConsecutiveQftRowsInCol);

		if (gridRow + 1 == computeNumWires()) {
			qasmStr += constructQftCircuit(gridRow + 1 - numConsecutiveQftRowsInCol,
				numConsecutiveQftRowsInCol);
		}
	}
  else {
  	if (numConsecutiveQftRowsInCol > 0) {
			// One or more previous rows had consecutive QFT gates
			qasmStr += constructQftCircuit(gridRow - numConsecutiveQftRowsInCol, numConsecutiveQftRowsInCol);

			numConsecutiveQftRowsInCol = 0;
		}
	}

	if (circNodeType == CircuitNodeTypes.H) {
		qasmStr += ' h q[' + gridRow + '];';
	}

	// else if (circNodeType == CircuitNodeTypes.RZ_4) {
	// 	qasmStr += ' z q[' + gridRow + '];';
	// }
	// else if (circNodeType == CircuitNodeTypes.RZ_1) {
	// 	qasmStr += ' t q[' + gridRow + '];';
	// }
	// else if (circNodeType == CircuitNodeTypes.RZ_6) {
	// 	qasmStr += ' sdg q[' + gridRow + '];';
	// }
	// else if (circNodeType == CircuitNodeTypes.RZ_2) {
	// 	qasmStr += ' s q[' + gridRow + '];';
	// }
	// else if (circNodeType == CircuitNodeTypes.RZ_7) {
	// 	qasmStr += ' tdg q[' + gridRow + '];';
	// }

	else if (circNodeType == CircuitNodeTypes.RX_0) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_0;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rx(0) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_0;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crx(0) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RX_1) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_1;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rx(pi/8) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_1;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crx(pi/8) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RX_2) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_2;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rx(pi/4) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_2;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crx(pi/4) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RX_3) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_3;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rx(3*pi/8) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_3;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crx(3*pi/8) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RX_4) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_4;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rx(pi/2) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_4;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crx(pi/2) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RX_5) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_5;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rx(5*pi/8) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_5;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crx(5*pi/8) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RX_6) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_6;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rx(3*pi/4) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_6;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crx(3*pi/4) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RX_7) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_7;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rx(7*pi/8) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_7;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crx(7*pi/8) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RX_8 ||
		circNodeType == CircuitNodeTypes.CTRL_X) {
		//post('\nX or CTRL_X circNodeType: ' + circNodeType);
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_8;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' x q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.CTRL_X;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' cx q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RX_9) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_9;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rx(9*pi/8) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_9;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crx(9*pi/8) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RX_10) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_10;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rx(5*pi/4) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_10;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crx(5*pi/4) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RX_11) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_11;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rx(11*pi/8) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_11;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crx(11*pi/8) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RX_12) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_12;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rx(3*pi/2) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_12;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crx(3*pi/2) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RX_13) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_13;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rx(13*pi/8) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_13;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crx(13*pi/8) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RX_14) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_14;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rx(7*pi/4) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_14;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crx(7*pi/4) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RX_15) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_15;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rx(15*pi/8) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RX_15;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crx(15*pi/8) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}

	else if (circNodeType == CircuitNodeTypes.RY_0) {
		qasmStr += ' ry(0) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RY_1) {
		qasmStr += ' ry(pi/8) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RY_2) {
		qasmStr += ' ry(pi/4) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RY_3) {
		qasmStr += ' ry(3*pi/8) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RY_4) {
		qasmStr += ' ry(pi/2) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RY_5) {
		qasmStr += ' ry(5*pi/8) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RY_6) {
		qasmStr += ' ry(3*pi/4) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RY_7) {
		qasmStr += ' ry(7*pi/8) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RY_8) {
		qasmStr += ' ry(pi) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RY_9) {
		qasmStr += ' ry(9*pi/8) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RY_10) {
		qasmStr += ' ry(5*pi/4) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RY_11) {
		qasmStr += ' ry(11*pi/8) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RY_12) {
		qasmStr += ' ry(3*pi/2) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RY_13) {
		qasmStr += ' ry(13*pi/8) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RY_14) {
		qasmStr += ' ry(7*pi/4) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RY_15) {
		qasmStr += ' ry(15*pi/8) q[' + gridRow + '];';
	}

	else if (circNodeType == CircuitNodeTypes.RZ_0) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_0;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rz(0) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_0;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crz(0) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RZ_1) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_1;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rz(pi/8) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_1;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crz(pi/8) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RZ_2) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_2;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rz(pi/4) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_2;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crz(pi/4) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RZ_3) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_3;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rz(3*pi/8) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_3;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crz(3*pi/8) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RZ_4) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_4;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rz(pi/2) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_4;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crz(pi/2) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RZ_5) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_5;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rz(5*pi/8) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_5;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crz(5*pi/8) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RZ_6) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_6;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rz(3*pi/4) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_6;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crz(3*pi/4) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RZ_7) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_7;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rz(7*pi/8) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_7;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crz(7*pi/8) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RZ_8) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_8;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rz(pi) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_8;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crz(pi) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RZ_9) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_9;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rz(9*pi/8) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_9;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crz(9*pi/8) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RZ_10) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_10;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rz(5*pi/4) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_10;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crz(5*pi/4) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RZ_11) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_11;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rz(11*pi/8) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_11;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crz(11*pi/8) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RZ_12) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_12;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rz(3*pi/2) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_12;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crz(3*pi/2) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RZ_13) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_13;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rz(13*pi/8) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_13;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crz(13*pi/8) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RZ_14) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_14;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rz(7*pi/4) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_14;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crz(7*pi/4) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}
	else if (circNodeType == CircuitNodeTypes.RZ_15) {
		var ctrlWireNum = ctrlWireNumInColumn(gridCol);
		if (ctrlWireNum == -1) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_15;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' rz(15*pi/8) q[' + gridRow + '];';
		}
		else {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.RZ_15;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' crz(15*pi/8) q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
		}
	}

	else if (circNodeType == CircuitNodeTypes.SWAP) {
		var otherSwapGateWireNum = swapGateRowInColumn(gridCol, gridRow);
		if (otherSwapGateWireNum != -1 && otherSwapGateWireNum < gridRow) {
			circGrid[gridRow][gridCol] = CircuitNodeTypes.SWAP;
			informCircuitBtn(gridRow, gridCol);
			qasmStr += ' swap q[' + otherSwapGateWireNum + '],' + 'q[' + gridRow + '];';
		}
	}

	return qasmStr;
}


/**
 * Given a grid column, return the row in which a control exists.
 *
 * @return Zero-based row in which a control exists, -1 if not present.
 * @param columnIndex
 */
function ctrlWireNumInColumn(colNum) {
	//post('\nIn ctrlWireNumInColumn, colNum: ' + colNum);
	var ctrlRow = -1;
	for (var rowNum = 0; rowNum < NUM_GRID_ROWS; rowNum++) {
		if (circGrid[rowNum][colNum] == CircuitNodeTypes.CTRL) {
			ctrlRow = rowNum;
			break;
		}
	}
	return ctrlRow;
}


/**
 * Given a grid column, return the row, excluding the current row,
 * in which a swap gate exists.
 *
 * @param colNum
 * @param excludingRow
 * @returns Zero-based row in which a swap gate exists, -1 if not present.
 */
function swapGateRowInColumn(colNum, excludingRow) {
	post('\nIn swapGateRowInColumn, colNum: ' + colNum + ', excludingRow: ' + excludingRow);
	var swapGateRow = -1;
	for (var rowNum = 0; rowNum < NUM_GRID_ROWS; rowNum++) {
		if (rowNum != excludingRow && circGrid[rowNum][colNum] == CircuitNodeTypes.SWAP) {
			swapGateRow = rowNum;
			break;
		}
	}
	return swapGateRow;
}


/**
 * Construct a QFT circuit
 * TODO: Create better algorithm
 *
 * @param wireNum Wire on which first QFT gate was encountered
 * @param numWires Number of wires that QFT will occupy
 * @returns QASM string for QFT gate
 */
function constructQftCircuit(wireNum, numWires) {
	post('\nIn constructQftCircuit, wireNum: ' + wireNum + ', numWires: ' + numWires);
	var qftQasm = '';

	if (numWires == 1) {
		qftQasm += ' h q[' + wireNum + '];';
	}
	else if (numWires == 2) {
		qftQasm += ' swap q[' + wireNum + '],' + 'q[' + (wireNum + 1) + '];';
		qftQasm += ' h q[' + wireNum + '];';
		qftQasm += ' cp(pi/2) q[' + wireNum + '],' + 'q[' + (wireNum + 1) + '];';
		qftQasm += ' h q[' + (wireNum + 1) + '];';
	}
	else if (numWires == 3) {
		qftQasm += ' swap q[' + wireNum + '],' + 'q[' + (wireNum + 2) + '];';
		qftQasm += ' h q[' + wireNum + '];';
		qftQasm += ' cp(pi/2) q[' + wireNum + '],' + 'q[' + (wireNum + 1) + '];';
		qftQasm += ' cp(pi/4) q[' + wireNum + '],' + 'q[' + (wireNum + 2) + '];';
		qftQasm += ' h q[' + (wireNum + 1) + '];';
		qftQasm += ' cp(pi/2) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 2) + '];';
		qftQasm += ' h q[' + (wireNum + 2) + '];';
	}
	else if (numWires == 4) {
		qftQasm += ' swap q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 2) + '];';
		qftQasm += ' swap q[' + wireNum + '],' + 'q[' + (wireNum + 3) + '];';
		qftQasm += ' h q[' + wireNum + '];';
		qftQasm += ' cp(pi/2) q[' + wireNum + '],' + 'q[' + (wireNum + 1) + '];';
		qftQasm += ' cp(pi/4) q[' + wireNum + '],' + 'q[' + (wireNum + 2) + '];';
		qftQasm += ' h q[' + (wireNum + 1) + '];';
		qftQasm += ' cp(pi/8) q[' + (wireNum) + '],' + 'q[' + (wireNum + 3) + '];';
		qftQasm += ' cp(pi/2) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 2) + '];';
		qftQasm += ' cp(pi/4) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 3) + '];';
		qftQasm += ' h q[' + (wireNum + 2) + '];';
		qftQasm += ' cp(pi/2) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 3) + '];';
		qftQasm += ' h q[' + (wireNum + 3) + '];';
	}
	else if (numWires == 5) {
		qftQasm += ' swap q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 3) + '];';
		qftQasm += ' swap q[' + wireNum + '],' + 'q[' + (wireNum + 4) + '];';
		qftQasm += ' h q[' + wireNum + '];';
		qftQasm += ' cp(pi/2) q[' + wireNum + '],' + 'q[' + (wireNum + 1) + '];';
		qftQasm += ' cp(pi/4) q[' + wireNum + '],' + 'q[' + (wireNum + 2) + '];';
		qftQasm += ' h q[' + (wireNum + 1) + '];';
		qftQasm += ' cp(pi/8) q[' + (wireNum) + '],' + 'q[' + (wireNum + 3) + '];';
		qftQasm += ' cp(pi/2) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 2) + '];';
		qftQasm += ' cp(pi/16) q[' + (wireNum) + '],' + 'q[' + (wireNum + 4) + '];';
		qftQasm += ' cp(pi/4) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 3) + '];';
		qftQasm += ' h q[' + (wireNum + 2) + '];';
		qftQasm += ' cp(pi/8) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 4) + '];';
		qftQasm += ' cp(pi/2) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 3) + '];';
		qftQasm += ' cp(pi/4) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 4) + '];';
		qftQasm += ' h q[' + (wireNum + 3) + '];';
		qftQasm += ' cp(pi/2) q[' + (wireNum + 3) + '],' + 'q[' + (wireNum + 4) + '];';
		qftQasm += ' h q[' + (wireNum + 4) + '];';
	}
	else if (numWires == 6) {
		qftQasm += ' swap q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 3) + '];';
		qftQasm += ' swap q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 4) + '];';
		qftQasm += ' swap q[' + wireNum + '],' + 'q[' + (wireNum + 5) + '];';
		qftQasm += ' h q[' + wireNum + '];';
		qftQasm += ' cp(pi/2) q[' + wireNum + '],' + 'q[' + (wireNum + 1) + '];';
		qftQasm += ' cp(pi/4) q[' + wireNum + '],' + 'q[' + (wireNum + 2) + '];';
		qftQasm += ' h q[' + (wireNum + 1) + '];';
		qftQasm += ' cp(pi/8) q[' + (wireNum) + '],' + 'q[' + (wireNum + 3) + '];';
		qftQasm += ' cp(pi/2) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 2) + '];';
		qftQasm += ' cp(pi/16) q[' + (wireNum) + '],' + 'q[' + (wireNum + 4) + '];';
		qftQasm += ' cp(pi/4) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 3) + '];';
		qftQasm += ' h q[' + (wireNum + 2) + '];';
		qftQasm += ' cp(pi/32) q[' + (wireNum + 0) + '],' + 'q[' + (wireNum + 5) + '];';
		qftQasm += ' cp(pi/8) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 4) + '];';
		qftQasm += ' cp(pi/2) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 3) + '];';
		qftQasm += ' cp(pi/16) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 4) + '];';
		qftQasm += ' cp(pi/4) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 4) + '];';
		qftQasm += ' h q[' + (wireNum + 3) + '];';
		qftQasm += ' cp(pi/8) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 5) + '];';
		qftQasm += ' cp(pi/2) q[' + (wireNum + 3) + '],' + 'q[' + (wireNum + 4) + '];';
		qftQasm += ' cp(pi/4) q[' + (wireNum + 3) + '],' + 'q[' + (wireNum + 5) + '];';
		qftQasm += ' h q[' + (wireNum + 4) + '];';
		qftQasm += ' cp(pi/2) q[' + (wireNum + 4) + '],' + 'q[' + (wireNum + 5) + '];';
		qftQasm += ' h q[' + (wireNum + 5) + '];';
	}
	else if (numWires == 7) {
		qftQasm += ' swap q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 4) + '];';
		qftQasm += ' swap q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 5) + '];';
		qftQasm += ' swap q[' + wireNum + '],' + 'q[' + (wireNum + 6) + '];';
		qftQasm += ' h q[' + wireNum + '];';
		qftQasm += ' cp(pi/2) q[' + wireNum + '],' + 'q[' + (wireNum + 1) + '];';
		qftQasm += ' cp(pi/4) q[' + wireNum + '],' + 'q[' + (wireNum + 2) + '];';
		qftQasm += ' h q[' + (wireNum + 1) + '];';
		qftQasm += ' cp(pi/8) q[' + (wireNum) + '],' + 'q[' + (wireNum + 3) + '];';
		qftQasm += ' cp(pi/2) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 2) + '];';
		qftQasm += ' cp(pi/16) q[' + (wireNum) + '],' + 'q[' + (wireNum + 4) + '];';
		qftQasm += ' cp(pi/4) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 3) + '];';
		qftQasm += ' h q[' + (wireNum + 2) + '];';
		qftQasm += ' cp(pi/32) q[' + (wireNum + 0) + '],' + 'q[' + (wireNum + 5) + '];';
		qftQasm += ' cp(pi/8) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 4) + '];';
		qftQasm += ' cp(pi/2) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 3) + '];';
		qftQasm += ' cp(pi/64) q[' + (wireNum + 0) + '],' + 'q[' + (wireNum + 6) + '];';
		qftQasm += ' cp(pi/16) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 5) + '];';
		qftQasm += ' cp(pi/4) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 4) + '];';
		qftQasm += ' h q[' + (wireNum + 3) + '];';
		qftQasm += ' cp(pi/32) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 6) + '];';
		qftQasm += ' cp(pi/8) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 5) + '];';
		qftQasm += ' cp(pi/2) q[' + (wireNum + 3) + '],' + 'q[' + (wireNum + 4) + '];';
		qftQasm += ' cp(pi/16) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 6) + '];';
		qftQasm += ' cp(pi/4) q[' + (wireNum + 3) + '],' + 'q[' + (wireNum + 5) + '];';
		qftQasm += ' h q[' + (wireNum + 4) + '];';
		qftQasm += ' cp(pi/8) q[' + (wireNum + 3) + '],' + 'q[' + (wireNum + 6) + '];';
		qftQasm += ' cp(pi/2) q[' + (wireNum + 4) + '],' + 'q[' + (wireNum + 5) + '];';
		qftQasm += ' cp(pi/4) q[' + (wireNum + 4) + '],' + 'q[' + (wireNum + 6) + '];';
		qftQasm += ' h q[' + (wireNum + 5) + '];';
		qftQasm += ' cp(pi/2) q[' + (wireNum + 5) + '],' + 'q[' + (wireNum + 6) + '];';
		qftQasm += ' h q[' + (wireNum + 6) + '];';
	}
	else if (numWires == 8) {
		qftQasm += ' swap q[' + (wireNum + 3) + '],' + 'q[' + (wireNum + 4) + '];';
		qftQasm += ' swap q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 5) + '];';
		qftQasm += ' swap q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 6) + '];';
		qftQasm += ' swap q[' + wireNum + '],' + 'q[' + (wireNum + 7) + '];';
		qftQasm += ' h q[' + wireNum + '];';
		qftQasm += ' cp(pi/2) q[' + wireNum + '],' + 'q[' + (wireNum + 1) + '];';
		qftQasm += ' cp(pi/4) q[' + wireNum + '],' + 'q[' + (wireNum + 2) + '];';
		qftQasm += ' h q[' + (wireNum + 1) + '];';
		qftQasm += ' cp(pi/8) q[' + (wireNum) + '],' + 'q[' + (wireNum + 3) + '];';
		qftQasm += ' cp(pi/2) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 2) + '];';
		qftQasm += ' cp(pi/16) q[' + (wireNum) + '],' + 'q[' + (wireNum + 4) + '];';
		qftQasm += ' cp(pi/4) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 3) + '];';
		qftQasm += ' h q[' + (wireNum + 2) + '];';
		qftQasm += ' cp(pi/32) q[' + (wireNum + 0) + '],' + 'q[' + (wireNum + 5) + '];';
		qftQasm += ' cp(pi/8) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 4) + '];';
		qftQasm += ' cp(pi/2) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 3) + '];';
		qftQasm += ' cp(pi/64) q[' + (wireNum + 0) + '],' + 'q[' + (wireNum + 6) + '];';
		qftQasm += ' cp(pi/16) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 5) + '];';
		qftQasm += ' cp(pi/4) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 4) + '];';
		qftQasm += ' h q[' + (wireNum + 3) + '];';
		qftQasm += ' cp(pi/128) q[' + (wireNum + 0) + '],' + 'q[' + (wireNum + 7) + '];';
		qftQasm += ' cp(pi/32) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 6) + '];';
		qftQasm += ' cp(pi/8) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 5) + '];';
		qftQasm += ' cp(pi/2) q[' + (wireNum + 3) + '],' + 'q[' + (wireNum + 4) + '];';
		qftQasm += ' cp(pi/64) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 7) + '];';
		qftQasm += ' cp(pi/16) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 6) + '];';
		qftQasm += ' cp(pi/4) q[' + (wireNum + 3) + '],' + 'q[' + (wireNum + 5) + '];';
		qftQasm += ' h q[' + (wireNum + 4) + '];';
		qftQasm += ' cp(pi/32) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 7) + '];';
		qftQasm += ' cp(pi/8) q[' + (wireNum + 3) + '],' + 'q[' + (wireNum + 6) + '];';
		qftQasm += ' cp(pi/2) q[' + (wireNum + 4) + '],' + 'q[' + (wireNum + 5) + '];';
		qftQasm += ' cp(pi/16) q[' + (wireNum + 3) + '],' + 'q[' + (wireNum + 7) + '];';
		qftQasm += ' cp(pi/4) q[' + (wireNum + 4) + '],' + 'q[' + (wireNum + 6) + '];';
		qftQasm += ' h q[' + (wireNum + 5) + '];';
		qftQasm += ' cp(pi/8) q[' + (wireNum + 4) + '],' + 'q[' + (wireNum + 7) + '];';
		qftQasm += ' cp(pi/2) q[' + (wireNum + 5) + '],' + 'q[' + (wireNum + 6) + '];';
		qftQasm += ' cp(pi/4) q[' + (wireNum + 5) + '],' + 'q[' + (wireNum + 7) + '];';
		qftQasm += ' h q[' + (wireNum + 6) + '];';
		qftQasm += ' cp(pi/2) q[' + (wireNum + 6) + '],' + 'q[' + (wireNum + 7) + '];';
		qftQasm += ' h q[' + (wireNum + 7) + '];';
	}

	return qftQasm;
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

	return Math.max(numWires, MIN_CIRCUIT_WIRES);
}


/**
 * Ask the relevant circuit button to ascertain and update its state
 *
 * @param rowIdx Zero-based row number on circuit grid
 * @param colIdx Zero-based column number on circuit grid
 */
function informCircuitBtn(gridRowIdx, gridColIdx) {
	var midiPitch = LOW_MIDI_PITCH + ((NUM_GRID_ROWS - gridRowIdx - 1) * CONTR_MAT_COLS) + gridColIdx;
	//post('\n----In informCircuitBtn, midiPitch: ' + midiPitch);
	//post('\nIn informCircuitBtn, gridRowIdx: ' + gridRowIdx);
	//post('\nIn informCircuitBtn, gridColIdx: ' + gridColIdx);
	var circBtnObj = this.patcher.getnamed('circbtn' + midiPitch);
	circBtnObj.js.updateDisplay(circGrid[gridRowIdx][gridColIdx]);
}


/**
 * Output the circuit grid to the console for debug purposes
 */
function printCircGrid() {
	//post('\n');
	for (rowIdx = 0; rowIdx < NUM_GRID_ROWS; rowIdx++) {
		for (colIdx = 0; colIdx < NUM_GRID_COLS; colIdx++) {
			//post(circGrid[rowIdx][colIdx] + ' ');
		}
		//post('\n');
	}
}


/**
 * Draw this component, which is currently just a label. The rest of
 * the UI consists of components placed in the Max UI designer tool.
 * TODO: Ascertain whether there is a better UI pattern to use.
 */
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


function populateMidiClipsList() {
	// Send midi clips names to outlet
	outlet(1, 'clear');
	clipsPaths = [];
	var clipsNames = [];

	var live_set = new LiveAPI('live_set');
	var numTracks = live_set.getcount('tracks');

	for (var trackIdx = 0; trackIdx < numTracks; trackIdx++ ) {
		var track = new LiveAPI('live_set tracks ' + trackIdx);
		//post('\ntrack ' + trackIdx + ' id: ' + track.id);

		if (track.get('has_midi_input')) {
			var numClipSlots = track.getcount('clip_slots');

			for (var clipSlotIdx = 0; clipSlotIdx < numClipSlots; clipSlotIdx++) {
				var clipSlot = new LiveAPI('live_set tracks ' + trackIdx + ' clip_slots ' + clipSlotIdx);
				//post('\nclipSlot ' + clipSlotIdx + ' id: ' + clipSlot.id);

				if (clipSlot.get('has_clip') != 0) {
					var clip = new LiveAPI('live_set tracks ' + trackIdx + ' clip_slots ' + clipSlotIdx + ' clip');
					//post('\nclip id: ' + clip.id);

					var clipName = clip.getstring('name');
					if (clipName.length > 2) {
						if (clipName.substring(0, 1) == '\"') {
							clipName = clipName.substring(1, clipName.length - 1);
						}
						//post('\nclipName: ' + clipName);
						//post('\nclip path: ' + clip.unquotedpath);

						outlet(1, 'append', clipName);
						clipsPaths.push(clipName + '^' + clip.unquotedpath);
						clipsNames.push(clipName);

						//post('\nclipsIds: ' + clipsId[0]);
						//post('\nSecond slot path: ' + getPathByClipNameIdx(1));
					}
				}
			}
		}
	}

	// TODO: Move
	var clipSelectDial = this.patcher.getnamed('clip_select');
	//clipSelectDial.setattr('_parameter_steps', clipsNames.length);

	clipSelectDial.setattr('_parameter_range', clipsNames);

	//post('\nclipSelectDial: ' + clipSelectDial.getattrnames());
	//post('\n_parameter_range: ' + clipSelectDial.getattr('_parameter_range'));

	// Zero the clip selector dial
	outlet(2, 'int', 0);
}


/**
 * Given a track path, pad/note names in display
 * @param trackPath
 */
function populatePadNoteNames(trackPath, pitchTransformIdx, transposeSemitones) {
	if (padNoteNamesDirty) {
		padNoteNamesDirty = false;
		//post('\nIn populatePadNoteNames, trackPath: ' + trackPath);
		var track = new LiveAPI(trackPath);

		if (track.get('has_midi_input')) {
			var textbox = this.patcher.getnamed('pad_note[0]');
			//post('\ntextbox: ' + textbox.getattr('text'));

			var device = new LiveAPI(trackPath + ' devices ' + 0);
			//post("\ndevice name: " + device.get('name'));

			var canHaveDrumPads = device.get('can_have_drum_pads') == 1;
			//post("\ndevice can_have_drum_pads: " + canHaveDrumPads);

			refreshPadNoteNames();

			if (canHaveDrumPads) {
				for (var drumPadIdx = 0; drumPadIdx < MAX_DRUMPADS; drumPadIdx++) {
					var drumPad =
						new LiveAPI(trackPath + ' devices ' + 0 + ' drum_pads ' + (LOW_DRUMPAD_MIDI + drumPadIdx));
					//post("\ndrumPad name: " + drumPad.getstring('name'));
					padNoteNames[drumPadIdx] = drumPad.getstring('name');
				}
			}
			//post('\npadNoteNames: ' + padNoteNames);

			for (var midiPitchIdx = 0; midiPitchIdx < NUM_PITCHES; midiPitchIdx++) {
				var noteName = '';
				if (pitchTransformIdx == 0) {
					noteName = padNoteNames[midiPitchIdx];
					//post('\nPad noteName: ' + noteName);
				} else {
					noteName = padNoteNames[pitchIdxToDiatonic(midiPitchIdx, pitchTransformIdx, transposeSemitones)];
					//post('\nDiatonic noteName: ' + noteName);
				}

				// Update textbox
				textbox = this.patcher.getnamed('pad_note[' + midiPitchIdx + ']');
				textbox.setattr('text', removeQuotes(noteName));
			}
		}
	}
}

function refreshPadNoteNames() {
	padNoteNames = [];
	for (var midiNum = 0; midiNum <= 127; midiNum++) {
		padNoteNames.push(midi2NoteName(midiNum));
	}
}


function refreshControllerPads() {
	var controlSurface = new LiveAPI('control_surfaces 1'); //TODO: Inquire surface number
	//var controlNames = controlSurface.call('get_control_names');
	controlSurface.call('grab_midi');
	for (rowIdx = 0; rowIdx < NUM_GRID_ROWS; rowIdx++) {
		for (colIdx = 0; colIdx < NUM_GRID_COLS; colIdx++) {
			var midiPitch = LOW_MIDI_PITCH + ((NUM_GRID_ROWS - rowIdx - 1) * CONTR_MAT_COLS) + colIdx;
			var padColor = circNodeType2Color(circGrid[rowIdx][colIdx]);
			controlSurface.call('send_midi', 144, midiPitch, padColor);
		}
	}

	// Refresh gate pads
	for (rowIdx = 0; rowIdx < CONTR_MAT_ROWS; rowIdx++) {
		for (colIdx = 0; colIdx < NUM_GATE_COLS; colIdx++) {
			var midiPitch = LOW_MIDI_PITCH + ((NUM_GRID_ROWS - rowIdx - 1) * CONTR_MAT_COLS) + NUM_GRID_COLS + colIdx;
			var padColor = circNodeType2Color(gateGrid[rowIdx][colIdx]);
			controlSurface.call('send_midi', 144, midiPitch, padColor);
		}
	}

	// For development, display all colors on pads
	// for (var midiNum = 36; midiNum < 100; midiNum++) {
	// 	var padColor = midiNum - 36;
	// 	//controlSurface.call('send_midi', 144, midiNum, padColor + 64);
	// 	controlSurface.call('send_midi', 144, midiNum, padColor);
	// }

	controlSurface.call('release_midi');
}
