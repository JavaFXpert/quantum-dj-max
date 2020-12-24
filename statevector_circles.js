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

sketch.default2d();
var vbrgb = [1.,1.,1.,1.];

draw();
refresh();

/**
 * Accept a viz message, which visualizes a statevector
 *
 * @param svlist Statevector as a list of floats, with each pair of floats
 *               expressing one complex number (without a character such as i
 *               that symbolizes an imaginary component.
 */
function viz(svlist) {
	post("\nsvlist: " + svlist);

	// Compute probabilities and phases.
	// var probs = [];
	// var phases = [];

	var svArray = svlist.toString().split(' ');
	post("\nsvArray: " + svArray);
	var numStates = svArray.length / 2;
	post('\nnumStates: ' + numStates);

	messnamed('cmd_to_svgrid', 'columns', numStates);
	messnamed('cmd_to_svgrid', 'clear');

  for (var svIdx = 0; svIdx < svArray.length; svIdx += 2) {
  	var real = svArray[svIdx];
		var imag = svArray[svIdx + 1];

		var amplitude = Math.sqrt(Math.pow(Math.abs(real), 2) + Math.pow(Math.abs(imag), 2));
		var probability = Math.pow(Math.abs(amplitude), 2);

		if (probability > PROBABILITY_THRESHOLD) {
			var polar = cartesianToPolar(real, imag);
			post('\npolar.theta: ' + polar.theta);
			var pitchNum = Math.round(polar.theta / 6.283185307179586 * NUM_PITCHES + NUM_PITCHES, 0) % NUM_PITCHES;
			post('\npitchNum: ' + pitchNum);
			messnamed('cmd_to_svgrid', 'setcell', (svIdx / 2) + 1, pitchNum + 1, 127);
		}
	}

	//var polar = cartesianToPolar(Math.sqrt(0.5), Math.sqrt(0.5));

	// var polar = cartesianToPolar(0, -1);
	// //post('polar.r: ' + polar.r);
	// polar.theta = (polar.theta + (Math.PI * 2)) / Math.PI * 2;
	// post('polar.theta: ' + polar.theta);
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


