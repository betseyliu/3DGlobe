import * as THREE from 'three'
import 'three-trackballcontrols'
import OrbitControls from 'three-orbitcontrols'
import $ from 'jquery'
import { drawThreeGeo } from './libs/threeGeoJSON'
import './libs/CSS3DRenderer'
import Stats from './libs/stats.min'


// import Ribbon from './ribbonEffect.js'

const CONFIG = {
  WIDTH: window.innerWidth,
  HEIGHT: window.innerHeight,
  DEVICE_PIXEL_RATIO: window.devicePixelRatio,
  FLAT_NUM: 6,
  FLAT_RADIUS: 400,
  CANVAS: document.body,
}

class ParticleSystem {
  constructor({ particleNum = 400, size = 1, color = 0xffffff, radius = 500 } = {}) {
    this.particleNum = particleNum
    this.size = size
    this.color = color
    this.radius = radius
    this.init()
  }
  init() {
    const particles = new THREE.Geometry()
    const particleMat = new THREE.PointsMaterial({
      color: this.color,
      size: 1,
      blending: THREE.AdditiveBlending,
      transparent: true,
    })

    for (let i = 0; i < this.particleNum; i++) {
      const px = Math.random() * this.radius * 2 - this.radius
      const py = Math.random() * this.radius * 2 - this.radius
      const pz = Math.random() * this.radius * 2 - this.radius
      const particle = new THREE.Vector3(px, py, pz)
      particles.vertices.push(particle)
    }
    this.mesh = new THREE.Points(particles, particleMat)
    this.mesh.sortParticles = true
  }
}

class Earth {
  constructor({ radius }) {
    this.radius = radius
    this.init()
  }
  init() {
    this.mesh = new THREE.Group()
    const innerGlobe = new THREE.Object3D()
    innerGlobe.add(new THREE.Mesh(this.getGlobeGeo(this.radius), this.getGlobeMat({
      color: 0x222222,
    })))

    this.drawGeoJson({
      jsonFile: './test_geojson/countries_states.geojson',
      color: 0x00d0ea,
      parentMesh: innerGlobe,
    })

    const lineGlobe = new THREE.Object3D()
    lineGlobe.add(new THREE.Mesh(this.getGlobeGeo(this.radius), this.getGlobeMat({
      color: 0x333333,
      wireframe: true,
    })))

    this.mesh.add(innerGlobe)
    this.mesh.add(lineGlobe)
  }
  getGlobeMat({ color, wireframe = false }) {
    return new THREE.MeshLambertMaterial({
      color,
      wireframe,
    })
  }
  getGlobeGeo(radius) {
    return new THREE.SphereGeometry(radius, 200, 200)
  }
  drawGeoJson({ jsonFile, color, shape = 'sphere', parentMesh }) {
    $.getJSON(jsonFile, (data) => {
      drawThreeGeo(data, 201, shape, {
        color,
      }, parentMesh)
    })
  }
}

let stats, camera, webGLScene, webGLRenderer, controls, particleSystem, earth, pointLight
const initWorld = () => {
  stats = new Stats()
  stats.domElement.style.position = 'absolute'
  stats.domElement.style.left = '0px'
  stats.domElement.style.top = '0px'
  CONFIG.CANVAS.appendChild(stats.domElement)

  camera = new THREE.PerspectiveCamera(75, CONFIG.WIDTH / CONFIG.HEIGHT, 1, 1000)
  camera.position.set(0, 100, 600)
  camera.lookAt(0, 0, 0)

  webGLScene = new THREE.Scene()

  webGLRenderer = new THREE.WebGLRenderer({ antialias: true })
  webGLRenderer.setPixelRatio(CONFIG.DEVICE_PIXEL_RATIO)
  webGLRenderer.setSize(CONFIG.WIDTH, CONFIG.HEIGHT)
  CONFIG.CANVAS.appendChild(webGLRenderer.domElement)

  controls = new OrbitControls(camera)
// controls.maxPolarAngle = Math.PI / 2
// controls.minPolarAngle = Math.PI / 2
// controls.autoRotate = true

  particleSystem = new ParticleSystem()
  webGLScene.add(particleSystem.mesh)

  earth = new Earth({ radius: 200 })
  earth.mesh.rotation.z = 0.2 * Math.PI
  webGLScene.add(earth.mesh)

  // --------------------- 光线 -------------------
  // 环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75)
  webGLScene.add(ambientLight)

  // 两极渲染光
  const polarLight = new THREE.HemisphereLight(0x00d0ea, 0x6200DE, 1)
  webGLScene.add(polarLight)


  pointLight = new THREE.PointLight(0xffffff, 30, 10)
  pointLight.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(10, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    ))
  webGLScene.add(pointLight)

}

initWorld()



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
CONFIG.CANVAS.appendChild(css3DRenderer.domElement)



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
webGLScene.add(waveParticles)




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
// webGLScene.add(spotLight1)
// webGLScene.add(spotLightHelper1)


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
  webGLRenderer.render(webGLScene, camera)
  css3DRenderer.render(css3DScene, camera)
  requestAnimationFrame(render)
}

$(window).on('resize', () => {
  webGLRenderer.setSize(window.innerWidth, window.innerHeight())
})

render()
