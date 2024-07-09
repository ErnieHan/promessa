var DiamondColorDict = {
  aq: [[0, 0.6, 1], 0.75, 0.2],
  at: [[0.47, 0.3, 0.67], 1, 0.6],
  cr: [[0.93, 0.52, 0.19], 0.75, 0.5],
  dd: [[1.1, 1.1, 1.1], 1.25, 1],
  em: [[0.2, 1, 0.45], 1, 0.6],
  fm: [[0.84, 0.84, 0.84], 0.5, 1],
  ga: [[0.83, 0.23, 0], 0.5, 0.8],
  pe: [[0.6, 0.88, 0], 0.75, 0.3],
  ru: [[1, 0, 0.3], 1.25, 0.8],
  sa: [[0, 0.2, 1], 1.25, 0.8],
  tu: [[0.7, 0, 0.53], 0.75, 0.3],
  tz: [[0.57, 0.53, 0.9], 1, 0.5]
}

var RingModel = function (scene) {
  this.geometry = null
  this.base_ring = null
  this.radius = 10.0
  this.material = null
  this.mesh = null

  this.mirror_mesh = null
  this.diamond_mesh = null
  this.inner_diamond_mesh = null
  this.isShowMirror = false
  // this.polygons = [];
  var scope = this

  this.envMap = new THREE.Texture()
  this.bumpMap = new THREE.Texture()
  this.logoMap = new THREE.Texture()
  this.sandMap = new THREE.Texture()
  this.diffuseColor = new THREE.Color().setRGB(1.354, 1.3666, 1.37)
  this.position = new THREE.Vector3()
  this.rotation = new THREE.Euler()

  this.shapeType = 'p'
  this.widthType = '35'
  this.colorType = 'kw'

  this.surfaceType = 2 // surfaceType:0-Smooth,  1-hammer, 2-linear
  this.isShowOutterDiamond = 0
  this.isShowInnerDiamond = 0

  this.innerDiamondColor = 'dd'
  this.outterDiamondColor = 'dd'

  this.shaderVertex = ''
  this.shaderFragment = ''

  this.bump_width = 0
  this.bump_height = 0
  this.bump_data = null
  this.bump_dirty = false
  this.bump_filename = ''
  this.env_filename = ''
  this.logo_filename = ''
  this.sand_filename = ''

  this.ring_surface_width = 1.25
  this.ring_surface_radius = 10.0
  this.front_hole_width = 1.25
  this.prong_diamond_number = 25
  this.prong_side_offset = 0.35
  this.prong_height = 0.1
  this.ring_size = 15
  this.prong_diamond_size = 0.005
  this.prong_diamonds_model = new ProngDiamondModel(scene)

  this.prong_diamonds_type = 1
  this.is_show_prong = 0
  this.show_diamonds_type = 0

  this.initProngDiamonds = function () {
    this.prong_diamonds_model.init(function () {
      scope.makeProngDimonds()
    })
  }

  // this.shadow_mesh = null;
  this.initShader = function () {
    if (typeof RingShaderDict != 'undefined') {
      scope.shaderVertex = RingShaderDict['vertexShader'].join('\n')
      scope.shaderFragment = RingShaderDict['fragmentShader'].join('\n')
    } else {
      $.ajax({
        url: 'shaders/ringshader_vert.glsl',
        success: function (res) {
          // console.log(res);
          scope.shaderVertex = res
          if (scope.isShaderReady()) {
            scope.updateMesh()
          }
        },
        dataType: 'text'
      })

      $.ajax({
        url: 'shaders/ringshader_frag.glsl',
        success: function (res) {
          scope.shaderFragment = res
          if (scope.isShaderReady()) {
            scope.updateMesh()
          }
        },
        dataType: 'text'
      })
    }
  }
  this.initShader()

  this.isShaderReady = function () {
    // return false;
    if (this.shaderVertex.length > 0 && this.shaderFragment.length > 0) {
      return true
    } else {
      return false
    }
  }

  this.loadDiamond = function (callback) {
    var diamondPath = 'models/diamond.stl'
    var path = 'textures/bk/cube02_'
    var format = '.jpg'
    var urls = [
      path + '0' + format,
      path + '1' + format,
      path + '2' + format,
      path + '3' + format,
      path + '4' + format,
      path + '5' + format
    ]

    var textureCube = THREE.ImageUtils.loadTextureCube(urls)
    textureCube.format = THREE.RGBFormat
    textureCube.mapping = THREE.CubeReflectionMapping
    var stl_loader = new THREE.STLLoader()

    stl_loader.load(diamondPath, function (geometry) {
      var shaderGenerator = new DiamondShaderGenerator()
      var material = shaderGenerator.generateShader(geometry)
      // console.log(geometry.boundingBox.center());
      var center = geometry.boundingBox.getCenter(new THREE.Vector3())
      material.uniforms.iChannel0.value = textureCube
      var g_diamond_mesh = new THREE.Mesh(geometry, material)

      var rotation = new THREE.Euler()
      rotation.set(scope.rotation.x, scope.rotation.y, scope.rotation.z + Math.PI * 0.75)
      var offset = new THREE.Vector3(0, 10.8, 0.0)
      offset.applyEuler(rotation)
      g_diamond_mesh.position.set(scope.position.x + offset.x, scope.position.y + offset.y, scope.position.z + offset.z)
      g_diamond_mesh.rotation.copy(rotation)

      var uMatrix = new THREE.Matrix4()
      uMatrix.makeRotationFromEuler(scope.rotation)
      g_diamond_mesh.material.uniforms['uMatrix'].value = uMatrix.getInverse(uMatrix)
      g_diamond_mesh.scale.set(0.3, 0.3, 0.3)

      g_diamond_mesh.visible = false

      scope.diamond_mesh = g_diamond_mesh

      material = shaderGenerator.generateShader(geometry)
      material.uniforms.iChannel0.value = textureCube
      scope.inner_diamond_mesh = new THREE.Mesh(geometry.clone(), material)
      offset = new THREE.Vector3(0.0, -8.0, 0.0)
      var eular = new THREE.Euler()
      eular.set(scope.rotation.x, scope.rotation.y, scope.rotation.z - Math.PI * 0.25)

      offset.applyEuler(eular)
      scope.inner_diamond_mesh.position.set(
        scope.position.x + offset.x,
        scope.position.y + offset.y,
        scope.position.z + offset.z
      )
      scope.inner_diamond_mesh.rotation.set(scope.rotation.x, scope.rotation.y, scope.rotation.z + Math.PI * 1.25)
      scope.inner_diamond_mesh.scale.set(0.3, 0.3, 0.3)
      uMatrix = new THREE.Matrix4()
      uMatrix.makeRotationFromEuler(scope.inner_diamond_mesh.rotation)
      scope.inner_diamond_mesh.material.uniforms['uMatrix'].value = uMatrix.getInverse(uMatrix)

      scope.changeInnerDiamondColor(scope.innerDiamondColor)
      scope.changeOutterDiamondColor(scope.outterDiamondColor)
      scope.inner_diamond_mesh.visible = false

      if (callback) {
        callback(scope.diamond_mesh, scope.inner_diamond_mesh)
      }
    })
  }
  this.loadEnvMap = function (filename) {
    if (this.env_filename == filename) return
    this.env_filename = filename
    var loader = new THREE.TextureLoader()
    var texture = scope.envMap

    if (scope.envMap.image === undefined) {
      texture = THREE.ImageUtils.loadTexture(filename)
      texture.format = THREE.RGBAFormat
      texture.magFilter = THREE.LinearFilter
      texture.minFilter = THREE.LinearMipMapLinearFilter
      texture.mapping = THREE.SphericalReflectionMapping
      texture.wrapS = 1001
      texture.wrapT = 1001
      texture.anisotropy = true
      scope.envMap = texture
    } else {
      loader.load(filename, function (texture) {
        texture.format = THREE.RGBAFormat
        texture.magFilter = THREE.LinearFilter
        texture.minFilter = THREE.LinearMipMapLinearFilter
        texture.mapping = THREE.SphericalReflectionMapping
        texture.wrapS = 1001
        texture.wrapT = 1001
        texture.anisotropy = true
        scope.envMap = texture
      })
    }
  }

  this.prongOffsetX = function () {
    return -(this.ring_surface_width - this.prong_side_offset - this.front_hole_width * 0.5)
  }
  this.setProngHeight = function (ph) {
    this.prong_height = ph
    this.material.uniforms.prong_height.value = scope.prong_height
  }

  this.loadLogoMap = function (filename) {
    if (this.logo_filename == filename) return
    console.log('load logo map', filename)
    this.logo_filename = filename
    var texture = scope.logoMap
    var loader = new THREE.TextureLoader()

    if (scope.logoMap.image === undefined) {
      texture = THREE.ImageUtils.loadTexture(filename)
      texture.format = THREE.RGBFormat
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping
      texture.magFilter = THREE.LinearFilter
      texture.minFilter = THREE.NearestFilter
      texture.repeat.set(10, 10)
      texture.anisotropy = true
      scope.logoMap = texture
    } else {
      loader.load(filename, function (texture) {
        texture.format = THREE.RGBFormat
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.magFilter = THREE.LinearFilter
        texture.minFilter = THREE.NearestFilter
        texture.repeat.set(10, 10)
        texture.anisotropy = true
        scope.logoMap = texture
        if (scope.material && scope.material.uniforms) {
          scope.material.uniforms.logoMap.value = scope.logoMap
        }
      })
    }
  }
  this.updateGeometry = function () {
    this.makeRing()
    if (this.mesh) {
      this.mesh.geometry = this.geometry
    }
  }

  this.loadSandMap = function (filename) {
    if (this.sand_filename == filename) return
    this.sand_filename = filename
    var loader = new THREE.ImageLoader()
    var texture = scope.sandMap
    loader.load(filename, function (image) {
      texture.image = image
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping
      texture.needsUpdate = true
    })
  }
  this.loadBumpMap = function (filename, repeat) {
    if (this.bump_filename == filename) return
    this.bump_filename = filename
    var loader = new THREE.ImageLoader()
    var texture = scope.bumpMap
    if (!repeat) {
      repeat = [1, 1]
    }
    this.bump_dirty = false
    scope.bumpMap.repeat.set(repeat[0], repeat[1])
    loader.load(filename, function (image) {
      texture.image = image
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping
      texture.repeat.set(repeat[0], repeat[1])
      texture.needsUpdate = true

      // var canvas = document.createElement("canvas");
      // canvas.width = image.width;
      // canvas.height = image.height;
      // var ctx = canvas.getContext("2d");
      // ctx.drawImage(image,0,0);

      // scope.bump_width = image.width;
      // scope.bump_height = image.height;

      // scope.bump_data = ctx.getImageData(0,0,image.width,image.height).data;
      if (scope.surfaceType == 3) {
        // console.log(scope.bump_data);
      }
      // scope.bump_dirty = true;
      // if(scope.mesh) scope.updateGeometry();
    })
  }

  this.setProngDiamondsPosition = function () {
    this.prong_diamonds_model.mesh_group.position.copy(this.position)
    this.prong_diamonds_model.mesh_group.rotation.copy(this.rotation)
  }
  this.makeProngDimonds = function () {
    let ringModel = this
    let prong_diamonds_model = this.prong_diamonds_model

    if (this.is_show_prong) {
      prong_diamonds_model.make_diamonds(
        ringModel.prong_diamond_number,
        ringModel.ring_surface_radius,
        ringModel.prongOffsetX(),
        ringModel.prong_diamond_size,
        ringModel.prong_diamonds_type,
        ringModel.shapeType,
        ringModel.widthType
      )
    }

    ringModel.setProngHeight(prong_diamonds_model.prong_height)

    this.setProngDiamondsPosition()

    prong_diamonds_model.setVisible(this.is_show_prong)
  }
  this.showOutterDiamond = function (t) {
    this.isShowOutterDiamond = t
    var outter_offset = -0.4
    if (this.widthType == '25') {
      outter_offset = -0.51
    } else if (this.shapeType != 'p') {
      outter_offset -= 0.075
    }
    if (this.isShowOutterDiamond == 1) {
      var rotation = new THREE.Euler()
      rotation.set(scope.rotation.x, scope.rotation.y, scope.rotation.z + Math.PI * 0.5)
      this.diamond_mesh.rotation.copy(rotation)
      var offset = new THREE.Vector3(0, this.radius + outter_offset, 0.0)
      offset.applyEuler(this.diamond_mesh.rotation)
      this.diamond_mesh.position.set(
        scope.position.x + offset.x,
        scope.position.y + offset.y,
        scope.position.z + offset.z
      )
      this.diamond_mesh.visible = true
      this.updateMaterial()
    } else {
      this.diamond_mesh.visible = false
      this.mesh.material.uniforms.uHoleRadius.value = -1.0
      // this.updateMaterial();
    }
  }

  this.showInnerDiamond = function (t) {
    this.isShowInnerDiamond = t
    var inner_offset = -1.32
    if (this.widthType == '25') {
      inner_offset = -1.22
    } else if (this.widthType == '40') {
      inner_offset = -1.7
      if (this.shapeType == 'p') {
        inner_offset = -1.25
      }
    } else if (this.widthType == '50') {
      inner_offset = -1.7
      if (this.shapeType == 'p') {
        inner_offset = -1.65
      }
    } else {
      if (this.shapeType == 'p') {
        inner_offset = -1.25
      }
    }

    if (this.isShowInnerDiamond == 1) {
      offset = new THREE.Vector3(0, -(this.radius + inner_offset), 0.0)
      if (scope.is_show_prong && scope.prong_diamonds_type == 0) {
        scope.inner_diamond_mesh.rotation.set(scope.rotation.x, scope.rotation.y, scope.rotation.z + Math.PI * 0.75)
      } else {
        scope.inner_diamond_mesh.rotation.set(scope.rotation.x, scope.rotation.y, scope.rotation.z + Math.PI)
      }
      offset.applyEuler(scope.inner_diamond_mesh.rotation)
      this.inner_diamond_mesh.visible = true
      this.inner_diamond_mesh.position.set(
        scope.position.x + offset.x,
        scope.position.y + offset.y,
        scope.position.z + offset.z
      )
      this.updateMaterial()
    } else {
      this.inner_diamond_mesh.visible = false
      this.mesh.material.uniforms.uHoleRadius1.value = -1.0
    }
  }

  this.makeRing = function () {
    if (!scope.base_ring) return
    var rlen = scope.base_ring.length
    var rsize = 90
    if (this.surfaceType == 3) {
      rsize = 180
    }
    if (this.prong_diamonds_type == 1) {
      rsize = 180
    }
    var angle = (2 * Math.PI) / rsize
    var max_px = 0.0
    var min_px = 20.0
    var nor_px = 0.0
    var max_dy = 0.0
    var max_py = -10.0
    var min_py = 10.0
    var max_uv = 0.0
    function getRadius() {
      var radius = 0.0
      for (var i = 1; i < scope.base_ring.length; i++) {
        var pos = scope.base_ring[i]['pos']
        var uv_y = scope.base_ring[i]['uv']
        if (uv_y > max_uv) {
          max_uv = uv_y
        }
        if (Math.abs(pos[0]) > radius) {
          radius = Math.abs(pos[0])
          max_px = pos[0]
          var nor = scope.base_ring[i]['nor']
          nor_px = nor[0]
          var pos1 = scope.base_ring[i - 1]['pos']
          var dy = pos[1] - pos1[1]
          max_dy = dy
        }

        if (pos[1] > max_py) max_py = pos[1]
        if (pos[1] < min_py) min_py = pos[1]
      }
      // console.log(max_px, max_dy,nor_px);

      if (max_px < 0) {
        for (var i = 0; i < scope.base_ring.length; i++) {
          var pos = scope.base_ring[i]['pos']
          var nor = scope.base_ring[i]['nor']
          // console.log(nor[0]);
          scope.base_ring[i]['pos'] = [-pos[0], pos[1], pos[2]]
          scope.base_ring[i]['nor'] = [-nor[0], nor[1], nor[2]]
          if (scope.base_ring[i]['type'] == 1 && scope.shapeType == 'p' && scope.widthType == '50') {
            scope.base_ring[i]['nor'] = [nor[0], nor[1], nor[2]]
          }
        }
        max_px = -max_px
        nor_px = -nor_px
      }
      if (max_dy < 0.0) {
        for (var i = 0; i < scope.base_ring.length / 2; i++) {
          var tmp = scope.base_ring[i]
          scope.base_ring[i] = scope.base_ring[scope.base_ring.length - 1 - i]
          scope.base_ring[scope.base_ring.length - 1 - i] = tmp
        }
      }

      for (let i = 0; i < scope.base_ring.length; i++) {
        let tmp = scope.base_ring[i]['pos']
        if (tmp[0] < min_px) min_px = tmp[0]
      }
      // console.log("++++",max_uv*2, 10 * 2 * Math.PI)
      return radius
    }
    var radius = getRadius()
    var dx = this.radius - radius
    if (max_px < 0) {
      dx = -dx
    }
    console.log(min_px, max_px, max_py, min_py)
    this.ring_surface_width = max_py
    // console.trace();
    var base_ring = scope.base_ring

    if (this.surfaceType == 3) {
      base_ring = []
      var subNum = 5
      for (var i = 0; i < scope.base_ring.length; i++) {
        base_ring.push(scope.base_ring[i])
        if (scope.base_ring[i].type == 1) {
          var p0 = scope.base_ring[i]['pos']
          var n0 = scope.base_ring[i]['nor']
          var uv0 = scope.base_ring[i]['uv']
          var p1 = scope.base_ring[(i + 1) % scope.base_ring.length]['pos']
          var n1 = scope.base_ring[(i + 1) % scope.base_ring.length]['nor']
          var uv1 = scope.base_ring[(i + 1) % scope.base_ring.length]['uv']

          for (var j = 1; j < subNum; j++) {
            var p2 = [0.0, 0.0, 0.0]
            var n2 = [0.0, 0.0, 0.0]
            var uv2 = 0.0
            var a = (subNum - j) / (subNum + 0.000000001)
            for (var k = 0; k < 3; k++) {
              p2[k] = p0[k] * a + p1[k] * (1.0 - a)
              n2[k] = n0[k] * a + n1[k] * (1.0 - a)
            }
            uv2 = uv0 * a + uv1 * (1.0 - a)
            base_ring.push({ pos: p2, nor: n2, uv: uv2, type: 1 })
          }
        }
      }
    }
    if (this.shapeType == 'r') {
      let b_ring = []
      for (let i = 0; i < scope.base_ring.length; i++) {
        if (base_ring[i].type == 1) {
          let p0 = base_ring[i]['pos']
          let n0 = base_ring[i]['nor']
          let uv0 = base_ring[i]['uv']

          if (Math.abs(p0[1]) <= this.ring_surface_width - this.prong_side_offset) {
            let p1 = [max_px, p0[1], 0]

            b_ring.push({ pos: p1, nor: n0, uv: uv0, type: 1 })
          } else {
            b_ring.push(base_ring[i])
          }
        } else {
          b_ring.push(base_ring[i])
        }
      }
      // base_ring = b_ring;
    }

    rlen = base_ring.length
    radius = this.radius
    var tlen = 2.0 * Math.PI * radius
    var tval = 0.0
    function getBumpValue(uv) {
      if (!scope.bump_data) return 0.0
      var tuv = uv.clone()
      tuv = tuv.applyMatrix3(scope.bumpMap.matrix)
      var x = tuv.x - Math.floor(tuv.x)
      var y = tuv.y - Math.floor(tuv.y)

      x = Math.floor(scope.bump_width * x)
      y = Math.floor(scope.bump_height * y)
      return scope.bump_data[4 * (y * scope.bump_width + x) + 1] - 255.0
    }

    // this.ring_surface_radius = dx + max_px;

    let mx_right = max_px
    let mx_left = max_px
    let my_right = -max_py + scope.prong_side_offset
    let my_left = -(max_py - scope.prong_side_offset - scope.front_hole_width)

    mx_right = -10
    mx_left = -10
    for (let i = 0; i < base_ring.length; i++) {
      let v0 = base_ring[i]['pos']
      let v1 = base_ring[(i + 1) % base_ring.length]['pos']

      let tl = v1[1] - v0[1]
      let t0_left = my_left - v0[1]
      let t1_left = my_left - v1[1]

      if (t0_left * t1_left <= 0) {
        let a = Math.abs(t0_left / tl)
        let px_left = v0[0] * (1 - a) + v1[0] * a

        if (px_left > mx_left) mx_left = px_left
      }

      let t0_right = my_right - v0[1]
      let t1_right = my_right - v1[1]

      if (t0_right * t1_right <= 0) {
        let a = Math.abs(t0_right / tl)

        let px_right = v0[0] * (1 - a) + v1[0] * a

        if (px_right > mx_right) mx_right = px_right
      }
    }
    let mm_x = mx_left < mx_right ? mx_left : mx_right
    this.ring_surface_radius = dx + mm_x

    var t_ring = [
      { pos: [mx_right, my_right, 0], nor: [0, -1, 0], uv: 0.1 },
      {
        pos: [mx_right - 0.01, my_right - 0.02, 0],
        nor: [-0.77, -0.77, 0],
        uv: 0.1
      },
      {
        pos: [mx_right - 0.05, my_right - 0.02, 0],
        nor: [0.0, -1.0, 0.0],
        uv: 0.2
      },
      {
        pos: [mx_right - 0.28, my_right - 0.02, 0],
        nor: [-0.77, -0.77, 0.0],
        uv: 0.3
      },
      {
        pos: [mx_right - 0.28, my_right - 0.01 - 0.02, 0],
        nor: [-1.0, 0.0, 0.0],
        uv: 0.4
      },
      {
        pos: [mx_right - 0.28, my_left + 0.01 + 0.02, 0],
        nor: [-1.0, 0.0, 0.0],
        uv: 0.7
      },
      {
        pos: [mx_right - 0.28, my_left + 0.02, 0],
        nor: [-0.77, 0.77, 0.0],
        uv: 0.8
      },
      {
        pos: [mx_left - 0.05, my_left + 0.02, 0],
        nor: [0.0, 1.0, 0.0],
        uv: 0.9
      },
      {
        pos: [mx_left - 0.01, my_left + 0.02, 0],
        nor: [-0.77, 0.77, 0.0],
        uv: 1.0
      },
      {
        pos: [mx_left, my_left, 0],
        nor: [-1.0, 0.0, 0.0],
        uv: 1.0
      }
    ]
    for (let i in t_ring) {
      if (Math.abs(t_ring[i]['nor'][0]) > 0.9) {
        t_ring[i]['uv'] = t_ring[i]['pos'][1] / tlen
      }
    }

    function getVertex(i, j) {
      var pos, nor, uv_y
      if (j < base_ring.length) {
        pos = base_ring[j]['pos']
        nor = base_ring[j]['nor']
        uv_y = base_ring[j]['uv']
      } else {
        pos = t_ring[j - base_ring.length]['pos']
        nor = t_ring[j - base_ring.length]['nor']
        uv_y = t_ring[j - base_ring.length]['uv']
      }

      pos = new THREE.Vector3(pos[0] + dx, pos[2], pos[1])
      nor = new THREE.Vector3(nor[0], nor[2], nor[1])

      if (scope.prong_diamonds_type == 1 && scope.is_show_prong) {
        let t_angle = angle * i

        if (t_angle > Math.PI) {
          t_angle = t_angle - Math.PI * 2.0
        }

        if (Math.abs(t_angle) > Math.PI - 0.5 / radius) {
          let mid_px = max_px * 0.7 + min_px * 0.3
          if (pos.x > mid_px + dx) {
            pos.x = mid_px + dx + (pos.x - (mid_px + dx)) * 0.3
          }
        }
      }

      var quat = new THREE.Quaternion()
      if (max_dy > 0) {
        quat.setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle * i)
      } else {
        quat.setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle * i)
      }
      // console.log(pos);
      // console.log(nor);

      pos = pos.applyQuaternion(quat)
      nor = nor.applyQuaternion(quat)

      // console.log(pos);
      // console.log(nor);
      var uv_x = i / (rsize + 0.00000001)
      var uv = new THREE.Vector2(uv_x + 1.0, uv_y)

      if (j < base_ring.length) {
        if (base_ring[j]['type'] == 1 || (scope.surfaceType == 3 && base_ring[j]['type'] % 2 == 1)) {
          uv_y = uv_y / tlen
          var uv_x = i / (rsize + 0.00000001)
          uv = new THREE.Vector2(uv_x, uv_y)
        } else if (base_ring[j]['type'] == 2 && scope.isShaderReady()) {
          uv_y = uv_y / tlen
          var uv_x = -(angle * i) / (2.0 * Math.PI)
          uv = new THREE.Vector2(uv_x, uv_y)
        } else {
          uv = new THREE.Vector2(0.0, 0.0)
        }
      }

      return [pos, nor, uv]
    }
    var zlen = t_ring.length

    var faceNum = rsize * (rlen + zlen - 1) * 2

    var ff_len = rlen + zlen - 1
    var vertices = new Float32Array(faceNum * 3 * 3)
    var normals = new Float32Array(faceNum * 3 * 3)
    var uvs = new Float32Array(faceNum * 3 * 2)
    for (var i = 0; i < rsize; i++) {
      for (var j = 0; j < ff_len; j++) {
        let v0, v1, v2, v3
        if (j >= rlen) {
          v0 = getVertex(i, j)
          v1 = getVertex(i + 1, j)
          v2 = getVertex(i + 1, j + 1)
          v3 = getVertex(i, j + 1)
        } else {
          v0 = getVertex(i, j)
          v1 = getVertex(i + 1, j)
          v2 = getVertex(i + 1, (j + 1) % rlen)
          v3 = getVertex(i, (j + 1) % rlen)
        }

        if (v0[2].x == 0.0 || v1[2].x == 0.0 || v2[2].x == 0.0 || v3[2].x == 0.0) {
          v0[2].set(0.0, 0.0)
          v1[2].set(0.0, 0.0)
          v2[2].set(0.0, 0.0)
          v3[2].set(0.0, 0.0)
        }
        if (v0[2].x < 0.0 || v1[2].x < 0.0 || v2[2].x < 0.0 || v3[2].x < 0.0) {
          if (v0[2].x > 0) {
            v0[2].x = -v0[2].x
          }
          if (v1[2].x > 0) {
            v1[2].x = -v1[2].x
          }
          if (v2[2].x > 0) {
            v2[2].x = -v2[2].x
          }
          if (v3[2].x > 0) {
            v3[2].x = -v3[2].x
          }
        }

        var fid = 2 * (i * ff_len + j)

        // v0 v1 v2
        vertices[3 * 3 * fid + 3 * 0 + 0] = v0[0].x
        vertices[3 * 3 * fid + 3 * 0 + 1] = v0[0].y
        vertices[3 * 3 * fid + 3 * 0 + 2] = v0[0].z

        vertices[3 * 3 * fid + 3 * 1 + 0] = v1[0].x
        vertices[3 * 3 * fid + 3 * 1 + 1] = v1[0].y
        vertices[3 * 3 * fid + 3 * 1 + 2] = v1[0].z

        vertices[3 * 3 * fid + 3 * 2 + 0] = v2[0].x
        vertices[3 * 3 * fid + 3 * 2 + 1] = v2[0].y
        vertices[3 * 3 * fid + 3 * 2 + 2] = v2[0].z

        normals[3 * 3 * fid + 3 * 0 + 0] = v0[1].x
        normals[3 * 3 * fid + 3 * 0 + 1] = v0[1].y
        normals[3 * 3 * fid + 3 * 0 + 2] = v0[1].z

        normals[3 * 3 * fid + 3 * 1 + 0] = v1[1].x
        normals[3 * 3 * fid + 3 * 1 + 1] = v1[1].y
        normals[3 * 3 * fid + 3 * 1 + 2] = v1[1].z

        normals[3 * 3 * fid + 3 * 2 + 0] = v2[1].x
        normals[3 * 3 * fid + 3 * 2 + 1] = v2[1].y
        normals[3 * 3 * fid + 3 * 2 + 2] = v2[1].z

        uvs[2 * 3 * fid + 2 * 0 + 0] = v0[2].x
        uvs[2 * 3 * fid + 2 * 0 + 1] = v0[2].y

        uvs[2 * 3 * fid + 2 * 1 + 0] = v1[2].x
        uvs[2 * 3 * fid + 2 * 1 + 1] = v1[2].y

        uvs[2 * 3 * fid + 2 * 2 + 0] = v2[2].x
        uvs[2 * 3 * fid + 2 * 2 + 1] = v2[2].y

        fid = 2 * (i * ff_len + j) + 1

        // v0 v1 v2
        vertices[3 * 3 * fid + 3 * 0 + 0] = v2[0].x
        vertices[3 * 3 * fid + 3 * 0 + 1] = v2[0].y
        vertices[3 * 3 * fid + 3 * 0 + 2] = v2[0].z

        vertices[3 * 3 * fid + 3 * 1 + 0] = v3[0].x
        vertices[3 * 3 * fid + 3 * 1 + 1] = v3[0].y
        vertices[3 * 3 * fid + 3 * 1 + 2] = v3[0].z

        vertices[3 * 3 * fid + 3 * 2 + 0] = v0[0].x
        vertices[3 * 3 * fid + 3 * 2 + 1] = v0[0].y
        vertices[3 * 3 * fid + 3 * 2 + 2] = v0[0].z

        normals[3 * 3 * fid + 3 * 0 + 0] = v2[1].x
        normals[3 * 3 * fid + 3 * 0 + 1] = v2[1].y
        normals[3 * 3 * fid + 3 * 0 + 2] = v2[1].z

        normals[3 * 3 * fid + 3 * 1 + 0] = v3[1].x
        normals[3 * 3 * fid + 3 * 1 + 1] = v3[1].y
        normals[3 * 3 * fid + 3 * 1 + 2] = v3[1].z

        normals[3 * 3 * fid + 3 * 2 + 0] = v0[1].x
        normals[3 * 3 * fid + 3 * 2 + 1] = v0[1].y
        normals[3 * 3 * fid + 3 * 2 + 2] = v0[1].z

        uvs[2 * 3 * fid + 2 * 0 + 0] = v2[2].x
        uvs[2 * 3 * fid + 2 * 0 + 1] = v2[2].y

        uvs[2 * 3 * fid + 2 * 1 + 0] = v3[2].x
        uvs[2 * 3 * fid + 2 * 1 + 1] = v3[2].y

        uvs[2 * 3 * fid + 2 * 2 + 0] = v0[2].x
        uvs[2 * 3 * fid + 2 * 2 + 1] = v0[2].y
      }
    }
    base_ring = []
    if (!this.geometry) {
      this.geometry = new THREE.BufferGeometry()
      this.geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3))
      this.geometry.addAttribute('normal', new THREE.BufferAttribute(normals, 3))
      this.geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2))
    } else {
      this.geometry.removeAttribute('position')
      this.geometry.removeAttribute('normal')
      this.geometry.removeAttribute('uv')

      this.geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3))
      this.geometry.addAttribute('normal', new THREE.BufferAttribute(normals, 3))
      this.geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2))
    }
    return radius
  }

  this.updateMesh = function () {
    this.updateProngProperties()
    this.updateMaterial()
    var radius = this.makeRing()

    this.position.y = radius - 12.0
    this.position.x = 12.0 - radius

    if (!this.mesh) {
      this.mesh = new THREE.Mesh(this.geometry, this.material)
      this.mesh.position.copy(this.position)
      this.mesh.rotation.copy(this.rotation)
    } else {
      this.mesh.position.copy(this.position)
      this.mesh.rotation.copy(this.rotation)
      // this.mesh.geometry = this.geometry;
    }
    var material = this.material
    // console.log(material);
    // material.uniforms.uHoleRadius.value = -1.0;
    // material.uniforms.uHoleRadius1.value = -1.0;
    if (this.isShowMirror && !this.mirror_mesh) {
      this.mirror_mesh = new THREE.Mesh(this.mesh.geometry, material)
      this.mirror_mesh.rotation.set(this.mesh.rotation.x + Math.PI, -this.mesh.rotation.y, this.mesh.rotation.z)
      this.mirror_mesh.position.set(this.mesh.position.x, this.mesh.position.y - radius * 2.0, this.mesh.position.z)
    } else {
      // this.mirror_mesh.geometry = this.geometry;
    }

    if (this.material) {
      this.material.uniforms.surface_width.value = scope.ring_surface_width
      this.material.uniforms.surface_radius.value = scope.ring_surface_radius
    }
  }

  this.load = function (file_url, callback) {
    if (typeof RingModelDict != 'undefined') {
      scope.base_ring = RingModelDict[scope.shapeType + scope.widthType]
      scope.updateMesh()
      if (callback) callback(scope.mesh, scope.mirror_mesh)
    } else {
      $.ajax({
        url: file_url,
        success: function (res) {
          scope.base_ring = res
          scope.updateMesh()
          if (callback) callback(scope.mesh, scope.mirror_mesh)
        },
        dataType: 'json'
      })
    }
  }
  this.updateColorMaps = function (callback) {
    var env_filename = 'textures/'
    var logo_filename = ''
    if (this.colorType == 'pt') {
      env_filename += 'ring5bw.png'
      logo_filename = 'textures/logo3.jpg'
    } else if (this.colorType == 'kw') {
      env_filename += 'ring5bw.png'
      logo_filename = 'textures/logo4.jpg'
    } else if (this.colorType == 'kr') {
      env_filename += '18kr.png'

      logo_filename = 'textures/logo4.jpg'
    } else {
      env_filename += '18ky.png'
      logo_filename = 'textures/logo4.jpg'
    }
    if (this.env_filename != env_filename) {
      this.loadLogoMap(logo_filename)
      this.env_filename = env_filename

      var loader = new THREE.ImageLoader()
      loader.load(env_filename, function (image) {
        scope.envMap.image = image
        scope.envMap.needsUpdate = true
        if (callback) callback()
      })
    } else if (this.logo_filename != logo_filename) {
      var loader = new THREE.ImageLoader()
      loader.load(logo_filename, function (image) {
        scope.logoMap.image = image
        scope.logoMap.needsUpdate = true
        if (callback) callback()
      })
    }
  }
  this.updateMaterial = function () {
    //console.log(scope.envMap);
    // console.log("here");
    var env_filename = 'textures/'
    var diffuse = new THREE.Vector3(1.455, 1.4666, 1.47)
    var bumpscale = 0.0
    var metalness = 0.93
    var displaceArea = 0.023

    if (this.widthType == '25') {
      displaceArea = 0.016
    } else if (this.widthType == '40') {
      displaceArea = 0.027
    } else if (this.widthType == '50') {
      displaceArea = 0.035
    }
    if (this.colorType == 'pt') {
      env_filename += 'ring5bw.png'
      if (this.is_show_prong && this.prong_diamonds_type == 0) {
        this.loadLogoMap('textures/logo3.jpg')
      } else {
        this.loadLogoMap('textures/logo1.jpg')
      }
    } else if (this.colorType == 'kw') {
      env_filename += 'ring5bw.png'
      if (this.is_show_prong && this.prong_diamonds_type == 0) {
        this.loadLogoMap('textures/logo4.jpg')
      } else {
        this.loadLogoMap('textures/logo2.jpg')
      }
    } else if (this.colorType == 'kr') {
      env_filename += '18kr.png'
      diffuse = new THREE.Vector3(1.454, 1.4666, 1.47)
      if (this.is_show_prong && this.prong_diamonds_type == 0) {
        this.loadLogoMap('textures/logo4.jpg')
      } else {
        this.loadLogoMap('textures/logo2.jpg')
      }
      metalness = 0.9
      bumpscale = 0.06
    } else if (this.colorType == 'ky') {
      env_filename += '18ky.png'
      diffuse = new THREE.Vector3(1.455, 1.4666, 1.47)
      if (this.is_show_prong && this.prong_diamonds_type == 0) {
        this.loadLogoMap('textures/logo4.jpg')
      } else {
        this.loadLogoMap('textures/logo2.jpg')
      }
      metalness = 0.8
      bumpscale = 0.15
    }

    this.loadEnvMap(env_filename)

    if (this.surfaceType == 0) {
      bumpscale = 0.0
      // metalness = 1.0;
    } else if (this.surfaceType == 1) {
      this.loadBumpMap('textures/hammer.jpg')
      bumpscale = 0.12
    } else if (this.surfaceType == 2) {
      this.loadBumpMap('textures/bump0.jpg')
      bumpscale = 0.015
    } else if (this.surfaceType == 3) {
      this.loadBumpMap('textures/linear.jpg')
      if (metalness > 0.9) metalness = 0.9
      bumpscale = 0.8
    } else if (this.surfaceType == 4) {
      this.loadBumpMap('textures/sand.jpg')
      bumpscale = 0.1
    }
    this.loadSandMap('textures/sand.jpg')
    var roughness = 1.0 - metalness

    var offset = scope.bumpMap.offset
    var repeat = scope.bumpMap.repeat
    var rotation = scope.bumpMap.rotation
    var center = scope.bumpMap.center

    if (scope.surfaceType == 1) {
      repeat.set(11, 14)
    } else if (scope.surfaceType == 2) {
      repeat.set(10, 10)
      rotation = -Math.PI / 4.0
    } else if (scope.surfaceType == 3) {
      repeat.set(1, 14)
    } else if (scope.surfaceType == 4) {
      repeat.set(10, 10)
    }
    scope.bumpMap.matrix.setUvTransform(offset.x, offset.y, repeat.x, repeat.y, rotation, center.x, center.y)
    this.diffuseColor = diffuse
    if (this.isShaderReady()) {
      var holeRadius = -1.0
      if (this.isShowOutterDiamond == 1) {
        holeRadius = 0.013
      }
      var holeRadius1 = -1.0
      if (this.isShowInnerDiamond == 1) {
        holeRadius1 = 0.014
      }
      if (this.material && typeof this.material.uniforms != 'undefined') {
        // console.log("is_show_prong",this.is_show_prong);
        // this.material.uniforms =  {
        // 		"envMap": { value: scope.envMap },
        // 		"bumpMap":{ value:scope.bumpMap},
        // 		"bumpScale":{ value:bumpscale},
        // 		"diffuse":{value:diffuse},
        // 		"emissive":{value:new THREE.Vector3(0.00,0.00,0.00)},
        // 		"metalness":{value:metalness},
        // 		"roughness":{value:roughness},
        // 		"uSurfaceType":{value:scope.surfaceType},
        // 		"opacity":{value:1.0},
        // 		"flipEnvMap":{value:1.0},
        // 		"maxMipLevel":{value:3},
        // 		"refractionRatio":{value:0.98},
        // 		"reflectivity":{value:0.5},
        // 		"envMapIntensity":{value:1.0},
        // 		"uvTransform":{value:scope.bumpMap.matrix},
        // 		"uHoleCenter":{value:new THREE.Vector2(0.625,0.0)},
        // 		"uHoleRadius":{value:holeRadius},
        // 		"uHoleCenter1":{value:new THREE.Vector2(-0.375,0.0)},
        // 		"uHoleRadius1":{value:holeRadius1},
        // 		"logoMap":{value:scope.logoMap},
        // 		"displaceArea":{value:displaceArea}
        // };
        this.material.uniforms.envMap.value = scope.envMap
        this.material.uniforms.bumpMap.value = scope.bumpMap
        this.material.uniforms.bumpScale.value = bumpscale
        this.material.uniforms.diffuse.value.copy(diffuse)
        this.material.uniforms.metalness.value = metalness
        this.material.uniforms.roughness.value = roughness
        this.material.uniforms.uSurfaceType.value = scope.surfaceType
        this.material.uniforms.uvTransform.value = scope.bumpMap.matrix
        this.material.uniforms.uHoleRadius.value = holeRadius
        this.material.uniforms.uHoleRadius1.value = holeRadius1
        this.material.uniforms.logoMap.value = scope.logoMap
        this.material.uniforms.displaceArea.value = displaceArea

        this.material.uniforms.surface_width.value = scope.ring_surface_width
        this.material.uniforms.surface_radius.value = scope.ring_surface_radius

        this.material.uniforms.front_hole_width.value = scope.front_hole_width
        this.material.uniforms.prong_height.value = scope.prong_height
        this.material.uniforms.prong_side_offset.value = scope.prong_side_offset
        this.material.uniforms.is_show_prong.value = scope.is_show_prong
        this.material.uniforms.prong_diamonds_type.value = scope.prong_diamonds_type
        if (scope.is_show_prong && scope.prong_diamonds_type == 0) {
          this.material.uniforms.uHoleCenter1.value.set(-0.125, 0.0)
        } else {
          this.material.uniforms.uHoleCenter1.value.set(-0.25, 0.0)
        }
      } else {
        this.material = new THREE.ShaderMaterial({
          uniforms: {
            envMap: { value: scope.envMap },
            bumpMap: { value: scope.bumpMap },
            bumpScale: { value: bumpscale },
            diffuse: { value: diffuse },
            emissive: { value: new THREE.Vector3(0.0, 0.0, 0.0) },
            metalness: { value: metalness },
            roughness: { value: roughness },
            uSurfaceType: { value: scope.surfaceType },
            opacity: { value: 1.0 },
            flipEnvMap: { value: 1.0 },
            maxMipLevel: { value: 3 },
            refractionRatio: { value: 0.98 },
            reflectivity: { value: 0.5 },
            envMapIntensity: { value: 1.0 },
            uvTransform: { value: scope.bumpMap.matrix },
            uHoleCenter: { value: new THREE.Vector2(0.5, 0.0) },
            uHoleRadius: { value: holeRadius },
            uHoleCenter1: { value: new THREE.Vector2(-0.375, 0.0) },
            uHoleRadius1: { value: holeRadius1 },
            logoMap: { value: scope.logoMap },
            displaceArea: { value: displaceArea },
            sandMap: { value: scope.sandMap },
            surface_width: { value: scope.ring_surface_width },
            surface_radius: { value: scope.ring_surface_radius },
            front_hole_width: { value: scope.front_hole_width },
            prong_height: { value: scope.prong_height },
            prong_side_offset: { value: scope.prong_side_offset },
            is_show_prong: { value: scope.is_show_prong },
            prong_diamonds_type: { value: scope.prong_diamonds_type }
          },
          vertexShader: scope.shaderVertex,
          fragmentShader: scope.shaderFragment,
          transparent: true,
          flatShading: false,
          side: THREE.DoubleSide,
          extensions: { derivatives: true }
        })
      }
    } else {
      this.material = new THREE.MeshStandardMaterial({
        map: null,
        bumpMap: scope.bumpMap,
        bumpScale: bumpscale,
        normalMap: null,
        color: scope.diffuseColor,
        metalness: metalness,
        roughness: roughness,
        flatShading: false,
        envMap: scope.envMap
        // side: THREE.DoubleSide
      })
    }

    if (this.mesh) {
      this.mesh.material = this.material
      // console.log(this.mesh);
    }

    if (this.isShowMirror && this.mirror_mesh) {
      var matrix = new THREE.Matrix3()
      matrix.setUvTransform(offset.x, offset.y, repeat.x, -repeat.y, rotation, center.x, center.y)
      // if(this.mirror_mesh.material)
      // {
      // 	delete this.mirror_mesh.material;
      // }

      this.mirror_mesh.material = this.material.clone()
      this.mirror_mesh.material.uniforms.uvTransform.value = matrix
      this.mirror_mesh.material.uniforms.envMap.value = scope.envMap
      this.mirror_mesh.material.uniforms.bumpMap.value = scope.bumpMap
      this.mirror_mesh.material.uniforms.logoMap.value = scope.logoMap
      this.mirror_mesh.material.uniforms.uHoleRadius.value = -1.0
      this.mirror_mesh.material.uniforms.uHoleRadius1.value = -1.0
    }

    if (this.prong_diamonds_model) {
      scope.prong_diamonds_model.setProngDiffuse(scope.diffuseColor, scope.envMap)
    }
  }

  this.changeBumpScale = function (sc) {
    this.mesh.material.uniforms.bumpScale.value = sc
  }
  this.updateModel = function (callback) {
    var file_url = 'models/' + this.shapeType + this.widthType + 'a.json'
    this.load(file_url, callback)
  }

  this.changeShapeType = function (type) {
    this.shapeType = type
    this.updateModel()
    this.showInnerDiamond(this.isShowInnerDiamond)
    this.showOutterDiamond(this.isShowOutterDiamond)

    this.makeProngDimonds()
  }
  this.changeWidthType = function (type) {
    this.widthType = type
    this.updateModel()
    this.showInnerDiamond(this.isShowInnerDiamond)
    this.showOutterDiamond(this.isShowOutterDiamond)

    this.makeProngDimonds()
  }
  this.changeColorType = function (type) {
    this.colorType = type
    this.updateColorMaps(function () {
      scope.updateMaterial()
    })
  }

  this.changeSurfaceType = function (type) {
    this.surfaceType = type
    this.updateMesh()
  }

  this.updateDiamondMaterial = function (mesh, pow, color, intensity) {
    var vcolor = new THREE.Vector3()
    if (color.length >= 3) {
      vcolor.set(color[0], color[1], color[2])
    } else {
      vcolor.set(color, color, color)
    }

    var material = mesh.material
    material.uniforms.iObjColor.value.copy(vcolor)
    if (intensity) {
      material.uniforms.uIntensity.value = intensity
    } else {
      material.uniforms.uIntensity.value = 0.5
    }

    material.uniforms.uPow.value = pow
  }

  this.changeInnerDiamondColor = function (type) {
    this.innerDiamondColor = type

    var res = DiamondColorDict[type]

    this.updateDiamondMaterial(this.inner_diamond_mesh, res[1], res[0], res[2])
  }

  this.changeOutterDiamondColor = function (type) {
    this.outterDiamondColor = type

    var res = DiamondColorDict[type]

    this.updateDiamondMaterial(this.diamond_mesh, res[1], res[0], res[2])
  }

  this.changeProngDiamondsType = function (type) {
    this.prong_diamonds_type = type
    this.updateModel()
    this.makeProngDimonds()
    this.showOutterDiamond(this.isShowOutterDiamond)
    this.showInnerDiamond(this.isShowInnerDiamond)
  }
  this.updateProngProperties = function () {
    if (this.shapeType == 'o') {
      this.is_show_prong = 0
      this.prong_diamonds_model.setVisible(this.is_show_prong)
      return
    }
    let t = this.show_diamonds_type
    if (t == 0) {
      this.is_show_prong = 0
      this.isShowOutterDiamond = 0
    } else if (t == 1) {
      this.is_show_prong = 0
      this.isShowOutterDiamond = 1
    } else if (t == 2) {
      this.is_show_prong = 1
      this.isShowOutterDiamond = 0
    }
    if (ProngDiamondsNumberDict !== undefined) {
      let res = ProngDiamondsNumberDict[this.widthType]
      if (res !== undefined) {
        this.prong_side_offset = parseFloat(res['side_offset'])
        this.prong_diamond_size = parseFloat(res['diamond_size'])
        this.front_hole_width = (1.25 * this.prong_diamond_size) / 0.005
        for (let ti in res['number']) {
          let tt_i = parseInt(ti)
          if (this.ring_size >= tt_i) {
            this.prong_diamond_number = res['number'][ti]
          } else {
            break
          }
        }
      }
    }

    if (this.prong_diamonds_type == 1 || this.shapeType != 'p') {
      this.prong_diamonds_type = 1
      this.prong_diamond_size = 0.005
      if (this.widthType == '25') {
        this.prong_diamond_number = 2
      } else {
        this.prong_diamond_number = 3
      }
    }
    this.prong_diamonds_model.setVisible(this.is_show_prong)
  }

  this.changeRingRadius = function (ring_size, val) {
    this.radius = val
    this.ring_size = parseInt(ring_size)
    this.updateModel()
    this.makeProngDimonds()
    this.showOutterDiamond(this.isShowOutterDiamond)
    this.showInnerDiamond(this.isShowInnerDiamond)
  }
  this.show = function (t) {
    if (t) {
      this.mesh.visible = true
      if (this.is_show_prong) {
        this.makeProngDimonds()
      }
      this.prong_diamonds_model.setVisible(this.is_show_prong)
    } else {
      this.mesh.visible = false
      this.inner_diamond_mesh.visible = false
      this.diamond_mesh.visible = false

      this.prong_diamonds_model.setVisible(false)
    }
  }

  this.changeShowProng = function (t) {
    t = parseInt(t)
    this.show_diamonds_type = t

    if (t == 0) {
      this.is_show_prong = 0
      this.isShowOutterDiamond = 0
    } else if (t == 1) {
      this.is_show_prong = 0
      this.isShowOutterDiamond = 1
    } else if (t == 2) {
      this.is_show_prong = 1
      this.isShowOutterDiamond = 0
    }

    this.updateModel()
    this.makeProngDimonds()

    this.showOutterDiamond(this.isShowOutterDiamond)
    this.showInnerDiamond(this.isShowInnerDiamond)
    this.setProngDiamondsPosition()
    if (this.material) {
      this.material.uniforms.is_show_prong.value = this.is_show_prong
    }
    if (this.mesh.visible) {
      this.prong_diamonds_model.setVisible(this.is_show_prong)
    }
  }
}
