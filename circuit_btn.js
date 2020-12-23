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
 * Button that represents a circuit element on a Push 2 matrix
 */
include('common.js');

this.midiNum = 0;
this.qasmPadObj = this.patcher.getnamed("qasmpad");


function updateDisplay() {
	draw();
	refresh();
}


sketch.default2d();
var val = 0;
var vbrgb = [1.,1.,1.,1.];

// process arguments
if (jsarguments.length > 1) {
	this.midiNum = jsarguments[1];
}


function draw()
{
	this.qasmPadObj = this.patcher.getnamed("qasmpad");

	var theta;
	var width = box.rect[2] - box.rect[0];


	with (sketch) {
		shapeslice(180,1);
		// erase background
		glclearcolor(vbrgb[0],vbrgb[1],vbrgb[2],vbrgb[3]);
		glclear();

		glcolor(0,0,0,1);

		var curNodeType = qasmPadObj.js.curCircNodeType;
		//post'in draw(), curNodeType:  ' + curNodeType);
    if (curNodeType == CircuitNodeTypes.EMPTY || curNodeType == 0) {
			// Draw empty circuit wire
    	moveto(-1.0, 0.0);
			lineto(1.0, 0.0);
		}
    else {
			moveto(-0.8, -0.8);

			// Draw square
			lineto(0.8, -0.8);
			lineto(0.8, 0.8);
			lineto(-0.8, 0.8);
			lineto(-0.8, -0.8);

			// Draw connector
			moveto(-1.0, 0.0);
			lineto(-0.8, -0.0);
			moveto(0.8, 0.0);
			lineto(1.0, 0.0);
		}

		if (curNodeType == CircuitNodeTypes.H) {
			moveto(-0.32, -0.4);
			text("H");
		}
		else if (curNodeType == CircuitNodeTypes.X) {
			moveto(-0.32, -0.4);
			text("X");
		}
		else if (curNodeType == CircuitNodeTypes.Z) {
			moveto(-0.32, -0.4);
			text("Z");
		}
		else if (curNodeType == CircuitNodeTypes.S) {
			moveto(-0.32, -0.4);
			text("S");
		}
		else if (curNodeType == CircuitNodeTypes.SDG) {
			moveto(-0.6, -0.32);
			text("S\u2020");
		}
		else if (curNodeType == CircuitNodeTypes.T) {
			moveto(-0.32, -0.4);
			text("T");
		}
		else if (curNodeType == CircuitNodeTypes.TDG) {
			moveto(-0.6, -0.32);
			text("T\u2020");
		}
	}
}


/**
 * When button is clicked send a message and update its appearance.
 */
function onclick(x, y, but, cmd, shift, capslock, option, ctrl)
{
	// TODO: Change 'alice' remote message everywhere
	messnamed('alice', this.midiNum, 127);

	draw();
	refresh();
}
onclick.local = 1;  //private


/**
 * Force the button to be square
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
 * Attempt to resize the button
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


