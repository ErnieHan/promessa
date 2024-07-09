var ProngDiamondModel = function (scene) {
  this.prong_geometry = null
  this.diamond_geometry = null

  this.prong_material = null
  this.diamond_material = null
  this.is_loaded = false
  this.prong_height = 0.1
  this.cube_texture = null
  this.mesh_group = new THREE.Group()
  scene.add(this.mesh_group)
  var scope = this

  this.updateLoadingState = function () {
    this.is_loaded = this.diamond_geometry !== null && this.prong_geometry !== null
  }
  this.init = function (callback) {
    var diamondPath = 'models/diamond1.stl'
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

    this.cube_texture = textureCube
    var stl_loader = new THREE.STLLoader()

    stl_loader.load(diamondPath, function (geometry) {
      // var shaderGenerator = new DiamondShaderGenerator();
      // var material= shaderGenerator.generateShader(geometry);
      // material.uniforms.iChannel0.value = textureCube;
      scope.diamond_geometry = geometry
      // scope.diamond_material = material;
      scope.updateLoadingState()

      if (callback !== undefined && scope.is_loaded) {
        callback()
      }
    })

    var prongPath = 'models/prong1.stl'
    var diffuseColor = new THREE.Color().setRGB(1.1, 1.1, 1.1)
    var textureSphere = THREE.ImageUtils.loadTexture('textures/ring5bw.png')
    // textureSphere = THREE.ImageUtils.loadTexture("Gold8.png");
    textureSphere.format = THREE.RGBAFormat
    textureSphere.magFilter = THREE.LinearFilter
    textureSphere.minFilter = THREE.LinearMipMapLinearFilter
    // textureSphere.mapping = THREE.EquirectangularReflectionMapping;
    textureSphere.mapping = THREE.SphericalReflectionMapping
    textureSphere.wrapS = 1001
    textureSphere.wrapT = 1001
    textureSphere.anisotropy = true
    var prong_material = new THREE.MeshStandardMaterial({
      map: null,
      bumpMap: null,
      bumpScale: 0.13,
      color: diffuseColor,
      metalness: 1.0,
      roughness: 0,
      flatShading: false,
      envMap: textureSphere,
      side: THREE.DoubleSide
    })
    scope.prong_material = prong_material
    stl_loader.load(prongPath, function (geometry) {
      scope.prong_geometry = geometry
      scope.updateLoadingState()
      if (callback !== undefined && scope.is_loaded) {
        callback()
      }
    })
  }
  this.clear_meshes = function () {
    let removed_list = []
    for (let i in this.mesh_group.children) {
      let object = this.mesh_group.children[i]
      object.parent = null

      removed_list.push(object)
    }

    this.mesh_group.children = []

    for (let object of removed_list) {
      object.dispatchEvent({ type: 'removed' })
    }
    removed_list = []
  }
  this.make_diamonds = function (number, radius, ox, diamond_size, type, shape_type, widthType) {
    this.clear_meshes()
    let d_scale = Math.sqrt(diamond_size / 0.005)
    let mm_len = 1.15 * d_scale
    d_scale *= 0.125

    if (!this.diamond_material) {
      var shaderGenerator = new DiamondShaderGenerator()
      this.diamond_material = shaderGenerator.generateShader(this.diamond_geometry)
      this.diamond_material.uniforms.iChannel0.value = this.cube_texture
    }
    if (type == undefined || type == 0) {
      let step_angle = Math.asin(mm_len / 2.0 / radius) * 2.0
      let start_angle = (-step_angle * (number - 1)) / 2.0
      for (let i = 0; i < number; i++) {
        let c_angle = start_angle + step_angle * i

        let diamond_mesh = new THREE.Mesh(this.diamond_geometry, this.diamond_material)
        let prong_mesh = new THREE.Mesh(this.prong_geometry, this.prong_material)

        // prong_mesh.position.set(0,0,-1);
        let sub_group = new THREE.Group()
        sub_group.add(diamond_mesh)
        sub_group.add(prong_mesh)

        var rotation = new THREE.Euler()
        rotation.set(Math.PI / 2.0, c_angle - Math.PI / 2.0, 0)
        var offset = new THREE.Vector3(0, ox, radius - 0.68)
        offset.applyEuler(rotation)
        sub_group.rotation.copy(rotation)
        sub_group.scale.set(d_scale, d_scale, d_scale)

        sub_group.position.copy(offset)
        this.mesh_group.add(sub_group)
      }
      this.prong_height = Math.cos(start_angle - step_angle * 0.75)
    } else {
      widthType = widthType ? widthType : '30'
      mm_len = mm_len - 0.1
      let d_offset = 0.68
      if (widthType == '40') {
        mm_len += 0.2
      } else if (widthType == '50') {
        mm_len += 0.58
        d_scale *= 1.25
        d_offset = 0.88
      }
      let left_x = (-mm_len * (number - 1)) / 2.0
      for (let i = 0; i < number; i++) {
        let x_pos = left_x + mm_len * i
        let diamond_mesh = new THREE.Mesh(this.diamond_geometry, this.diamond_material)
        let prong_mesh = new THREE.Mesh(this.prong_geometry, this.prong_material)
        // prong_mesh.position.set(0,0,-1);

        let sub_group = new THREE.Group()
        sub_group.add(diamond_mesh)
        sub_group.add(prong_mesh)

        var rotation = new THREE.Euler()
        rotation.set(Math.PI / 2.0, -Math.PI / 2.0, 0)
        var offset = new THREE.Vector3(0, x_pos, radius - d_offset)

        if (shape_type == 'r') {
          // console.log("ere");
          if (number == 3 && i != 1) {
            offset.z = radius - 0.71
          }
          if (i == 1) {
            offset.z = radius - 0.6
          }
        }

        offset.applyEuler(rotation)
        sub_group.rotation.copy(rotation)
        sub_group.scale.set(d_scale, d_scale, d_scale)

        sub_group.position.copy(offset)
        this.mesh_group.add(sub_group)
      }
    }

    // this.mesh_group.rotation.set(,0, 0);
  }

  this.setProngDiffuse = function (diffuse, texture) {
    // scope.prong_material.color.setRGB(diffuse.x,diffuse.y,diffuse.z);
    if (scope.prong_material) {
      scope.prong_material.envMap = texture
    }
  }

  this.setVisible = function (t) {
    if (t) {
      this.mesh_group.visible = true
    } else {
      this.mesh_group.visible = false
    }
  }
}
