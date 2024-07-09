precision highp float;
precision highp int;
#define STANDARD 
#define VERTEX_TEXTURES
#define GAMMA_FACTOR 2
#define MAX_BONES 0
#define USE_ENVMAP
#define ENVMAP_MODE_REFLECTION
#define USE_BUMPMAP
#define BONE_TEXTURE
#ifdef USE_COLOR
	attribute vec3 color;
#endif
#define PHYSICAL
varying vec3 vViewPosition;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#define PI 3.14159265359
#define PI2 6.28318530718
#define PI_HALF 1.5707963267949
#define RECIPROCAL_PI 0.31830988618
#define RECIPROCAL_PI2 0.15915494
#define LOG2 1.442695
#define EPSILON 1e-6
#define saturate(a) clamp( a, 0.0, 1.0 )
#define whiteCompliment(a) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float average( const in vec3 color ) { return dot( color, vec3( 0.3333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract(sin(sn) * c);
}

struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
struct GeometricContext {
	vec3 position;
	vec3 normal;
	vec3 viewDir;
};
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
vec3 projectOnPlane(in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal ) {
	float distance = dot( planeNormal, point - pointOnPlane );
	return - distance * planeNormal + point;
}
float sideOfPlane( in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal ) {
	return sign( dot( point - pointOnPlane, planeNormal ) );
}
vec3 linePlaneIntersect( in vec3 pointOnLine, in vec3 lineDirection, in vec3 pointOnPlane, in vec3 planeNormal ) {
	return lineDirection * ( dot( planeNormal, pointOnPlane - pointOnLine ) / dot( planeNormal, lineDirection ) ) + pointOnLine;
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
float linearToRelativeLuminance( const in vec3 color ) {
	vec3 weights = vec3( 0.2126, 0.7152, 0.0722 );
	return dot( weights, color.rgb );
}

#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP ) || defined( USE_EMISSIVEMAP ) || defined( USE_ROUGHNESSMAP ) || defined( USE_METALNESSMAP )
	varying vec2 vUv;
	varying vec2 vUv0;
	uniform mat3 uvTransform;
	uniform sampler2D bumpMap;
	uniform float bumpScale;	
	uniform int uSurfaceType; 
	uniform float displaceArea;
	uniform float uHoleRadius;
	uniform vec2 uHoleCenter;

#endif

#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
	attribute vec2 uv2;
	varying vec2 vUv2;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif

#ifdef USE_COLOR
	varying vec3 vColor;
#endif
#ifdef USE_FOG
  varying float fogDepth;
#endif


#ifdef USE_SHADOWMAP
	#if 0 > 0
		uniform mat4 directionalShadowMatrix[ 0 ];
		varying vec4 vDirectionalShadowCoord[ 0 ];
	#endif
	#if 0 > 0
		uniform mat4 spotShadowMatrix[ 0 ];
		varying vec4 vSpotShadowCoord[ 0 ];
	#endif
	#if 3 > 0
		uniform mat4 pointShadowMatrix[ 3 ];
		varying vec4 vPointShadowCoord[ 3 ];
	#endif
#endif

#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
	#endif
	uniform float logDepthBufFC;
#endif
#if 0 > 0 && ! defined( PHYSICAL ) && ! defined( PHONG )
	varying vec3 vViewPosition;
#endif

void main() {
#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP ) || defined( USE_EMISSIVEMAP ) || defined( USE_ROUGHNESSMAP ) || defined( USE_METALNESSMAP )
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	vUv0 = uv;
#endif
#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
	vUv2 = uv2;
#endif
#ifdef USE_COLOR
	vColor.xyz = color.xyz;
#endif

vec3 objectNormal = vec3( normal );


vec3 transformedNormal = normalMatrix * objectNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif

#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
#endif

vec3 transformed = vec3( position );

if(vUv0.x > 0.0){

	if(uSurfaceType==3)
	{
		transformed += normalize( objectNormal ) * ((texture2D( bumpMap, vUv ).x-1.0) * bumpScale*0.3 + 0.0 );
	}
	else if(uSurfaceType==1)
	{
		float sc = 1.0;
		float distL = length(vUv0-uHoleCenter);
		if((distL < uHoleRadius+0.01) || abs(vUv0.y) > displaceArea || vUv0.x < 0.01 || vUv0.x > 1.0 - 0.01) {
			sc = 0.0;
		}
		transformed += normalize( objectNormal ) * ((texture2D( bumpMap, vUv ).x) * bumpScale*1.5*sc + 0.0);		
	}

}


vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );
gl_Position = projectionMatrix * mvPosition;

#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
	#else
		gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
		gl_Position.z *= gl_Position.w;
	#endif
#endif

#if 0 > 0 && ! defined( PHYSICAL ) && ! defined( PHONG )
	vViewPosition = - mvPosition.xyz;
#endif

	vViewPosition = - mvPosition.xyz;
#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP )
	vec4 worldPosition = modelMatrix * vec4( transformed, 1.0 );
#endif

#ifdef USE_SHADOWMAP
	#if 0 > 0
	
	#endif
	#if 0 > 0
	
	#endif
	#if 3 > 0
	
		vPointShadowCoord[ 0 ] = pointShadowMatrix[ 0 ] * worldPosition;
	
		vPointShadowCoord[ 1 ] = pointShadowMatrix[ 1 ] * worldPosition;
	
		vPointShadowCoord[ 2 ] = pointShadowMatrix[ 2 ] * worldPosition;
	
	#endif
#endif


#ifdef USE_FOG
fogDepth = -mvPosition.z;
#endif
}