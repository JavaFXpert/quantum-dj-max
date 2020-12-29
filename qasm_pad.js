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
 * Quantum DJ device circuit pad that may be used when
 * a Push 2 device is not connected.
 */
include('common.js');

// Inlet 0 receives note messages that include velocity.
// Inlet 1 receives control change messages.
this.inlets = 2;

// Outlet 0 sends message to a simulator with generated QASM
// Outlet 1 sends messages to the midi clips list box
this.outlets = 2;

// Flag that tracks whether the circuit should be cleared
// when the CircuitNodeTypes.EMPTY key is net pressed
var clearCircuitWhenEmptyKeyNextPressed = false;

var curCircNodeType = CircuitNodeTypes.EMPTY;

// Dimensions of controller pad matrix
var CONTR_MAT_ROWS = 8;
var CONTR_MAT_COLS = 8;

// Controller pad columns reserved for gates
var NUM_GATE_COLS = 3;

var lowMidiPitch = 36;
var highMidiPitch = (NUM_GRID_ROWS - 1) * CONTR_MAT_COLS + NUM_GRID_COLS + lowMidiPitch - 1;
//post('highMidiPitch: ' + highMidiPitch);

// TODO: Dynamically initialize this array
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


// Associates clip name to id
var clipsIds = [];

function getIdByClipName(clipName) {
	for (var clipIdx = 0; clipIdx < clipsIds.length; clipIdx++) {
		var caratPos = clipsIds[clipIdx].indexOf('^');
		if (caratPos > 0 && clipName == clipsIds[clipIdx].substring(0, caratPos)) {
			var clipId = parseInt(clipsIds[clipIdx].substring(caratPos + 1));
			return clipId;
		}
	}
	// Not found
	return 0;
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
	createQasmFromGrid();
	//printCircGrid();

	populateMidiClipsList();
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
		var pitch = notePitchVelocity[0];
		var velocity = notePitchVelocity[1];
	
		if (pitch >= lowMidiPitch && pitch <= highMidiPitch & velocity > 0) {
			// var gridCol = (highMidiPitch - pitch) % NUM_GRID_COLS;
			// gridCol = NUM_GRID_COLS - gridCol - 1;
      // var gridRow = Math.floor((highMidiPitch - pitch) / NUM_GRID_COLS);

			var gridRow = Math.floor((highMidiPitch - pitch) / CONTR_MAT_COLS);
			var gridCol = (highMidiPitch - pitch) % CONTR_MAT_COLS;

			if (gridCol < NUM_GRID_COLS) {
				gridCol = NUM_GRID_COLS - gridCol - 1;
				circGrid[gridRow][gridCol] = curCircNodeType;
				var rowIdx = NUM_GRID_ROWS - gridRow - 1;
				var colIdx = gridCol;
				informCircuitBtn(rowIdx, colIdx);
				clearCircuitWhenEmptyKeyNextPressed = false;
				// printCircGrid();
				createQasmFromGrid();
			}
			else {
				post('gridCol not on circuit: ' + gridCol);
			}
		}
		// Additional gates TODO: Move these
		else if (pitch == 97) {
			clearCircuitWhenEmptyKeyNextPressed = false;
			curCircNodeType = CircuitNodeTypes.RY_MINUS;
		}
		else if (pitch == 98) {
			clearCircuitWhenEmptyKeyNextPressed = false;
			curCircNodeType = CircuitNodeTypes.RY_PLUS;
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
	//post('controllerNumValue: ' + controllerNumValue[0]);
	if (controllerNumValue.length >= 2) {
		var contNum = controllerNumValue[0];
		var contVal = controllerNumValue[1];

		if (contVal > 0) {
			if (contNum == 43) {
				clearCircuitWhenEmptyKeyNextPressed = false;
				curCircNodeType = CircuitNodeTypes.H;
			}
			else if (contNum == 42) {
				clearCircuitWhenEmptyKeyNextPressed = false;
				curCircNodeType = CircuitNodeTypes.X;
			}
			else if (contNum == 41) {
				clearCircuitWhenEmptyKeyNextPressed = false;
				curCircNodeType = CircuitNodeTypes.Z;
			}
			else if (contNum == 40) {
				clearCircuitWhenEmptyKeyNextPressed = false;
				curCircNodeType = CircuitNodeTypes.S;
			}
			else if (contNum == 39) {
				clearCircuitWhenEmptyKeyNextPressed = false;
				curCircNodeType = CircuitNodeTypes.SDG;
			}
			else if (contNum == 38) {
				clearCircuitWhenEmptyKeyNextPressed = false;
				curCircNodeType = CircuitNodeTypes.T;
			}
			else if (contNum == 37) {
				clearCircuitWhenEmptyKeyNextPressed = false;
				curCircNodeType = CircuitNodeTypes.TDG;
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
		}
		//post('curCircNodeType is now ' + curCircNodeType);
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
	else if (circNodeType == CircuitNodeTypes.RY_MINUS) {
		qasmStr += ' ry(-pi/4) q[' + gridRow + '];';
	}
	else if (circNodeType == CircuitNodeTypes.RY_PLUS) {
		qasmStr += ' ry(pi/4) q[' + gridRow + '];';
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
	var midiPitch = lowMidiPitch + (gridRowIdx * CONTR_MAT_COLS) + gridColIdx;
	var circBtnObj = this.patcher.getnamed('circbtn' + midiPitch);
	circBtnObj.js.updateDisplay();
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
	//post('\n--------live_set.info: ' + live_set.info);
	/*
	post('\n#############live_set.getcount(tracks): ' + live_set.getcount('tracks'));

	var track0 = new LiveAPI('live_set tracks 0');
	post('\n-------------#track0.id: ' + track0.id);
	post('\n#############track0.get(has_midi_input): ' + track0.get('has_midi_input'));
	post('\n#############track0.getcount(clip_slots): ' + track0.getcount('clip_slots'));
	post('\n#############track0.get(name): ' + track0.get('name'));

	var track0clip0 = new LiveAPI('live_set tracks 0 clip_slots 0 clip');
	post('\n-------------#track0clip0.id: ' + track0clip0.id);
	post('\n#############track0clip0.get(is_midi_track): ' + track0clip0.get('is_midi_clip'));
	post('\n#############track0clip0.get(name): ' + track0clip0.get('name'));

	var track0clip1 = new LiveAPI('live_set tracks 0 clip_slots 1 clip');
	post('\n-------------#track0clip1.id: ' + track0clip1.id);
	post('\n#############track0clip1.get(is_midi_track): ' + track0clip1.get('is_midi_clip'));
	post('\n#############track0clip1.get(name): ' + track0clip1.get('name'));

	var track0clipslot2 = new LiveAPI('live_set tracks 0 clip_slots 2');
	post('\n-------------#track0clipslot2.id: ' + track0clipslot2.id);
	post('\n#############track0clipslot2.get(has_clip): ' + track0clipslot2.get('has_clip'));

	var track0clip2 = new LiveAPI('live_set tracks 0 clip_slots 2 clip');
	post('\n-------------#track0clip2.id: ' + track0clip2.id);
	post('\n#############track0clip2.get(is_midi_track): ' + track0clip2.get('is_midi_clip'));
	post('\n#############track0clip2.get(name): ' + track0clip2.get('name'));

	var track0clipslot3 = new LiveAPI('live_set tracks 0 clip_slots 3');
	post('\n-------------#track0clipslot3.id: ' + track0clipslot3.id);
	post('\n#############track0clipslot3.get(has_clip): ' + track0clipslot3.get('has_clip'));


	var track1 = new LiveAPI('live_set tracks 1');
	post('\n-------------#track1.id: ' + track1.id);
	post('\n#############track1.get(has_midi_input): ' + track1.get('has_midi_input'));

	var track2 = new LiveAPI('live_set tracks 2');
	post('\n-------------#track2.id: ' + track2.id);
	post('\n#############track2.get(has_midi_input): ' + track2.get('has_midi_input'));

	var track3 = new LiveAPI('live_set tracks 3');
	post('\n-------------#track3.id: ' + track3.id);
	post('\n#############track3.get(has_midi_input): ' + track3.get('has_midi_input'));

	var track4 = new LiveAPI('live_set tracks 4');
	post('\n-------------#track4.id: ' + track4.id);
	post('\n#############track4.get(has_midi_input): ' + track4.get('has_midi_input'));

	var track5 = new LiveAPI('live_set tracks 5');
	post('\n-------------#track5.id: ' + track5.id);
	//post('\n#############track5.get(has_midi_input): ' + track5.get('has_midi_input'));

	var track6 = new LiveAPI('live_set tracks 6');
	post('\n-------------#track6.id: ' + track6.id);
	//post('\n#############track6.get(has_midi_input): ' + track6.get('has_midi_input'));

	//post('\ntracks: ' + tracks.children);

	//post('\ntrac.get(name): ' + clip.get('name'));
	*/

	// Send midi clips names to outlet
	outlet(1, 'clear');
	clipsIds = [];

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
						clipName = clipName.substring(1, clipName.length - 1);
						post('\nclipName: ' + clipName);
						post('\nclip id: ' + clip.id);

						outlet(1, 'append', clipName);
						clipsIds.push(clipName + '^' + clip.id);

						//post('\nclipsIds: ' + clipsId[0]);
						post('\nSecond slot id: ' + getIdByClipName('Second slot'));
					}
				}
			}
		}
	}
}

