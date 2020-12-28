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

// Controller pad rows and columns reserved for circuit
var NUM_GRID_ROWS = 8;
var NUM_GRID_COLS = 5;

// Resolution of calculation from phase to notes or sounds in a kit
var NUM_PITCHES = 8;

// Minimum number of qubits in a circuit
var MIN_CIRCUIT_WIRES = 2;

// Threshold for regarding a state as having any probability
var PROBABILITY_THRESHOLD = 0.03

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
  MEASURE_Z: 13,
  RY_PLUS: 20, // Ry +pi/4
  RY_MINUS: 21 // Ry -pi/4
}
