import * as THREE from 'three'
import 'three-trackballcontrols'
import OrbitControls from 'three-orbitcontrols'
import $ from 'jquery'
import { drawThreeGeo } from './libs/threeGeoJSON'
import './libs/CSS3DRenderer'
import Stats from './libs/stats.min'
import 'tween.js'


// import Ribbon from './ribbonEffect.js'

const CONFIG = {
  WIDTH: window.innerWidth,
  HEIGHT: window.innerHeight,
  DEVICE_PIXEL_RATIO: window.devicePixelRatio,
  FLAT_NUM: 6,
  FLAT_RADIUS: 400,
}

const canvas = document.getElementById('sphere')

const scene = new THREE.Scene()

// 性能监控
const stats = new Stats()
stats.domElement.style.position = 'absolute'
stats.domElement.style.left = '0px'
stats.domElement.style.top = '0px'
canvas.appendChild(stats.domElement)

// 设置相机
const camera = new THREE.PerspectiveCamera(75, CONFIG.WIDTH / CONFIG.HEIGHT, 1, 1000)
camera.position.z = 600
camera.position.x = 0
camera.position.y = 100
camera.lookAt(0, 0, 0)

// 设置渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(CONFIG.DEVICE_PIXEL_RATIO)
renderer.setSize(CONFIG.WIDTH, CONFIG.HEIGHT)
canvas.appendChild(renderer.domElement)


// 设置控制器
const controls = new OrbitControls(camera)
// controls.maxPolarAngle = Math.PI / 2
// controls.minPolarAngle = Math.PI / 2
// controls.autoRotate = true


// CSS3D 场景
const css3DScene = new THREE.Scene()

// flat dom 结构
for (let i = 0; i < CONFIG.FLAT_NUM; i++) {
  const flatElement = document.createElement('div')
  flatElement.className = 'flat'
  const flat = new THREE.CSS3DObject(flatElement)
  flat.position.x = Math.cos(i * (2 * Math.PI / CONFIG.FLAT_NUM)) * CONFIG.FLAT_RADIUS
  flat.position.z = Math.sin(i * (2 * Math.PI / CONFIG.FLAT_NUM)) * CONFIG.FLAT_RADIUS
  flat.rotation.y = -( i * (2 * Math.PI / CONFIG.FLAT_NUM) - Math.PI / 2)
  flat.position.y = 0
  css3DScene.add(flat)
}

// CSS3D Renderer
const css3DRenderer = new THREE.CSS3DRenderer()
css3DRenderer.setSize(CONFIG.WIDTH, CONFIG.HEIGHT)
css3DRenderer.domElement.style.position = 'absolute'
css3DRenderer.domElement.style.top = 0
canvas.appendChild(css3DRenderer.domElement)

// 粒子系统
const particleCount = 400
const particles = new THREE.Geometry()
const pMaterial = new THREE.PointsMaterial({
  color: 0xFFFFFF,
  size: 1,
  blending: THREE.AdditiveBlending,
  transparent: true,
})

for (let p = 0; p < particleCount; p++) {
  const pX = Math.random() * 1000 - 500
  const pY = Math.random() * 1000 - 500
  const pZ = Math.random() * 1000 - 500
  const particle = new THREE.Vector3(pX, pY, pZ)
  particles.vertices.push(particle)
}

const particleSystem = new THREE.Points(particles, pMaterial)
particleSystem.sortParticles = true
scene.add(particleSystem)


// 波浪点阵
const WAVE = {
  COUNT_X: 100,
  COUNT_Y: 100,
  SEPARATION: 20,
  RANGE: 5,
}

const waveParticles = new THREE.Group()
const waveArray = []
let waveAnimeCount = 0
const waveParticleGeo = new THREE.IcosahedronGeometry(1, 0)
const waveParticleMat = new THREE.MeshPhongMaterial({ color: 0xffffff })

for (let ix = 0; ix < WAVE.COUNT_X; ix++) {
  for (let iy = 0; iy < WAVE.COUNT_Y; iy++) {
    const waveParticle = new THREE.Mesh(waveParticleGeo, waveParticleMat)
    waveParticle.position.x = ix * WAVE.SEPARATION - ((WAVE.COUNT_X * WAVE.SEPARATION) / 2)
    waveParticle.position.y = iy * WAVE.SEPARATION - ((WAVE.COUNT_Y * WAVE.SEPARATION) / 2)
    waveParticles.add(waveParticle)
    waveArray.push(waveParticle)
  }
}
waveParticles.rotation.x = -Math.PI / 2
waveParticles.position.y = -300
scene.add(waveParticles)

// ------------------- 地球 ---------------

// 构造地球
// 地表层 + 地形层
const globe = new THREE.Group()

const innerGlobeGeo = new THREE.SphereGeometry(200, 200, 100)
const innerGlobeMat = new THREE.MeshLambertMaterial({
  color: 0x222222,
  // transparent: true,
  shininess: 1000,
  // wireframe: true,
  // shading: THREE.FlatShading,
  castShadow: true,
})
const innerGlobe = new THREE.Object3D()
innerGlobe.add(new THREE.Mesh(innerGlobeGeo, innerGlobeMat))

$.getJSON('./test_geojson/countries_states.geojson', (data) => {
  drawThreeGeo(data, 201, 'sphere', {
    color: 0x00d0ea,
  }, innerGlobe)
})
$.getJSON('./test_geojson/pop_places.geojson', (data) => {
  drawThreeGeo(data, 201, 'sphere', {
    color: 0x00d0ea,
  }, innerGlobe)
})
globe.add(innerGlobe)

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


// --------------------- 光线 -------------------
// 环境光
const ambientLight = new THREE.AmbientLight(0xffffff, 0.75)
scene.add(ambientLight)

// 两极渲染光
const polarLight = new THREE.HemisphereLight(0x00d0ea, 0x6200DE, 1)
scene.add(polarLight)


const pointLight = new THREE.PointLight(0xffffff, 30, 10)
pointLight.add(
  new THREE.Mesh(
    new THREE.SphereGeometry(10, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  ))
scene.add(pointLight)

// const createSpotLight = (color) => {
//   const spotLight = new THREE.SpotLight(color, 10)
//   spotLight.angle = 0.4
//   spotLight.penumbra = 0.2
//   spotLight.decay = 10
//   spotLight.distance = 100
//   return spotLight
// }
// const spotLight1 = createSpotLight(0xFF7F00)
// spotLight1.position.set(0, -200, 0)
// spotLight1.target.position.set(0, -300, 0)

// spotLight1.target.updateMatrixWorld()
// const spotLightHelper1 = new THREE.SpotLightHelper(spotLight1)
// scene.add(spotLight1)
// scene.add(spotLightHelper1)


const pointLightAnimation = () => {
  const time = Date.now() * 0.0005
  pointLight.position.x = Math.sin(time * 2) * 150
  pointLight.position.y = Math.cos(time * 2) * 200
  pointLight.position.z = Math.cos(time * 2) * 200
}

const waveAnimation = () => {
  let i = 0
  for (let ix = 0; ix < WAVE.COUNT_X; ix++) {
    for (let iy = 0; iy < WAVE.COUNT_Y; iy++) {
      const waveParticle = waveArray[i++]
      waveParticle.position.z = (Math.sin((ix + waveAnimeCount) * 0.3) * WAVE.RANGE) + (Math.sin((iy + waveAnimeCount) * 0.5) * WAVE.RANGE)
      waveParticle.scale.x = waveParticle.scale.y = waveParticle.scale.z = (Math.sin((ix + waveAnimeCount) * 0.3) + 1) * 0.5 + (Math.sin((iy + waveAnimeCount) * 0.5) + 1) * 0.5
    }
  }
  waveAnimeCount += 0.1
}

// 渲染
function render() {
  controls.update()
  stats.update()
  pointLightAnimation()
  waveAnimation()
  renderer.render(scene, camera)
  css3DRenderer.render(css3DScene, camera)
  requestAnimationFrame(render)
}

$(window).on('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight())
})

render()
