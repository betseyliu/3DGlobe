'use strict'

import * as THREE from 'three'


const Config =  {
  'debug': false,
  'texturePath': '/visb360front/resources/textures/',
  'imagePath': '/visb360front/resources/img/',
  'webglSize': {
    w: function () {
      return window.innerWidth - 560
    },
    h: function () {
      return window.innerHeight - 105
    }
  },

  'fog': {
    'color': 0x000000,
    'near': 200,
    'far': 550
  },
  'globeRadius': 180,
  'camera': null,
  'light': {
    'color': new THREE.Color(0x808080),
    'intensity': 3,
    'position': new THREE.Vector3(-1000, 0, 2000)
  },
  'levelColors': [
    0xF4D03F,
    0xD35400,
    0xCF000F
  ],
  'wlzpTypeToColor': {
    'shopping': 0xff7042,
    'licai': 0x03a9f4,
    'ticket': 0xfff176,
    'jiayao': 0xb740fb,
    'happy': 0xbaff68,
    'other': 0xff4081
  },
  'homePos': new THREE.Vector3(302, 130, -70)
}

export {
  Config
}