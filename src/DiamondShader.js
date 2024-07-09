/*
 *	@author Wang Shiwei (wangshiwei@abaci3d.com)
 */

var DiamondShaderGenerator = function () {
  this.planesList = [];
  this.center = [];
  this.fireColor = 1;
  this.minAngle = Math.PI / 12.0;
  this.getVertexShader = function () {
    return [
      "precision highp float;",
      "precision highp int;",
      "varying vec3 vPosition;",
      "varying vec3 vNormal;",
      "varying mat4 mvMatrix;",
      "void main() {",
      "vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
      "vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
      "vNormal = normal;",
      "mvMatrix = modelViewMatrix;",
      "vPosition = position;",
      "gl_Position = projectionMatrix * mvPosition;",

      "}",
    ].join("\n");
  };

  this.getFragShaderPart0 = function () {
    return [
      "precision highp float;",
      "precision highp int;",
      "uniform mat4 inverseModelMatrix;",
      "uniform samplerCube iChannel0;",
      "uniform vec3 iObjColor;",
      "uniform vec3 iObjCenter;",
      "varying vec3 vPosition;",
      "varying vec3 vNormal;",
      "varying mat4 mvMatrix;",
      "uniform mat4 uMatrix;",
      "uniform float uIntensity;",
      "uniform float uPow;",
      "const int n_relections = 7; // the max number of inside reflections;",
      "int max_iters = 7; // the max number of inside reflections;",
      "vec4 ans;",
      "const float maxdist = 10000.; ",
      "const float ior = 2.418;",
      "float ior_r = 2.408;",
      "float ior_g = 2.424;",
      "float ior_b = 2.432;",
      "const vec3 diamondColor = vec3(.98, 0.96, 0.93);",
      "// Math constants",
      "#define DELTA	0.001",
      "#define PI		3.14159265359",
      "void getHit(in vec3 o, in vec3 ray,in vec4 plane)",
      "{",
      "	float fd = dot(o, plane.xyz) + plane.w;",
      "	float di = dot(ray, plane.xyz);",
      "	fd = -fd / di;",
      "	if(di >0.0001 && fd < ans.w) ans = vec4(plane.xyz, fd);",
      "}",
      "void getAns(in vec3 o, in vec3 ray)",
      "{",
    ].join("\n");
  };

  this.getFragShaderPart1 = function () {
    return [
      "}",
      "						  ",
      "vec3 getBackColor(in vec3 ray)",
      "{",
      "	return textureCube(iChannel0, (-(mvMatrix*vec4(ray,0.0)).xyz)).rrr;",
      "}",
      "vec3 ray_cast(vec3 origin, vec3 normal, vec3 ray, float refractionIndex)",
      "{",
      "	ray = refract(ray, normal, 1. / refractionIndex);",
      "	vec3 color = vec3(0.0,0.0,0.0);",
      "	color += vec3(pow(abs(dot(normalize(ray),normal))*0.955,18.0));",
      "	vec3 ray_refract;",
      "	bool flag = false;",
      "	",
      "	for(int ii=0; ii < n_relections; ii++)",
      "	{",
      "		getAns(origin,ray);",
      "		origin += ray * ans.w;",
      "		normal = -normalize(ans.xyz);",
      "		ray_refract =  refract(ray, normal, refractionIndex);",
      "		if(ii >= max_iters) break;",
      "		if(length(ray_refract)!=0.)",
      "		{",
      "			color = (color+ getBackColor(ray_refract));",
      "			flag = true;",
      "			break;",
      "		}",
      "		",
      "		ray = reflect(ray, normal);	",
      "	}",
      "	if(!flag)	// not finished cast",
      "	{",
      "		color +=  getBackColor(ray);",
      "		",
      "	}",
      "	color = pow(abs(color),vec3(uPow));",
      "	return color*(1.0-uIntensity)+color*iObjColor*(uIntensity);",
      "}",
      "void main()",
      "{",
      "	vec3 origin = vPosition - iObjCenter;",
      "	vec4 camPos = inverseModelMatrix * vec4(cameraPosition,1.0);",
      "	vec3 ray = normalize(vPosition-camPos.xyz);",
      "	vec3 normal = vNormal;",
      "	vec4 color; float d=0.02; max_iters = 3;",
      "	color.xyz = ray_cast(origin, normal, ray, ior_b);",
      "	if(uPow>1.0) {",
      "		color.r = ray_cast(origin, normal, ray, ior_r).x;",
      "		color.g = ray_cast(origin, normal, ray, ior_g).y;",
      "	}",
      // "	color.rgb = (ray_cast(origin+vec3(-d,0.0,0), normal, ray, ior_r)+ray_cast(origin+vec3(0,d,0), normal, ray, ior_g)+ray_cast(origin+vec3(0,-d,0), normal, ray,ior_b)+ray_cast(origin, normal, ray,ior))*0.25;",
      "	color.w = 1.0;",
      "	gl_FragColor = color; ",
      "}",
    ].join("\n");
  };

  this.addPlane = function (nor, w) {
    //console.log(nor,w);
    //if(nor.x < -0.01) return;
    // if(Math.abs(nor.z)<0.01) return;
    if (nor.z < -0.99) return;
    var len = this.planesList.length;

    for (var i = 0; i < len; i++) {
      var p = this.planesList[i];
      var dt = p.normal.dot(nor);
      var angle = Math.abs(Math.acos(dt));
      if (Math.abs(dt - 1.0) < 0.001) {
        angle = 0.0;
      }
      if (Math.abs(nor.z) < 0.01 && angle < Math.PI / 9) return;
      if (angle < this.minAngle) {
        return;
      }
    }
    this.planesList.push({ normal: nor.clone(), w: w });
  };
  this.getDistanceMapString = function () {
    var str = "\n ans=vec4(0.0,0.0,0.0,99999.0);\n";
    for (var i = 0; i < this.planesList.length; i++) {
      var p = this.planesList[i];
      str +=
        "getHit(o, ray, vec4(" +
        p.normal.x.toFixed(6) +
        "," +
        p.normal.y.toFixed(6) +
        "," +
        p.normal.z.toFixed(6) +
        "," +
        p.w.toFixed(6) +
        "));\n";
    }
    str += "\n";

    //console.log(str);
    return str;
  };
  this.generateShader = function (geometry) {
    geometry.computeBoundingBox();
    var center = geometry.boundingBox.getCenter();
    var v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    var nor = new THREE.Vector3();
    var positions = geometry.attributes.position.array;
    var il = positions.length;
    for (var i = 0; i < il; i += 9) {
      v[0].set(positions[i + 0], positions[i + 1], positions[i + 2]);
      v[1].set(positions[i + 3], positions[i + 4], positions[i + 5]);
      v[2].set(positions[i + 6], positions[i + 7], positions[i + 8]);
      for (var j = 0; j < 3; j++) {
        v[j]
          .sub(center)
          .multiply(new THREE.Vector3(0.93, 0.93, 0.98))
          .add(center);
      }

      v[1].sub(v[0]);
      v[2].sub(v[0]);
      nor.crossVectors(v[1], v[2]).normalize();
      //console.log(nor);
      var w = -nor.dot(v[0].sub(center));
      this.addPlane(nor, w);

      nor.set(-nor.x, nor.y, nor.z);
      this.addPlane(nor, w);
    }
    //this.planesList.push({"normal":new THREE.Vector3(-1,0,0),"w":0});
    console.log(this.planesList.length);
    var str = this.getDistanceMapString();

    var uMatrix = new THREE.Matrix4();

    var defines = "";
    if (this.fireColor) {
      defines += "#define FireColor;\n";
    }
    var material = new THREE.ShaderMaterial({
      uniforms: {
        iChannel0: { type: "t", value: null },
        iObjColor: { type: "v3", value: new THREE.Vector3(1.2, 1.2, 1.2) },
        iObjCenter: { type: "v3", value: center },
        uMatrix: { value: uMatrix },
        uIntensity: { value: 0.5 },
        uPow: { value: 2.0 },
      },
      vertexShader: this.getVertexShader(),
      fragmentShader:
        defines + this.getFragShaderPart0() + str + this.getFragShaderPart1(),
    });
    return material;
  };
};
