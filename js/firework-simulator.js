/***** TITLE *****/
// Firework Simulator
/*****************/

/***** AUTHOR *****/
// Bryce Paubel
/******************/

/***** DESCRIPTION *****/
// Displays simple fireworks
/***********************/

/***** COPYRIGHT *****/
// Copyright 2022 Bryce Paubel
/*********************/

/***** LICENSING *****/
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License along
// with this program; if not, write to the Free Software Foundation, Inc.,
// 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
/*********************/

// Vertex shader
const V_SHADER_SOURCE = `#version 300 es
	in vec4 a_p;		// Position
	in float a_p_s;		// Point size
	in vec2 a_t_coord;

	out vec2 v_t_coord;
	
	uniform mat4 u_pv_mat;
	uniform mat4 u_m_mat;
	
	void main() {
		gl_PointSize = a_p_s;
		gl_Position = u_pv_mat * u_m_mat * a_p;

		v_t_coord = a_t_coord;
	}
`

// Fragment shader
const F_SHADER_SOURCE = `#version 300 es
	precision highp float;
	out vec4 out_c; // Output color

	in vec2 v_t_coord;

	uniform sampler2D u_img;
	
	void main() {
		out_c = texture(u_img, v_t_coord);
	}
`

// Configuration object
let config = {
	MOUSE: null,
	MOUSE_MOVEMENT: [],
	SELECTION: 0,
	PARTICLES: 50,
	COLOR: 180,
	CIRCLE: false,
}

// Main program
function main() {
	// Animation ID
	let animID = 1;

	// Particle array
	let particles = [];
	
	// Firework array
	let fireworks = [];
	
	// Initialize canvas
	let canvas = document.getElementById("canvas");
	canvas.margin = 0;
	canvas.width = 1.0 * window.innerWidth;
	canvas.height = 1.01 * window.innerHeight;
	
	// Get rendering context and initialize shaders
	let webGL = canvas.getContext("webgl2");
	initShaders(webGL, V_SHADER_SOURCE, F_SHADER_SOURCE);

	// Resize the canvas if the window changes
	window.onresize = function() {
		canvas.width = 1.0 * window.innerWidth;
		canvas.height = 1.01 * window.innerHeight;
		webGL.viewport(0, 0, canvas.width, canvas.height);
	}
	

	// Set firework button
	let fireworkButton= document.getElementById("firework");
	fireworkButton.onclick = function() { fireFirework(fireworks) };

	setupImage(webGL);
	setupBuffers(webGL);
	
	// Set up the special blending for the black background
	webGL.enable(webGL.DEPTH_TEST);
	webGL.depthMask(false);
	webGL.clearColor(0, 0, 0, 1);
	webGL.enable(webGL.BLEND);
	webGL.blendEquation(webGL.FUNC_ADD);
	webGL.blendFunc(webGL.SRC_ALPHA, webGL.ONE_MINUS_SRC_ALPHA);

	// Update function for animation frames
	let update = function() {
		// Cancel previous frame
		cancelAnimationFrame(animID);
		if (webGL.texturesReady) {

			// Clear the canvas
			webGL.clearColor(0.0, 0.0, 0.0, 1.0);
			webGL.clear(webGL.COLOR_BUFFER_BIT);

			// Draw the particles
			if (fireworks.length !== 0) {
				drawFireworks(canvas, webGL, fireworks);
			}
		}
		
		// Request a new frame
		animID = requestAnimationFrame(update);
	}
	
	// Call the update function to start animating
	update();
}

// Fire a firework
function fireFirework(fireworksArray) {
	let initialParticles = [];
	for (let i = 0; i < 10; i++) {
		initialParticles.push(new Particle(1, [0, 0, 0], [0, 0.1, 0], [1, 1, 1, 1], 1));
	}
	
	fireworksArray.push(new Firework(initialParticles));
}

// Draw a particle array
function drawFireworks(canvas, webGL, fireworksArray) {
	updateFireworks(fireworksArray);
	
	let particles = [];
	
	for (let i = 0; i < fireworksArray.length; i++) {
		for (let j = 0; j < fireworksArray[i].particles.length; j++) {
			particles.push(fireworksArray[i].particles[j]);
		}
	}
	
	for (let i = 0; i < particles.length; i++) {
		drawParticle(webGL, particles[i], canvas);
	}
}

// update fireworks
function updateFireworks(fireworksArray) {
	for (let i = 0; i < fireworksArray.length; i++) {
		updateFirework(fireworksArray[i]);
	}
}

// update firework
function updateFirework(firework) {
	for (let i = 0; i < firework.particles.length; i++) {
		firework.particles[i].position[0] += firework.particles[i].velocity[0];
		firework.particles[i].position[1] += firework.particles[i].velocity[1];
		firework.particles[i].position[2] += firework.particles[i].velocity[2];
	}
}

// Set up the image
function setupImage(gl) {
	gl.texturesReady = false;
	texture = gl.createTexture();
	img = new Image();
	img.crossOrigin = "";
	img.src = "img/particle.png";
	img.onload = function () {
		gl.activeTexture(gl.TEXTURE0);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

		gl.texturesReady = true;
	}
}

function setupBuffers(gl) {
	let a_t_coord = gl.getAttribLocation(gl.program, "a_t_coord");
	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1]), gl.STATIC_DRAW);
	gl.vertexAttribPointer(a_t_coord, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_t_coord);

	// Vertex shader pointers
	let a_p = gl.getAttribLocation(gl.program, "a_p");

	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 
		0.5, 0.5, 0, -0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, 0.5, 0]), gl.STATIC_DRAW);
	gl.vertexAttribPointer(a_p, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_p);

}

// Draw a singular particle
function drawParticle(gl, particle, canvas) {
	let m_mat = new Matrix4();
	let pv_mat = new Matrix4();

	let ar = canvas.width / canvas.height;

	m_mat.setIdentity();
	m_mat.setTranslate(particle.position[0], particle.position[1], particle.position[2]);
	m_mat.scale((1 / ar) * particle.scale, (1 / ar) * particle.scale, (1 / ar) * particle.scale);
	
	pv_mat.setPerspective(30, canvas.width/canvas.height, 1, 10000);
	pv_mat.lookAt(0, 5, 20, 0, 0, 0, 0, 1, 0);

	let u_m_mat = gl.getUniformLocation(gl.program, "u_m_mat");
	gl.uniformMatrix4fv(u_m_mat, false, m_mat.elements);
	
	let u_pv_mat = gl.getUniformLocation(gl.program, "u_pv_mat");
	gl.uniformMatrix4fv(u_pv_mat, false, pv_mat.elements);

	let u_img = gl.getUniformLocation(gl.program, "u_img");
	gl.uniform1i(u_img, 0);

	// Vertex shader pointers
	let a_p = gl.getAttribLocation(gl.program, "a_p");
	let a_p_s = gl.getAttribLocation(gl.program, "a_p_s");

	gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// Particle constructor
function Particle(size, position, velocity, color, scale) {
	this.size = size;
	this.position = position;
	this.velocity = velocity;
	this.color = color;
	this.scale = scale;
}

// Firework constructor
function Firework(particles) {
	this.particles = particles;
}

// Quick distance check
function distance(x1, y1, x2, y2) {
	return Math.sqrt((x1 - x2) ** 2  + (y1 - y2) ** 2);
}

// Clamp function, same as GLSL
function clamp(value, min, max) {
	if (value <= min) {
		return min;
	} else if (value >= max) {
		return max;
	} else {
		return value;
	}
}

// HSV to RGB color conversion
// Based off of this code: https://axonflux.com/handy-rgb-to-hsl-and-rgb-to-hsv-color-model-c
/**
 * Converts an HSV color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes h, s, and v are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 1].
 */
function hsvToRgb(h, s, v) {
    var r, g, b;
    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch(i % 6){
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return [r, g, b];
}