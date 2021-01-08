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
 * Component that renders a statevector as circles with phases and amplitudes
 */
include('common.js');

var maxDisplayedSteps = 64

// Inlet 0 receives "viz" messages with a statevector to display
// Inlet 1 receives global phase shift integer from 0 - 127
// Inlet 2 receives instrument type selection:
//     0: kit (midi is chromatic, from 36 - 43
//     1: diatonic octave 1,
//     2: diatonic octave 2
//     3: diatonic octave 3
//     4: diatonic octave 4
// Inlet 3 receives name of current clip
this.inlets = 4;

// Outlet 0 sends global phase shift
// Outlet 1 sends pitch transform index
this.outlets = 2;

sketch.default2d();
var vbrgb = [1.,1.,1.,1.];

// Current statevector
var svArray = [1.0, 0.0, 0.0, 0.0];


// Number of radians to add to the phase of each state to
// apply the desired global phase
var globalPhaseShift = 0.0;

// MIDI (0-127) representation of global phase shift value
var globalPhaseShiftMidi = 0;


// Instrument type selection
// TODO: Find better name
var pitchTransformIndex = 0;


var curClipPath = "";

draw();
refresh();


function msg_int(val) {
	if (inlet == 1) {
		globalPhaseShiftMidi = val;
		setGlobalPhaseShift(val);
	}
	else if (inlet == 2) {
		pitchTransformIndex = val;
		computeProbsPhases();
	}
	else if (inlet == 3) {
		var qasmPadObj = this.patcher.getnamed("qasmpad");
		curClipPath = qasmPadObj.js.getPathByClipNameIdx(val);
		populateCircGridFromClip();
		//post('curClipPath: ' + curClipPath);
	}
}


/**
 * Accept a viz message, which visualizes a statevector
 *
 * @param svlist Statevector as a list of floats, with each pair of floats
 *               expressing one complex number (without a character such as i
 *               that symbolizes an imaginary component.
 */
function viz(svlist) {
	//post("\nsvlist: " + svlist);

	// Reset global phase shift
	outlet(0, 'int', 0);

	svArray = svlist.toString().split(' ');
	//post("\nsvArray: " + svArray);
	var numStates = svArray.length / 2;
	//post('\nnumStates: ' + numStates);

	messnamed('cmd_to_svgrid', 'columns', Math.min(numStates, maxDisplayedSteps));

	computeProbsPhases();
}


/**
 * Compute probabilities and phases
 */
function computeProbsPhases() {
	messnamed('cmd_to_svgrid', 'clear');
	var pitchNums = [];
	var numNotes = 0;
	var numBasisStates = svArray.length / 2;

	for (var svIdx = 0; svIdx < svArray.length; svIdx += 2) {
		var real = svArray[svIdx];
		var imag = svArray[svIdx + 1];

		var amplitude = Math.sqrt(Math.pow(Math.abs(real), 2) + Math.pow(Math.abs(imag), 2));
		var probability = Math.pow(Math.abs(amplitude), 2);
		var pitchNum = -1;

		// post('\nprobability: ' + probability);
		// post('\nnumBasisStates: ' + numBasisStates);
		// post('\nPROBABILITY_THRESHOLD / numBasisStates: ' + PROBABILITY_THRESHOLD / numBasisStates);
		if (probability > PROBABILITY_THRESHOLD / numBasisStates) {
			var polar = cartesianToPolar(real, imag);

			// If first basis state has non-zero phase, and global phase isn't
			// already shifted, shift global phase by its phase
			// TODO: Prevent this from processing while global phase dial is being moved
			if (svIdx == 0 && polar.theta != 0.0 && globalPhaseShift == 0.0) {
				if (polar.theta < 0) {
					polar.theta += 2 * Math.PI;
				}

				//TODO: Review/simplify mods in calculation
				globalPhaseShiftMidi = 128 - (Math.floor((polar.theta / (2 * Math.PI)) * 128) % 128);
				globalPhaseShiftMidi = globalPhaseShiftMidi % 128;

				post('\nGlobal phase now: ' + polar.theta);
				post('\nGlobal phase dial now: ' + globalPhaseShiftMidi);

				outlet(0, 'int', globalPhaseShiftMidi);
			}

			var shiftedPhase = polar.theta + globalPhaseShift;
			//post('\nshiftedPhase: ' + shiftedPhase);

			// TODO: Change to 2 * Math.PI?
			pitchNum = Math.round(shiftedPhase / 6.283185307179586 * NUM_PITCHES + NUM_PITCHES, 0) % NUM_PITCHES;
			numNotes++;

			if (svIdx / 2 < maxDisplayedSteps) {
				messnamed('cmd_to_svgrid', 'setcell', (svIdx / 2) + 1, pitchNum + 1, 127);
			}
		}
		pitchNums.push(pitchNum);
		//post('\npitchNum: ' + pitchNum);
	}

	// Set the notes into the clip
	//var clip = new LiveAPI('live_set tracks 0 clip_slots 1 clip');
	var clip = new LiveAPI(curClipPath);
	post('\nclip.path: ' + clip.unquotedpath);
	clip.call('remove_notes', 0, 0, 256, 128);

	clip.set('loop_end', svArray.length / 8);

	clip.call('set_notes');

	// Number of notes will include circuit node type values from grid,
	// plus globalPhaseShift and pitchTransformationIndex

	clip.call('notes', numNotes + NUM_GRID_CELLS + NUM_ADDITIONAL_METADATA_VALUES);

	for (var pnIdx = 0; pnIdx < pitchNums.length; pnIdx++) {
		if (pitchNums[pnIdx] > -1) {
			var time = (pnIdx / 4.0).toFixed(2);

			//post('\npnIdx: ' + pnIdx);
			//post('\npitchTransformIndex: ' + pitchTransformIndex);

			if (pitchTransformIndex == 0) {
				clip.call('note', pitchNums[pnIdx] + 36, time, ".25", 100, 0);
				//post('\npitchNums[pnIdx] + 36: ' + pitchNums[pnIdx] + 36);
			}
			else {
				clip.call('note', pitchIdxToDiatonic(pitchNums[pnIdx], pitchTransformIndex), time, ".25", 100, 0);
				//post('\npitchIdxToDiatonic(pitchNums[pnIdx], pitchTransformIndex): ' +
				//	pitchIdxToDiatonic(pitchNums[pnIdx], pitchTransformIndex));
			}
		}
	}

	// Encode circuit grid into the clip, after the loop end
	var qasmPadObj = this.patcher.getnamed("qasmpad");
	var startIdx = pitchNums.length;
  for (var colIdx = 0; colIdx < NUM_GRID_COLS; colIdx++) {
  	for (var rowIdx = 0; rowIdx < NUM_GRID_ROWS; rowIdx++) {
  		var gateMidi = qasmPadObj.js.circGrid[rowIdx][colIdx];
  		if (gateMidi == -1) {
  			gateMidi = 127;
			}
  		//post('gateMidi: ' + gateMidi);

			var metaDataTime = ((startIdx + (colIdx * NUM_GRID_ROWS + rowIdx)) / 4.0).toFixed(2);
  		//post('\nmetaDataTime: ' + metaDataTime);
  		clip.call('note', gateMidi, metaDataTime, ".25", 100, 0);
		}
	}

	// Encode global phase shift
	var globalPhaseShiftTime = ((startIdx + NUM_GRID_CELLS) / 4.0).toFixed(2);
	post('\nEncoding globalPhaseShiftMidi: ' + globalPhaseShiftMidi);
	clip.call('note', globalPhaseShiftMidi, globalPhaseShiftTime, ".25", 100, 0);
	post('\nglobalPhaseShiftTime: ' + globalPhaseShiftTime);

	// Encode pitch transformation index
	var pitchTransformIndexTime = ((startIdx + NUM_GRID_CELLS + 1) / 4.0).toFixed(2);
	post('\nEncoding pitchTransformIndex: ' + pitchTransformIndex);
	clip.call('note', pitchTransformIndex, pitchTransformIndexTime, ".25", 100, 0);
	post('\npitchTransformIndexTime: ' + pitchTransformIndexTime);

	clip.call('done');
}


/**
 * Reads a clip, populating the circuit grid if that data exists
 * @param clipPath
 */
function populateCircGridFromClip() {
	post("\nIn populateCircGridFromClip, curClipPath: " + curClipPath);

	var notesArrayPeriod = 6;
	//var numGridCells = NUM_GRID_ROWS * NUM_GRID_COLS;
	var qasmPadObj = this.patcher.getnamed("qasmpad");
	var clip = new LiveAPI(curClipPath);
	var loopEnd = clip.get('loop_end');
	post('\nloopEnd: ' + loopEnd);

	qasmPadObj.js.resetCircGrid();

	//var ignore = [1, CircuitNodeTypes.IGNORE];
	//qasmPadObj.js.setCurCircNodeType(ignore);

	//var notes = clip.call('get_notes', loopEnd, 0, numGridCells, 128);
	var notes = clip.call('get_notes', loopEnd, 0, NUM_GRID_CELLS + NUM_ADDITIONAL_METADATA_VALUES, 128);

	post('\nnotes: ' + notes);

	if (notes[0] == 'notes' && notes[1] == NUM_GRID_CELLS + NUM_ADDITIONAL_METADATA_VALUES) {
		//for (var colIdx = 0; colIdx < NUM_GRID_COLS; colIdx++) {
		for (var noteIdx = 0; noteIdx < NUM_GRID_CELLS + NUM_ADDITIONAL_METADATA_VALUES; noteIdx++) {
			//for (var rowIdx = NUM_GRID_ROWS - 1; rowIdx >= 0; rowIdx--) {
			//for (var rowIdx = 0; rowIdx < NUM_GRID_ROWS; rowIdx++) {
			var noteMidi = notes[noteIdx * notesArrayPeriod + 3];
			var noteStart = notes[noteIdx * notesArrayPeriod + 4];
			//messnamed('bob', noteMidi, 127);

			if (noteMidi < 127) {
				post('\n----- noteMidi: ' + noteMidi);
				post('\nnoteStart: ' + noteStart);

				// Use the start time for each note for ascertaining
				// proper place in grid
				// TODO: Create class(es) to abstract Clip and notes?
				var adjNoteStart = noteStart - loopEnd;
				post('\nadjNoteStart: ' + adjNoteStart);

				if (adjNoteStart * 4 == NUM_GRID_CELLS) {
					globalPhaseShiftMidi = noteMidi;
					post('\nFound the globalPhaseShiftMidi: ' + globalPhaseShiftMidi);

					// Send globalPhaseShift
					outlet(0, 'int', globalPhaseShiftMidi);
				}
				else if (adjNoteStart * 4 == NUM_GRID_CELLS + 1) {
					pitchTransformIndex = noteMidi;
					post('\nFound the pitchTransformIndex: ' + pitchTransformIndex);

					// Send pitch transform index
					outlet(1, 'int', pitchTransformIndex);
				}
				else {
					var noteCol = Math.floor(adjNoteStart * 4 / NUM_GRID_ROWS);
					//post('\nnoteCol: ' + noteCol);

					var noteRow = Math.floor(adjNoteStart * 4 % NUM_GRID_ROWS);
					//post('\nnoteRow: ' + noteRow);

					//var temp = [1, noteMidi];
					//qasmPadObj.js.setCurCircNodeType(temp);

					var midiPitch = LOW_MIDI_PITCH + ((NUM_GRID_ROWS - noteRow - 1) * CONTR_MAT_COLS) + noteCol;
					var notePitchVelocity = [midiPitch, 127];
					qasmPadObj.js.setCircGridGate(notePitchVelocity);

					qasmPadObj.js.circGrid[noteRow][noteCol] = noteMidi;
					qasmPadObj.js.informCircuitBtn(noteRow, noteCol);
				}
			}
		}
		// var temp = [1, 8];
		// qasmPadObj.js.setCurCircNodeType(temp);
		// qasmPadObj.js.circGrid[2][0] = 8;
		// messnamed('bob', 8, 127);
		// qasmPadObj.js.informCircuitBtn(5, 0);

		// messnamed('alice', 96, 127);
		qasmPadObj.js.createQasmFromGrid();
		//qasmPadObj.js.printCircGrid();
	}
}


/**
 * Given an integer from 0 - 127, calculates and implements
 * global phase adjustment.
 *
 * TODO: Accept input from Push 2 dial
 *
 * @param phaseShiftDialVal Integer from 0 - 127 received from
 *        global phase shift dial
 */
function setGlobalPhaseShift(phaseShiftDialVal) {
	globalPhaseShift = phaseShiftDialVal / 128.0 * (2 * Math.PI);
	computeProbsPhases();
}



// Given an object in Cartesian coordinates x, y
// compute its Polar coordiantes { r: …, theta: … }
function cartesianToPolar(x, y) {
	return {
		r: Math.sqrt(x * x + y * y),
		theta: Math.atan2(y, x)
	};
}


function draw() {
	var width = box.rect[2] - box.rect[0];


	with (sketch) {
		shapeslice(180,1);
		// erase background
		glclearcolor(vbrgb[0],vbrgb[1],vbrgb[2],vbrgb[3]);
		glclear();

		glcolor(0,0,0,1);

		moveto(-0.5, -0.4);
		fontsize(12);
		text("svgrid");
	}
}


/**
 * Force the view to be square
 *
 * @param w Proposed width of button
 * @param h Proposed height of button
 */
function forcesize(w, h)
{
	if (w != h) {
		h = w;
		box.size(w,h);
	}
}
forcesize.local = 1; //private


/**
 * Attempt to resize the view
 *
 * @param w Proposed width of button
 * @param h Proposed height of button
 */
function onresize(w, h)
{
	forcesize(w, h);
	draw();
	refresh();
}
onresize.local = 1; //private


function pitchIdxToDiatonic(pitchIdx, octaveNum) {
	var diatonicMidiPitch = 0
	if (pitchIdx == 0) {
		diatonicMidiPitch = octaveNum * 12 + 24;
	}
	else if (pitchIdx == 1) {
		diatonicMidiPitch = octaveNum * 12 + 26;
	}
	else if (pitchIdx == 2) {
		diatonicMidiPitch = octaveNum * 12 + 28;
	}
	else if (pitchIdx == 3) {
		diatonicMidiPitch = octaveNum * 12 + 29;
	}
	else if (pitchIdx == 4) {
		diatonicMidiPitch = octaveNum * 12 + 31;
	}
	else if (pitchIdx == 5) {
		diatonicMidiPitch = octaveNum * 12 + 33;
	}
	else if (pitchIdx == 6) {
		diatonicMidiPitch = octaveNum * 12 + 35;
	}
	else if (pitchIdx == 7) {
		diatonicMidiPitch = octaveNum * 12 + 36;
	}
	//post('diatonicMidiPitch: ' + diatonicMidiPitch);
	return diatonicMidiPitch;
}
