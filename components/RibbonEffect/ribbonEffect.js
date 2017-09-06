import * as THREE from 'three'
import{ ShaderMatch, extendOptions} from '../utils.js'

const RibbonShader = require('./RibbonShaders.glsl')

var defaultOptions = {

    "segments": 50, 
    "poolSize": 50,
    "texture": THREE.ImageUtils.loadTexture('./resource/' + "light_dot.png") //impact_32x32.jpg  dot_8x8.png
};

var Ribbon = function (options){

    THREE.Object3D.call(this);
    extendOptions(this, options, defaultOptions);

    var _this = this;
    var clock = new THREE.Clock();
    var displayList = {};

    var elapseds = new Float32Array(_this.segments * 2);
    var lerps = new Float32Array(_this.segments * 2 * 3);
    var basicBufferGeometry = new THREE.PlaneBufferGeometry(0, 1, 1, _this.segments - 1);
        basicBufferGeometry.addAttribute( 'a_elapsed', new THREE.BufferAttribute(elapseds, 1));
        basicBufferGeometry.addAttribute( 'a_lerp', new THREE.BufferAttribute(lerps, 3));

    var Pool = {

        pool: [  ],

        get: function (){

            var item = this.pool.shift();

            if ( !item ){

                this.fill();
                item = this.pool.shift();
            }

            return item;
        },

        add: function (item){

            this.pool.push(item);
        },

        fill: function (){

            for ( var i = 0; i < _this.poolSize; i++ ){

                var geometry = basicBufferGeometry.clone();
                var material = new THREE.ShaderMaterial({
                
                    attributes: {

                        a_elapsed   : { type: "f", value: null },
                        a_lerp      : { type: "f", value: null }
                    },
                    uniforms: {

                        u_pi        : { type: "f"  , value: Math.PI },
                        u_elapsed   : { type: "f"  , value: 0 },
                        u_start     : { type: "v3" , value: new THREE.Vector3() },
                        u_end       : { type: "v3" , value: new THREE.Vector3() },
                        u_thickness : { type: "f"  , value: 0 },
                        u_crest     : { type: "f"  , value: 0 },
                        u_color     : { type: "c"  , value: new THREE.Color() },
                        u_texture   : { type: "t"  , value: _this.texture } 
                    },
                    vertexShader:   ShaderMatch("ribbon_vs", RibbonShader)[0],
                    fragmentShader: ShaderMatch("ribbon_fs", RibbonShader)[0],
                    blending:       THREE.AdditiveBlending,
                    depthTest:      false,
                    transparent:    true,
                    side: THREE.DoubleSide
                });

                var ribbon = new THREE.Mesh( geometry, material );
                ribbon.visible = false;
                // _this.add(ribbon);
                this.add(ribbon);
            }
        }
    };

    this.create = (function (){

        var startPos = new THREE.Vector3();
        var endPos = new THREE.Vector3();

        return function (){

            //startPos, endPos, thickness, crest, color, during, lerpSize

            var ribbon = null;

            if (arguments.length >= 4) {

                startPos.copy(arguments[0]);
                endPos.copy(arguments[1]);

                arguments[4] || ( arguments[4] = 0xFFFFFF );
                arguments[5] || ( arguments[5] = 1 );
                arguments[6] || ( arguments[6] = 0.46 );

                ribbon = Pool.get();

                ribbon.material.uniforms.u_start.value.copy(startPos);
                ribbon.material.uniforms.u_end.value.copy(endPos);
                ribbon.material.uniforms.u_thickness.value = arguments[2];
                ribbon.material.uniforms.u_crest.value = arguments[3];
                ribbon.material.uniforms.u_color.value.setHex(arguments[4]);
                ribbon.during = arguments[5];
                ribbon.lerpSize = arguments[6];
                ribbon.visible = true;
                _this.add(ribbon);

                displayList[ribbon.uuid] = ribbon;

            }else{

                console.log('Ribbon constructor arguments is not enough!');
            }

            return ribbon;
        }
    })();

    this.destory = function (ribbon){

        var elapseds = ribbon.geometry.attributes.a_elapsed.array;
        var lerps = ribbon.geometry.attributes.a_lerp.array;

        for (var i = 0; i < _this.segments * 2; i+=2){

            elapseds[ i ] = elapseds[ i + 1 ] = 0;

            lerps[ i * 3     ] = 0;
            lerps[ i * 3 + 1 ] = 0;
            lerps[ i * 3 + 2 ] = 0;

            lerps[ ( i + 1 ) * 3     ] = 0;
            lerps[ ( i + 1 ) * 3 + 1 ] = 0;
            lerps[ ( i + 1 ) * 3 + 2 ] = 0;
        }

        ribbon.material.uniforms.u_elapsed.value = 0;
        ribbon.visible = false;
        _this.remove(ribbon);
        Pool.add(ribbon);

        delete displayList[ribbon.uuid];
    }

    var render = (function (){

        var vertex1 = new THREE.Vector3();
        var vertex2 = new THREE.Vector3();
        var crossVertex = new THREE.Vector3();
        var crossVertexCopy1 = new THREE.Vector3();
        var crossVertexCopy2 = new THREE.Vector3();
        var startPointNormalize = new THREE.Vector3();
        var endPointNormalize = new THREE.Vector3();
        var lerpPoint = new THREE.Vector3();
        var lerpPoint2 = new THREE.Vector3();

        var foo = function (){

            var delta = clock.getDelta();
            var uuids = Object.keys(displayList);

            for (var i = 0, l = uuids.length; i < l; i++){

                var ribbon = displayList[uuids[i]];

                if ( ribbon ){

                    var ribbonGeo = ribbon.geometry;
                    var ribbonMat = ribbon.material;
                        ribbonMat.uniforms.u_elapsed.value += delta;

                    var positions = ribbonGeo.attributes.position.array;
                    var elapseds = ribbonGeo.attributes.a_elapsed.array;
                    var lerps = ribbonGeo.attributes.a_lerp.array;

                    var startPoint = ribbonMat.uniforms.u_start.value;
                    var endPoint = ribbonMat.uniforms.u_end.value;
                    var crest = ribbonMat.uniforms.u_crest.value;
                    var thickness = ribbonMat.uniforms.u_thickness.value;

                    var elapsed = ribbonMat.uniforms.u_elapsed.value;
                    var animationTime = Math.min( elapsed / ribbon.during, 1 );

                    startPointNormalize.copy(startPoint).normalize();
                    endPointNormalize.copy(endPoint).normalize();
                    crossVertex.crossVectors(startPointNormalize, endPointNormalize).normalize();

                    for (var j = 0; j < _this.segments * 2; j+=2){


                        if (j == 0){

                            elapseds[ j ] = elapseds[ j + 1 ] = animationTime;
                            lerpPoint.copy(startPoint).lerp(endPoint, animationTime).setLength(startPoint.length() + Math.sin(animationTime * Math.PI) * crest);
                        }else{

                            lerpPoint2.set(

                                lerps[ ( j - 2 ) * 3     ],
                                lerps[ ( j - 2 ) * 3 + 1 ],
                                lerps[ ( j - 2 ) * 3 + 2 ]
                            );

                            lerpPoint.set(

                                lerps[ j * 3     ],
                                lerps[ j * 3 + 1 ],
                                lerps[ j * 3 + 2 ]
                            );

                            var prv_elapsed = elapseds[ j - 2 ];
                            var cur_elapsed = elapseds[ j ];
                                cur_elapsed += (prv_elapsed - cur_elapsed) * ribbon.lerpSize;

                            elapseds[ j ] = elapseds[ j + 1 ] = cur_elapsed;

                            lerpPoint.lerp(lerpPoint2, ribbon.lerpSize).setLength(startPoint.length() + Math.sin(cur_elapsed * Math.PI) * crest);
                        }

                        lerps[ j * 3     ] = lerpPoint.x;
                        lerps[ j * 3 + 1 ] = lerpPoint.y;
                        lerps[ j * 3 + 2 ] = lerpPoint.z;

                        crossVertexCopy1.copy(crossVertex);
                        crossVertexCopy2.copy(crossVertex);

                        var thick =  ( 1 - ( j / ( _this.segments * 2 ) )) * thickness;

                        vertex1.addVectors(
                            lerpPoint, 
                            crossVertexCopy1.setLength(thick / 2)
                        );

                        vertex2.addVectors(
                            lerpPoint, 
                            crossVertexCopy2.setLength(-thick / 2)
                        );

                        positions[ j * 3    ] = vertex1.x;
                        positions[ j * 3 + 1] = vertex1.y;
                        positions[ j * 3 + 2] = vertex1.z;

                        positions[ ( j + 1 ) * 3    ] = vertex2.x;
                        positions[ ( j + 1 ) * 3 + 1] = vertex2.y;
                        positions[ ( j + 1 ) * 3 + 2] = vertex2.z;
                    }

                    ribbonGeo.attributes.position.needsUpdate = true;

                    if (elapsed > ribbon.during * 2.5){

                        _this.destory(ribbon);
                    }
                }
            }

            requestAnimationFrame(render.bind(_this));
        }

        return foo;
    })();

    render();
}

Ribbon.prototype = Object.create( THREE.Object3D.prototype );
Ribbon.prototype.constructor = Ribbon;

export default Ribbon