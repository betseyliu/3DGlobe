"use strict";

import * as THREE from 'three'
import Config from '../config.js'
import {extendOptions, toSphere, ShaderMatch} from '../utils.js'
import Locator from './Locator.js'
import ChinaJson from './geo/china_simplify.json'
import WorldJson from './geo/world.json'
import Shaders from './GlobeShaders.glsl'

var MAP_TYPE_ENUM = {

    ONLY_CHINA: "ONLY_CHINA",
    SIMPLE_WORLD: "SIMPLE_WORLD",
    CHINA_AS_CENTER_OF_WORLD: "CHINA_AS_CENTER_OF_WORLD"
};

var WORLD_MAP_OFFSET = {

    //欧洲
    'Europe': {

        //'center': [ 0, 0 ],
        'center': [ -( 90 + 180 ) / 2,  ( 15 + 45 ) / 2 ],
        'scale':  [ 0.12277544601653208 * 1.5, 0.37981453722421954 ]
    },

    //非洲
    'Africa': {

        //'center': [ 0, 0 ],
        'center': [ -( 90 + 180 ) / 2,  0 + 5 ],
        'scale':  [ 0.4378434615338997, 0.41687443680677555 ]
    },
    
    //亚洲
    'Asia': {

        //'center': [ 0, 0 ],
        'center': [ -( 90 + 180 ) / 2, -( 15 + 45 ) / 2 ],
        'scale':  [ 0.2515074811624496 * 1.5, 0.45779493485516265 ]
    },

    //北美
    'North America': {

        //'center': [ 0, 0 ],
        'center': [ ( 90 + 180 ) / 2,  ( 15 + 45 ) / 2 ],
        'scale':  [ 0.18828420528099765, 0.39361814358905206 - 0.1 ]
    },

    //南美
    'South America': {

        //'center': [ 0, 0 ],
        'center': [ ( 90 + 180 ) / 2,  0 ],
        'scale':  [ 0.6456196134562835 / 1.5, 0.4422127719273351 ]
    },

    //大洋洲
    'Oceania': {

        //'center': [ 0, 0 ],
        'center': [ ( 90 + 180 ) / 2 - 90, -( 15 + 45 ) / 2 ],
        'scale':  [ 0.08334916536370082 * 8, 0.6830513509892986 ]
    },

    'China': {

        'center': [ 0, 0 ],
        'scale':  [ 3.2, 4 ]
    }
};

var defaultOptions = {

    "sampleColor": 0x002F4D,
    "focusedColor": 0x575757,
    "selectedColor": 0x000F2F,
    "mapType": MAP_TYPE_ENUM.CHINA_AS_CENTER_OF_WORLD,
    "mapOffset": WORLD_MAP_OFFSET
};

//地图类
export default Map = function (options){
    
    THREE.Object3D.call(this);
    
    options || ( options = {} );

    //地图区域对象起始ID
    this.mapPolygonStartId = 0;
    //地图区域对象，key为name，value为{id: 0, name: 'city'}
    this.mapPolygonDict = {};
    //地图区域列表，index为id 或者 名字，value为{id: 0, name: 'city'}
    this.mapPolygonList = [];
    this.mapPolygonListLength = 0;
    //用于存储定位函数所需的变换矩阵对象
    this.LocationMatrixDict = {}
    //时钟
    this.clock = new THREE.Clock(false);
    //聚焦区域的id
    this.focusedPolygonId = -1;
    //聚焦区域的id
    this.selectedPolygonId = -1;

    //设置参数
    this.setOptions(options, defaultOptions);
    //解析geojson
    this.analyticalData();
    //绘制地图
    var drawRestult = this.draw();
    this.mesh = drawRestult[0];
    this.line = drawRestult[1];
}

Map.prototype = Object.create(THREE.Object3D.prototype);
Map.prototype.constructor = Map;

Map.prototype.setOptions = function (options, defaultOptions){

    var keys = Object.keys(defaultOptions);

    for (var i = 0, l = keys.length; i < l; i++){

        var key = keys[i];
        this[key] = options[key] !== undefined? options[key]: defaultOptions[key];
    }
}

Map.prototype.analyticalData = function (){

    var polygonId = 0;

    if (this.mapType == MAP_TYPE_ENUM.ONLY_CHINA) {

        this.chinaGeoJson = JSON.parse(ChinaJson);

    }else if (this.mapType == MAP_TYPE_ENUM.SIMPLE_WORLD){

        this.worldGeoJson = JSON.parse(WorldJson);

    }else{  //MAP_TYPE_ENUM.CHINA_AS_CENTER_OF_WORLD

        this.chinaGeoJson = JSON.parse(ChinaJson);
        this.worldGeoJson = JSON.parse(WorldJson);
    }

    if (this.chinaGeoJson){

        var features = this.chinaGeoJson.features;

        for ( var i = 0, fl = features.length; i < fl; i++ ){
            
            var parentName = 'China';
            var province = features[i];
            var provinceName = province['properties']['name'];
            var provinceGeo = province['geometry'];

            if ( provinceGeo ) {

                var provinceGeoType = provinceGeo['type'];
                var provinceGeoCoords = provinceGeo['coordinates'];

                var center = this.mapOffset[parentName]['center'];
                var scale = this.mapOffset[parentName]['scale'];

                var polygonObject = {'id': polygonId, 'name': provinceName, 'code': provinceName, 'parentName': parentName, 'provinceName': provinceName, 'coord': [], 'center': center, 'scale': scale};

                this.mapPolygonList.push(polygonObject);
                this.mapPolygonDict[polygonId] = polygonObject;
                this.mapPolygonDict[provinceName] = polygonObject;

                polygonId++;

                if (provinceGeoType == "Polygon"){

                    polygonObject.coord.push( provinceGeoCoords[0] );

                }else{

                    for (var j = 0, pl = provinceGeoCoords.length; j < pl; j++ ){

                        polygonObject.coord.push(provinceGeoCoords[j][0]);

                    }
                }
            }
        }
    }

    if (this.worldGeoJson){

        var result = this.worldGeoJson;

        for ( var i = 0, pl = result.length; i < pl; i++ ){
            
            var parent = result[i];
            var parentName = parent['name'];
            var children = parent['children'];

            if (!this.mapOffset[parentName]) continue;

            var center = this.mapOffset[parentName]['center'];
            var scale = this.mapOffset[parentName]['scale'];

            for (var j = 0, cl = children.length; j < cl; j++ ){

                var child = children[j];
                var childCode = child['code'];
                var childName = child['name'];
                var coords = child['coords'];

                if (parentName == 'Europe'){

                    var coordsLen = coords.length;

                    for (var k = 0; k < coordsLen; k++){

                        var coord = coords[k];
                        var coordLen = coord.length;

                        for (var m = 0; m < coordLen; m++){

                            if (coord[m][0] < -90){

                                coord[m][0] += 360;
                            }
                        }
                    }
                }
                
                //var mapPolygonListLength = this.mapPolygonList.length;
                //var polygonId = mapPolygonListLength;
                var polygonObject = {'id': polygonId, 'name': childName, 'code': childCode, 'parentName': parentName, 'coord': coords, 'center': center, 'scale': scale};

                this.mapPolygonList.push(polygonObject);
                this.mapPolygonDict[polygonId] = polygonObject;

                polygonId++;
            }
        }
    }

    this.mapPolygonListLength = this.mapPolygonList.length;
}

Map.prototype.draw = function (mapType){

    var _this = this;
    var lineGeo = new THREE.Geometry();
    var mapGeo = new THREE.Geometry();
    var mapMat = new THREE.ShaderMaterial( {

        attributes: {

            a_polygon_id: {type: 'f', value: []}
        },
        uniforms: {
            u_focused_polygon_id: {type: 'f', value: -1},
            u_selected_polygon_id: {type: 'f', value: -1},
            u_sample_color: {type: 'c', value: new THREE.Color(this.sampleColor)},
            u_focused_color: {type: 'c', value: new THREE.Color(this.focusedColor)},
            u_selected_color: {type: 'c', value: new THREE.Color(this.selectedColor)},
            u_light_intensity: {type: 'f', value: Config.light.intensity},
            u_light_position: {type: 'v3', value: Config.light.position},
            u_light_color: {type: 'c', value: Config.light.color},
            u_ambient_color: {type: 'c', value: Config.light.color},
            u_specular_color: {type: 'c', value: Config.light.color}
        },
        vertexShader: Utils.Reg.ShaderMatch("map_vs", Shaders)[0],
        fragmentShader: Utils.Reg.ShaderMatch("map_fs", Shaders)[0],
        depthTest:  true,
        transparent: true,
        // blending: THREE.AdditiveBlending,
        side: THREE.FrontSide
    });

    mapGeo.onMergeHandler = function ( vertex ){

        mapMat.attributes.a_polygon_id.value.push(vertex.areaId);
    };

    var currentParentName = '';

    var geos = [];

    for ( var i = 0, pl = this.mapPolygonList.length; i < pl; i++ ){

        var shapes = [];
        var linesVectices = [];
        var area = this.mapPolygonList[i];
        var areaId = area['id'];
        var childName = area['name'];
        var parentName = area['parentName'];
        //var provinceName = area['provinceName'];
        var center = area['center'];
        var scale = area['scale'];
        var coords = area['coord'];
        var coordsLen = coords.length;

        currentParentName == '' && ( currentParentName = parentName );

        if (currentParentName !== parentName){

            resetShapes(geos, currentParentName, this.mapOffset[currentParentName]['center'], this.mapOffset[currentParentName]['scale']);

            currentParentName = parentName;
        }
        
        for (var j = 0; j < coordsLen; j++){

            var shape_pts = [];
            var coord = coords[j];
            var coordLen = coord.length;

            for (var k = 0; k < coordLen; k++){

                var lonLat = coord[k];
                shape_pts.push(new THREE.Vector2(lonLat[0], lonLat[1]));

                linesVectices.push(new THREE.Vector3( lonLat[0], lonLat[1], 1 ));
                if (k !== coordLen - 1 && k !== 0){

                    linesVectices.push(new THREE.Vector3( lonLat[0], lonLat[1], 1 ));
                }
            }

            var shape = new THREE.Shape(shape_pts);
            shapes.push(shape);
        }

        var bevelSize = parentName == 'China' ? -0.05: -0.1
        //var mapGeometry = new THREE.ExtrudeGeometry( shapes, {amount: 10.0, steps: 1 , bevelSegments: 0, bevelSize: bevelSize, bevelThickness: 0 } );
        var mapGeometry = new THREE.ExtrudeGeometry( shapes, {amount: 0.0, steps: 0 , bevelSegments: 0, bevelSize: 0, bevelThickness: 0 } );
            mapGeometry.areaId = areaId;
            mapGeometry.childName = childName;
            mapGeometry.parentName = parentName;

        var lineGeometry = new THREE.Geometry();
            lineGeometry.vertices = linesVectices;
            lineGeometry.areaId = areaId;
            lineGeometry.childName = childName;
            lineGeometry.parentName = parentName;

        this.mapPolygonList[areaId]["origin"] = this.mapPolygonDict[areaId]["origin"] = this.ComputeGeometryCenter(mapGeometry);
        
        geos.push({ face: mapGeometry, line: lineGeometry });
        if (i == pl - 1) resetShapes(geos, parentName, center, scale);
    }

    function resetShapes(geometrys, pname, center, scale){

        var mapGeometry = new THREE.Geometry();
        var lineGeometry = new THREE.Geometry();
        var areaIdList = [];
        var areaNameList = [];

        for (var i = 0; i < geometrys.length; i++){

            var face_geo = geometrys[i]["face"];
            var line_geo = geometrys[i]["line"];
            areaIdList.push(face_geo.areaId);
            areaNameList.push(face_geo.childName);

            Utils.merge(mapGeometry, face_geo);
            Utils.merge(lineGeometry, line_geo);
        }

        var geoCenter = _this.ComputeGeometryCenter(mapGeometry);

        var tempMatrix = new THREE.Matrix4().multiplyMatrices(
            new THREE.Matrix4().makeScale(scale[0], scale[1], 1),
            new THREE.Matrix4().makeTranslation(-geoCenter.x, -geoCenter.y, -geoCenter.z)
        );

        tempMatrix = new THREE.Matrix4().multiplyMatrices(
            new THREE.Matrix4().makeTranslation(center[0], center[1], 0), 
            tempMatrix
        );

        var transformMatrix = new THREE.Matrix4().multiplyMatrices(
            new THREE.Matrix4().makeScale(4, 4, 1),
            tempMatrix
        );

        mapGeometry.applyMatrix(transformMatrix);
        lineGeometry.applyMatrix(transformMatrix);
        _this.LocationMatrixDict[pname.toLowerCase()] = transformMatrix;

        for (var i = 0; i < areaIdList.length; i++){

            _this.mapPolygonList[areaIdList[i]]["origin"].applyMatrix4(transformMatrix);
            _this.mapPolygonDict[areaIdList[i]]["origin"] = _this.mapPolygonList[areaIdList[i]]["origin"];

            var areaName = areaNameList[i].toLowerCase();

            if (areaName !== "china"){

                _this.LocationMatrixDict[areaName] = transformMatrix
            }
        }

        Utils.merge( mapGeo, mapGeometry );
        Utils.merge( lineGeo, lineGeometry );

        geos = [];
    }

    // convert buffer

    var mapGeoFaceLength = mapGeo.faces.length;
    var polygon_id_buffer = new Float32Array( mapGeoFaceLength * 3 * 1 );

    for ( var i = 0, i2 = 0; i < mapGeoFaceLength; i ++, i2 += 3 ) {

        var face = mapGeo.faces[ i ];

        var a = mapGeo.vertices[ face.a ];

        polygon_id_buffer[ i2 ] = a.areaId;
        polygon_id_buffer[ i2 + 1 ] = a.areaId;
        polygon_id_buffer[ i2 + 2 ] = a.areaId;
    }

    var mapBufferGeometry = new THREE.BufferGeometry().fromGeometry( mapGeo );
        mapBufferGeometry.addAttribute("a_polygon_id", new THREE.BufferAttribute( polygon_id_buffer, 1 ));
        mapMat.attributes.a_polygon_id.value = null;
        mapGeo = null;

    var linePositions = new Float32Array(lineGeo.vertices.length * 3);

    for (var i = 0, l = lineGeo.vertices.length; i < l; i++){

        var vertex = lineGeo.vertices[i];

        linePositions[ i * 3 + 0 ] = vertex.x;
        linePositions[ i * 3 + 1 ] = vertex.y;
        linePositions[ i * 3 + 2 ] = vertex.z;
    }

    var lineBufferGeometry = new THREE.BufferGeometry();
        lineBufferGeometry.addAttribute("position", new THREE.BufferAttribute( linePositions, 3 ));

    var mesh = new THREE.Mesh( 
        mapBufferGeometry,
        mapMat
    );

    var line = new THREE.Line(lineBufferGeometry, new THREE.LineBasicMaterial({color: 0xffffff}), THREE.LinePieces);

    this.add(mesh);
    this.add(line);
    return [ mesh, line];
}

Map.prototype.SetMapUniforms = function (key, value){

    this.mesh.material.uniforms[key].value = value;
}

Map.prototype.HighLight = function ( cname ){

    this.selectedPolygonId = this.mapPolygonDict[cname]["id"];
    this.SetMapUniforms("u_selected_polygon_id", this.selectedPolygonId);
}

//定位工具函数
Map.prototype.LocationHandler = function ( pname, cname, lonlat ){

    // pname: 大洲名、China
    // cname: 国家名、省份名
    // lonlat: 自定义经纬度，屏蔽内建定位库
    
    if (!pname || !cname) return;

    var coord = [];

    if (lonlat){

        coord = lonlat;
        
    }else {

        coord = Locator.WorldCountry(cname);

        if (!coord){

            coord = Locator.ChinaState( cname );

            if (!coord) return;
        }
    }

    var v = new THREE.Vector3( coord[0], coord[1], 0 );

    if (pname.toLowerCase() == 'europe' && coord[0] < -90) v.x += 360;

    var transformMatrix = this.LocationMatrixDict[pname];

    transformMatrix && v.applyMatrix4(transformMatrix);

    this.localToWorld(v);

    return v;
}

//随机中国的city
Map.prototype.RandomCityOfChina = function (){

    var city = this.mapPolygonList[ THREE.Math.randInt( 0, this.mapPolygonListLength - 1 ) ];
    var vertex = city.origin;
    vertex.cityId = city.id;
    vertex.cityName = city.name;
    
    return vertex;
}

Map.prototype.ComputeGeometryCenter = function (geometry){

    geometry.boundingBox || geometry.computeBoundingBox();

    var max = geometry.boundingBox.max;
    var min = geometry.boundingBox.min;
    var geoCenter = new THREE.Vector3();
        geoCenter.addVectors( min, max );
        geoCenter.multiplyScalar( 0.5 );

    return geoCenter;
}

Map.prototype.render = function (renderer, camera){

    var deltaTime = this.clock.getDelta();
    var elapsedTime = this.clock.elapsedTime;

    // requestAnimationFrame(this.render.bind(this));
}

Map.MAP_TYPE_ENUM = MAP_TYPE_ENUM;