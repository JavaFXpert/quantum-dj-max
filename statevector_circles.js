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

var maxDisplayedSteps = 32

// Inlet 0 receives "viz" messages with a statevector to display
// Inlet 1 receives global phase shift integer from 0 - 127
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


function msg_int(val) {
	if (inlet == 1) {
		setGlobalPhaseShift(val);
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
	//messnamed('cmd_to_svgrid', 'clear');

	computeProbsPhases();
}

/**
 * Compute probabilities and phases
 */
function computeProbsPhases() {
	messnamed('cmd_to_svgrid', 'clear');

	for (var svIdx = 0; svIdx < svArray.length; svIdx += 2) {
		var real = svArray[svIdx];
		var imag = svArray[svIdx + 1];

		var amplitude = Math.sqrt(Math.pow(Math.abs(real), 2) + Math.pow(Math.abs(imag), 2));
		var probability = Math.pow(Math.abs(amplitude), 2);

		if (probability > PROBABILITY_THRESHOLD) {
			var polar = cartesianToPolar(real, imag);

			// If first basis state has non-zero phase, and global phase isn't
			// already shifted, shift global phase by its phase
			// TODO: Prevent this from processing while global phase dial is being moved
			if (svIdx == 0 && polar.theta != 0.0 && globalPhaseShift == 0.0) {
				if (polar.theta < 0) {
					polar.theta += 2 * Math.PI;
				}
				var phaseDialValue = 128 - (Math.floor((polar.theta / (2 * Math.PI)) * 128) % 128);

				//post('\nGlobal phase now: ' + polar.theta);
				//post('\nGlobal phase dial now: ' + phaseDialValue);

				outlet(0, 'int', phaseDialValue);
			}

			var shiftedPhase = polar.theta + globalPhaseShift;
			//post('\nshiftedPhase: ' + shiftedPhase);

			// TODO: Change to 2 * Math.PI?
			var pitchNum = Math.round(shiftedPhase / 6.283185307179586 * NUM_PITCHES + NUM_PITCHES, 0) % NUM_PITCHES;

			//post('\npitchNum: ' + pitchNum);
			if (svIdx / 2 < maxDisplayedSteps) {
				messnamed('cmd_to_svgrid', 'setcell', (svIdx / 2) + 1, pitchNum + 1, 127);
			}
		}
	}

	// Experiment with writing midi to clip (TODO: fold into code)
  var api = new LiveAPI('live_set tracks 0 clip_slots 0 clip');
  post('api.id: ' + api.id);
  post('api.get(is_midi_clip): ' + api.get('is_midi_clip'));
	post("notes:", api.call("get_notes", 0, 0, 256, 128));
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
