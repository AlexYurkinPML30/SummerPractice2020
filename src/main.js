import { mat4 } from 'gl-matrix';

import vxShaderStr from './main.vert';
import fsShaderStr from './main.frag';

import * as dat from 'dat.gui';

import iText from './texture.jpg';

class FractalClass {
  ColorRed = 0;
  ColorBlue = 0;
  ColorGreen = 0;
  RedCoef = 0;
  GreenCoef = 0;
  BlueCoef = 0;
  isTexture = true;
  timeMs = Date.now();
  startTime = Date.now();
  mousePos;
  move = false;

  constructor() {
    var canvas = document.getElementById("webglCanvas");

    function writeMessage(canvas, message) {
      console.log(message);
    }
    
    var gui = new dat.GUI();
    gui.addColor(this.sampleText, 'color').onChange(this.setValue);
    gui.add(this.sampleText, 'red').onChange(this.setValue);
    gui.add(this.sampleText, 'blue').onChange(this.setValue);
    gui.add(this.sampleText, 'green').onChange(this.setValue);
    gui.add(this.sampleText, 'isTexture').onChange(this.setValue);
    
    function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
          return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
      };
    }

    // default cell width
    document.getElementById('inputRedCoef').value = 255;
    document.getElementById('inputBlueCoef').value = 255;
    document.getElementById('inputGreenCoef').value = 255;

    var canvas = document.getElementById('webglCanvas');
    this.initGL(canvas);
    this.initShaders();
    this.initBuffers();
    this.initTexture();

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    
    canvas.addEventListener('mousedown', (evt) => {
      this.mousePos = getMousePos(canvas, evt);
      this.move = true;
      }, false);

    canvas.addEventListener('mousemove', (evt) => {
      if (this.move) {
        var previusMousePos = this.mousePos;
        this.mousePos = getMousePos(canvas, evt);
        var message = 'Mouse position: ' + this.mousePos.x + ',' + this.mousePos.y + ' ' + evt.deltaY;
        writeMessage(canvas, message);
        var newLeft = this.draw_area.left + (previusMousePos.x - this.mousePos.x) / 500 * (this.draw_area.right - this.draw_area.left);
        var newBottom = this.draw_area.bottom + (this.mousePos.y - previusMousePos.y) / 500 * (this.draw_area.top - this.draw_area.bottom);
        var newRight = newLeft + (this.draw_area.right - this.draw_area.left);
        var newTop = newBottom + (this.draw_area.top - this.draw_area.bottom);

        this.draw_area.left = newLeft;
        this.draw_area.right = newRight;
        this.draw_area.bottom = newBottom;
        this.draw_area.top = newTop;
      }
      }, false);

    canvas.addEventListener('mouseup', (evt) => {
      this.move = false;
      }, false);

    canvas.addEventListener('wheel', (evt) => {
      this.mousePos = getMousePos(canvas, evt);
      var modifiedMousePos = {x:this.mousePos.x, y:500 - this.mousePos.y};
      this.update_borders(modifiedMousePos, evt.deltaY);
      }, false);
      
    this.tick();
  }

  initGL = (canvas) => {
    try {
      this.gl = canvas.getContext('webgl2');
      this.gl.viewportWidth = canvas.width;
      this.gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!this.gl) {
      alert('Could not initialize WebGL');
    }
  }
  
  setValue = () => {
    this.ColorRed = 16 * parseInt(this.sampleText.color[1], 16) + parseInt(this.sampleText.color[2], 16);
    this.ColorBlue = 16 * parseInt(this.sampleText.color[3], 16) + parseInt(this.sampleText.color[4], 16);
    this.ColorGreen = 16 * parseInt(this.sampleText.color[5], 16) + parseInt(this.sampleText.color[6], 16);
    this.RedCoef = this.sampleText.red;
    this.BlueCoef = this.sampleText.blue;
    this.GreenCoef = this.sampleText.green;
    this.isTexture = this.sampleText.isTexture;    
  }

  loadTexture = (fName) => {
    this.Texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.Texture);
  
    const level = 0;
    const internalFormat = this.gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = this.gl.RGBA;
    const srcType = this.gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);
    this.gl.texImage2D(this.gl.TEXTURE_2D, level, internalFormat,
      width, height, border, srcFormat, srcType,
      pixel);
  
    const image = new Image();
    image.onload = () => {
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.Texture);
      this.gl.texImage2D(this.gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);
  
      if (((image.width & (image.width - 1)) === 0) && ((image.height & (image.height - 1)) === 0)) {
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
      } else {
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      }
    };
    image.src = iText;
  }
  
  getShader = (type, str) => {
    var shader;
    shader = this.gl.createShader(type);
  
    this.gl.shaderSource(shader, str);
    this.gl.compileShader(shader);
  
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      alert(this.gl.getShaderInfoLog(shader));
      return null;
    }
  
    return shader;
  }

  isPowerOf2 = (value) => {
    return (value & (value - 1)) == 0;
  }

  initShaders = () => {
    var fragmentShader = this.getShader(this.gl.FRAGMENT_SHADER, fsShaderStr);
    var vertexShader = this.getShader(this.gl.VERTEX_SHADER, vxShaderStr);
  
    this.shaderProgram = this.gl.createProgram();
    this.gl.attachShader(this.shaderProgram, vertexShader);
    this.gl.attachShader(this.shaderProgram, fragmentShader);
    this.gl.linkProgram(this.shaderProgram);
  
    if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
      alert('Could not initialize shaders');
    }
  
    this.gl.useProgram(this.shaderProgram);
  
    this.shaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram, 'aVertexPosition');
    this.gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);
    
    this.shaderProgram.area_uniform = this.gl.getUniformLocation(this.shaderProgram, "Area");
    this.shaderProgram.uRedCoef = this.gl.getUniformLocation(this.shaderProgram, 'uRedCoef');
    this.shaderProgram.uBlueCoef = this.gl.getUniformLocation(this.shaderProgram, 'uBlueCoef');
    this.shaderProgram.uGreenCoef = this.gl.getUniformLocation(this.shaderProgram, 'uGreenCoef');
    this.shaderProgram.uTime = this.gl.getUniformLocation(this.shaderProgram, 'uTime');
    this.shaderProgram.uTexture = this.gl.getUniformLocation(this.shaderProgram, "uTexture");
    this.shaderProgram.isTexture = this.gl.getUniformLocation(this.shaderProgram, "isTexture");
    this.shaderProgram.uRed = this.gl.getUniformLocation(this.shaderProgram, "uRed");
    this.shaderProgram.uBlue = this.gl.getUniformLocation(this.shaderProgram, "uBlue");
    this.shaderProgram.uGreen = this.gl.getUniformLocation(this.shaderProgram, "uGreen");
  }
  
  setUniforms = () => {
    this.gl.uniform1i(this.shaderProgram.uRedCoef, this.RedCoef);
    this.gl.uniform1i(this.shaderProgram.uBlueCoef, this.BlueCoef);
    this.gl.uniform1i(this.shaderProgram.uGreenCoef, this.GreenCoef);
    this.gl.uniform1f(this.shaderProgram.uTime, this.timeMs);
    this.gl.uniform1i(this.shaderProgram.uRed, this.ColorRed);
    this.gl.uniform1i(this.shaderProgram.uBlue, this.ColorBlue);
    this.gl.uniform1i(this.shaderProgram.uGreen, this.ColorGreen);
    this.gl.uniform1i(this.shaderProgram.isTexture, this.isTexture);
  }
  
  initTexture = () => {
    this.loadTexture("texture.jpg");
  }
  
  initBuffers = () => {
    this.squareVertexPositionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexPositionBuffer);
    var vertices = [
      1.0, 1.0, 0.0,
      -1.0, 1.0, 0.0,
      1.0, -1.0, 0.0,
      -1.0, -1.0, 0.0
    ];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
    this.squareVertexPositionBuffer.itemSize = 3;
    this.squareVertexPositionBuffer.numItems = 4;
  }

  draw_area =
  {
      left : -1,
      right : 1,
      bottom : -1,
      top : 1,
      scale : 1
  };

  drawScene = () => {
    this.timeMs = (Date.now() - this.startTime) / 1000;
    this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.uniform4f(this.shaderProgram.area_uniform, this.draw_area.left,  this.draw_area.right, this.draw_area.bottom, this.draw_area.top);
  
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.Texture);
    this.gl.uniform1i(this.shaderProgram.uTexture, 0);
  
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexPositionBuffer);
    this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.squareVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
    this.setUniforms();
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.squareVertexPositionBuffer.numItems);
  }
  
  tick = () => {
    window.requestAnimationFrame(this.tick);
    this.updateCheckersCellWidth();
    this.drawScene();
  }
  
  update_borders = ( mouse_pos, scroll ) => {
    var new_scale = 1;//draw_area.scale;
  
    if (scroll > 0)
        new_scale *= 1 + 0.5 * scroll / 100;
    else
        new_scale /= 1 - 0.5 * scroll / 100;
  
    var newLeft = this.draw_area.left + mouse_pos.x / 500 * (this.draw_area.right - this.draw_area.left) * (1 - new_scale);
    var newBottom = this.draw_area.bottom + mouse_pos.y / 500 * (this.draw_area.top - this.draw_area.bottom) * (1 - new_scale);
    var newRight = newLeft + (this.draw_area.right - this.draw_area.left) * new_scale;
    var newTop = newBottom + (this.draw_area.top - this.draw_area.bottom) * new_scale;
  
    this.draw_area.left = newLeft;
    this.draw_area.right = newRight;
    this.draw_area.bottom = newBottom;
    this.draw_area.top = newTop;
  }
  
  sampleText = new function () {
    this.color = "#ff0000";
    this.red = 255;
    this.blue = 255;
    this.green = 255;
    this.isTexture = true;
  }();
  
  updateCheckersCellWidth = () => {
  }
}

function Start() {
  new FractalClass();
}

document.addEventListener('DOMContentLoaded', Start);
