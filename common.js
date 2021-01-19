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
var NUM_ADDITIONAL_METADATA_VALUES = 3;

// Resolution of calculation from phase to notes or sounds in a kit.
// Also represents resolution of phase.
var NUM_PITCHES = 8;

// Lowest MIDI value of drum pad
var LOW_DRUMPAD_MIDI = 36;

// Maximum number of drum pads
var MAX_DRUMPADS = 16;

// Minimum number of qubits in a circuit
var MIN_CIRCUIT_WIRES = 2;

// Threshold for regarding a state as having any probability
var PROBABILITY_THRESHOLD = 0.12

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
  TRACE: 12, // In the path between a gate part and a "control" or "swap" part
  MEASURE_Z: 13,
  IDEN: 14,

  CTRL_X: 21, // X gate that is associated with control qubit(s)

  RX_0: 30, // Rx
  RX_1: 31, // Rx pi/4
  RX_2: 32, // Rx pi/2
  RX_3: 33, // Rx 3pi/4
  RX_4: 34, // Rx pi (X)
  RX_5: 35, // Rx 5pi/4
  RX_6: 36, // Rx 3pi/2
  RX_7: 37, // Rx 7pi/4

  RY_0: 40, // Ry
  RY_1: 41, // Ry pi/4
  RY_2: 42, // Ry pi/2
  RY_3: 43, // Ry 3pi/4
  RY_4: 44, // Ry pi (Y)
  RY_5: 45, // Ry 5pi/4
  RY_6: 46, // Ry 3pi/2
  RY_7: 47, // Ry 7pi/4

  RZ_0: 50, // Rz
  RZ_1: 51, // Rz pi/4 (T)
  RZ_2: 52, // Rz pi/2 (S)
  RZ_3: 53, // Rz 3pi/4
  RZ_4: 54, // Rz pi (Z)
  RZ_5: 55, // Rz 5pi/4
  RZ_6: 56, // Rz 3pi/2 (S†)
  RZ_7: 57, // Rz 7pi/4 (T†)

  QFT: 60 // QFT
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
 * @param pitchIdx Diatonic pitch index (0 - 7)
 * @param octaveNum MIDI octave number. 0 indicates that a kit should be used.
 * @param transposeSemitones Number of semitones to transpose the outputted note (0 - 11)
 * @returns {number}
 */
function pitchIdxToDiatonic(pitchIdx, octaveNumPlus2, transposeSemitones) {
  var octaveNum = octaveNumPlus2 - 2;
  var diatonicMidiPitch = 0
  if (pitchIdx == 0) {
    diatonicMidiPitch = octaveNum * 12 + 24;
  } else if (pitchIdx == 1) {
    diatonicMidiPitch = octaveNum * 12 + 26;
  } else if (pitchIdx == 2) {
    diatonicMidiPitch = octaveNum * 12 + 28;
  } else if (pitchIdx == 3) {
    diatonicMidiPitch = octaveNum * 12 + 29;
  } else if (pitchIdx == 4) {
    diatonicMidiPitch = octaveNum * 12 + 31;
  } else if (pitchIdx == 5) {
    diatonicMidiPitch = octaveNum * 12 + 33;
  } else if (pitchIdx == 6) {
    diatonicMidiPitch = octaveNum * 12 + 35;
  } else if (pitchIdx == 7) {
    diatonicMidiPitch = octaveNum * 12 + 36;
  }
  //post('diatonicMidiPitch: ' + diatonicMidiPitch);
  diatonicMidiPitch += transposeSemitones;
  return diatonicMidiPitch;
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
  else if (circNodeTypeNum == CircuitNodeTypes.CTRL_X) {
    colorNum = 1;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.IDEN) {
    colorNum = 124;
  }

  else if (circNodeTypeNum == CircuitNodeTypes.RX_0) {
    colorNum = 25;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_1) {
    colorNum = 127;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_2) {
    colorNum = 68;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_3) {
    colorNum = 67;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_4) {
    colorNum = 2;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_5) {
    colorNum = 4;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_6) {
    colorNum = 3;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_7) {
    colorNum = 29;
  }

  else if (circNodeTypeNum == CircuitNodeTypes.RY_0) {
    colorNum = 8;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_1) {
    colorNum = 10;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_2) {
    colorNum = 11;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_3) {
    colorNum = 31;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_4) {
    colorNum = 32;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_5) {
    colorNum = 89;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_6) {
    colorNum = 93;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_7) {
    colorNum = 97;
  }

  else if (circNodeTypeNum == CircuitNodeTypes.RZ_0) {
    colorNum = 95;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RZ_1) {
    colorNum = 103;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RZ_2) {
    colorNum = 99;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RZ_3) {
    colorNum = 125;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RZ_4) {
    colorNum = 18;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RZ_5) {
    colorNum = 19;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RZ_6) {
    colorNum = 24;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RZ_7) {
    colorNum = 113;
  }

  return colorNum;
}

