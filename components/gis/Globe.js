"use strict";
/*
 *===========================================================================================
 *
 * 地球
 *
 *===========================================================================================
 */
import * as THREE from 'three'
import Config from '../config.js'
import {extendOptions, toSphere, ShaderMatch} from '../utils.js'
import Locator from './Locator.js'
import ChinaJson from './geo/china_simplify.json'
import WorldJson from './geo/world.json'
import Shaders from './GlobeShaders.glsl'





var chinaJson = JSON.parse(ChinaJson);
var worldJson = JSON.parse(WorldJson);

var defaultOptions = {

    renderer         : new THREE.WebGLRenderer({antialias: true}),
    radius           : 200,
    innerColor       : 0x00c2da,
    chinaColor       : 0x00515a,
    forginColor      : 0x002125,
    atmoColor        : 0x005b67,
    fog              : {

        color            : 0x000000,
        near             : 1,
        far              : 2000
    },
    vertexGlobalTime : 6,
    positionElapse   : [ 1, 3 ],
    pointSize        : [ 3, 5 ]
}

//地图类
export default Globe = function (options){
    
    THREE.Object3D.call(this);
    Utils.extendOptions(this, options, defaultOptions);

    this.clock = new THREE.Clock(true);

    // 前端计算的国家中心经纬度
    this.countryCoordDict = {};

    this.draw();
    this.render();
}

Globe.prototype = Object.create(THREE.Object3D.prototype);
Globe.prototype.constructor = Globe;

Globe.prototype.draw = function (){

    this.pointCloudGlobe = new THREE.PointCloud(

        new THREE.Geometry(), 
        new THREE.ShaderMaterial({
        
            uniforms:       {

                u_fog_color: { type: "c", value: new THREE.Color( this.fog.color ) },
                u_fog_near: { type: "f", value: this.fog.near },
                u_fog_far: { type: "f", value: this.fog.far },
                u_color:     { type: "c", value: new THREE.Color( 0xf0f0f0 ) },
                u_global_time:{ type: "f", value: this.vertexGlobalTime },
                u_texture:   { type: "t", value: THREE.ImageUtils.loadTexture(Config.texturePath + "light_dot.png") },
                u_shade:    { type: "f", value: 0 },
            },
            attributes:     {

                a_size: { type: 'f', value: [] },
                a_time: { type: 'f', value: [] },
                a_color: { type: 'c', value: [] }
            },
            vertexShader:   Utils.Reg.ShaderMatch("point_vs", Shaders)[0],
            fragmentShader: Utils.Reg.ShaderMatch("point_fs", Shaders)[0],
            blending:       THREE.AdditiveBlending,
            depthTest:      false,
            transparent:    true,
            side: THREE.FrontSide
        })
    );

    this.lineGlobe = new THREE.Line(

        new THREE.Geometry(),
        new THREE.ShaderMaterial({
        
            uniforms:       {

                u_fog_color: { type: "c", value: new THREE.Color( this.fog.color ) },
                u_fog_near: { type: "f", value: this.fog.near },
                u_fog_far: { type: "f", value: this.fog.far },
                u_color:     { type: "c", value: new THREE.Color( 0xf0f0f0 ) },
                u_global_time:{ type: "f", value: this.vertexGlobalTime }
            },
            attributes:     {

                a_time: { type: 'f', value: [] },
                a_color: { type: 'c', value: [] }
            },
            vertexShader:   Utils.Reg.ShaderMatch("line_vs", Shaders)[0],
            fragmentShader: Utils.Reg.ShaderMatch("line_fs", Shaders)[0],
            blending:       THREE.AdditiveBlending,
            depthTest:      true,
            transparent:    true,
            side: THREE.FrontSide
        }),
        THREE.LinePieces
    );

    var innerGlobeTexture = THREE.ImageUtils.loadTexture(Config.texturePath + "map_blur.jpg");
        innerGlobeTexture.offset.set( 0.25, 0 );

    this.innerGlobe = new THREE.Mesh(

        new THREE.SphereGeometry( this.radius - 1, 200, 100),
        new THREE.ShaderMaterial({
        
            uniforms:       {

                u_fog_color: { type: "c", value: new THREE.Color( this.fog.color ) },
                u_fog_near: { type: "f", value: this.fog.near },
                u_fog_far: { type: "f", value: this.fog.far },
                u_color:     { type: "c", value: new THREE.Color( this.innerColor ) },
                u_texture:   { type: "t", value: innerGlobeTexture }
            },
            
            vertexShader:   Utils.Reg.ShaderMatch("inner_vs", Shaders)[0],
            fragmentShader: Utils.Reg.ShaderMatch("inner_fs", Shaders)[0],
            blending:       THREE.AdditiveBlending,
            depthTest:      true,
            transparent:    false,
            side: THREE.FrontSide
        })
    );

    this.atmoGlobe = new THREE.Mesh(

        new THREE.SphereGeometry( this.radius + 50, 200, 100),
        new THREE.ShaderMaterial({
        
            uniforms:       {

                u_atmo_color:     { type: "c", value: new THREE.Color( this.atmoColor ) },
                u_atmo_shade:     { type: "f", value: 1 }
            },
            
            vertexShader:   Utils.Reg.ShaderMatch("atmo_vs", Shaders)[0],
            fragmentShader: Utils.Reg.ShaderMatch("atmo_fs", Shaders)[0],
            blending:       THREE.AdditiveBlending,
            depthTest:      false,
            transparent:    true,
            //side: THREE.BackSide
            side: THREE.FrontSide
        }) 
    );
    
    this.randomSize = function (){

        return THREE.Math.randFloat(this.pointSize[0], this.pointSize[1]);
    }

    this.fillVertices = function (dataset, color, size){

        for (var i = 0, l = dataset.length; i < l; i++){

            var lonlat = dataset[i];

            var vertex = new THREE.Vector3().copy(Utils.coord.toSphere(lonlat[0], lonlat[1], this.radius));
            this.pointCloudGlobe.material.attributes.a_size.value.push(size !== undefined ? size : this.randomSize());
            this.pointCloudGlobe.material.attributes.a_time.value.push(THREE.Math.randFloat(this.positionElapse[0], this.positionElapse[1]));
            this.pointCloudGlobe.material.attributes.a_color.value.push(new THREE.Color(color));
            this.pointCloudGlobe.geometry.vertices.push(vertex);

            this.lineGlobe.material.attributes.a_time.value.push(THREE.Math.randFloat(this.positionElapse[0], this.positionElapse[1]));
            this.lineGlobe.material.attributes.a_color.value.push(new THREE.Color(color));
            this.lineGlobe.geometry.vertices.push(vertex);

            if ( i !== 0 && i !== l - 1 ){

                this.lineGlobe.material.attributes.a_time.value.push(THREE.Math.randFloat(this.positionElapse[0], this.positionElapse[1]));
                this.lineGlobe.material.attributes.a_color.value.push(new THREE.Color(color));
                this.lineGlobe.geometry.vertices.push(vertex);
            }
        }
    };

    for ( var i = 0, pl = worldJson.length; i < pl; i++ ){
        
        var parent = worldJson[i];

        var children = parent['children'];

        for (var j = 0, cl = children.length; j < cl; j++ ){

            var child = children[j];

            if (child["code"] !== "CN" && child["code"] !== "TW") {

                var coords = child['coords'];
                var coordsLen = coords.length;
                var color = this.forginColor;//Math.random() * 0xffffff;

                for (var k = 0; k < coordsLen; k++){

                    var coord = coords[k];

                    /*
                    var coordLen = coord.length;

                    for (var m = 0; m < coordLen; m++){

                        var lonlat = coord[m];

                        ( lonlat[0] < boundingBox.min.x ) && ( boundingBox.min.x = lonlat[0] );
                        ( lonlat[1] < boundingBox.min.y ) && ( boundingBox.min.y = lonlat[1] );

                        ( lonlat[0] > boundingBox.max.x ) && ( boundingBox.max.x = lonlat[0] );
                        ( lonlat[1] > boundingBox.max.y ) && ( boundingBox.max.y = lonlat[1] );
                        
                        
                    }
                    */

                    this.fillVertices(coord, color, 1.5);
                }

                /*this.countryCoordDict[child["name"]] = this.countryCoordDict[child["code"]] = [ 

                    ( boundingBox.min.x + boundingBox.max.x ) / 2,
                    ( boundingBox.min.y + boundingBox.max.y ) / 2
                ];*/
            }
        }
    }

    for ( var i = 0, fl = chinaJson.features.length; i < fl; i++ ){
        
        var parentName = 'China';
        var province = chinaJson.features[i];
        var provinceName = province['properties']['name'];
        var provinceGeo = province['geometry'];

        if ( provinceGeo ) {

            var provinceGeoType = provinceGeo['type'];
            var provinceGeoCoords = provinceGeo['coordinates'];

            if (provinceGeoType == "Polygon"){

                this.fillVertices(provinceGeoCoords[0], this.chinaColor, 2.5);

            }else{

                for (var j = 0, pl = provinceGeoCoords.length; j < pl; j++ ){
                   
                    this.fillVertices(provinceGeoCoords[j][0], this.chinaColor, 2.5);
                }
            }
        }
    }

    this.add(this.pointCloudGlobe);
    this.add(this.lineGlobe);
    this.add(this.innerGlobe);
    this.add(this.atmoGlobe);
}

//定位工具函数
Globe.prototype.LocationHandler = function (para){

    // para -- 国家英文名、国家代码、中国省份中文名

    var center = this.countryCoordDict[ para ];

    if (!center){

        center = Locator.WorldCountry( para );

        if (!center){

            center = Locator.ChinaState( para );
        }
    }

    if (center){

        return Utils.coord.toSphere(center[0], center[1], this.radius);
    }

    return null;
}

Globe.prototype.render = function (){

    var deltaTime = this.clock.getDelta();

    if (this.pointCloudGlobe.material.uniforms.u_global_time.value > 0){

        this.pointCloudGlobe.material.uniforms.u_global_time.value -= deltaTime;
        this.lineGlobe.material.uniforms.u_global_time.value -= deltaTime;
    }

    this.atmoGlobe.material.uniforms.u_atmo_shade.value += 0.005;
    this.pointCloudGlobe.material.uniforms.u_shade.value += 0.005;

    requestAnimationFrame(this.render.bind(this));
}
