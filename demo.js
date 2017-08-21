import * as THREE from 'three'
import 'three-trackballcontrols'
import OrbitControls from 'three-orbitcontrols'
import $ from 'jquery'
import { drawThreeGeo } from './libs/threeGeoJSON.js'

// import Ribbon from './ribbonEffect.js'

const canvas = document.getElementById('sphere')

const clock = new THREE.Clock()

const scene = new THREE.Scene()

// 设置相机
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000)
camera.position.z = 600
camera.position.x = 0
camera.position.y = 100
camera.lookAt(0, 0, 0)

// 设置渲染器
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)


// 设置控制器
const controls = new OrbitControls(camera)
controls.maxPolarAngle = Math.PI / 2
controls.minPolarAngle = Math.PI / 2
controls.autoRotate = true



// 粒子系统
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


    particles.vertices.push(particle);
}

const particleSystem = new THREE.Points(particles, pMaterial)
particleSystem.sortParticles = true
scene.add(particleSystem)



// ------------------- 地球 ---------------

// 构造地球
// 地表层 + 地形层
// 
const globe = new THREE.Group()

const innerGlobeGeo = new THREE.SphereGeometry(200, 200, 100)
const innerGlobeMat = new THREE.MeshPhongMaterial({
    color: 0x222222,
    transparent: true,
    shininess: 1000,
    // wireframe: true
})
const innerGlobe = new THREE.Object3D()
innerGlobe.add(new THREE.Mesh(innerGlobeGeo, innerGlobeMat))

$.getJSON("./test_geojson/countries_states.geojson", function(data) {
    drawThreeGeo(data, 201, 'sphere', {
        color: 0x00d0ea
    }, innerGlobe)
})
$.getJSON("./test_geojson/pop_places.geojson", function(data) {
    drawThreeGeo(data, 201, 'sphere', {
        color: 0x00d0ea
    }, innerGlobe)
})
// globe.add(innerGlobe)

// 环线层
const lineGlobeGeo = new THREE.SphereGeometry(200, 200, 200)
const lineGlobeMat = new THREE.MeshPhongMaterial({
    color: 0x333333,
    transparent: true,
    wireframe: true,
})
const lineGlobe = new THREE.Object3D()
lineGlobe.add(new THREE.Mesh(lineGlobeGeo, lineGlobeMat))
globe.add(lineGlobe)

globe.rotation.z = -Math.PI / 6

scene.add(globe)



const carousel = new THREE.Group()

const flatGeo = new THREE.PlaneGeometry(100, 100, 32)
const flatMat = new THREE.MeshLambertMaterial({color: 0xffffff})
const flat = new THREE.Mesh(flatGeo, flatMat)
flat.doubleSided = true

scene.add(flat)


// --------------------- 光线 -------------------
// 环境光
const ambientLight = new THREE.AmbientLight(0xffffff, 0.75)
scene.add(ambientLight)

// 两极渲染光
const polarLight = new THREE.HemisphereLight(0x00d0ea, 0x6200DE, .4)
scene.add(polarLight)

const pointLight = new THREE.PointLight(0xffffff, 20, 10)
pointLight.add(
  new THREE.Mesh(
    new THREE.SphereGeometry(2, 32, 32), 
    new THREE.MeshBasicMaterial({color: 0xffffff})
  )
)
scene.add(pointLight)



const pointLightAnimation = () => {
    const time = Date.now() * 0.0005
    pointLight.position.x = Math.sin(time * 4) * 150;
    pointLight.position.y = Math.cos(time * 4) * 200;
    pointLight.position.z = Math.cos(time * 4) * 200;
}

// 渲染
function render() {
    controls.update()
    pointLightAnimation()
    requestAnimationFrame(render)
    renderer.render(scene, camera)
}

$(window).on('resize', () => {
    init()
})

render()