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
 *
 */
include('common.js');

var maxDisplayedSteps = 256;
var numSvGrids = 4;

// Inlet 0 receives "viz" messages with a statevector to display
// Inlet 1 receives global phase shift integer from 0 - 7
// Inlet 2 receives instrument type selection:
//     0: kit (midi is chromatic, from 36 - 51
//     1: diatonic octave 1,
//     2: diatonic octave 2
//     3: diatonic octave 3
//     4: diatonic octave 4
// Inlet 3 receives name of current clip
// Inlet 4 receives bang messages to shift global phase in such a way
//   that makes the first basis state have a 0 phase (if possible).
// Inlet 5 receives number of semitones to transpose
// Inlet 6 receives messages that indicate whether notes are to be legato
// Inlet 7 receives messages that indicate whether scale is to be reversed
// Inlet 8 receives messages that indicate whether scale is to be halved
// Inlet 9 receives messages that indicate current scale type
// Inlet 10 receives messages that indicate current beats in cycle A
// Inlet 11 receives messages that indicate whether pitch num 15 is a rest
// Inlet 12 receives messages that indicate current beats in cycle B
this.inlets = 13;

// Outlet 0 sends global phase shift
// Outlet 1 sends pitch transform index
// Outlet 2 sends number of semitones transposition
// Outlet 3 sends indication of whether notes are to be legato
// Outlet 4 sends indication of whether scale is to be reversed
// Outlet 5 sends indication of whether scale is to be halved
// Outlet 6 sends the current scale type value
// Outlet 7 sends the current beats in cycle A
// Outlet 8 sends indication of whether pitch num 15 is a rest
// Outlet 9 sends the current beats in a cycle B
this.outlets = 10;

sketch.default2d();
var vbrgb = [1.,1.,1.,1.];

// Current statevector
var svArray = [1.0, 0.0, 0.0, 0.0];


// Number of radians to add to the phase of each state to
// apply the desired global phase
var globalPhaseShift = 0.0;

// MIDI (0-127) representation of global phase shift value
var globalPhaseShiftMidi = 0;

// Flag that indicates not to zero the globalPhaseShift
var preserveGlobalPhaseShift = false;

// Flag that indicates whether note duration should be
// until the the next note begins playing.
var legato = false;

// Instrument type selection
// TODO: Find better name
var pitchTransformIndex = 0;

// Number of semitones to transpose
var numTransposeSemitones = 0;


// Use inverted scale
var reverseScale = false;

// Use half the number of pitches in the scale
var halfScale = false;

// Make pitch number 15 a rest
var restPitchNum15 = true;


// Type of scale to use
var curScaleType = 0; //Major


// Length of cycle A
var curCycleLengthA = 2;

// Length of cycle B
var curCycleLengthB = 2;

var prevPiOver8Phase = 0;

var curClipPath = "";

var beatsPerMeasure = 4.0;

var curNumBasisStates = 4;

// Dictionary for sending notes to Live
var notesDict = {
	notes: []
};

draw();
refresh();


function msg_int(val) {
	if (inlet == 1) {
		//preserveGlobalPhaseShift = (val > 0);
		globalPhaseShiftMidi = val;
		setGlobalPhaseShift(val);
	}
	else if (inlet == 2) {
		//preserveGlobalPhaseShift = true;
		pitchTransformIndex = val;
		var qasmPadObj = this.patcher.getnamed("qasmpad");
		qasmPadObj.js.padNoteNamesDirty = true;
		computeProbsPhases();
	}
	else if (inlet == 3) {
		var tempPreserveGlobalPhaseShift = preserveGlobalPhaseShift;
		preserveGlobalPhaseShift = true;
		var qasmPadObj = this.patcher.getnamed("qasmpad");
		curClipPath = qasmPadObj.js.getPathByClipNameIdx(val);
		qasmPadObj.js.padNoteNamesDirty = true;
		populateCircGridFromClip();

		preserveGlobalPhaseShift = tempPreserveGlobalPhaseShift;
	}
	else if (inlet == 4) {
		// Preserve either global phase, or first pitch with above threshold probability
		preserveGlobalPhaseShift = (val > 0);
	}
	else if (inlet == 5) {
		//preserveGlobalPhaseShift = true;
		numTransposeSemitones = val;
		var qasmPadObj = this.patcher.getnamed("qasmpad");
		qasmPadObj.js.padNoteNamesDirty = true;
		computeProbsPhases();
	}
	else if (inlet == 6) {
		// Make notes legato
		legato = (val > 0);
		computeProbsPhases();
	}
	else if (inlet == 7) {
		// Make scale reversed
		reverseScale = (val > 0);
		var qasmPadObj = this.patcher.getnamed("qasmpad");
		qasmPadObj.js.padNoteNamesDirty = true;
		computeProbsPhases();
	}
	else if (inlet == 8) {
		// Make scale half its range
		halfScale = (val > 0);
		var qasmPadObj = this.patcher.getnamed("qasmpad");
		qasmPadObj.js.padNoteNamesDirty = true;
		computeProbsPhases();
	}
	else if (inlet == 9) {
		// Set the scale type
		curScaleType = val;
		var qasmPadObj = this.patcher.getnamed("qasmpad");
		qasmPadObj.js.padNoteNamesDirty = true;
		computeProbsPhases();
	}
	else if (inlet == 10) {
		// Set cycle A length
		curCycleLengthA = val;
		computeProbsPhases();
	}
	else if (inlet == 11) {
		// Make pitch number 15 a rest
		restPitchNum15 = (val > 0);
		var qasmPadObj = this.patcher.getnamed("qasmpad");
		qasmPadObj.js.padNoteNamesDirty = true;
		computeProbsPhases();
	}
	else if (inlet == 12) {
		// Set cycle B length
		curCycleLengthB = val;
		computeProbsPhases();
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
	svArray = svlist.toString().split(' ');
	curNumBasisStates = svArray.length / 2;

	dimSvGrid();

	computeProbsPhases();
}



function dimSvGrid() {
	for (var gIdx = 0; gIdx < numSvGrids; gIdx++) {
		var svGrid = this.patcher.getnamed('svgrid[' + gIdx + ']');
		svGrid.setattr('columns', Math.floor(curNumBasisStates / numSvGrids));
	}
}

function clearSvGrid() {
	for (var gIdx = 0; gIdx < numSvGrids; gIdx++) {
		var svGrid = this.patcher.getnamed('svgrid[' + gIdx + ']');
		svGrid.message('clear');
	}
}

function setSvGridCell(colIdx, rowIdx) {
	var svGridIdx = Math.floor(colIdx / curNumBasisStates * numSvGrids);
	var svGrid = this.patcher.getnamed('svgrid[' + svGridIdx + ']');
	var svGridColIdx = colIdx % (curNumBasisStates / numSvGrids);

	svGrid.message('setcell', svGridColIdx + 1, rowIdx + 1, 127);
}


/**
 * Compute probabilities and phases
 */
function computeProbsPhases() {
	clearSvGrid();
	var pitchNums = [];

	var numBasisStates = svArray.length / 2;

	var numBasisStatesWithNonZeroProbability = 0;

	var gamakaType = GamakaTypes.NONE;

	var globalPhaseShifted = false;

	for (var svIdx = 0; svIdx < svArray.length; svIdx += 2) {
		var real = svArray[svIdx];
		var imag = svArray[svIdx + 1];

		var amplitude = Math.sqrt(Math.pow(Math.abs(real), 2) + Math.pow(Math.abs(imag), 2));
		var probability = Math.pow(Math.abs(amplitude), 2);
		if (probability > 0) {
			numBasisStatesWithNonZeroProbability++;
		}
	}

	for (var svIdx = 0; svIdx < svArray.length; svIdx += 2) {
		var real = svArray[svIdx];
		var imag = svArray[svIdx + 1];

		var amplitude = Math.sqrt(Math.pow(Math.abs(real), 2) + Math.pow(Math.abs(imag), 2));
		var probability = Math.pow(Math.abs(amplitude), 2);
		var pitchNum = -1;

		if (probability > PROBABILITY_THRESHOLD / numBasisStatesWithNonZeroProbability) {
			var polar = cartesianToPolar(real, imag);

			// If first basis state with significant probability has non-zero phase,
			// shift global phase by its phase
			if (!preserveGlobalPhaseShift && !globalPhaseShifted) {
				globalPhaseShifted = true;
				if (polar.theta < 0) {
					polar.theta += 2 * Math.PI;
				}

				var piOver8Phase = Math.round(polar.theta / (Math.PI / (NUM_PITCHES / 2)));
				piOver8Phase += NUM_PITCHES - prevPiOver8Phase;
				piOver8Phase = piOver8Phase % NUM_PITCHES;
				globalPhaseShiftMidi = (NUM_PITCHES - piOver8Phase) % NUM_PITCHES;

				outlet(0, 'int', globalPhaseShiftMidi);
			}

			var shiftedPhase = polar.theta + globalPhaseShift;
			if (shiftedPhase < 0.0) {
				shiftedPhase += (2*Math.PI);
			}
			pitchNum = Math.round(shiftedPhase / (2 * Math.PI) * NUM_PITCHES + NUM_PITCHES, 0) % NUM_PITCHES;

			if (svIdx / 2 < maxDisplayedSteps) {
				setSvGridCell((svIdx / 2), pitchNum);
			}
		}
		if (svIdx / 2 < maxDisplayedSteps) {
			if (!basisStateIncluded(svIdx / 2, numBasisStates, curCycleLengthA, curCycleLengthB)) {
				for (var pIdx = 0; pIdx < NUM_PITCHES; pIdx++) {
					setSvGridCell((svIdx / 2), pIdx);
				}
			}
		}
		pitchNums.push(pitchNum);
	}

	// Set the notes into the clip
	notesDict.notes = [];
	var clip = new LiveAPI(curClipPath);
	clip.call('remove_notes_extended', 0, 128, 0, 256);

	var foundFirstPitch = false;
	var formerPitchNum = 0;
	var successorPitchNum = 0;

	// Tracks the beats in the loop
	var beatIdx = 0;

	for (var pnIdx = 0; pnIdx < pitchNums.length; pnIdx++) {
		if (basisStateIncluded(pnIdx, numBasisStates, curCycleLengthA, curCycleLengthB)) {
			if (pitchNums[pnIdx] > -1 && !(restPitchNum15 && pitchNums[pnIdx] == 15)) {
				if (!foundFirstPitch) {
					prevPiOver8Phase = pitchNums[pnIdx];
					foundFirstPitch = true;
					//post('\n***** prevPiOver8Phase: ' + prevPiOver8Phase);
				}

				var duration = 0.25;
				var successorNoteFound = false;
				for (var remPnIdx = pnIdx + 1; remPnIdx < pitchNums.length; remPnIdx++) {
					if (pitchNums[remPnIdx] > -1 && !(restPitchNum15 && pitchNums[remPnIdx] == 15)) {
						successorNoteFound = true;
						successorPitchNum = pitchNums[remPnIdx];
						if (legato) {
							duration = (remPnIdx - pnIdx) / beatsPerMeasure;
						}
						//post('\nnew duration: ' + duration);
						break;
					}
				}
				if (!successorNoteFound) {
					if (legato) {
						// No successor note was found so duration of final note extends
						// to the end of the loop
						duration = (pitchNums.length - pnIdx) / beatsPerMeasure;
					}
				}

				if (pitchTransformIndex == 0) {
					notesDict.notes.push(
						{
							pitch: pitchNums[pnIdx] + 36,
							start_time: beatIdx / beatsPerMeasure,
							duration: duration,
							velocity: 100
						}
					);

				} else {
					gamakaType = pitchIdxToGamaka(pitchNums[pnIdx], curScaleType, formerPitchNum);
					var gamakaPlayed = false;

					if (gamakaType == GamakaTypes.SLIDE_UP_2_PITCHES) {
						// Ensure that there is a pitch from which to slide
						if (pitchNums[pnIdx] >= 2) {
							notesDict.notes.push(
								{
									pitch: pitchIdxToMidi(pitchNums[pnIdx] - 2,
										pitchTransformIndex,
										numTransposeSemitones,
										reverseScale,
										halfScale,
										curScaleType,
										pitchNums[pnIdx] <= formerPitchNum),
									start_time: beatIdx / beatsPerMeasure,
									duration: duration * 0.30,
									velocity: 100
								}
							);
							notesDict.notes.push(
								{
									pitch: pitchIdxToMidi(pitchNums[pnIdx],
										pitchTransformIndex,
										numTransposeSemitones,
										reverseScale,
										halfScale,
										curScaleType,
										pitchNums[pnIdx] <= formerPitchNum),
									start_time: beatIdx / beatsPerMeasure + duration * 0.25,
									duration: duration * 0.75,
									velocity: 100
								}
							);
							gamakaPlayed = true;
						}
					} else if (gamakaType == GamakaTypes.SLIDE_DOWN) {
						// Ensure that the previous note is higher in pitch than the
						// gamaka note.
						if (formerPitchNum > 0 && formerPitchNum > pitchNums[pnIdx]) {
							notesDict.notes.push(
								{
									pitch: pitchIdxToMidi(formerPitchNum,
										pitchTransformIndex,
										numTransposeSemitones,
										reverseScale,
										halfScale,
										curScaleType,
										pitchNums[pnIdx] <= formerPitchNum),
									start_time: beatIdx / beatsPerMeasure,
									duration: duration * 0.30,
									velocity: 100
								}
							);
							notesDict.notes.push(
								{
									pitch: pitchIdxToMidi(pitchNums[pnIdx],
										pitchTransformIndex,
										numTransposeSemitones,
										reverseScale,
										halfScale,
										curScaleType,
										pitchNums[pnIdx] <= formerPitchNum),
									start_time: beatIdx / beatsPerMeasure + duration * 0.25,
									duration: duration * 0.75,
									velocity: 100
								}
							);
							gamakaPlayed = true;
						}
					} else if (gamakaType == GamakaTypes.ASCENDING_SLIDE_OSCILLATE) {
						// Ensure that the previous note is lower in pitch than the
						// gamaka note, and that the following pitch is higher
						if (formerPitchNum > 0 && formerPitchNum < pitchNums[pnIdx] &&
							successorPitchNum > pitchNums[pnIdx]) {

							// Begin slide from the previous note pitch
							notesDict.notes.push(
								{
									pitch: pitchIdxToMidi(formerPitchNum,
										pitchTransformIndex,
										numTransposeSemitones,
										reverseScale,
										halfScale,
										curScaleType,
										pitchNums[pnIdx] <= formerPitchNum),
									start_time: beatIdx / beatsPerMeasure,
									duration: duration * 0.25,
									velocity: 100
								}
							);
							// Slide up to pitch in the note following the gamaka
							notesDict.notes.push(
								{
									pitch: pitchIdxToMidi(successorPitchNum,
										pitchTransformIndex,
										numTransposeSemitones,
										reverseScale,
										halfScale,
										curScaleType,
										pitchNums[pnIdx] <= formerPitchNum),
									start_time: beatIdx / beatsPerMeasure + duration * 0.1875, // 3/16
									duration: duration * 0.25,
									velocity: 100
								}
							);
							// Slide down to pitch in the gamaka note
							notesDict.notes.push(
								{
									pitch: pitchIdxToMidi(pitchNums[pnIdx],
										pitchTransformIndex,
										numTransposeSemitones,
										reverseScale,
										halfScale,
										curScaleType,
										pitchNums[pnIdx] <= formerPitchNum),
									start_time: beatIdx / beatsPerMeasure + duration * 0.375, // 6/16
									duration: duration * 0.25,
									velocity: 100
								}
							);
							// Slide up to pitch in the note following the gamaka
							notesDict.notes.push(
								{
									pitch: pitchIdxToMidi(successorPitchNum,
										pitchTransformIndex,
										numTransposeSemitones,
										reverseScale,
										halfScale,
										curScaleType,
										pitchNums[pnIdx] <= formerPitchNum),
									start_time: beatIdx / beatsPerMeasure + duration * 0.5625, // 9/16
									duration: duration * 0.25,
									velocity: 100
								}
							);
							// Slide down to pitch in the gamaka note
							notesDict.notes.push(
								{
									pitch: pitchIdxToMidi(pitchNums[pnIdx],
										pitchTransformIndex,
										numTransposeSemitones,
										reverseScale,
										halfScale,
										curScaleType,
										pitchNums[pnIdx] <= formerPitchNum),
									start_time: beatIdx / beatsPerMeasure + duration * 0.75, // 12/16
									duration: duration * 0.25,
									velocity: 100
								}
							);
							gamakaPlayed = true;
						}
					} else if (gamakaType == GamakaTypes.ASCENDING_OSCILLATE) {
						// Ensure that the previous note is lower in pitch than the
						// gamaka note.
						if (formerPitchNum > 0 && formerPitchNum < pitchNums[pnIdx]) {

							// Begin slide from the previous note pitch
							notesDict.notes.push(
								{
									pitch: pitchIdxToMidi(formerPitchNum,
										pitchTransformIndex,
										numTransposeSemitones,
										reverseScale,
										halfScale,
										curScaleType,
										pitchNums[pnIdx] <= formerPitchNum),
									start_time: beatIdx / beatsPerMeasure,
									duration: duration * 0.30,
									velocity: 100
								}
							);
							// Slide up to pitch of the gamaka note
							notesDict.notes.push(
								{
									pitch: pitchIdxToMidi(pitchNums[pnIdx],
										pitchTransformIndex,
										numTransposeSemitones,
										reverseScale,
										halfScale,
										curScaleType,
										pitchNums[pnIdx] <= formerPitchNum),
									start_time: beatIdx / beatsPerMeasure + duration * 0.25,
									duration: duration * 0.30,
									velocity: 100
								}
							);
							// Slide down to the previous note pitch
							notesDict.notes.push(
								{
									pitch: pitchIdxToMidi(formerPitchNum,
										pitchTransformIndex,
										numTransposeSemitones,
										reverseScale,
										halfScale,
										curScaleType,
										pitchNums[pnIdx] <= formerPitchNum),
									start_time: beatIdx / beatsPerMeasure + duration * 0.5,
									duration: duration * 0.30,
									velocity: 100
								}
							);
							// Slide back up to pitch of the gamaka note
							notesDict.notes.push(
								{
									pitch: pitchIdxToMidi(pitchNums[pnIdx],
										pitchTransformIndex,
										numTransposeSemitones,
										reverseScale,
										halfScale,
										curScaleType,
										pitchNums[pnIdx] <= formerPitchNum),
									start_time: beatIdx / beatsPerMeasure + duration * 0.75,
									duration: duration * 0.25,
									velocity: 100
								}
							);
							gamakaPlayed = true;
						}
					} else if (gamakaType == GamakaTypes.DESCENDING_OSCILLATE) {
						// Ensure that the previous note is higher in pitch than the
						// gamaka note.
						if (formerPitchNum > 0 && formerPitchNum > pitchNums[pnIdx]) {

							// Begin slide from the gamaka pitch
							notesDict.notes.push(
								{
									pitch: pitchIdxToMidi(pitchNums[pnIdx],
										pitchTransformIndex,
										numTransposeSemitones,
										reverseScale,
										halfScale,
										curScaleType,
										pitchNums[pnIdx] <= formerPitchNum),
									start_time: beatIdx / beatsPerMeasure,
									duration: duration * 0.30,
									velocity: 100
								}
							);
							// Slide up to pitch of the previous note
							notesDict.notes.push(
								{
									pitch: pitchIdxToMidi(formerPitchNum,
										pitchTransformIndex,
										numTransposeSemitones,
										reverseScale,
										halfScale,
										curScaleType,
										pitchNums[pnIdx] <= formerPitchNum),
									start_time: beatIdx / beatsPerMeasure + duration * 0.25,
									duration: duration * 0.30,
									velocity: 100
								}
							);
							// Slide down to the gamaka note pitch
							notesDict.notes.push(
								{
									pitch: pitchIdxToMidi(pitchNums[pnIdx],
										pitchTransformIndex,
										numTransposeSemitones,
										reverseScale,
										halfScale,
										curScaleType,
										pitchNums[pnIdx] <= formerPitchNum),
									start_time: beatIdx / beatsPerMeasure + duration * 0.5,
									duration: duration * 0.30,
									velocity: 100
								}
							);
							// Slide back up to pitch of the previous note
							notesDict.notes.push(
								{
									pitch: pitchIdxToMidi(formerPitchNum,
										pitchTransformIndex,
										numTransposeSemitones,
										reverseScale,
										halfScale,
										curScaleType,
										pitchNums[pnIdx] <= formerPitchNum),
									start_time: beatIdx / beatsPerMeasure + duration * 0.75,
									duration: duration * 0.25,
									velocity: 100
								}
							);
							gamakaPlayed = true;
						}
					} else if (gamakaType == GamakaTypes.HAMMER_ON_CHROMATIC) {
						// Ensure that there is a lower pitch from which to hammer on
						if (pitchNums[pnIdx] >= 1) {
							notesDict.notes.push(
								{
									pitch: pitchIdxToMidi(pitchNums[pnIdx],
										pitchTransformIndex,
										numTransposeSemitones,
										reverseScale,
										halfScale,
										curScaleType,
										pitchNums[pnIdx] <= formerPitchNum) - 1,
									start_time: beatIdx / beatsPerMeasure,
									//duration: duration * 0.15,
									duration: 0.15,
									velocity: 100
								}
							);
							notesDict.notes.push(
								{
									pitch: pitchIdxToMidi(pitchNums[pnIdx],
										pitchTransformIndex,
										numTransposeSemitones,
										reverseScale,
										halfScale,
										curScaleType,
										pitchNums[pnIdx] <= formerPitchNum),
									//start_time: beatIdx / beatsPerMeasure + duration * 0.10,
									start_time: beatIdx / beatsPerMeasure + 0.10,
									//duration: duration * 0.9,
									duration: duration - 0.10,
									velocity: 100
								}
							);
							gamakaPlayed = true;
						}
					}

					if (!gamakaPlayed) {
						notesDict.notes.push(
							{
								pitch: pitchIdxToMidi(pitchNums[pnIdx],
									pitchTransformIndex,
									numTransposeSemitones,
									reverseScale,
									halfScale,
									curScaleType,
									pitchNums[pnIdx] < formerPitchNum),
								start_time: beatIdx / beatsPerMeasure,
								duration: duration,
								velocity: 100
							}
						);
					}
				}
				formerPitchNum = pitchNums[pnIdx];
			}
			beatIdx++;
		}
	}
	var numBeats = beatIdx;
	clip.set('loop_end', numBeats / beatsPerMeasure);

	// Encode circuit grid into the clip, after the loop end
	var qasmPadObj = this.patcher.getnamed("qasmpad");
	var startIdx = numBeats;
  for (var colIdx = 0; colIdx < NUM_GRID_COLS; colIdx++) {
  	for (var rowIdx = 0; rowIdx < NUM_GRID_ROWS; rowIdx++) {
  		var gateMidi = qasmPadObj.js.circGrid[rowIdx][colIdx];
  		if (gateMidi == -1) {
  			gateMidi = 127;
			}

			notesDict.notes.push(
				{
					pitch: gateMidi,
					start_time: (startIdx + (colIdx * NUM_GRID_ROWS + rowIdx)) / beatsPerMeasure,
					duration: 0.25,
				}
			);

		}
	}

	// Encode global phase shift
	notesDict.notes.push(
		{
			pitch: globalPhaseShiftMidi,
			start_time: (startIdx + NUM_GRID_CELLS) / beatsPerMeasure,
			duration: 0.25,
		}
	);

	// Encode pitch transformation index
	notesDict.notes.push(
		{
			pitch: pitchTransformIndex,
			start_time: (startIdx + NUM_GRID_CELLS + 1) / beatsPerMeasure,
			duration: 0.25,
		}
	);

	// Encode number of semitones transposition
	notesDict.notes.push(
		{
			pitch: numTransposeSemitones,
			start_time: (startIdx + NUM_GRID_CELLS + 2) / beatsPerMeasure,
			duration: 0.25,
		}
	);

	// Encode scale type
	notesDict.notes.push(
		{
			pitch: curScaleType,
			start_time: (startIdx + NUM_GRID_CELLS + 3) / beatsPerMeasure,
			duration: 0.25,
		}
	);

	// Encode cycle length A
	notesDict.notes.push(
		{
			pitch: curCycleLengthA,
			start_time: (startIdx + NUM_GRID_CELLS + 4) / beatsPerMeasure,
			duration: 0.25,
		}
	);

	// Encode cycle length B
	notesDict.notes.push(
		{
			pitch: curCycleLengthB,
			start_time: (startIdx + NUM_GRID_CELLS + 5) / beatsPerMeasure,
			duration: 0.25,
		}
	);

	// Encode flags (legato, reverseScale, halfScale, restPitchNum15)
	// The value encoded is a binary representation, where:
	//   - 0b0000001 place represents legato
	//   - 0b0000010 place represents reverseScale
	//   - 0b0000100 place represents halfScale
	//   - 0b0001000 place represents restPitchNum15
	var miscFlagsVal = 0;
	if (legato) {
		miscFlagsVal += 1;
	}
	if (reverseScale) {
		miscFlagsVal += 2;
	}
	if (halfScale) {
		miscFlagsVal += 4;
	}
	if (restPitchNum15) {
		miscFlagsVal += 8;
	}

	notesDict.notes.push(
		{
			pitch: miscFlagsVal,
			start_time: (startIdx + NUM_GRID_CELLS + 6) / beatsPerMeasure,
			duration: 0.25,
		}
	);

	clip.call('add_new_notes', notesDict);


	// TODO: Refactor code below and its occurrence elsewhere into separate method
	//	 		 and ensure that it doesn't get called unnecessarily
	// Get truncated path that only includes track (e.g. live_set tracks 2)
	var trackPathTokens = curClipPath.split(' ');
	trackPathTokens.length = 3;
	var trackPath = trackPathTokens.join(' ');
	// Display the pads/notes corresponding to each phase
	qasmPadObj.js.populatePadNoteNames(trackPath, pitchTransformIndex, numTransposeSemitones, reverseScale, halfScale, curScaleType, restPitchNum15);
}


/**
 * Reads a clip, populating the circuit grid if that data exists
 * @param clipPath
 */
function populateCircGridFromClip() {
	var notesArrayPeriod = 6;
	//var numGridCells = NUM_GRID_ROWS * NUM_GRID_COLS;
	var qasmPadObj = this.patcher.getnamed("qasmpad");
	var clip = new LiveAPI(curClipPath);
	var loopEnd = clip.get('loop_end');

	qasmPadObj.js.resetCircGrid();

	var notes = clip.call('get_notes', loopEnd, 0, NUM_GRID_CELLS + NUM_ADDITIONAL_METADATA_VALUES, 128);

	if (notes[0] == 'notes' && notes[1] == NUM_GRID_CELLS + NUM_ADDITIONAL_METADATA_VALUES) {
		for (var noteIdx = 0; noteIdx < NUM_GRID_CELLS + NUM_ADDITIONAL_METADATA_VALUES; noteIdx++) {
			var noteMidi = notes[noteIdx * notesArrayPeriod + 3];
			var noteStart = notes[noteIdx * notesArrayPeriod + 4];

			if (noteMidi < 127) {
				// Use the start time for each note for ascertaining
				// proper place in grid
				// TODO: Create class(es) to abstract Clip and notes?
				var adjNoteStart = noteStart - loopEnd;

				if (adjNoteStart * 4 == NUM_GRID_CELLS) {
					globalPhaseShiftMidi = noteMidi;

					// Send globalPhaseShift
					outlet(0, 'int', globalPhaseShiftMidi);
				}
				else if (adjNoteStart * 4 == NUM_GRID_CELLS + 1) {
					pitchTransformIndex = noteMidi;

					// Send pitch transform index
					outlet(1, 'int', pitchTransformIndex);
				}
				else if (adjNoteStart * 4 == NUM_GRID_CELLS + 2) {
					numTransposeSemitones = noteMidi;

					// Send pitch transform index TODO: Remove from here?
					outlet(1, 'int', pitchTransformIndex);

					// Send number of semitones transposition
					outlet(2, 'int', numTransposeSemitones);
				}
				else if (adjNoteStart * 4 == NUM_GRID_CELLS + 3) {
					curScaleType = noteMidi;

					// Send current scale type value
					outlet(6, 'int', curScaleType);
				}
				else if (adjNoteStart * 4 == NUM_GRID_CELLS + 4) {
					curCycleLengthA = noteMidi;

					// Send current cycle length A
					outlet(7, 'int', curCycleLengthA);
				}
				else if (adjNoteStart * 4 == NUM_GRID_CELLS + 5) {
					curCycleLengthB = noteMidi;

					// Send current cycle length B
					outlet(9, 'int', curCycleLengthB);
				}
				else if (adjNoteStart * 4 == NUM_GRID_CELLS + 6) {
					legato = (noteMidi & 1) == 1; // legato is represented in 0b0000001 place
					reverseScale = (noteMidi & 2) == 2; // reverseScale is represented in 0b0000010 place
					halfScale = (noteMidi & 4) == 4; // halfScale is represented in 0b0000100 place
					restPitchNum15 = (noteMidi & 8) == 8; // restPitchNum15 is represented in 0b0001000 place

					// Send states to UI controls
					outlet(3, 'int', legato ? 1 : 0);
					outlet(4, 'int', reverseScale ? 1 : 0);
					outlet(5, 'int', halfScale ? 1 : 0);
					outlet(8, 'int', restPitchNum15 ? 1 : 0);
				}
				else {
					var noteCol = Math.floor(adjNoteStart * 4 / NUM_GRID_ROWS);

					var noteRow = Math.floor(adjNoteStart * 4 % NUM_GRID_ROWS);

					var midiPitch = LOW_MIDI_PITCH + ((NUM_GRID_ROWS - noteRow - 1) * CONTR_MAT_COLS) + noteCol;
					var notePitchVelocity = [midiPitch, 127];
					qasmPadObj.js.setCircGridGate(notePitchVelocity);

					qasmPadObj.js.circGrid[noteRow][noteCol] = noteMidi;
					qasmPadObj.js.informCircuitBtn(noteRow, noteCol);
				}
			}
		}

		// TODO: Refactor code below and its occurrence elsewhere into separate method
		//	 		 and ensure that it doesn't get call unnecessarily
		// Get truncated path that only includes track (e.g. live_set tracks 2)
		var trackPathTokens = curClipPath.split(' ');
		trackPathTokens.length = 3;
		var trackPath = trackPathTokens.join(' ');

		// Display the pads/notes corresponding to each phase
		qasmPadObj.js.populatePadNoteNames(trackPath, pitchTransformIndex, numTransposeSemitones, reverseScale, halfScale, curScaleType, restPitchNum15);


		qasmPadObj.js.createQasmFromGrid();
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
	//globalPhaseShift = phaseShiftDialVal / 128.0 * (2 * Math.PI);
	// var piOver8PhaseShift = Math.min(phaseShiftDialVal, NUM_PITCHES - 1);
	// piOver8PhaseShift = Math.max(piOver8PhaseShift, 0);

	var piOver8PhaseShift = phaseShiftDialVal;
	globalPhaseShift = piOver8PhaseShift * (2 * Math.PI / NUM_PITCHES);
	computeProbsPhases();
}


function basisStateIncluded(basisStateIdx, numBasisStates, cycleLengthA, cycleLengthB) {
	var cycleIncludedA = false;
	var cycleIncludedB = false;

	var closestA = 1;
	while (cycleLengthA > closestA) {
		closestA *= 2;
	}

	var closestB = 1;
	while (cycleLengthB > closestB) {
		closestB *= 2;
	}

	var cycleStart = 0;

	for (cycleStart = 0; cycleStart < numBasisStates; cycleStart += closestA) {
		if (basisStateIdx >= cycleStart && basisStateIdx < cycleStart + cycleLengthA) {
			cycleIncludedA = true;
			break;
		}
	}

	for (cycleStart = 0; cycleStart < numBasisStates; cycleStart += closestB) {
		if (basisStateIdx >= cycleStart && basisStateIdx < cycleStart + cycleLengthB) {
			cycleIncludedB = true;
			break;
		}
	}

	return cycleIncludedA && cycleIncludedB;
}


// Given an object in Cartesian coordinates x, y
// compute its Polar coordinates { r: …, theta: … }
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

