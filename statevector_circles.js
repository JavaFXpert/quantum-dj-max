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

// Inlet 0 receives "viz" messages with a statevector to display
// Inlet 1 receives control change messages.
this.inlets = 2;

sketch.default2d();
var vbrgb = [1.,1.,1.,1.];

// Current statevector
var svArray = [1.0, 0.0, 0.0, 0.0];

// Number of radians to add to the phase of each state to
// apply the desired global phase
var globalPhaseShift = 0.0;

draw();
refresh();


function list(lst) {
	if (inlet == 1) {
		setGlobalPhaseShift(arguments);
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

	// Compute probabilities and phases.
	// var probs = [];
	// var phases = [];

	svArray = svlist.toString().split(' ');
	//post("\nsvArray: " + svArray);
	var numStates = svArray.length / 2;
	//post('\nnumStates: ' + numStates);

	messnamed('cmd_to_svgrid', 'columns', numStates);
	//messnamed('cmd_to_svgrid', 'clear');

	computeProbsPhases();
}


function computeProbsPhases() {
	messnamed('cmd_to_svgrid', 'clear');

	for (var svIdx = 0; svIdx < svArray.length; svIdx += 2) {
		var real = svArray[svIdx];
		var imag = svArray[svIdx + 1];

		var amplitude = Math.sqrt(Math.pow(Math.abs(real), 2) + Math.pow(Math.abs(imag), 2));
		var probability = Math.pow(Math.abs(amplitude), 2);

		if (probability > PROBABILITY_THRESHOLD) {
			var polar = cartesianToPolar(real, imag);
			//post('\npolar.theta: ' + polar.theta);

			var shiftedPhase = polar.theta + globalPhaseShift;
			//post('\nshiftedPhase: ' + shiftedPhase);

			var pitchNum = Math.round(shiftedPhase / 6.283185307179586 * NUM_PITCHES + NUM_PITCHES, 0) % NUM_PITCHES;
			//post('\npitchNum: ' + pitchNum);
			messnamed('cmd_to_svgrid', 'setcell', (svIdx / 2) + 1, pitchNum + 1, 127);
		}
	}
}

/**
 * Given an array with controller number and value,
 * calculates global phase adjustment.
 *
 * TODO: Accept input from Push 2 dial
 * TODO: Automatically adjust phases to make first beat 0 rads?
 *
 * @param controllerNumValue Array containing controller number and value
 */
function setGlobalPhaseShift(controllerNumValue) {
	//post('controllerNumValue: ' + controllerNumValue[0]);
	//if (controllerNumValue.length >= 2) {
		var contNum = controllerNumValue[0];
		var contVal = controllerNumValue[1];

		//if (contVal > 0) {
			//if (contNum == 78) {
				// Convert from range 0..127 to 0..(almost 2pi)
				//globalPhaseShift = contVal / 128.0 * (2 * Math.PI);
			  globalPhaseShift = contNum / 128.0 * (2 * Math.PI);
			//}

			//post('globalPhaseShift is now ' + globalPhaseShift);

			computeProbsPhases();
		//}
	//}
	//else {
		//post('Unexpected controllerNumValue.length: ' + controllerNumValue.length);
	//}
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


