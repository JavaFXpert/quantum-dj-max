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
var NUM_GRID_COLS = 4;

//  Number of controller pads reserved for the circuit
var NUM_GRID_CELLS = NUM_GRID_ROWS * NUM_GRID_COLS;

// Controller pad columns reserved for gates
var NUM_GATE_COLS = 4;

// Number of values in addition to the circuit grid
// stored as metadata in the clip
var NUM_ADDITIONAL_METADATA_VALUES = 2;

// Resolution of calculation from phase to notes or sounds in a kit.
// Also represents resolution of phase.
var NUM_PITCHES = 8;

// Minimum number of qubits in a circuit
var MIN_CIRCUIT_WIRES = 2;

// Threshold for regarding a state as having any probability
var PROBABILITY_THRESHOLD = 0.12

var CircuitNodeTypes = {
  EMPTY: -1,
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
  MEASURE_Z: 13,
  IDEN: 14,

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
