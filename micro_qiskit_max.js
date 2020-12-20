/**
 * MicroQiskit implementation in Max
 */
var r2 = 0.70710678118;

this.inlets = 2;

sketch.default2d();
var val = 0;
var vbrgb = [1.,1.,1.,1.];
var vfrgb = [0.5,0.5,0.5,1.];
var vrgb2 = [0.7,0.7,0.7,1.];
var last_x = 0;
var last_y = 0;

// process arguments
//post('in process args');
if (jsarguments.length>1) {
	//vfrgb[0] = jsarguments[1]/255.;
}

draw();


function msg_int(n)
{
    //post('n: ' + n);    
}


function list(lst) 
{
	// post('from inlet: ' + inlet);
	// post('arguments.length: ' + arguments.length);
	// post('arguments[0]: ' + arguments[0] + ', arguments[1]: ' + arguments[1]);

	// if (inlet == 0) {
	// 	createQuantumCircuitFromQasm(arguments);
	// }
	// else if (inlet == 0) {
	// 	setCurCircNodeType(arguments);
	// }
}



function draw()
{
	var theta;
	var width = box.rect[2] - box.rect[0];


	with (sketch) {
		shapeslice(180,1);
		// erase background
		glclearcolor(vbrgb[0],vbrgb[1],vbrgb[2],vbrgb[3]);
		glclear();

		glcolor(0,0,0,1);

		moveto(-1.3, -0.4);
		//font("plex");
		fontsize(24);
		text("µQiskit");

		// draw arc outline
		// glcolor(0,0,0,1);
		// circle(0.8,-90-val*360,-90);

		/*
		// fill arc
		glcolor(vfrgb);
		circle(0.7,-90-val*360,-90);
		// draw rest of outline
		if (width<=32)
			gllinewidth(1);
		else
			gllinewidth(2);
		glcolor(0,0,0,1);
		moveto(0,0);
		lineto(0,-0.8);
		moveto(0,0);
		theta = (0.75-val)*2*Math.PI;
		lineto(0.8*Math.cos(theta),0.8*Math.sin(theta));

		 */
	}
}

function bang()
{
	draw();
	refresh();
	outlet(0,val);
}

function msg_float(v)
{
	val = Math.min(Math.max(0,v),1);
	notifyclients();
	bang();
}

function set(v)
{
	val = Math.min(Math.max(0,v),1);
	notifyclients();
	draw();
	refresh();
}


function setvalueof(v)
{
	msg_float(v);
}

function getvalueof()
{
	return val;
}


function forcesize(w,h)
{
	// if (w!=h) {
	// 	h = w;
	// 	box.size(w,h);
	// }
}
forcesize.local = 1; //private

function onresize(w,h)
{
	forcesize(w,h);
	draw();
	refresh();
}
onresize.local = 1; //private


/**
 * Accept an svsim message
 */
function svsim(qasm) {
	//post('svsim: ' + arguments.length);
	//post('qasm: ' + qasm);
	var qc = createQuantumCircuitFromQasm(qasm);
	if (qc != null) {

		var statevector = simulate(qc, 0, 'statevector');
		post('\n');
		post('statevector: ' + statevector);
	}
	else {
		post('Unexpectedly, qc: ' + qc);
	}
}


/**
 * Process QASM and return a QuantumCircuit
 */
function createQuantumCircuitFromQasm(qasm) {
	var quantumCircuit = null;
	var numQuantumWires = 0;
	var numClassicalWires = 0;

	var qasmArray = qasm.split(';');

	for (var tokenIdx = 0; tokenIdx < qasmArray.length; tokenIdx++) {
		var instruction = qasmArray[tokenIdx].trim();

		if (instruction.length > 0) {
			post('\ninstruction: ' + instruction);
			var keywordArgumentArray = instruction.split(' ');
			if (keywordArgumentArray.length == 2) {
				//post('\nkeywordArgumentArray[0]: ' + keywordArgumentArray[0]);
				//post('\nkeywordArgumentArray[1]: ' + keywordArgumentArray[1]);

				var keyword = keywordArgumentArray[0];
				var argument = keywordArgumentArray[1];

				var leftBracketPos = argument.indexOf('[');
				var rightBracketPos = argument.indexOf(']');

				if (leftBracketPos > 0 && rightBracketPos > 0) {
					var argInt = parseInt(argument.substring(leftBracketPos + 1, rightBracketPos));
					if (argInt >= 0) {
						keyword = keyword.trim();
						if (keyword == 'qreg') {
							numQuantumWires = argInt;
						}
						else if (keyword == 'creg') {
							numClassicalWires = argInt;
						}
						else {
							// Subsequent instructions should be added to quantum circuit
							// so make sure it is created
							if (quantumCircuit == null) {
								quantumCircuit = new QuantumCircuit(numQuantumWires, numClassicalWires);
								//post('Creating quantumCircuit, quantumCircuit: ' + quantumCircuit.numQubits);
							}

							// TODO: Expand list of gates supported
							if (keyword == 'h') {
								quantumCircuit.h(argInt);
							}
							else if (keyword == 'x') {
								quantumCircuit.x(argInt);
							}
							else if (keyword == 'z') {
								quantumCircuit.z(argInt);
							}
							else if (keyword == 's') {
								quantumCircuit.s(argInt);
							}
							else if (keyword == 'sdg') {
								quantumCircuit.sdg(argInt);
							}
							else if (keyword == 't') {
								quantumCircuit.t(argInt);
							}
							else if (keyword == 'tdg') {
								quantumCircuit.tdg(argInt);
							}
						}
					}
				}
			}
		}
	}

	return quantumCircuit;
}


/**
 * Creates a quantum gate from an element in the circuit grid
 * and adds it to the supplied QuantumCircuit instance
 * // TODO: Support CNOT gates
 */
function addGateFromGrid(quantumCircuit, gridRow, gridCol) {
	var circNodeType = circGrid[gridRow][gridCol];

	if (circNodeType == CircuitNodeTypes.H) {
		quantumCircuit.h(gridRow);
	}
	else if (circNodeType == CircuitNodeTypes.X) {
		quantumCircuit.x(gridRow);
	}
	else if (circNodeType == CircuitNodeTypes.Z) {
		quantumCircuit.z(gridRow);
	}
	else if (circNodeType == CircuitNodeTypes.S) {
		quantumCircuit.s(gridRow);
	}
	else if (circNodeType == CircuitNodeTypes.SDG) {
		quantumCircuit.sdg(gridRow);
	}
	else if (circNodeType == CircuitNodeTypes.T) {
		quantumCircuit.t(gridRow);
	}
	else if (circNodeType == CircuitNodeTypes.TDG) {
		quantumCircuit.tdg(gridRow);
	}

	return quantumCircuit;
}


// This is a JavaScript version of Qiskit. For the full version, see qiskit.org.
// It has many more features, and access to real quantum computers.
function QuantumCircuit(n, m) {
	this.numQubits = n;
	this.numClbits = m;
	this.data = [];
}
(QuantumCircuit.prototype).x = function (q) {
	this.data.push(['x', q]);
	return this;
};
(QuantumCircuit.prototype).rx = function(theta, q) {
	this.data.push(['rx', theta, q]);
	return this;
};
(QuantumCircuit.prototype).h = function(q) {
	this.data.push(['h', q]);
	return this;
};
(QuantumCircuit.prototype).cx = function(s, t) {
	this.data.push(['cx', s, t]);
	return this;
};
(QuantumCircuit.prototype).rz = function(theta, q) {
	this.h(q);
	this.rx(theta, q);
	this.h(q);
	return this;
};
(QuantumCircuit.prototype).ry = function(theta, q) {
	this.rx(Math.PI / 2, q);
	this.rz(theta, q);
	this.rx(-Math.PI / 2, q);
	return this;
};
(QuantumCircuit.prototype).z = function(q) {
	this.rz(Math.PI, q);
	return this;
};
(QuantumCircuit.prototype).s = function(q) {
	this.rz(Math.PI / 2, q);
	return this;
};
(QuantumCircuit.prototype).sdg = function(q) {
	this.rz(-Math.PI / 2, q);
	return this;
};
(QuantumCircuit.prototype).t = function(q) {
	this.rz(Math.PI / 4, q);
	return this;
};
(QuantumCircuit.prototype).tdg = function(q) {
	this.rz(-Math.PI / 4, q);
	return this;
};
(QuantumCircuit.prototype).y = function(q) {
	this.rz(Math.PI, q);
	this.x(q);
	return this;
};
(QuantumCircuit.prototype).measure = function(q, b) {
	if (q >= this.numQubits) {
		throw 'Index for qubit out of range.';
	}
	if (b >= this.numClbits) {
		throw 'Index for output bit out of range.';
	}
	this.data.push(['m', q, b]);
	return this;
};
var simulate = function (qc, shots, get) {
	var superpose = function (x, y) {
		var sup = [
			[(x[0] + y[0]) * r2, (x[1] + y[1]) * r2],
			[(x[0] - y[0]) * r2, (x[1] - y[1]) * r2]
		];
		return sup;
	};
	var turn = function(x, y, theta) {
		var trn = [
			[
				x[0] * Math.cos(theta / 2) + y[1] * Math.sin(theta / 2),
				x[1] * Math.cos(theta / 2) - y[0] * Math.sin(theta / 2)
			],
			[
				y[0] * Math.cos(theta / 2) + x[1] * Math.sin(theta / 2),
				y[1] * Math.cos(theta / 2) - x[0] * Math.sin(theta / 2)
			]
		];
		return trn;
	};
	var k = [];
	for (j = 0; j < Math.pow(2, qc.numQubits); j++) {
		k.push([0, 0]);
	}
	k[0] = [1.0, 0.0];
	var outputMap = {};
	for (var idx = 0; idx < qc.data.length; idx++) {
		var gate = qc.data[idx];
		if (gate[0] == 'm') {
			outputMap[gate[2]] = gate[1];
		} else if (gate[0] == "x" || gate[0] == "h" || gate[0] == "rx") {
			var j = gate.slice(-1)[0];
			for (var i0 = 0; i0 < Math.pow(2, j); i0++) {
				for (var i1 = 0; i1 < Math.pow(2, qc.numQubits - j - 1); i1++) {
					var b0 = i0 + Math.pow(2, (j + 1)) * i1;
					var b1 = b0 + Math.pow(2, j);
					if (gate[0] == 'x') {
						var temp0 = k[b0];
						var temp1 = k[b1];
						k[b0] = temp1;
						k[b1] = temp0;
					} else if (gate[0] == 'h') {
						var sup = superpose(k[b0], k[b1]);
						k[b0] = sup[0];
						k[b1] = sup[1];
					} else {
						var theta = gate[1];
						var trn = turn(k[b0], k[b1], theta);
						k[b0] = trn[0];
						k[b1] = trn[1];
					}
				}
			}
		}
		else if (gate[0] == 'cx') {
			var s = gate[1];
			var t = gate[2];
			var l = Math.min(s, t);
			var h = Math.max(s, t);
			for (var i0 = 0; i0 < Math.pow(2, l); i0++) {
				for (var i1 = 0; i1 < Math.pow(2, (h - l - 1)); i1++) {
					for (var i2 = 0; i2 < Math.pow(2, (qc.numQubits - h - 1)); i2++) {
						var b0 = i0 + Math.pow(2, l + 1) * i1 + Math.pow(2, h + 1) * i2 + Math.pow(2, s);
						var b1 = b0 + Math.pow(2, t);
						var tmp0 = k[b0];
						var tmp1 = k[b1];
						k[b0] = tmp1;
						k[b1] = tmp0;
					}
				}
			}
		}
	}
	if (get == 'statevector') {
		return k;
	}
	else {
		var m = [];
		for (var idx = 0; idx < qc.numQubits; idx++) {
			m.push(false);
		}
		for (var i = 0; i < qc.data.length; i++) {
			var gate = qc.data[i];
			for (var j = 0; j < qc.numQubits; j++) {
				if (((gate.slice(-1)[0] == j) && m[j])) {
					throw ('Incorrect or missing measure command.');
				}
				m[j] = (gate[0] == 'm' && gate[1] == j && gate[2] == j);
			}
		}
		var probs = [];
		for (var i = 0; i < k.length; i++) {
			probs.push((Math.pow(k[i][0], 2) + Math.pow(k[i][1], 2)));
		}
		if (get == 'counts' || get == 'memory') {
			var me = [];
			for (var idx = 0; idx < shots; idx++) {
				var cumu = 0.0;
				var un = true;
				var r = Math.random();
				for (var j = 0; j < probs.length; j++) {
					var p = probs[j];
					cumu += p;
					if (r < cumu && un) {
						var bitStr = j.toString(2);
						var padStr = Math.pow(10, qc.numQubits - bitStr.length).toString().substr(1, qc.numQubits);
						var rawOut = padStr + bitStr;
						var outList = [];
						for (var i = 0; i < qc.numClbits; i++) {
							outList.push('0');
						}
						for (var bit in outputMap) {
							outList[qc.numClbits - 1 - bit] =
								rawOut[qc.numQubits - 1 - outputMap[bit]];
						}
						var out = outList.join("");
						me.push(out);
						un = false;
					}
				}
			}
			if (get == 'memory') {
				return m;
			} else {
				var counts = {};
				for (var meIdx = 0; meIdx < me.length; meIdx++) {
					var out = me[meIdx];
					if (counts.hasOwnProperty(out)) {
						counts[out] += 1;
					} else {
						counts[out] = 1;
					}
				}
				return counts;
			}
		}
	}
};

