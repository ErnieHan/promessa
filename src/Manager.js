var Mananger = function () {
  this.scene = null
  this.renderer = null
  this.composer = null
  this.controls = null
  this.camera = null
  this.ringModels = []
  this.shadowScene = null
  this.shadowRenderer = null
  this.plane = null
  this.selected_id = 0
  this.isShowMirrorMesh = false
  this.showRing = 0
  var scope = this
  this.selectedRing = function () {
    return this.ringModels[this.selected_id]
  }
  this.initShadow = function (f, g, d) {
    var e = document.getElementById(f)
    this.shadowRenderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: true
    })
    this.shadowRenderer.setPixelRatio(window.devicePixelRatio)
    this.shadowRenderer.setSize(g, d)
    e.appendChild(this.shadowRenderer.domElement)
    if (!this.shadowScene) {
      this.shadowScene = new THREE.Scene()
    }

    function getPlaneGeometry() {
      var geometry = new THREE.PlaneGeometry(1000, 1000)
      var k = new THREE.Euler(-Math.PI / 2, 0, Math.PI / 2)
      var i = new THREE.Matrix4()
      i.makeRotationFromEuler(k)
      geometry.applyMatrix(i)
      return geometry
    }
    let tex_loader = new THREE.TextureLoader()
    var tex0 = tex_loader.load('textures/plane.png')
    var uniforms = {
      tex0: {
        value: tex0
      },
      center0: {
        value: new THREE.Vector3(0, 0, -5)
      },
      axisX0: {
        value: new THREE.Vector3(1, 0, 0)
      },
      axisY0: {
        value: new THREE.Vector3(0, 0, 1)
      },
      center1: {
        value: new THREE.Vector3(0, 0, -5)
      },
      axisX1: {
        value: new THREE.Vector3(1, 0, 0)
      },
      axisY1: {
        value: new THREE.Vector3(0, 0, 1)
      },
      width0: {
        value: 2.3
      },
      width1: {
        value: 2.3
      }
    }
    var vertexShader = ''
    var fragmentShader = ''
    if (PlaneShaderDict != undefined) {
      vertexShader = PlaneShaderDict['vertexShader'].join('\n')
      fragmentShader = PlaneShaderDict['fragmentShader'].join('\n')
    }

    this.plane = new THREE.Mesh(
      getPlaneGeometry(),
      new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true
      })
    )
    this.plane.position.set(0, -12, 0)
    this.updatePlane()
    this.plane.renderOrder = 10
    this.shadowScene.add(this.plane)
  }
  this.updatePlane = function () {
    if (this.showRing == 1) {
      var e = this.ringModels[0].position
      var h = new THREE.Vector3(1, 0, 0)
      var c = new THREE.Vector3(0, 0, 1)
      var width = parseFloat(this.ringModels[0].widthType) / 12.0

      this.plane.material.uniforms.center0.value = e
      this.plane.material.uniforms.axisX0.value = h
      this.plane.material.uniforms.axisY0.value = c
      this.plane.material.uniforms.width0.value = width
      this.plane.material.uniforms.center1.value.copy(e)
      this.plane.material.uniforms.axisX1.value.copy(h)
      this.plane.material.uniforms.axisY1.value.copy(c)
      this.plane.material.uniforms.width1.value = width
    } else {
      var g = new THREE.Euler()
      g.set(0, this.ringModels[0].rotation.y, 0)
      var e = this.ringModels[0].position
      var h = new THREE.Vector3(1, 0, 0)
      var c = new THREE.Vector3(0, 0, 1)
      h.applyEuler(g)
      c.applyEuler(g)
      var width = parseFloat(this.ringModels[0].widthType) / 12.0
      this.plane.material.uniforms.center0.value = e
      this.plane.material.uniforms.axisX0.value = h
      this.plane.material.uniforms.axisY0.value = c
      this.plane.material.uniforms.width0.value = width
      var d = this.ringModels[1].position
      var f = new THREE.Vector3(1, 0, 0)
      var b = new THREE.Vector3(0, 0, 1)
      width = parseFloat(this.ringModels[1].widthType) / 12.5
      g.set(0, this.ringModels[1].rotation.y, 0)
      f.applyEuler(g)
      b.applyEuler(g)
      this.plane.material.uniforms.center1.value = d
      this.plane.material.uniforms.axisX1.value = f
      this.plane.material.uniforms.axisY1.value = b
      this.plane.material.uniforms.width1.value = width
    }
  }

  this.init = function (divId, width, height) {
    var container = document.getElementById(divId)
    var camera = new THREE.PerspectiveCamera(45, width / height, 1, 500)
    camera.position.set(-18, 36, 0)
    // camera.position.set(-45, 0, 0);
    this.camera = camera

    this.scene = new THREE.Scene()
    var scene = this.scene

    scene.add(new THREE.AmbientLight(0x222222))

    var pointLight = new THREE.PointLight(0xffffff, 0.75)
    pointLight.position.set(-3, -4.2, 13.5)
    scene.add(pointLight)

    pointLight = new THREE.PointLight(0xffffff, 0.5)
    pointLight.position.set(16, -4, -2)
    scene.add(pointLight)

    pointLight = new THREE.PointLight(0xffffff, 0.25)
    pointLight.position.set(-13, -3.2, -6.9)
    scene.add(pointLight)

    this.renderer = new THREE.WebGLRenderer({
      antialias: true, //是否开启反锯齿
      preserveDrawingBuffer: true, //是否保存绘图缓冲
      alpha: true
    })
    var renderer = this.renderer
    // renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setPixelRatio(2.0)
    renderer.setSize(width, height)
    container.appendChild(renderer.domElement)

    // this.composer = new THREE.EffectComposer( renderer );
    // var composer = this.composer;
    // var ssaaRenderPass = new THREE.SSAARenderPass( scene, camera );
    // ssaaRenderPass.unbiased = false;

    // ssaaRenderPass.sampleLevel = 2;
    // composer.addPass( ssaaRenderPass );
    // var copyPass = new THREE.ShaderPass( THREE.CopyShader );
    // copyPass.renderToScreen = true;
    // composer.addPass( copyPass );

    this.controls = new THREE.OrbitControls(camera, renderer.domElement)
    var controls = this.controls
    controls.noZoom = false
    controls.noPan = true
    controls.minDistance = 35
    controls.maxDistance = 85
    controls.minPolarAngle = 0 // radians
    controls.maxPolarAngle = Math.PI / 2.0 // radians

    for (var i = 0; i < 2; i++) {
      this.ringModels[i] = new RingModel(this.scene)
      var ring = this.ringModels[i]
      ring.loadEnvMap('textures/ring5bw.png')
      ring.loadBumpMap('textures/bump0.jpg', [3, 3])
    }

    this.ringModels[0].ring_size = 25
    this.ringModels[0].radius = 20.8 / 2.0 + 1.0
    this.ringModels[0].position.set(0, 0, -5)
    this.ringModels[0].rotation.set(0, -0.2, -Math.PI / 2.0)

    this.ringModels[1].ring_size = 17
    this.ringModels[1].radius = 18.3 / 2.0 + 1.0
    this.ringModels[1].position.set(0, 0, 5)
    this.ringModels[1].rotation.set(0, 0.2, -Math.PI / 2.0)

    for (var i = 0; i < 2; i++) {
      var ring = this.ringModels[i]
      ring.loadDiamond(function (outter_diamond, inner_diamond) {
        // console.log(mesh);
        scope.scene.add(outter_diamond)
        scope.scene.add(inner_diamond)
      })
      ring.updateModel(function (mesh, mirror_mesh) {
        scope.scene.add(mesh)
        if (scope.isShowMirrorMesh) {
          scope.shadowScene.add(mirror_mesh)
        }
      })

      ring.initProngDiamonds()
    }
  }

  this.render = function () {
    this.controls.update()
    // this.composer.render();
    this.renderer.render(this.scene, this.camera)
    if (this.shadowRenderer) {
      this.shadowRenderer.render(this.shadowScene, this.camera)
    }
    this.controls.autoRotate = true
    this.controls.autoRotateSpeed = 10
  }
  this.changeShapeType = function (b) {
    this.ringModels[this.selected_id].changeShapeType(b)
  }
  this.changeWidthType = function (b) {
    this.ringModels[this.selected_id].changeWidthType(b)
    this.updatePlane()
  }
  this.changeColorType = function (b) {
    this.ringModels[this.selected_id].changeColorType(b)
  }

  this.showRingMode = function (type) {
    if (type == 1) {
      this.showRing = 1

      // this.ringModels[0].radius = 11;
      this.ringModels[0].position.set(0, 0, 0)
      this.ringModels[0].rotation.set(0, 0, -Math.PI / 2.0)

      this.ringModels[0].updateMesh()
      this.ringModels[0].showOutterDiamond(this.ringModels[0].isShowOutterDiamond)
      this.ringModels[0].showInnerDiamond(this.ringModels[0].isShowInnerDiamond)

      this.ringModels[0].show(true)
      this.ringModels[1].show(false)
      this.updatePlane()
    } else {
      this.showRing = 2

      // this.ringModels[0].radius = 11;
      this.ringModels[0].position.set(0, 0, -5)
      this.ringModels[0].rotation.set(0, -0.2, -Math.PI / 2.0)

      // this.ringModels[1].radius = 10.2;
      this.ringModels[1].position.set(0, 0, 5)
      this.ringModels[1].rotation.set(0, 0.2, -Math.PI / 2.0)

      this.ringModels[0].updateMesh()
      this.ringModels[1].updateMesh()

      this.ringModels[0].showOutterDiamond(this.ringModels[0].isShowOutterDiamond)
      this.ringModels[0].showInnerDiamond(this.ringModels[0].isShowInnerDiamond)

      this.ringModels[1].showOutterDiamond(this.ringModels[1].isShowOutterDiamond)
      this.ringModels[1].showInnerDiamond(this.ringModels[1].isShowInnerDiamond)
      this.ringModels[0].show(true)
      this.ringModels[1].show(true)
      this.updatePlane()
    }
  }
}
