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
 */
include('common.js');

// Inlet 0 receives note messages that include velocity.
// Inlet 1 receives control change messages.
// Inlet 2 receives bang message to update clips
this.inlets = 3;

// Outlet 0 sends message to a simulator with generated QASM
// Outlet 1 sends messages to the midi clips list box
// Outlet 2 sends messages the clip selector dial
this.outlets = 3;

// Flag that tracks whether the circuit should be cleared
// when the CircuitNodeTypes.EMPTY key is net pressed
var clearCircuitWhenEmptyKeyNextPressed = false;

var curCircNodeType = CircuitNodeTypes.EMPTY;

var highMidiPitch = (NUM_GRID_ROWS - 1) * CONTR_MAT_COLS + NUM_GRID_COLS + LOW_MIDI_PITCH - 1;
//post('highMidiPitch: ' + highMidiPitch);

// TODO: Dynamically initialize this array
var circGrid = [
    [-1, -1, -1, -1],
    [-1, -1, -1, -1],
    [-1, -1, -1, -1],
    [-1, -1, -1, -1],
    [-1, -1, -1, -1],
    [-1, -1, -1, -1],
    [-1, -1, -1, -1],
    [-1, -1, -1, -1]
];


// Associates clip name to id
//var clipsIds = [];


// Associates clip name to path
var clipsPaths = [];


function bang() {
	if (inlet == 2) {
		// bang received to refresh list of clips
		populateMidiClipsList();
	}
}


function getPathByClipNameIdx(clipNameIdx) {
	post('In getPathByClipNameIdx, clipNameIdx: ' + clipNameIdx);
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
		createQasmFromGrid();
	}
	else if (inlet == 1) {
		setCurCircNodeType(arguments);
	}
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
	//createQasmFromGrid();
	//printCircGrid();
}


/**
 * Given an array with midi pitch and velocity,
 * populates the corresponding circuit grid element
 *
 * @param notePitchVelocity Array containing midi pitch and velocity
 */
function setCircGridGate(notePitchVelocity) {
	//post('notePitchVel: ' + notePitchVel[0]);
	if (notePitchVelocity.length >= 2) {
		clearCircuitWhenEmptyKeyNextPressed = false;
		var pitch = notePitchVelocity[0];
		var velocity = notePitchVelocity[1];
	
		if (pitch >= LOW_MIDI_PITCH && pitch <= highMidiPitch & velocity > 0) {
			var gridRow = Math.floor((highMidiPitch - pitch) / CONTR_MAT_COLS);
			var gridCol = (highMidiPitch - pitch) % CONTR_MAT_COLS;

			if (gridCol < NUM_GRID_COLS) {
				gridCol = NUM_GRID_COLS - gridCol - 1;
				circGrid[gridRow][gridCol] = curCircNodeType;

				//var rowIdx = NUM_GRID_ROWS - gridRow - 1;
				//var colIdx = gridCol;
				informCircuitBtn(gridRow, gridCol);
				// printCircGrid();
				//createQasmFromGrid();
			}
			else {
				post('gridCol not on circuit: ' + gridCol);
			}
		}
		// Additional gates TODO: Move these
		else if (pitch == 96) {
			curCircNodeType = CircuitNodeTypes.EMPTY;
		}
		else if (pitch == 97) {
			curCircNodeType = CircuitNodeTypes.RX_0;
		}
		else if (pitch == 98) {
			curCircNodeType = CircuitNodeTypes.RY_0;
		}
		else if (pitch == 99) {
			curCircNodeType = CircuitNodeTypes.RZ_0;
		}

		else if (pitch == 88) {
			curCircNodeType = CircuitNodeTypes.H;
		}
		else if (pitch == 89) {
			curCircNodeType = CircuitNodeTypes.RX_1;
		}
		else if (pitch == 90) {
			curCircNodeType = CircuitNodeTypes.RY_1;
		}
		else if (pitch == 91) {
			curCircNodeType = CircuitNodeTypes.RZ_1;
		}

		else if (pitch == 80) {
			curCircNodeType = CircuitNodeTypes.CTRL;
		}
		else if (pitch == 81) {
			curCircNodeType = CircuitNodeTypes.RX_2;
		}
		else if (pitch == 82) {
			curCircNodeType = CircuitNodeTypes.RY_2;
		}
		else if (pitch == 83) {
			curCircNodeType = CircuitNodeTypes.RZ_2;
		}

		else if (pitch == 73) {
			curCircNodeType = CircuitNodeTypes.RX_3;
		}
		else if (pitch == 74) {
			curCircNodeType = CircuitNodeTypes.RY_3;
		}
		else if (pitch == 75) {
			curCircNodeType = CircuitNodeTypes.RZ_3;
		}

		else if (pitch == 64) {
			curCircNodeType = CircuitNodeTypes.IDEN;
		}
		else if (pitch == 65) {
			curCircNodeType = CircuitNodeTypes.RX_4;
		}
		else if (pitch == 66) {
			curCircNodeType = CircuitNodeTypes.RY_4;
		}
		else if (pitch == 67) {
			curCircNodeType = CircuitNodeTypes.RZ_4;
		}

		else if (pitch == 57) {
			curCircNodeType = CircuitNodeTypes.RX_5;
		}
		else if (pitch == 58) {
			curCircNodeType = CircuitNodeTypes.RY_5;
		}
		else if (pitch == 59) {
			curCircNodeType = CircuitNodeTypes.RZ_5;
		}

		else if (pitch == 48) {
			curCircNodeType = CircuitNodeTypes.SWAP;
		}
		else if (pitch == 49) {
			curCircNodeType = CircuitNodeTypes.RX_6;
		}
		else if (pitch == 50) {
			curCircNodeType = CircuitNodeTypes.RY_6;
		}
		else if (pitch == 51) {
			curCircNodeType = CircuitNodeTypes.RZ_6;
		}

		else if (pitch == 40) {
			curCircNodeType = CircuitNodeTypes.QFT;
		}
		else if (pitch == 41) {
			curCircNodeType = CircuitNodeTypes.RX_7;
		}
		else if (pitch == 42) {
			curCircNodeType = CircuitNodeTypes.RY_7;
		}
		else if (pitch == 43) {
			curCircNodeType = CircuitNodeTypes.RZ_7;
		}
	}
	else {
		post('Unexpected notePitchVelocity.length: ' + notePitchVelocity.length);
	}
}


/**
 * Given an array with controller number and value,
 * sets the current circuit node type for when
 * a node is placed on the circuit
 *
 * @param controllerNumValue Array containing controller number and value
 */
function setCurCircNodeType(controllerNumValue) {
	post('controllerNumValue: ' + controllerNumValue[0]);
	if (controllerNumValue.length >= 2) {
		var contNum = controllerNumValue[0];
		var contVal = controllerNumValue[1];

		if (contVal > 0) {
			clearCircuitWhenEmptyKeyNextPressed = false;
			if (contNum == 39) {
				curCircNodeType = CircuitNodeTypes.H;
			}
			else if (contNum == 36) {
				curCircNodeType = CircuitNodeTypes.EMPTY;
				if (clearCircuitWhenEmptyKeyNextPressed){
					resetCircGrid();
					clearCircuitWhenEmptyKeyNextPressed = false;
				}
				else {
					clearCircuitWhenEmptyKeyNextPressed = true;
				}
			}

			else if (contNum == 96) {
				curCircNodeType = CircuitNodeTypes.EMPTY;
			}
			else if (contNum == 97) {
				curCircNodeType = CircuitNodeTypes.RX_0;
			}
			else if (contNum == 98) {
				curCircNodeType = CircuitNodeTypes.RY_0;
			}
			else if (contNum == 99) {
				curCircNodeType = CircuitNodeTypes.RZ_0;
			}

			else if (contNum == 88) {
				curCircNodeType = CircuitNodeTypes.H;
			}
			else if (contNum == 89) {
				curCircNodeType = CircuitNodeTypes.RX_1;
			}
			else if (contNum == 90) {
				curCircNodeType = CircuitNodeTypes.RY_1;
			}
			else if (contNum == 91) {
				curCircNodeType = CircuitNodeTypes.RZ_1;
			}

			else if (contNum == 80) {
				curCircNodeType = CircuitNodeTypes.CTRL;
			}
			else if (contNum == 81) {
				curCircNodeType = CircuitNodeTypes.RX_2;
			}
			else if (contNum == 82) {
				curCircNodeType = CircuitNodeTypes.RY_2;
			}
			else if (contNum == 83) {
				curCircNodeType = CircuitNodeTypes.RZ_2;
			}

			else if (contNum == 73) {
				curCircNodeType = CircuitNodeTypes.RX_3;
			}
			else if (contNum == 74) {
				curCircNodeType = CircuitNodeTypes.RY_3;
			}
			else if (contNum == 74) {
				curCircNodeType = CircuitNodeTypes.RZ_3;
			}

			else if (contNum == 64) {
				curCircNodeType = CircuitNodeTypes.IDEN;
			}
			else if (contNum == 65) {
				curCircNodeType = CircuitNodeTypes.RX_4;
			}
			else if (contNum == 66) {
				curCircNodeType = CircuitNodeTypes.RY_4;
			}
			else if (contNum == 67) {
				curCircNodeType = CircuitNodeTypes.RZ_4;
			}

			else if (contNum == 57) {
				curCircNodeType = CircuitNodeTypes.RX_5;
			}
			else if (contNum == 58) {
				curCircNodeType = CircuitNodeTypes.RY_5;
			}
			else if (contNum == 59) {
				curCircNodeType = CircuitNodeTypes.RZ_5;
			}

			else if (contNum == 48) {
				curCircNodeType = CircuitNodeTypes.SWAP;
			}
			else if (contNum == 49) {
				curCircNodeType = CircuitNodeTypes.RX_6;
			}
			else if (contNum == 50) {
				curCircNodeType = CircuitNodeTypes.RY_6;
			}
			else if (contNum == 51) {
				curCircNodeType = CircuitNodeTypes.RZ_6;
			}

			else if (contNum == 40) {
				curCircNodeType = CircuitNodeTypes.QFT;
			}
			else if (contNum == 41) {
				curCircNodeType = CircuitNodeTypes.RX_7;
			}
			else if (contNum == 42) {
				curCircNodeType = CircuitNodeTypes.RY_7;
			}
			else if (contNum == 43) {
				curCircNodeType = CircuitNodeTypes.RZ_7;
			}
		}
		post('curCircNodeType is now ' + curCircNodeType);
	}
	else {
		post('Unexpected controllerNumValue.length: ' + controllerNumValue.length);
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
		for (var rowIdx = 0; rowIdx < numCircuitWires; rowIdx++) {
			qasmGatesStr = addGateFromGrid(qasmGatesStr, rowIdx, colIdx);
		}
	}

	// If circuit is empty, add an identity gate
	if (qasmGatesStr.trim().length == 0) {
		qasmGatesStr = ' id q[0];'
	}

	qasm = qasmHeaderStr + qasmGatesStr;

	// Send statevector simulator message with QASM to outlet
  outlet(0, 'svsim', qasm);
}


/**
 * Creates a quantum gate from an element in the circuit grid
 * and adds it to the supplied QuantumCircuit instance
 * TODO: Support CNOT and some other gates
 *
 * @param qasmStr Current QASM string
 * @param gridRow Zero-based row number on circuit grid
 * @param gridCol Zero-based column number on circuit grid
 * @returns QASM string for the gate
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

	else if (circNodeType == CircuitNodeTypes.RX_0) {
		qasmStr += ' rx(0) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RX_1) {
		qasmStr += ' rx(pi/4) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RX_2) {
		qasmStr += ' rx(pi/2) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RX_3) {
		qasmStr += ' rx(3*pi/4) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RX_4) {
		qasmStr += ' rx(pi) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RX_5) {
		qasmStr += ' rx(5*pi/4) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RX_6) {
		qasmStr += ' rx(3*pi/2) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RX_7) {
		qasmStr += ' rx(7*pi/4) q[' + gridRow + '];';
	}

	else if (circNodeType == CircuitNodeTypes.RY_0) {
		qasmStr += ' ry(0) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RY_1) {
		qasmStr += ' ry(pi/4) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RY_2) {
		qasmStr += ' ry(pi/2) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RY_3) {
		qasmStr += ' ry(3*pi/4) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RY_4) {
		qasmStr += ' ry(pi) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RY_5) {
		qasmStr += ' ry(5*pi/4) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RY_6) {
		qasmStr += ' ry(3*pi/2) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RY_7) {
		qasmStr += ' ry(7*pi/4) q[' + gridRow + '];';
	}

	else if (circNodeType == CircuitNodeTypes.RZ_0) {
		qasmStr += ' rz(0) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RZ_1) {
		qasmStr += ' rz(pi/4) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RZ_2) {
		qasmStr += ' rz(pi/2) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RZ_3) {
		qasmStr += ' rz(3*pi/4) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RZ_4) {
		qasmStr += ' rz(pi) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RZ_5) {
		qasmStr += ' rz(5*pi/4) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RZ_6) {
		qasmStr += ' rz(3*pi/2) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RZ_7) {
		qasmStr += ' rz(7*pi/4) q[' + gridRow + '];';
	}

	return qasmStr;
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
	post('\n');
	for (rowIdx = 0; rowIdx < NUM_GRID_ROWS; rowIdx++) {
		for (colIdx = 0; colIdx < NUM_GRID_COLS; colIdx++) {
			post(circGrid[rowIdx][colIdx] + ' ');
		}
		post('\n');
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
	var live_set = new LiveAPI('live_set');

	// Send midi clips names to outlet
	outlet(1, 'clear');
	clipsPaths = [];

	var live_set = new LiveAPI('live_set');
	var numTracks = live_set.getcount('tracks');

	for (var trackIdx = 0; trackIdx < numTracks; trackIdx++ ) {
		var track = new LiveAPI('live_set tracks ' + trackIdx);
		post('\ntrack ' + trackIdx + ' id: ' + track.id);

		if (track.get('has_midi_input')) {



			// TODO: Move the below code
			//var textbox = this.patcher.getnamed('foo_text');
			var textbox = this.patcher.getnamed('pad_note[0]');
			post('\ntextbox: ' + textbox.getattr('text'));

			var device = new LiveAPI('live_set tracks ' + trackIdx + ' devices ' + 0);
			post("\ndevice name: " + device.get('name'));

			var canHaveDrumPads = device.get('can_have_drum_pads') == 1;
			post("\ndevice can_have_drum_pads: " + canHaveDrumPads);

			for (var midiPitch = LOW_MIDI_PITCH; midiPitch <= highMidiPitch; midiPitch++) {
				if (canHaveDrumPads) {
					var drumPad =
						new LiveAPI('live_set tracks ' + trackIdx + ' devices ' + 0 + ' drum_pads ' + midiPitch);
					post("\ndrumPad name: " + drumPad.getstring('name'));
				}
				else {
					post("\nnote name: " + midi2NoteName(midiPitch));
				}
			}
			// TODO: Move the above code


			var numClipSlots = track.getcount('clip_slots');

			for (var clipSlotIdx = 0; clipSlotIdx < numClipSlots; clipSlotIdx++) {
				var clipSlot = new LiveAPI('live_set tracks ' + trackIdx + ' clip_slots ' + clipSlotIdx);
				post('\nclipSlot ' + clipSlotIdx + ' id: ' + clipSlot.id);

				if (clipSlot.get('has_clip') != 0) {
					var clip = new LiveAPI('live_set tracks ' + trackIdx + ' clip_slots ' + clipSlotIdx + ' clip');
					post('\nclip id: ' + clip.id);

					var clipName = clip.getstring('name');
					if (clipName.length > 2) {
						if (clipName.substring(0, 1) == '\"') {
							clipName = clipName.substring(1, clipName.length - 1);
						}
						post('\nclipName: ' + clipName);
						post('\nclip path: ' + clip.unquotedpath);

						outlet(1, 'append', clipName);
						clipsPaths.push(clipName + '^' + clip.unquotedpath);

						//post('\nclipsIds: ' + clipsId[0]);
						post('\nSecond slot path: ' + getPathByClipNameIdx(1));
					}
				}
			}
		}
	}

	// Zero the clip selector dial
	outlet(2, 'int', 0);
}
