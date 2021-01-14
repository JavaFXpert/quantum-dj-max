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
 * Button that represents a quantum gate on a Push 2 matrix
 */
include('common.js');

this.midiNum = 0;


sketch.default2d();
var val = 0;
var vbrgb = [1.,1.,1.,1.];

// process arguments
//post'processing args');
if (jsarguments.length > 1) {
	this.midiNum = jsarguments[1];
	//post'\njsarguments[1]: ' + jsarguments[1]);
}

draw();


function draw()
{
	var width = box.rect[2] - box.rect[0];


	with (sketch) {
		shapeslice(180,1);
		// erase background
		glclearcolor(vbrgb[0],vbrgb[1],vbrgb[2],vbrgb[3]);
		glclear();

		glcolor(0,0,0,1);

		//var curNodeType = qasmPadObj.js.curCircNodeType;
		if (midiNum == 96) {
			// Draw delete character
			moveto(-0.6, -0.4);
			text("\u232b");
		}
		else {
			moveto(-0.8, -0.8);

			// Draw square
			lineto(0.8, -0.8);
			lineto(0.8, 0.8);
			lineto(-0.8, 0.8);
			lineto(-0.8, -0.8);
		}

		if (midiNum == 97) {
			// CircuitNodeTypes.RX_0
			moveto(-0.6, -0.4);
			text("x0");
		}
		else if (midiNum == 98) {
			// CircuitNodeTypes.RY_0
			moveto(-0.6, -0.4);
			text("y0");
		}
		else if (midiNum == 99) {
			// CircuitNodeTypes.RZ_0
			moveto(-0.6, -0.4);
			text("z0");
		}

		else if (midiNum == 88) {
			// CircuitNodeTypes.H
			moveto(-0.32, -0.4);
			text("H");
		}
		else if (midiNum == 89) {
			// CircuitNodeTypes.RX_1
			moveto(-0.6, -0.4);
			text("x1");
		}
		else if (midiNum == 90) {
			// CircuitNodeTypes.RY_1
			moveto(-0.6, -0.4);
			text("y1");
		}
		else if (midiNum == 91) {
			// CircuitNodeTypes.RZ_1
			moveto(-0.30, -0.4);
			text("T");
		}

		else if (midiNum == 80) {
			// CircuitNodeTypes.CTRL
			moveto(-0.323, -0.4);
			text("\u2022");
		}
		else if (midiNum == 81) {
			// CircuitNodeTypes.RX_2
			moveto(-0.6, -0.4);
			text("x2");
		}
		else if (midiNum == 82) {
			// CircuitNodeTypes.RY_2
			moveto(-0.6, -0.4);
			text("y2");
		}
		else if (midiNum == 83) {
			// CircuitNodeTypes.RZ_2
			moveto(-0.30, -0.4);
			text("S");
		}

		else if (midiNum == 73) {
			// CircuitNodeTypes.RX_3
			moveto(-0.6, -0.4);
			text("x3");
		}
		else if (midiNum == 74) {
			// CircuitNodeTypes.RY_3
			moveto(-0.6, -0.4);
			text("y3");
		}
		else if (midiNum == 75) {
			// CircuitNodeTypes.RZ_3
			moveto(-0.6, -0.4);
			text("z3");
		}

		else if (midiNum == 64) {
			// CircuitNodeTypes.IDEN
			moveto(-0.2, -0.4);
			text("I");
		}
		else if (midiNum == 65) {
			// CircuitNodeTypes.RX_4
			moveto(-0.25, -0.4);
			text("X");
		}
		else if (midiNum == 66) {
			// CircuitNodeTypes.RY_4
			moveto(-0.25, -0.4);
			text("Y");
		}
		else if (midiNum == 67) {
			// CircuitNodeTypes.RZ_4
			moveto(-0.25, -0.4);
			text("Z");
		}

		else if (midiNum == 57) {
			// CircuitNodeTypes.RX_5
			moveto(-0.6, -0.4);
			text("x5");
		}
		else if (midiNum == 58) {
			// CircuitNodeTypes.RY_5
			moveto(-0.6, -0.4);
			text("y5");
		}
		else if (midiNum == 59) {
			// CircuitNodeTypes.RZ_5
			moveto(-0.6, -0.4);
			text("z5");
		}

		else if (midiNum == 48) {
			// CircuitNodeTypes.SWAP
			moveto(-0.35, -0.4);
			text("\u2736");
		}
		else if (midiNum == 49) {
			// CircuitNodeTypes.RX_6
			moveto(-0.6, -0.4);
			text("x6");
		}
		else if (midiNum == 50) {
			// CircuitNodeTypes.RY_6
			moveto(-0.6, -0.4);
			text("y6");
		}
		else if (midiNum == 51) {
			// CircuitNodeTypes.RZ_6
			moveto(-0.6, -0.35);
			text("S\u2020");
		}

		else if (midiNum == 40) {
			// CircuitNodeTypes.QFT
			moveto(-0.4, -0.32);
			text("q");
		}
		else if (midiNum == 41) {
			// CircuitNodeTypes.RX_7
			moveto(-0.6, -0.4);
			text("x7");
		}
		else if (midiNum == 42) {
			// CircuitNodeTypes.RY_7
			moveto(-0.6, -0.4);
			text("y7");
		}
		else if (midiNum == 43) {
			// CircuitNodeTypes.RZ_7
			moveto(-0.6, -0.35);
			text("T\u2020");
		}
	}
}


/**
 * When button is clicked send a message and update its appearance.
 */
function onclick(x, y, but, cmd, shift, capslock, option, ctrl)
{
	// TODO: Change 'bob' remote message everywhere
	messnamed('alice', this.midiNum, 0);
	//messnamed('bob', this.midiNum, 127);

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


