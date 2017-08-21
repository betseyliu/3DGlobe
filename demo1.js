import * as THREE from 'three'
import 'three-trackballcontrols'
import OrbitControls from 'three-orbitcontrols'
import $ from 'jquery'
import { drawThreeGeo } from './libs/threeGeoJSON.js' 

// import Ribbon from './ribbonEffect.js'

const canvas = document.getElementById('sphere')
let scene, camera, renderer, controls, earth ,particles, spotLight1

const clock = new THREE.Clock()


// 设置相机
const initCamera = () => {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000)
    camera.position.z = 600
    camera.position.x = 0
    camera.position.y = 100
    camera.lookAt(0, 0, 0)
}

// 设置渲染器
const initRenderer = () => {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
}


// 设置控制器
const initControl = () => {
    controls = new OrbitControls(camera)
    controls.maxPolarAngle = Math.PI / 2
    controls.minPolarAngle = Math.PI / 2
    // controls.autoRotate = true
}


// 粒子系统

const particleSystem = () => {
  const particleCount = 400
  const particles = new THREE.Geometry()
  const pMaterial = new THREE.PointsMaterial({
    color: 0xFFFFFF,
    size: 1,
    blending: THREE.AdditiveBlending,
    transparent: true
  })

  for (let p = 0; p < particleCount; p++) {

    const pX = Math.random() * 1000 - 500
    const pY = Math.random() * 1000 - 500
    const pZ = Math.random() * 1000 - 500
    const particle = new THREE.Vector3(pX, pY, pZ)

    // add it to the geometry
    particles.vertices.push(particle);
  }

  const system = new THREE.Points(particles, pMaterial)
  system.sortParticles = true

  return system
}




// ------------------- 地球 ---------------

// 构造地球
// 地表层 + 地形层
const innerGlobe = () => {
    const planet = new THREE.Object3D()
    const map = THREE.TextureLoader('./resources/textures/map_blur.jpg')
    //Create a sphere to make visualization easier.
    const geometry = new THREE.SphereGeometry(200, 200, 100)
    const material = new THREE.MeshPhongMaterial({
        color: 0x222222,
        transparent: true,
        shininess: 1000,
        // wireframe: true
    })
    const sphere = new THREE.Mesh(geometry, material)
    planet.add(sphere)

    $.getJSON("./test_geojson/countries_states.geojson", function(data) {
      drawThreeGeo(data, 201, 'sphere', {
          color: 0x00d0ea
      }, planet)
    })

    $.getJSON("./test_geojson/pop_places.geojson", function(data) {
        drawThreeGeo(data, 201, 'sphere', {
            color: 0x00d0ea
        }, planet)
    })

    return planet
}

// 环线层
const lineGlobe = () => {
   const planet = new THREE.Object3D()
   const geometry = new THREE.SphereGeometry(200, 200, 200)
   const material = new THREE.MeshPhongMaterial({
       color: 0x333333,
       transparent: true,
       wireframe: true,
   })
   const sphere = new THREE.Mesh(geometry, material)
   planet.add(sphere)
   return planet
}

// 地球整体
const globe = () => {
  const group =new THREE.Group()
  group.add(innerGlobe())
  group.add(lineGlobe())
  group.rotation.z = - Math.PI / 6
  return group
}



// 环境光
const ambientLight = () => {
  return new THREE.AmbientLight(0xffffff, 0.75)
}
// 两极渲染光
const polarLight = () => {
  return new THREE.HemisphereLight( 0x00d0ea, 0x6200DE, .4 )
}

const spotLight = () => {
  const light = new THREE.SpotLight(0xffffff, 2, 50)
  return light
  // return light.add(new THREE.Mesh( new THREE.SphereGeometry( 15, 16, 8 ), new THREE.MeshBasicMaterial( { color: 0xffffff } ) ))
}




// 初始化
const init = () => {
  scene = new THREE.Scene()

  // 初始化渲染器、相机、控制器
  initRenderer()
  initCamera()
  initControl()

  // 加入灯光
  scene.add(ambientLight())
  scene.add(polarLight())
  
  // 加入地球
  earth = globe()
  scene.add(earth)

  spotLight1 = spotLight()
  scene.add(spotLight1)

  // 加入粒子系统
  particles = particleSystem()
  scene.add(particles)

}


const spotLightAnimation = () => {
  const time = Date.now() * 0.0005
  spotLight1.position.x = Math.sin( time * 0.7 ) * 250;
  spotLight1.position.y = Math.cos( time * 0.5 ) * 250;
  spotLight1.position.z = Math.cos( time * 0.3 ) * 250;


}

// 渲染
function render() {
  controls.update()
  requestAnimationFrame(render)

  // spotLightAnimation()
  // earth.rotation.y += 0.01
  renderer.render(scene, camera)
}

$(window).on('resize', () => {
  init()
})

init()
render()