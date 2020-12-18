/*

Quantum DJ device user interface

arguments: fgred fggreen fgblue bgred bggreen bgblue dialred dialgreen dialblue

*/

this.inlets = 2;

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
    MEASURE_Z: 13
}

var curCircNodeType = CircuitNodeTypes.EMPTY;

var NUM_GRID_ROWS = 8;
var NUM_GRID_COLS = 5;

var lowMidiPitch = 36;
var highMidiPitch = NUM_GRID_ROWS * NUM_GRID_COLS + lowMidiPitch - 1;
post('highMidiPitch: ' + highMidiPitch);


var circGrid = [
    [-1, -1, -1, -1,-1],
    [-1, -1, -1, -1,-1],
    [-1, -1, -1, -1,-1],
    [-1, -1, -1, -1,-1],
    [-1, -1, -1, -1,-1],
    [-1, -1, -1, -1,-1],
    [-1, -1, -1, -1,-1],
    [-1, -1, -1, -1,-1]
];

/**
 * Determine how many wires are represented on the circGrid
 */
function computeNumWires() {
	var numWires = 1;
	var foundPopulatedRow = false;
	var rowIdx = NUM_GRID_ROWS - 1;

	while (!foundPopulatedRow && rowIdx > 0) {
		for (var colIdx = 0; colIdx < NUM_GRID_COLS; colIdx++) {
			if (circGrid[rowIdx][colIdx] != CircuitNodeTypes.EMPTY) {
				numWires = rowIdx + 1;
				foundPopulatedRow = true;
			}
		}
		rowIdx--;
	}

	return numWires;
}


sketch.default2d();
var val = 0;
var vbrgb = [1.,1.,1.,1.];
var vfrgb = [0.5,0.5,0.5,1.];
var vrgb2 = [0.7,0.7,0.7,1.];
var last_x = 0;
var last_y = 0;

// process arguments
post('in process args');
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
	//post('from inlet: ' + inlet);
	//post('arguments.length: ' + arguments.length);
	//post('arguments[0]: ' + arguments[0] + ', arguments[1]: ' + arguments[1]);
	
	if (inlet == 0) { 
		setCircGridGate(arguments);
	}
	else if (inlet == 1) {
		setCurCircNodeType(arguments);
	}
}


/*
Given an array with midi pitch and velocity, 
populates the corresponding circuit grid element
*/
function setCircGridGate(notePitchVelocity) {
	//post('notePitchVel: ' + notePitchVel[0]);
	if (notePitchVelocity.length >= 2) {
		var pitch = notePitchVelocity[0];
		var velocity = notePitchVelocity[1];
	
		if (pitch >= lowMidiPitch && pitch <= highMidiPitch & velocity > 0) {
			var gridCol = (highMidiPitch - pitch) % NUM_GRID_COLS;
			gridCol = NUM_GRID_COLS - gridCol - 1;

      var gridRow = Math.floor((highMidiPitch - pitch) / NUM_GRID_COLS);

      circGrid[gridRow][gridCol] = curCircNodeType;
			createQuantumCircuitFromGrid();

		}

    printCircGrid();

	}
	else {
		post('Unexpected notePitchVelocity.length: ' + notePitchVelocity.length);
	}
}


/*
Given an array with controller number and value, 
sets the current circuit node type for when
a node is placed on the circuit
*/
function setCurCircNodeType(controllerNumValue) {
	//post('controllerNumValue: ' + controllerNumValue[0]);
	if (controllerNumValue.length >= 2) {
	    var contNum = controllerNumValue[0];
	    var contVal = controllerNumValue[1];
	
	    if (contVal > 0) {
		    if (contNum == 43) {
			    curCircNodeType = CircuitNodeTypes.H;
			}
			else if (contNum == 42) {
				curCircNodeType = CircuitNodeTypes.X;
			}
			else if (contNum == 41) {
				curCircNodeType = CircuitNodeTypes.Z;
			}
			else if (contNum == 40) {
				curCircNodeType = CircuitNodeTypes.S;
			}
			else if (contNum == 39) {
				curCircNodeType = CircuitNodeTypes.SDG;
			}
			else if (contNum == 38) {
				curCircNodeType = CircuitNodeTypes.T;
			}
			else if (contNum == 37) {
				curCircNodeType = CircuitNodeTypes.TDG;
			}
			else if (contNum == 36) {
				curCircNodeType = CircuitNodeTypes.EMPTY;
			}
			
      post('curCircNodeType is now ' + curCircNodeType);
		}
	

	}
	else {
		post('Unexpected controllerNumValue.length: ' + controllerNumValue.length);
	}
}



function printCircGrid() {
	post('\n');
    for (rowIdx = 0; rowIdx < NUM_GRID_ROWS; rowIdx++) {
        for (colIdx = 0; colIdx < NUM_GRID_COLS; colIdx++) {
	        post(circGrid[rowIdx][colIdx] + ' ');
	    }	
	    post('\n');
	}	
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
		moveto(0,0);
		// fill bgcircle
		glcolor(vrgb2);
		circle(0.8);
		// draw arc outline
		glcolor(0,0,0,1);
		circle(0.8,-90-val*360,-90);						
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

// all mouse events are of the form: 
// onevent <x>, <y>, <button down>, <cmd(PC ctrl)>, <shift>, <capslock>, <option>, <ctrl(PC rbutton)>
// if you don't care about the additonal modifiers args, you can simply leave them out.
// one potentially confusing thing is that mouse events are in absolute screen coordinates, 
// with (0,0) as left top, and (width,height) as right, bottom, while drawing 
// coordinates are in relative world coordinates, with (0,0) as the center, +1 top, -1 bottom,
// and x coordinates using a uniform scale based on the y coordinates. to convert between screen 
// and world coordinates, use sketch.screentoworld(x,y) and sketch.worldtoscreen(x,y,z).

function onclick(x,y,but,cmd,shift,capslock,option,ctrl)
{
	// cache mouse position for tracking delta movements
	last_x = x;
	last_y = y;
}
onclick.local = 1; //private. could be left public to permit "synthetic" events

function ondrag(x,y,but,cmd,shift,capslock,option,ctrl)
{
	var f,dy;
	
	// calculate delta movements
	dy = y - last_y;
	if (shift) { 
		// fine tune if shift key is down
		f = val - dy*0.001; 
	} else {
		f = val - dy*0.01;
	}
	msg_float(f); //set new value with clipping + refresh
	// cache mouse position for tracking delta movements
	last_x = x;
	last_y = y;
}
ondrag.local = 1; //private. could be left public to permit "synthetic" events

function ondblclick(x,y,but,cmd,shift,capslock,option,ctrl)
{
	last_x = x;
	last_y = y;
	msg_float(0); // reset dial?
}
ondblclick.local = 1; //private. could be left public to permit "synthetic" events

function forcesize(w,h)
{
	if (w!=h) {
		h = w;
		box.size(w,h);
	}
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
 * Analyze the circuit grid and return a QuantumCircuit
 */
function createQuantumCircuitFromGrid() {
	var numCircuitWires = computeNumWires();
	//var qc = new QuantumCircuit(numCircuitWires, numCircuitWires);

	post('numCircuitWires: ' + numCircuitWires);
}


/*
function q_command:create_qasm_for_node(circuit_node_pos, wire_num,
                                        include_measurement_blocks, c_if_table, tomo_meas_basis, exclude_reset_blocks)
    local qasm_str = ""
    local circuit_node_block = circuit_blocks:get_circuit_block(circuit_node_pos)
    local q_block = q_command:get_q_command_block(circuit_node_pos)

    if circuit_node_block then
        local node_type = circuit_node_block.get_node_type()

        if node_type == CircuitNodeTypes.EMPTY or
                node_type == CircuitNodeTypes.TRACE or
                node_type == CircuitNodeTypes.CTRL then
            -- Throw away a c_if if present
            c_if_table[wire_num] = ""
            -- Return immediately with zero length qasm_str
            return qasm_str
        else
            if c_if_table[wire_num] and c_if_table[wire_num] ~= "" then
                qasm_str = qasm_str .. c_if_table[wire_num] .. " "
                c_if_table[wire_num] = ""
            end
        end

        local ctrl_a = circuit_node_block.get_ctrl_a()
        local ctrl_b = circuit_node_block.get_ctrl_b()
        local swap = circuit_node_block.get_swap()

        local radians = circuit_node_block.get_radians()

        local wire_num_idx = tostring(wire_num - 1)
        local ctrl_a_idx = tostring(ctrl_a - 1)
        local ctrl_b_idx = tostring(ctrl_b - 1)
        local swap_idx = tostring(swap - 1)


        if node_type == CircuitNodeTypes.IDEN then
            -- Identity gate
            qasm_str = qasm_str .. 'id q[' .. wire_num_idx .. '];'

        elseif node_type == CircuitNodeTypes.X then
            local threshold = 0.0001
            if math.abs(radians - math.pi) <= threshold then
                if ctrl_a ~= -1 then
                    if ctrl_b ~= -1 then
                        -- Toffoli gate
                        qasm_str = qasm_str .. 'ccx q[' .. ctrl_a_idx .. '],'
                        qasm_str = qasm_str .. 'q[' .. ctrl_b_idx .. '],'
                        qasm_str = qasm_str .. 'q[' .. wire_num_idx .. '];'
                    else
                        -- Controlled X gate
                        qasm_str = qasm_str .. 'cx q[' .. ctrl_a_idx .. '],'
                        qasm_str = qasm_str .. 'q[' .. wire_num_idx .. '];'
                    end
                else
                    -- Pauli-X gate
                    qasm_str = qasm_str .. 'x q[' .. wire_num_idx .. '];'
                end
            else
                -- Rotation around X axis
                qasm_str = qasm_str .. 'rx(' .. tostring(radians) .. ') '
                qasm_str = qasm_str .. 'q[' .. wire_num_idx .. '];'
            end

        elseif node_type == CircuitNodeTypes.Y then
            local threshold = 0.0001
            if math.abs(radians - math.pi) <= threshold then
                if ctrl_a ~= -1 then
                    -- Controlled Y gate
                    qasm_str = qasm_str .. 'cy q[' .. ctrl_a_idx .. '],'
                    qasm_str = qasm_str .. 'q[' .. wire_num_idx .. '];'
                else
                    -- Pauli-Y gate
                    qasm_str = qasm_str .. 'y q[' .. wire_num_idx .. '];'
                end
            else
                -- Rotation around Y axis
                qasm_str = qasm_str .. 'ry(' .. tostring(radians) .. ') '
                qasm_str = qasm_str .. 'q[' .. wire_num_idx .. '];'
            end
        elseif node_type == CircuitNodeTypes.Z then
            local threshold = 0.0001
            if math.abs(radians - math.pi) <= threshold then
                if ctrl_a ~= -1 then
                    -- Controlled Z gate
                    qasm_str = qasm_str .. 'cz q[' .. ctrl_a_idx .. '],'
                    qasm_str = qasm_str .. 'q[' .. wire_num_idx .. '];'
                else
                    -- Pauli-Z gate
                    qasm_str = qasm_str .. 'z q[' .. wire_num_idx .. '];'
                end
            else
                if circuit_node_block.get_ctrl_a() ~= -1 then
                    -- Controlled rotation around the Z axis
                    qasm_str = qasm_str .. 'crz(' .. tostring(radians) .. ') '
                    qasm_str = qasm_str .. 'q[' .. ctrl_a_idx .. '],'
                    qasm_str = qasm_str .. 'q[' .. wire_num_idx .. '];'
                else
                    -- Rotation around Z axis
                    qasm_str = qasm_str .. 'rz(' .. tostring(radians) .. ') '
                    qasm_str = qasm_str .. 'q[' .. wire_num_idx .. '];'
                end
            end

        elseif node_type == CircuitNodeTypes.S then
            -- S gate
            qasm_str = qasm_str .. 's q[' .. wire_num_idx .. '];'
        elseif node_type == CircuitNodeTypes.SDG then
            -- S dagger gate
            qasm_str = qasm_str .. 'sdg q[' .. wire_num_idx .. '];'
        elseif node_type == CircuitNodeTypes.T then
            -- T gate
            qasm_str = qasm_str .. 't q[' .. wire_num_idx .. '];'
        elseif node_type == CircuitNodeTypes.TDG then
            -- T dagger gate
            qasm_str = qasm_str .. 'tdg q[' .. wire_num_idx .. '];'
        elseif node_type == CircuitNodeTypes.H then
            if ctrl_a ~= -1 then
                -- Controlled Hadamard
                qasm_str = qasm_str .. 'ch q[' .. ctrl_a_idx .. '],'
                qasm_str = qasm_str .. 'q[' .. wire_num_idx .. '];'
            else
                -- Hadamard gate
                qasm_str = qasm_str .. 'h q[' .. wire_num_idx .. '];'
            end
        elseif node_type == CircuitNodeTypes.BARRIER then
            -- barrier
            qasm_str = qasm_str .. 'barrier q[' .. wire_num_idx .. '];'
        elseif node_type == CircuitNodeTypes.MEASURE_Z then
            if include_measurement_blocks then
                -- Measurement block
                --qasm_str = qasm_str .. 'measure q[' .. wire_num_idx .. '] -> c[' .. wire_num_idx .. '];'
                qasm_str = qasm_str .. 'measure q[' .. wire_num_idx .. '] -> c' .. wire_num_idx .. '[0];'
            end
        elseif node_type == CircuitNodeTypes.QUBIT_BASIS then
            if not exclude_reset_blocks then
                qasm_str = qasm_str .. 'reset q[' .. wire_num_idx .. '];'
                if circuit_node_block.get_node_name():sub(-2) == "_1" then
                    qasm_str = qasm_str .. 'x q[' .. wire_num_idx .. '];'
                end
            end
        elseif node_type == CircuitNodeTypes.CONNECTOR_M then
            -- Connector to wire extension, so traverse
            local wire_extension_block_pos = circuit_node_block.get_wire_extension_block_pos()

            if wire_extension_block_pos.x ~= 0 then
                local wire_extension_block = circuit_blocks:get_circuit_block(wire_extension_block_pos)
                local wire_extension_dir_str = wire_extension_block.get_circuit_dir_str()
                local wire_extension_circuit_pos = wire_extension_block.get_circuit_pos()

                if wire_extension_circuit_pos.x ~= 0 then
                    local wire_extension_circuit = circuit_blocks:get_circuit_block(wire_extension_circuit_pos)
                    local extension_wire_num = wire_extension_circuit.get_circuit_specs_wire_num_offset() + 1
                    local extension_num_columns = wire_extension_circuit.get_circuit_num_columns()
                    for column_num = 1, extension_num_columns do

                        -- Assume dir_str is "+Z"
                        local circ_node_pos = {x = wire_extension_circuit_pos.x + column_num - 1,
                                               y = wire_extension_circuit_pos.y,
                                               z = wire_extension_circuit_pos.z}

                        if wire_extension_dir_str == "+X" then
                            circ_node_pos = {x = wire_extension_circuit_pos.x,
                                             y = wire_extension_circuit_pos.y,
                                             z = wire_extension_circuit_pos.z - column_num + 1}
                        elseif wire_extension_dir_str == "-X" then
                            circ_node_pos = {x = wire_extension_circuit_pos.x,
                                             y = wire_extension_circuit_pos.y,
                                             z = wire_extension_circuit_pos.z + column_num - 1}
                        elseif wire_extension_dir_str == "-Z" then
                            circ_node_pos = {x = wire_extension_circuit_pos.x - column_num + 1,
                                             y = wire_extension_circuit_pos.y,
                                             z = wire_extension_circuit_pos.z}
                        end

                        qasm_str = qasm_str ..
                                q_command:create_qasm_for_node(circ_node_pos,
                                        extension_wire_num, include_measurement_blocks,
                                        c_if_table, tomo_meas_basis, exclude_reset_blocks)
                    end
                end
            end

        elseif node_type == CircuitNodeTypes.SWAP and swap ~= -1 then
            if ctrl_a ~= -1 then
                -- Controlled Swap
                qasm_str = qasm_str .. 'cswap q[' .. ctrl_a_idx .. '],'
                qasm_str = qasm_str .. 'q[' .. wire_num_idx .. '],'
                qasm_str = qasm_str .. 'q[' .. swap_idx .. '];'
            else
                -- Swap gate
                qasm_str = qasm_str .. 'swap q[' .. wire_num_idx .. '],'
                qasm_str = qasm_str .. 'q[' .. swap_idx .. '];'
            end

        elseif node_type == CircuitNodeTypes.C_IF then
            local node_name = circuit_node_block.get_node_name()
            local register_idx_str = node_name:sub(35, 35)
            local eq_val_str = node_name:sub(39, 39)
            c_if_table[wire_num] = "if(c" .. register_idx_str .. "==" ..
                    eq_val_str .. ")"

        elseif node_type == CircuitNodeTypes.BLOCH_SPHERE or
                node_type == CircuitNodeTypes.COLOR_QUBIT then
            if include_measurement_blocks then
                if tomo_meas_basis == 1 then
                    -- Measure in the X basis (by first rotating -pi/2 radians on Y axis)
                    qasm_str = qasm_str .. 'ry(' .. tostring(-math.pi / 2) .. ') '
                    qasm_str = qasm_str .. 'q[' .. wire_num_idx .. '];'
                elseif tomo_meas_basis == 2 then
                    -- Measure in the Y basis (by first rotating pi/2 radians on X axis)
                    qasm_str = qasm_str .. 'rx(' .. tostring(math.pi / 2) .. ') '
                    qasm_str = qasm_str .. 'q[' .. wire_num_idx .. '];'
                elseif tomo_meas_basis == 3 then
                    -- Measure in the Z basis (no rotation necessary)
                end
                qasm_str = qasm_str .. 'measure q[' .. wire_num_idx .. '] -> c' .. wire_num_idx .. '[0];'
            end
        end

    else
        print("Unknown gate!")
    end

    if LOG_DEBUG then
        minetest.debug("End of create_qasm_for_node(), qasm_str:\n" .. qasm_str)
    end
    return qasm_str
end

 */
