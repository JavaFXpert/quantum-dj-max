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
this.circNodeType = CircuitNodeTypes.EMPTY;

function updateDisplay(nodeType) {
	this.circNodeType = nodeType;
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

		//var curNodeType = qasmPadObj.js.curCircNodeType;
		var curNodeType = circNodeType;

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
		else if (curNodeType == CircuitNodeTypes.CTRL) {
			moveto(-0.323, -0.4);
			text("\u2022");
		}
		else if (curNodeType == CircuitNodeTypes.ANTI_CTRL) {
			moveto(-0.323, -0.35);
			text("\u26ac");
		}
		else if (curNodeType == CircuitNodeTypes.CTRL_X) {
			moveto(0.0, 0.0);
			framecircle(0.5, 0, 360);
			moveto(-0.5, 0.0);
			lineto(0.5, 0.0);
			moveto(0.0, -0.5);
			lineto(0.0, 0.5);
		}
		else if (curNodeType == CircuitNodeTypes.IDEN) {
			moveto(-0.2, -0.4);
			text("I");
		}
		else if (curNodeType == CircuitNodeTypes.SWAP) {
			moveto(-0.35, -0.4);
			text("\u2736");
		}
		else if (curNodeType == CircuitNodeTypes.QFT) {
			moveto(-0.4, -0.32);
			text("q");
		}

		else if (curNodeType == CircuitNodeTypes.RX_0) {
			moveto(-0.6, -0.4);
			text("x0");
		}
		else if (curNodeType == CircuitNodeTypes.RX_1) {
			moveto(-0.6, -0.4);
			text("x1");
		}
		else if (curNodeType == CircuitNodeTypes.RX_2) {
			moveto(-0.6, -0.4);
			text("x2");
		}
		else if (curNodeType == CircuitNodeTypes.RX_3) {
			moveto(-0.6, -0.4);
			text("x3");
		}
		else if (curNodeType == CircuitNodeTypes.RX_4) {
			moveto(-0.25, -0.4);
			text("x4");
		}
		else if (curNodeType == CircuitNodeTypes.RX_5) {
			moveto(-0.6, -0.4);
			text("x5");
		}
		else if (curNodeType == CircuitNodeTypes.RX_6) {
			moveto(-0.6, -0.4);
			text("x6");
		}
		else if (curNodeType == CircuitNodeTypes.RX_7) {
			moveto(-0.6, -0.4);
			text("x7");
		}
		else if (curNodeType == CircuitNodeTypes.RX_8) {
			moveto(-0.6, -0.4);
			text("X");
		}
		else if (curNodeType == CircuitNodeTypes.RX_9) {
			moveto(-0.6, -0.4);
			text("x9");
		}
		else if (curNodeType == CircuitNodeTypes.RX_10) {
			moveto(-0.6, -0.4);
			text("x10");
		}
		else if (curNodeType == CircuitNodeTypes.RX_11) {
			moveto(-0.6, -0.4);
			text("x11");
		}
		else if (curNodeType == CircuitNodeTypes.RX_12) {
			moveto(-0.25, -0.4);
			text("x12");
		}
		else if (curNodeType == CircuitNodeTypes.RX_13) {
			moveto(-0.6, -0.4);
			text("x13");
		}
		else if (curNodeType == CircuitNodeTypes.RX_14) {
			moveto(-0.6, -0.4);
			text("x14");
		}
		else if (curNodeType == CircuitNodeTypes.RX_15) {
			moveto(-0.6, -0.4);
			text("x15");
		}

		else if (curNodeType == CircuitNodeTypes.RY_0) {
			moveto(-0.6, -0.4);
			text("y0");
		}
		else if (curNodeType == CircuitNodeTypes.RY_1) {
			moveto(-0.6, -0.4);
			text("y1");
		}
		else if (curNodeType == CircuitNodeTypes.RY_2) {
			moveto(-0.6, -0.4);
			text("y2");
		}
		else if (curNodeType == CircuitNodeTypes.RY_3) {
			moveto(-0.6, -0.4);
			text("y3");
		}
		else if (curNodeType == CircuitNodeTypes.RY_4) {
			moveto(-0.25, -0.4);
			text("y4");
		}
		else if (curNodeType == CircuitNodeTypes.RY_5) {
			moveto(-0.6, -0.4);
			text("y5");
		}
		else if (curNodeType == CircuitNodeTypes.RY_6) {
			moveto(-0.6, -0.4);
			text("y6");
		}
		else if (curNodeType == CircuitNodeTypes.RY_7) {
			moveto(-0.6, -0.4);
			text("y7");
		}
		else if (curNodeType == CircuitNodeTypes.RY_8) {
			moveto(-0.6, -0.4);
			text("Y");
		}
		else if (curNodeType == CircuitNodeTypes.RY_9) {
			moveto(-0.6, -0.4);
			text("y9");
		}
		else if (curNodeType == CircuitNodeTypes.RY_10) {
			moveto(-0.6, -0.4);
			text("y10");
		}
		else if (curNodeType == CircuitNodeTypes.RY_11) {
			moveto(-0.6, -0.4);
			text("y11");
		}
		else if (curNodeType == CircuitNodeTypes.RY_12) {
			moveto(-0.25, -0.4);
			text("y12");
		}
		else if (curNodeType == CircuitNodeTypes.RY_13) {
			moveto(-0.6, -0.4);
			text("y13");
		}
		else if (curNodeType == CircuitNodeTypes.RY_14) {
			moveto(-0.6, -0.4);
			text("y14");
		}
		else if (curNodeType == CircuitNodeTypes.RY_15) {
			moveto(-0.6, -0.4);
			text("y15");
		}

		else if (curNodeType == CircuitNodeTypes.RZ_0) {
			moveto(-0.6, -0.4);
			text("z0");
		}
		else if (curNodeType == CircuitNodeTypes.RZ_1) {
			moveto(-0.30, -0.4);
			text("z1");
		}
		else if (curNodeType == CircuitNodeTypes.RZ_2) {
			moveto(-0.30, -0.4);
			text("T");
		}
		else if (curNodeType == CircuitNodeTypes.RZ_3) {
			moveto(-0.6, -0.4);
			text("z3");
		}
		else if (curNodeType == CircuitNodeTypes.RZ_4) {
			moveto(-0.25, -0.4);
			text("S");
		}
		else if (curNodeType == CircuitNodeTypes.RZ_5) {
			moveto(-0.6, -0.4);
			text("z5");
		}
		else if (curNodeType == CircuitNodeTypes.RZ_6) {
			moveto(-0.6, -0.35);
			text("z6");
		}
		else if (curNodeType == CircuitNodeTypes.RZ_7) {
			moveto(-0.6, -0.35);
			text("z7");
		}
		else if (curNodeType == CircuitNodeTypes.RZ_8) {
			moveto(-0.6, -0.4);
			text("Z");
		}
		else if (curNodeType == CircuitNodeTypes.RZ_9) {
			moveto(-0.30, -0.4);
			text("z9");
		}
		else if (curNodeType == CircuitNodeTypes.RZ_10) {
			moveto(-0.30, -0.4);
			text("z10");
		}
		else if (curNodeType == CircuitNodeTypes.RZ_11) {
			moveto(-0.6, -0.4);
			text("z1");
		}
		else if (curNodeType == CircuitNodeTypes.RZ_12) {
			moveto(-0.25, -0.4);
			text("S\u2020");
		}
		else if (curNodeType == CircuitNodeTypes.RZ_13) {
			moveto(-0.6, -0.4);
			text("z13");
		}
		else if (curNodeType == CircuitNodeTypes.RZ_14) {
			moveto(-0.6, -0.35);
			text("T\u2020");
		}
		else if (curNodeType == CircuitNodeTypes.RZ_15) {
			moveto(-0.6, -0.35);
			text("z15");
		}
	}
}


/**
 * When button is clicked send a message and update its appearance.
 */
function onclick(x, y, but, cmd, shift, capslock, option, ctrl)
{
	// TODO: Change 'alice' remote message everywhere
	messnamed('alice', this.midiNum, 0);

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


