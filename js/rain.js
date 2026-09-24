(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  var RAIN_ASSET_BASE = (function () {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i += 1) {
      var src = scripts[i].src || "";
      if (src.indexOf("rain.js") !== -1) {
        return src.replace(/js\/rain\.js.*$/, "");
      }
    }
    return "";
  })();

  var VERT_SHADER =
    "precision mediump float;\n" +
    "attribute vec2 a_position;\n" +
    "attribute vec2 a_texCoord;\n" +
    "varying vec2 v_texCoord;\n" +
    "void main() {\n" +
    "  gl_Position = vec4(a_position, 0.0, 1.0);\n" +
    "  v_texCoord = a_texCoord;\n" +
    "}";

  var FRAG_SHADER =
    "precision mediump float;\n" +
    "uniform sampler2D u_waterMap;\n" +
    "uniform sampler2D u_textureShine;\n" +
    "uniform sampler2D u_textureFg;\n" +
    "uniform sampler2D u_textureBg;\n" +
    "varying vec2 v_texCoord;\n" +
    "uniform vec2 u_resolution;\n" +
    "uniform vec2 u_parallax;\n" +
    "uniform float u_parallaxFg;\n" +
    "uniform float u_parallaxBg;\n" +
    "uniform float u_textureRatio;\n" +
    "uniform bool u_renderShine;\n" +
    "uniform bool u_renderShadow;\n" +
    "uniform float u_minRefraction;\n" +
    "uniform float u_refractionDelta;\n" +
    "uniform float u_brightness;\n" +
    "uniform float u_alphaMultiply;\n" +
    "uniform float u_alphaSubtract;\n" +
    "vec4 blend(vec4 bg, vec4 fg) {\n" +
    "  vec3 bgm = bg.rgb * bg.a;\n" +
    "  vec3 fgm = fg.rgb * fg.a;\n" +
    "  float ia = 1.0 - fg.a;\n" +
    "  float a = (fg.a + bg.a * ia);\n" +
    "  vec3 rgb = a != 0.0 ? (fgm + bgm * ia) / a : vec3(0.0);\n" +
    "  return vec4(rgb, a);\n" +
    "}\n" +
    "vec2 pixel() { return vec2(1.0, 1.0) / u_resolution; }\n" +
    "vec2 parallax(float v) { return u_parallax * pixel() * v; }\n" +
    "vec2 texCoord() {\n" +
    "  return vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y) / u_resolution;\n" +
    "}\n" +
    "vec2 scaledTexCoord() {\n" +
    "  float ratio = u_resolution.x / u_resolution.y;\n" +
    "  vec2 scale = vec2(1.0, 1.0);\n" +
    "  vec2 offset = vec2(0.0, 0.0);\n" +
    "  float ratioDelta = ratio - u_textureRatio;\n" +
    "  if (ratioDelta >= 0.0) { scale.y = (1.0 + ratioDelta); offset.y = ratioDelta / 2.0; }\n" +
    "  else { scale.x = (1.0 - ratioDelta); offset.x = -ratioDelta / 2.0; }\n" +
    "  return (texCoord() + offset) / scale;\n" +
    "}\n" +
    "vec4 fgColor(float x, float y) {\n" +
    "  float p2 = u_parallaxFg * 2.0;\n" +
    "  vec2 scale = vec2((u_resolution.x + p2) / u_resolution.x, (u_resolution.y + p2) / u_resolution.y);\n" +
    "  vec2 scaled = texCoord() / scale;\n" +
    "  vec2 offset = vec2((1.0 - (1.0 / scale.x)) / 2.0, (1.0 - (1.0 / scale.y)) / 2.0);\n" +
    "  return texture2D(u_waterMap, (scaled + offset) + (pixel() * vec2(x, y)) + parallax(u_parallaxFg));\n" +
    "}\n" +
    "void main() {\n" +
    "  vec4 bg = texture2D(u_textureBg, scaledTexCoord() + parallax(u_parallaxBg));\n" +
    "  vec4 cur = fgColor(0.0, 0.0);\n" +
    "  float d = cur.b;\n" +
    "  float x = cur.g;\n" +
    "  float y = cur.r;\n" +
    "  float a = clamp(cur.a * u_alphaMultiply - u_alphaSubtract, 0.0, 1.0);\n" +
    "  vec2 refraction = (vec2(x, y) - 0.5) * 2.0;\n" +
    "  vec2 refractionPos = scaledTexCoord() + (pixel() * refraction * (u_minRefraction + (d * u_refractionDelta))) + parallax(u_parallaxBg - u_parallaxFg);\n" +
    "  vec4 tex = texture2D(u_textureFg, refractionPos);\n" +
    "  vec4 fg = vec4(tex.rgb * u_brightness, a);\n" +
    "  gl_FragColor = blend(bg, fg);\n" +
    "}";

  function createCanvas(width, height) {
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  function random(from, to, interpolation) {
    if (from == null) {
      from = 0;
      to = 1;
    } else if (to == null) {
      to = from;
      from = 0;
    }
    if (!interpolation) interpolation = function (n) { return n; };
    return from + interpolation(Math.random()) * (to - from);
  }

  function chance(c) {
    return random() <= c;
  }

  function times(n, fn) {
    for (var i = 0; i < n; i++) fn(i);
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }

  function getContext(canvas, options) {
    var names = ["webgl", "experimental-webgl"];
    var context = null;
    names.some(function (name) {
      try {
        context = canvas.getContext(name, options || {});
      } catch (e) {}
      return context != null;
    });
    return context;
  }

  function createShader(gl, script, type) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, script);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createProgram(gl, vert, frag) {
    var program = gl.createProgram();
    gl.attachShader(program, createShader(gl, vert, gl.VERTEX_SHADER));
    gl.attachShader(program, createShader(gl, frag, gl.FRAGMENT_SHADER));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return null;
    }

    var positionLocation = gl.getAttribLocation(program, "a_position");
    var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

    var texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW);
    if (texCoordLocation >= 0) {
      gl.enableVertexAttribArray(texCoordLocation);
      gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    }

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    return program;
  }

  function GL(canvas, options, vert, frag) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    this.gl = getContext(canvas, options);
    this.program = createProgram(this.gl, vert, frag);
    this.gl.useProgram(this.program);
  }

  GL.prototype.createTexture = function (source, i) {
    var gl = this.gl;
    var texture = gl.createTexture();
    gl.activeTexture(gl["TEXTURE" + i]);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (source) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    }
    return texture;
  };

  GL.prototype.createUniform = function (type, name) {
    var location = this.gl.getUniformLocation(this.program, "u_" + name);
    var args = [location].concat([].slice.call(arguments, 2));
    this.gl["uniform" + type].apply(this.gl, args);
  };

  GL.prototype.activeTexture = function (i) {
    this.gl.activeTexture(this.gl["TEXTURE" + i]);
  };

  GL.prototype.updateTexture = function (source) {
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, source);
  };

  GL.prototype.useProgram = function (program) {
    this.program = program;
    this.gl.useProgram(program);
  };

  GL.prototype.draw = function () {
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1
    ]), this.gl.STATIC_DRAW);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  };

  var Drop = {
    x: 0, y: 0, r: 0, spreadX: 0, spreadY: 0,
    momentum: 0, momentumX: 0, lastSpawn: 0, nextSpawn: 0,
    parent: null, isNew: true, killed: false, shrink: 0
  };

  var DROP_SIZE = 64;

  function Raindrops(width, height, scale, dropAlpha, dropColor, options) {
    this.width = width;
    this.height = height;
    this.scale = scale;
    this.dropAlpha = dropAlpha;
    this.dropColor = dropColor;
    this.dropletsPixelDensity = 1;
    this.dropletsCounter = 0;
    this.textureCleaningIterations = 0;
    this.lastRender = null;
    this.running = true;
    this.options = Object.assign({
      minR: 10,
      maxR: 40,
      maxDrops: 900,
      rainChance: 0.3,
      rainLimit: 3,
      dropletsRate: 50,
      dropletsSize: [2, 4],
      dropletsCleaningRadiusMultiplier: 0.43,
      raining: true,
      globalTimeScale: 1,
      trailRate: 1,
      autoShrink: true,
      spawnArea: [-0.1, 0.95],
      trailScaleRange: [0.2, 0.5],
      collisionRadius: 0.65,
      collisionRadiusIncrease: 0.01,
      dropFallMultiplier: 1,
      collisionBoostMultiplier: 0.05,
      collisionBoost: 1
    }, options || {});
    this.init();
  }

  Raindrops.prototype.init = function () {
    this.canvas = createCanvas(this.width, this.height);
    this.ctx = this.canvas.getContext("2d");
    this.droplets = createCanvas(this.width * this.dropletsPixelDensity, this.height * this.dropletsPixelDensity);
    this.dropletsCtx = this.droplets.getContext("2d");
    this.drops = [];
    this.dropsGfx = [];
    this.renderDropsGfx();
    this.seedDrizzle();
    this.update();
  };

  Object.defineProperty(Raindrops.prototype, "deltaR", {
    get: function () { return this.options.maxR - this.options.minR; }
  });
  Object.defineProperty(Raindrops.prototype, "area", {
    get: function () { return (this.width * this.height) / this.scale; }
  });
  Object.defineProperty(Raindrops.prototype, "areaMultiplier", {
    get: function () { return Math.sqrt(this.area / (1024 * 768)); }
  });

  Raindrops.prototype.renderDropsGfx = function () {
    var dropBuffer = createCanvas(DROP_SIZE, DROP_SIZE);
    var dropBufferCtx = dropBuffer.getContext("2d");
    var self = this;
    this.dropsGfx = Array.apply(null, Array(255)).map(function (_, i) {
      var drop = createCanvas(DROP_SIZE, DROP_SIZE);
      var dropCtx = drop.getContext("2d");
      dropBufferCtx.clearRect(0, 0, DROP_SIZE, DROP_SIZE);
      dropBufferCtx.globalCompositeOperation = "source-over";
      dropBufferCtx.drawImage(self.dropColor, 0, 0, DROP_SIZE, DROP_SIZE);
      dropBufferCtx.globalCompositeOperation = "screen";
      dropBufferCtx.fillStyle = "rgba(0,0," + i + ",1)";
      dropBufferCtx.fillRect(0, 0, DROP_SIZE, DROP_SIZE);
      dropCtx.globalCompositeOperation = "source-over";
      dropCtx.drawImage(self.dropAlpha, 0, 0, DROP_SIZE, DROP_SIZE);
      dropCtx.globalCompositeOperation = "source-in";
      dropCtx.drawImage(dropBuffer, 0, 0, DROP_SIZE, DROP_SIZE);
      return drop;
    });
    this.clearDropletsGfx = createCanvas(128, 128);
    var clearCtx = this.clearDropletsGfx.getContext("2d");
    clearCtx.fillStyle = "#000";
    clearCtx.beginPath();
    clearCtx.arc(64, 64, 64, 0, Math.PI * 2);
    clearCtx.fill();
  };

  Raindrops.prototype.seedDrizzle = function () {
    var self = this;
    times(320, function () {
      self.drawDroplet(
        random(self.width / self.scale),
        random(self.height / self.scale),
        random(self.options.dropletsSize[0], self.options.dropletsSize[1], function (n) { return n * n; })
      );
    });
    times(18, function () {
      var r = random(self.options.minR, self.options.maxR, function (n) { return Math.pow(n, 3); });
      var drop = self.createDrop({
        x: random(self.width / self.scale),
        y: random((self.height / self.scale) * 0.05, (self.height / self.scale) * 0.9),
        r: r,
        momentum: random(0.2, 1.4),
        spreadX: 0.4,
        spreadY: 0.6
      });
      if (drop) self.drops.push(drop);
    });
  };

  Raindrops.prototype.drawDrop = function (ctx, drop) {
    if (!this.dropsGfx.length) return;
    var r = drop.r;
    var scaleX = 1;
    var scaleY = 1.5;
    var d = Math.max(0, Math.min(1, ((r - this.options.minR) / this.deltaR) * 0.9));
    d *= 1 / (((drop.spreadX + drop.spreadY) * 0.5) + 1);
    d = Math.floor(d * (this.dropsGfx.length - 1));
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(
      this.dropsGfx[d],
      (drop.x - (r * scaleX * (drop.spreadX + 1))) * this.scale,
      (drop.y - (r * scaleY * (drop.spreadY + 1))) * this.scale,
      (r * 2 * scaleX * (drop.spreadX + 1)) * this.scale,
      (r * 2 * scaleY * (drop.spreadY + 1)) * this.scale
    );
  };

  Raindrops.prototype.drawDroplet = function (x, y, r) {
    this.drawDrop(this.dropletsCtx, Object.assign(Object.create(Drop), {
      x: x * this.dropletsPixelDensity,
      y: y * this.dropletsPixelDensity,
      r: r * this.dropletsPixelDensity
    }));
  };

  Raindrops.prototype.clearDroplets = function (x, y, r) {
    r = r == null ? 30 : r;
    var ctx = this.dropletsCtx;
    ctx.globalCompositeOperation = "destination-out";
    ctx.drawImage(
      this.clearDropletsGfx,
      (x - r) * this.dropletsPixelDensity * this.scale,
      (y - r) * this.dropletsPixelDensity * this.scale,
      (r * 2) * this.dropletsPixelDensity * this.scale,
      (r * 2) * this.dropletsPixelDensity * this.scale * 1.5
    );
  };

  Raindrops.prototype.createDrop = function (options) {
    if (this.drops.length >= this.options.maxDrops * this.areaMultiplier) return null;
    return Object.assign(Object.create(Drop), options);
  };

  Raindrops.prototype.updateRain = function (timeScale) {
    var rainDrops = [];
    if (!this.options.raining) return rainDrops;
    var limit = this.options.rainLimit * timeScale * this.areaMultiplier;
    var count = 0;
    while (chance(this.options.rainChance * timeScale * this.areaMultiplier) && count < limit) {
      count++;
      var r = random(this.options.minR, this.options.maxR, function (n) { return Math.pow(n, 3); });
      var drop = this.createDrop({
        x: random(this.width / this.scale),
        y: random((this.height / this.scale) * this.options.spawnArea[0], (this.height / this.scale) * this.options.spawnArea[1]),
        r: r,
        momentum: 1 + ((r - this.options.minR) * 0.1) + random(2),
        spreadX: 1.5,
        spreadY: 1.5
      });
      if (drop) rainDrops.push(drop);
    }
    return rainDrops;
  };

  Raindrops.prototype.updateDroplets = function (timeScale) {
    var self = this;
    if (this.textureCleaningIterations > 0) {
      this.textureCleaningIterations -= 1 * timeScale;
      this.dropletsCtx.globalCompositeOperation = "destination-out";
      this.dropletsCtx.fillStyle = "rgba(0,0,0," + (0.05 * timeScale) + ")";
      this.dropletsCtx.fillRect(0, 0, this.width * this.dropletsPixelDensity, this.height * this.dropletsPixelDensity);
    }
    if (this.options.raining) {
      this.dropletsCounter += this.options.dropletsRate * timeScale * this.areaMultiplier;
      times(this.dropletsCounter, function () {
        self.dropletsCounter--;
        self.drawDroplet(
          random(self.width / self.scale),
          random(self.height / self.scale),
          random(self.options.dropletsSize[0], self.options.dropletsSize[1], function (n) { return n * n; })
        );
      });
    }
    this.ctx.drawImage(this.droplets, 0, 0, this.width, this.height);
  };

  Raindrops.prototype.updateDrops = function (timeScale) {
    var self = this;
    this.updateDroplets(timeScale);
    var newDrops = this.updateRain(timeScale);

    this.drops.sort(function (a, b) {
      var va = (a.y * (self.width / self.scale)) + a.x;
      var vb = (b.y * (self.width / self.scale)) + b.x;
      return va > vb ? 1 : va === vb ? 0 : -1;
    });

    this.drops.forEach(function (drop, i) {
      if (drop.killed) return;

      if (chance((drop.r - (self.options.minR * self.options.dropFallMultiplier)) * (0.1 / self.deltaR) * timeScale)) {
        drop.momentum += random((drop.r / self.options.maxR) * 4);
      }
      if (self.options.autoShrink && drop.r <= self.options.minR && chance(0.05 * timeScale)) {
        drop.shrink += 0.01;
      }
      drop.r -= drop.shrink * timeScale;
      if (drop.r <= 0) drop.killed = true;

      if (self.options.raining) {
        drop.lastSpawn += drop.momentum * timeScale * self.options.trailRate;
        if (drop.lastSpawn > drop.nextSpawn) {
          var trailDrop = self.createDrop({
            x: drop.x + (random(-drop.r, drop.r) * 0.1),
            y: drop.y - (drop.r * 0.01),
            r: drop.r * random(self.options.trailScaleRange[0], self.options.trailScaleRange[1]),
            spreadY: drop.momentum * 0.1,
            parent: drop
          });
          if (trailDrop) {
            newDrops.push(trailDrop);
            drop.r *= Math.pow(0.97, timeScale);
            drop.lastSpawn = 0;
            drop.nextSpawn = random(self.options.minR, self.options.maxR) - (drop.momentum * 2 * self.options.trailRate) + (self.options.maxR - drop.r);
          }
        }
      }

      drop.spreadX *= Math.pow(0.4, timeScale);
      drop.spreadY *= Math.pow(0.7, timeScale);

      var moved = drop.momentum > 0;
      if (moved && !drop.killed) {
        drop.y += drop.momentum * self.options.globalTimeScale;
        drop.x += drop.momentumX * self.options.globalTimeScale;
        if (drop.y > (self.height / self.scale) + drop.r) drop.killed = true;
      }

      var checkCollision = (moved || drop.isNew) && !drop.killed;
      drop.isNew = false;
      if (checkCollision) {
        self.drops.slice(i + 1, i + 70).forEach(function (drop2) {
          if (drop === drop2 || drop.r <= drop2.r || drop.parent === drop2 || drop2.parent === drop || drop2.killed) return;
          var dx = drop2.x - drop.x;
          var dy = drop2.y - drop.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < (drop.r + drop2.r) * (self.options.collisionRadius + (drop.momentum * self.options.collisionRadiusIncrease * timeScale))) {
            var a1 = Math.PI * drop.r * drop.r;
            var a2 = Math.PI * drop2.r * drop2.r;
            var targetR = Math.sqrt((a1 + (a2 * 0.8)) / Math.PI);
            if (targetR > self.options.maxR) targetR = self.options.maxR;
            drop.r = targetR;
            drop.momentumX += dx * 0.1;
            drop.spreadX = 0;
            drop.spreadY = 0;
            drop2.killed = true;
            drop.momentum = Math.max(drop2.momentum, Math.min(40, drop.momentum + (targetR * self.options.collisionBoostMultiplier) + self.options.collisionBoost));
          }
        });
      }

      drop.momentum -= Math.max(1, (self.options.minR * 0.5) - drop.momentum) * 0.1 * timeScale;
      if (drop.momentum < 0) drop.momentum = 0;
      drop.momentumX *= Math.pow(0.7, timeScale);

      if (!drop.killed) {
        newDrops.push(drop);
        if (moved && self.options.dropletsRate > 0) {
          self.clearDroplets(drop.x, drop.y, drop.r * self.options.dropletsCleaningRadiusMultiplier);
        }
        self.drawDrop(self.ctx, drop);
      }
    });

    this.drops = newDrops;
  };

  Raindrops.prototype.update = function () {
    if (!this.running) return;
    this.ctx.clearRect(0, 0, this.width, this.height);
    var now = Date.now();
    if (this.lastRender == null) this.lastRender = now;
    var timeScale = (now - this.lastRender) / ((1 / 60) * 1000);
    if (timeScale > 1.1) timeScale = 1.1;
    timeScale *= this.options.globalTimeScale;
    this.lastRender = now;
    this.updateDrops(timeScale);
    requestAnimationFrame(this.update.bind(this));
  };

  Raindrops.prototype.stop = function () {
    this.running = false;
  };

  function RainRenderer(canvas, canvasLiquid, imageFg, imageBg, options) {
    this.canvas = canvas;
    this.canvasLiquid = canvasLiquid;
    this.imageFg = imageFg;
    this.imageBg = imageBg;
    this.parallaxX = 0;
    this.parallaxY = 0;
    this.running = true;
    this.options = Object.assign({
      minRefraction: 256,
      maxRefraction: 512,
      brightness: 1.04,
      alphaMultiply: 6,
      alphaSubtract: 3,
      parallaxBg: 5,
      parallaxFg: 20
    }, options || {});
    this.init();
  }

  RainRenderer.prototype.init = function () {
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.gl = new GL(this.canvas, { alpha: false }, VERT_SHADER, FRAG_SHADER);
    var gl = this.gl;
    gl.createUniform("1i", "waterMap", 0);
    gl.createUniform("2f", "resolution", this.width, this.height);
    gl.createUniform("1f", "textureRatio", this.imageBg.width / this.imageBg.height);
    gl.createUniform("1i", "renderShine", 0);
    gl.createUniform("1i", "renderShadow", 0);
    gl.createUniform("1f", "minRefraction", this.options.minRefraction);
    gl.createUniform("1f", "refractionDelta", this.options.maxRefraction - this.options.minRefraction);
    gl.createUniform("1f", "brightness", this.options.brightness);
    gl.createUniform("1f", "alphaMultiply", this.options.alphaMultiply);
    gl.createUniform("1f", "alphaSubtract", this.options.alphaSubtract);
    gl.createUniform("1f", "parallaxBg", this.options.parallaxBg);
    gl.createUniform("1f", "parallaxFg", this.options.parallaxFg);
    gl.createTexture(null, 0);

    this.textures = [
      { name: "textureShine", img: createCanvas(2, 2) },
      { name: "textureFg", img: this.imageFg },
      { name: "textureBg", img: this.imageBg }
    ];
    var self = this;
    this.textures.forEach(function (texture, i) {
      gl.createTexture(texture.img, i + 1);
      gl.createUniform("1i", texture.name, i + 1);
    });
    this.draw();
  };

  RainRenderer.prototype.draw = function () {
    if (!this.running) return;
    this.gl.useProgram(this.gl.program);
    this.gl.createUniform("2f", "parallax", this.parallaxX, this.parallaxY);
    this.gl.activeTexture(0);
    this.gl.updateTexture(this.canvasLiquid);
    this.gl.draw();
    requestAnimationFrame(this.draw.bind(this));
  };

  RainRenderer.prototype.stop = function () {
    this.running = false;
  };

  var headerDrizzle = {
    raining: true,
    minR: 7,
    maxR: 22,
    rainChance: 0.35,
    rainLimit: 3,
    dropletsRate: 24,
    dropletsSize: [2.2, 4.2],
    trailRate: 1,
    trailScaleRange: [0.2, 0.4],
    collisionRadius: 0.45,
    collisionRadiusIncrease: 0.0002,
    dropletsCleaningRadiusMultiplier: 0.28,
    maxDrops: 400
  };

  var footerDrizzle = {
    raining: true,
    minR: 10,
    maxR: 40,
    rainChance: 0.18,
    rainLimit: 3,
    dropletsRate: 14,
    dropletsSize: [3.5, 6],
    trailRate: 1,
    trailScaleRange: [0.2, 0.45],
    collisionRadius: 0.45,
    collisionRadiusIncrease: 0.0002,
    dropletsCleaningRadiusMultiplier: 0.28
  };

  function paintScene(kind, width, height, grain) {
    var scene = createCanvas(width, height);
    var ctx = scene.getContext("2d");
    var sky = kind === "frost"
      ? ctx.createLinearGradient(0, 0, width, height)
      : ctx.createLinearGradient(0, 0, 0, height);

    if (kind === "frost") {
      sky.addColorStop(0, "#f8fbfe");
      sky.addColorStop(0.45, "#e7f1f8");
      sky.addColorStop(1, "#cfe0ee");
    } else {
      sky.addColorStop(0, "#eff6ff");
      sky.addColorStop(1, "#dbeafe");
    }

    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    if (grain) {
      ctx.globalAlpha = kind === "frost" ? 0.14 : 0.22;
      ctx.globalCompositeOperation = "multiply";
      for (var y = 0; y < height; y += grain.height) {
        for (var x = 0; x < width; x += grain.width) {
          ctx.drawImage(grain, x, y);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
    return scene;
  }

  function ensureCanvas(parent) {
    var canvas = parent.querySelector(":scope > .rain-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.className = "rain-canvas";
      canvas.setAttribute("aria-hidden", "true");
      var bg = parent.querySelector(":scope > .footer-bg");
      if (bg && bg.nextSibling) parent.insertBefore(canvas, bg.nextSibling);
      else parent.insertBefore(canvas, parent.firstChild);
    }
    return canvas;
  }

  function createRain(parent, images, config) {
    var canvas = ensureCanvas(parent);
    var raindrops = null;
    var renderer = null;

    function sizeCanvas() {
      var dpi = window.devicePixelRatio || 1;
      var width = parent.clientWidth;
      var height = parent.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * dpi));
      canvas.height = Math.max(1, Math.floor(height * dpi));
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      return dpi;
    }

    function start() {
      try {
        if (raindrops) raindrops.stop();
        if (renderer) renderer.stop();
        if (!parent.clientWidth || !parent.clientHeight) return;

        var dpi = sizeCanvas();
        raindrops = new Raindrops(canvas.width, canvas.height, dpi, images.dropAlpha, images.dropColor, config.options);

        var aspect = parent.clientHeight / Math.max(1, parent.clientWidth);
        var bgW = 512;
        var bgH = Math.max(1, Math.round(512 * aspect));
        var fgW = 160;
        var fgH = Math.max(1, Math.round(160 * aspect));
        var scene = paintScene(config.scene, bgW, bgH, images.grain);

        var textureBg = createCanvas(bgW, bgH);
        var bgCtx = textureBg.getContext("2d");
        bgCtx.filter = "blur(7px)";
        bgCtx.drawImage(scene, 0, 0);

        var textureFg = createCanvas(fgW, fgH);
        textureFg.getContext("2d").drawImage(scene, 0, 0, fgW, fgH);

        renderer = new RainRenderer(canvas, raindrops.canvas, textureFg, textureBg, {
          brightness: config.scene === "frost" ? 1.08 : 1.04,
          alphaMultiply: 6,
          alphaSubtract: 3,
          parallaxBg: 0,
          parallaxFg: 0
        });
      } catch (err) {
        console.error("Drizzle rain failed to start", err);
      }
    }

    return { start: start, el: parent };
  }

  document.querySelectorAll(".nav-bar .rain-canvas, .nav-fixed .rain-canvas, .w-nav .rain-canvas").forEach(function (el) {
    el.remove();
  });

  Promise.all([
    loadImage(RAIN_ASSET_BASE + "images/rain/drop-alpha.png"),
    loadImage(RAIN_ASSET_BASE + "images/rain/drop-color.png"),
    loadImage(RAIN_ASSET_BASE + "images/grain-tile.png")
  ]).then(function (imgs) {
    var assets = {
      dropAlpha: imgs[0],
      dropColor: imgs[1],
      grain: imgs[2]
    };
    var mounts = [
      { el: document.querySelector(".footer"), scene: "ice", options: footerDrizzle }
    ];
    var instances = mounts.filter(function (m) { return m.el; }).map(function (m) {
      return createRain(m.el, assets, m);
    });
    if (!instances.length) return;

    function startAll() {
      instances.forEach(function (inst) { inst.start(); });
    }

    startAll();

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(startAll, 200);
    });

    if (window.ResizeObserver) {
      instances.forEach(function (inst) {
        var skip = true;
        var timer = null;
        var ro = new ResizeObserver(function () {
          if (skip) { skip = false; return; }
          clearTimeout(timer);
          timer = setTimeout(inst.start, 150);
        });
        ro.observe(inst.el);
      });
    }
  }).catch(function (err) {
    console.error("Drizzle rain failed to load", err);
  });
})();
