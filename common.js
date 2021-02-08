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
 * Variables and methods common to more than one JS file
 * in this app.
 */

// Lowest MIDI pitch on grid
var LOW_MIDI_PITCH = 36;

// Dimensions of controller pad matrix
var CONTR_MAT_ROWS = 8;
var CONTR_MAT_COLS = 8;

// Controller pad rows and columns reserved for circuit
var NUM_GRID_ROWS = 8;
var NUM_GRID_COLS = 6;

//  Number of controller pads reserved for the circuit
var NUM_GRID_CELLS = NUM_GRID_ROWS * NUM_GRID_COLS;

// Controller pad columns reserved for gates
var NUM_GATE_COLS = 2;

// Number of values in addition to the circuit grid
// stored as metadata in the clip
var NUM_ADDITIONAL_METADATA_VALUES = 4;

// Resolution of calculation from phase to notes or sounds in a kit.
// Also represents resolution of phase.
var NUM_PITCHES = 16;

// TODO: Make these configurable per track
// var HALF_SCALE = false;
// var REVERSE_SCALE = false;

// Lowest MIDI value of drum pad
var LOW_DRUMPAD_MIDI = 36;

// Maximum number of drum pads
var MAX_DRUMPADS = 16;

// Minimum number of qubits in a circuit
var MIN_CIRCUIT_WIRES = 2;

// Threshold for regarding a state as having any probability
var PROBABILITY_THRESHOLD = 0.24

var CircuitNodeTypes = {
  EMPTY: -1,
  // X: 1,
  // Y: 2,
  // Z: 3,
  // S: 4,
  // SDG: 5,
  // T: 6,
  // TDG: 7,
  H: 8,
  SWAP: 9,
  BARRIER: 10,
  CTRL: 11, // "control" part of multi-qubit gate
  ANTI_CTRL: 12, // "anti-control" part of multi-qubit gate
  TRACE: 13, // In the path between a gate part and a "control" or "swap" part
  MEASURE_Z: 14,
  IDEN: 15,

  CTRL_X: 21, // X gate that is associated with control qubit(s)

  RX_0: 30, // Rx
  RX_1: 31, // Rx pi/8
  RX_2: 32, // Rx pi/4
  RX_3: 33, // Rx 3pi/8
  RX_4: 34, // Rx pi/2
  RX_5: 35, // Rx 5pi/8
  RX_6: 36, // Rx 3pi/4
  RX_7: 37, // Rx 7pi/8
  RX_8: 38, // Rx pi (X)
  RX_9: 39, // Rx 9pi/8
  RX_10: 40, // Rx 5pi/4
  RX_11: 41, // Rx 11pi/8
  RX_12: 42, // Rx 3pi/2
  RX_13: 43, // Rx 13pi/8
  RX_14: 44, // Rx 7pi/4
  RX_15: 45, // Rx 15pi/8

  RY_0: 50, // Ry
  RY_1: 51, // Ry pi/8
  RY_2: 52, // Ry pi/4
  RY_3: 53, // Ry 3pi/8
  RY_4: 54, // Ry pi/2
  RY_5: 55, // Ry 5pi/8
  RY_6: 56, // Ry 3pi/4
  RY_7: 57, // Ry 7pi/8
  RY_8: 58, // Ry pi (Y)
  RY_9: 59, // Ry 9pi/8
  RY_10: 60, // Ry 5pi/4
  RY_11: 61, // Ry 11pi/8
  RY_12: 62, // Ry 3pi/2
  RY_13: 63, // Ry 13pi/8
  RY_14: 64, // Ry 7pi/4
  RY_15: 65, // Ry 15pi/8

  PHASE_0: 70, // Phase
  PHASE_1: 71, // Phase pi/8
  PHASE_2: 72, // Phase pi/4 (T)
  PHASE_3: 73, // Phase 3pi/8
  PHASE_4: 74, // Phase pi/2 (S)
  PHASE_5: 75, // Phase 5pi/8
  PHASE_6: 76, // Phase 3pi/4
  PHASE_7: 77, // Phase 7pi/8
  PHASE_8: 78, // Phase pi (Z)
  PHASE_9: 79, // Phase 9pi/8
  PHASE_10: 80, // Phase 5pi/4
  PHASE_11: 81, // Phase 11pi/8
  PHASE_12: 82, // Phase 3pi/2 (Sdg)
  PHASE_13: 83, // Phase 13pi/8
  PHASE_14: 84, // Phase 7pi/4 (Tdg)
  PHASE_15: 85, // Phase 15pi/8

  QFT: 90 // QFT
}


// Types of scales
var ScaleTypes = {
  MAJOR: 0,
  MINOR: 1,
  CHROMATIC: 2,
  PENTATONIC: 3
}


/**
 * Given a pi/8 rotation, returns a String that expresses
 * it in radians
 *
 * @param piOver8Arg int in range 0-15 inclusive
 * @returns String that expresses radians
 */
function piOver8RadiansStr(piOver8Arg) {
  radStr = '0';
  if (piOver8Arg == 1) {
    radStr = 'pi/8';
  }
  else if (piOver8Arg == 2) {
    radStr = 'pi/4';
  }
  else if (piOver8Arg == 3) {
    radStr = '3*pi/8';
  }
  else if (piOver8Arg == 4) {
    radStr = 'pi/2';
  }
  else if (piOver8Arg == 5) {
    radStr = '5*pi/8';
  }
  else if (piOver8Arg == 6) {
    radStr = '3*pi/4';
  }
  else if (piOver8Arg == 7) {
    radStr = '7*pi/8';
  }
  else if (piOver8Arg == 8) {
    radStr = 'pi';
  }
  else if (piOver8Arg == 9) {
    radStr = '9*pi/8';
  }
  else if (piOver8Arg == 10) {
    radStr = '5*pi/4';
  }
  else if (piOver8Arg == 11) {
    radStr = '11*pi/8';
  }
  else if (piOver8Arg == 12) {
    radStr = '3*pi/2';
  }
  else if (piOver8Arg == 13) {
    radStr = '13*pi/8';
  }
  else if (piOver8Arg == 14) {
    radStr = '7*pi/4';
  }
  else if (piOver8Arg == 15) {
    radStr = '15*pi/8';
  }
  return radStr;
}


/**
 * Convert a midi note number into a note name
 * @param noteNum MIDI number for a note
 * @returns Name (e.g. C3) of the note
 */
function midi2NoteName(noteNum) {
  var note = '';
  if (noteNum >= 0 && noteNum <= 127) {
    var octave = Math.floor(noteNum / 12) - 2;
    var note = "C C#D D#E F F#G G#A A#B ".substring((noteNum % 12) * 2, (noteNum % 12) * 2 + 2);
    note = note.trim() + octave;
  } else {
    post('Supplied noteNum ' + noteNum + ' is unexpectedly out of range');
  }
  return note;
}


/**
 * Compute a MIDI pitch given a diatonic pitch, octave number, and
 * number of semitones to transpose.
 * @param pitchIdx Diatonic pitch index (0 - NUM_PITCHES-1)
 * @param transposeSemitones Number of semitones to transpose the outputted note (0 - 11)
 * @returns {number}
 */
function pitchIdxToMidi(pitchIdx, octaveNumPlus2, transposeSemitones, reverseScale, halfScale, scaleType) {
  var octaveNum = octaveNumPlus2 - 2;
  var midiPitch = 0
  if (reverseScale) {
    pitchIdx = NUM_PITCHES - pitchIdx - 1;
  }
  if (halfScale) {
    pitchIdx = Math.floor(pitchIdx / 2.0);
  }
  if (pitchIdx == 0) {
    midiPitch = octaveNum * 12 + 24;
  } else if (pitchIdx == 1) {
    midiPitch = octaveNum * 12 + 26;
  } else if (pitchIdx == 2) {
    midiPitch = octaveNum * 12 + 28;
  } else if (pitchIdx == 3) {
    midiPitch = octaveNum * 12 + 29;
  } else if (pitchIdx == 4) {
    midiPitch = octaveNum * 12 + 31;
  } else if (pitchIdx == 5) {
    midiPitch = octaveNum * 12 + 33;
  } else if (pitchIdx == 6) {
    midiPitch = octaveNum * 12 + 35;
  } else if (pitchIdx == 7) {
    midiPitch = octaveNum * 12 + 36;
  } else if (pitchIdx == 8) {
    midiPitch = octaveNum * 12 + 38;
  } else if (pitchIdx == 9) {
    midiPitch = octaveNum * 12 + 40;
  } else if (pitchIdx == 10) {
    midiPitch = octaveNum * 12 + 41;
  } else if (pitchIdx == 11) {
    midiPitch = octaveNum * 12 + 43;
  } else if (pitchIdx == 12) {
    midiPitch = octaveNum * 12 + 45;
  } else if (pitchIdx == 13) {
    midiPitch = octaveNum * 12 + 47;
  } else if (pitchIdx == 14) {
    midiPitch = octaveNum * 12 + 48;
  } else if (pitchIdx == 15) {
    midiPitch = octaveNum * 12 + 50;
  }
  midiPitch += transposeSemitones;
  return midiPitch;
}

function removeQuotes(str) {
  var unquotedStr = str;
  if (str.length >= 3) {
    if (str.charAt(0) == '\"' &&
      str.charAt(str.length - 1) == '\"') {
      unquotedStr = str.substring(1, str.length - 1);
    }
  }
  return unquotedStr;
}


function circNodeType2Color(circNodeTypeNum) {
  var colorNum = 0;

  if (circNodeTypeNum == CircuitNodeTypes.EMPTY) {
    colorNum = 0;
  }
  if (circNodeTypeNum == CircuitNodeTypes.H) {
    colorNum = 122;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.CTRL) {
    colorNum = 123;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.ANTI_CTRL) {
    colorNum = 7;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.CTRL_X) {
    colorNum = 2;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.IDEN) {
    colorNum = 124;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.SWAP) {
    colorNum = 51;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.QFT) {
    colorNum = 43;
  }

  else if (circNodeTypeNum == CircuitNodeTypes.RX_0) {
    colorNum = 25;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_1) {
    colorNum = 25;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_2) {
    colorNum = 127;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_3) {
    colorNum = 127;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_4) {
    colorNum = 68;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_5) {
    colorNum = 68;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_6) {
    colorNum = 67;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_7) {
    colorNum = 67;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_8) {
    colorNum = 2;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_9) {
    colorNum = 2;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_10) {
    colorNum = 4;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_11) {
    colorNum = 4;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_12) {
    colorNum = 3;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_13) {
    colorNum = 3;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_14) {
    colorNum = 29;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_15) {
    colorNum = 29;
  }

  else if (circNodeTypeNum == CircuitNodeTypes.RY_0) {
    colorNum = 8;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_1) {
    colorNum = 8;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_2) {
    colorNum = 10;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_3) {
    colorNum = 10;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_4) {
    colorNum = 11;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_5) {
    colorNum = 11;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_6) {
    colorNum = 31;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_7) {
    colorNum = 31;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_8) {
    colorNum = 32;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_9) {
    colorNum = 32;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_10) {
    colorNum = 89;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_11) {
    colorNum = 89;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_12) {
    colorNum = 93;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_13) {
    colorNum = 93;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_14) {
    colorNum = 97;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_15) {
    colorNum = 97;
  }

  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_0) {
    colorNum = 95;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_1) {
    colorNum = 95;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_2) {
    colorNum = 103;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_3) {
    colorNum = 103;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_4) {
    colorNum = 99;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_5) {
    colorNum = 99;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_6) {
    colorNum = 125;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_7) {
    colorNum = 125;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_8) {
    colorNum = 18;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_9) {
    colorNum = 18;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_10) {
    colorNum = 19;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_11) {
    colorNum = 19;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_12) {
    colorNum = 24;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_13) {
    colorNum = 24;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_14) {
    colorNum = 113;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_15) {
    colorNum = 113;
  }

  return colorNum;
}

