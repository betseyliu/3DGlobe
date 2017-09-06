import * as THREE from 'three'
import OrbitControls from 'three-orbitcontrols'
import $ from 'jquery'
import { drawThreeGeo } from './libs/threeGeoJSON'
import TWEEN from 'tween'
import Chimee from'chimee'


// 一些使用到的配置
const config = {
  width: window.innerWidth,
  height: window.innerHeight,
  devicePixelRatio: window.devicePixelRatio,
  canvas: document.body,
  flatSrcMap: $('.video'),
  flatBorderMap: ['./resource/border.png', './resource/border.png']
}

const handleResize = () => {
    const height = window.innerHeight
    const width = window.innerWidth
    webGLRenderer.setSize(width, height)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
}
const render = () => {
  const delta = clock.getDelta()

  // 更新控制器
  controls.update()

  // 更新粒子海洋动画
  wave.animate()
  // 更新缓动动画
  TWEEN.update()
  // 进行渲染
  webGLRenderer.render(webGLScene, camera)
  requestAnimationFrame(render)
}

const moveCameraToFlat = ({flat, dist, time}) => {
  const fx = flat.position.x
  const fz = flat.position.z
  const angle = Math.atan(Math.abs(fz / fx))

  const dx = fx > 0 ? Math.cos(angle) * dist : 0 - Math.cos(angle) * dist 
  const dz = fz > 0 ? Math.sin(angle) * dist : 0 - Math.sin(angle) * dist 

  const tween = new TWEEN.Tween(camera.position)
                         .to({
                            x: fx + dx,
                            y: 0,
                            z: fz + dz
                          }, time)
                         .easing(TWEEN.Easing.Exponential.InOut)
  return tween
}

const chooseFlat = (event) => {
  event.preventDefault()
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  raycaster.setFromCamera( mouse, camera )
  const choosenFlat = raycaster.intersectObjects(carousel.mesh.children)[0]  && raycaster.intersectObjects(carousel.mesh.children)[0].object
  if(choosenFlat) {
    cameraPos = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    }
    controls.enabled = false
    controls.autoRotate = false
    moveCameraToFlat({
      flat: choosenFlat,
      dist: 150,
      time: 1000
    }).start()
    camera.lookAt(choosenFlat.position)
    setTimeout(() => {
      $('.insertIframe').attr('src', 'https://www.baidu.com')
      $('.insertIframe').addClass('show')
    }, 1000)
  }
}


const openDetail = () => {

}

const backToPrev = () => {
  console.log(cameraPos)
  controls.autoRotate = true
  controls.enabled = true
  console.log(camera.position)
  new TWEEN.Tween(camera.position)
           .to({
            x: cameraPos.x,
            y: cameraPos.y,
            z: cameraPos.z
           }, 1000)
           .easing(TWEEN.Easing.Exponential.InOut)
           .start()
  camera.lookAt(0, 0, 0)
  $('.insertIframe').removeClass('show')
}



// 星尘粒子
class ParticleSystem {
  constructor({ particleNum = 400, color = 0xffffff, radius = 500 } = {}) {
    this.particleNum = particleNum
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


// 地球
class Earth {
  constructor({ radius }) {
    this.radius = radius
    this.init()
  }
  init() {
    this.mesh = new THREE.Group()
    const innerGlobe = new THREE.Object3D()
    innerGlobe.add(new THREE.Mesh(this.getGlobeGeo(this.radius), this.getGlobeMat({
      color: 0x050c27,
    })))

    this.drawGeoJson({
      jsonFile: './test_geojson/countries_states.geojson',
      color: 0x016bef,
      parentMesh: innerGlobe,
    })

    const lineGlobe = new THREE.Object3D()
    lineGlobe.add(new THREE.Mesh(this.getGlobeGeo(this.radius), this.getGlobeMat({
      color: 0x0a184e,
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

// 粒子海洋
class Wave {
  constructor({numX = 50, numY = 50, dist = 40, amp = 5, particleSize = 1, geo, color} = {}) {
    this.numX = numX
    this.numY = numY
    this.dist = dist
    this.amp = amp
    this.geo = geo
    this.color = color
    this.particleSize = particleSize
    this.init()
  }
  init() {
    this.mesh = new THREE.Group()
    this.animeArray = []
    this.animeCount = 0
    const particleMat  = new THREE.MeshPhongMaterial({
      color: this.color
    })
    const particleGeo =this.geo || this.icosahedronGeo()

    for (let ix = 0; ix < this.numX; ix++) {
      for (let iy = 0; iy < this.numY; iy++) {
        const waveParticle = new THREE.Mesh(particleGeo, particleMat)
        waveParticle.position.x = ix * this.dist - ((this.numX * this.dist) / 2)
        waveParticle.position.y = iy * this.dist - ((this.numY * this.dist) / 2)
        this.mesh.add(waveParticle)
        this.animeArray.push(waveParticle)
      }
    }
  }
  icosahedronGeo() {
    return new THREE.IcosahedronGeometry(this.particleSize, 0)
  }
  animate() {
    let i = 0
    for (let ix = 0; ix < this.numX; ix++) {
      for (let iy = 0; iy < this.numY; iy++) {
        const waveParticle = this.animeArray[i++]
        waveParticle.position.z = (Math.sin((ix + this.animeCount) * 0.3) * this.amp) + (Math.sin((iy + this.animeCount) * 0.5) * this.amp)
        waveParticle.scale.x = waveParticle.scale.y = waveParticle.scale.z = (Math.sin((ix + this.animeCount) * 0.3) + 1) * 0.5 + (Math.sin((iy + this.animeCount) * 0.5) + 1) * 0.5
      }
    }
    this.animeCount += 0.1
  }
}
// 旋木效果
class Carousel {
  constructor({radius = 200, flatSize = [100, 100], srcMap = [], borderMap} = {}, ) {
    this.flatNum = srcMap.length
    this.flatWidth = flatSize[0]
    this.flatHeight = flatSize[1]
    this.radius = radius
    this.srcMap = srcMap
    this.borderMap = borderMap
    this.init()
  }
  init() {
    this.mesh = new THREE.Group()
    for (let i = 0; i < this.flatNum; i++) {
      // 加载材质
      const borderTexture = new THREE.TextureLoader().load(this.borderMap[i])
      const videoTexture = new THREE.VideoTexture(this.srcMap[i])
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTexture.format = THREE.RGBFormat; 
      // const fontTexture = new THREE.FontLoader().load('./resource/helvetiker_regular.typeface.json')

      // 创建肌理
      const flatMat = new THREE.MeshBasicMaterial({
        map: videoTexture,
        color: 0xffffff,
        side: THREE.DoubleSide
      })
      const flatBorderMat = new THREE.MeshLambertMaterial({
        map: borderTexture,
        transparent: true,
        side: THREE.DoubleSide,
      })

      // 创建骨骼
      const flatGeo = new THREE.PlaneGeometry( this.flatWidth, this.flatHeight)
      const flatBorderGeo = new THREE.PlaneGeometry( this.flatWidth + 70, this.flatHeight + 80)

      // 组装
      const flatBorderMesh = new THREE.Mesh(flatBorderGeo, flatBorderMat)
      const flatMesh = new THREE.Mesh(flatGeo, flatMat)
      flatMesh.name = 'flat' + i

      // 计算位置
      const px = Math.cos(i * (2 * Math.PI / this.flatNum)) * this.radius
      const pz = Math.sin(i * (2 * Math.PI / this.flatNum)) * this.radius
      flatMesh.position.set(px, 0, pz)
      flatBorderMesh.position.set(px, 25, pz)
      flatMesh.rotation.y = -( i * (2 * Math.PI / this.flatNum) - Math.PI / 2)
      flatBorderMesh.rotation.y = -( i * (2 * Math.PI / this.flatNum) - Math.PI / 2)

      // 放入主体中
      this.mesh.add(flatMesh)
      this.mesh.add(flatBorderMesh)
    }
  }
}

let camera, webGLScene, webGLRenderer, controls, particleSystem, earth, wave, carousel, raycaster, cameraPos, clock, insertDom

let mouse, INTERSECTED
const initWorld = () => {

  clock = new THREE.Clock()

  // 创建摄像机
  camera = new THREE.PerspectiveCamera(75, config.width / config.height, 0.1, 10000)
  camera.position.set(0, -50, 750)
  camera.lookAt(0, 0, 0)

  // 创建场景
  webGLScene = new THREE.Scene()

  // 创建渲染器
  webGLRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  webGLRenderer.setPixelRatio(config.devicePixelRatio)
  webGLRenderer.setSize(config.width, config.height)
  config.canvas.appendChild(webGLRenderer.domElement)


  // 创建控制器
  controls = new OrbitControls(camera)
  controls.maxPolarAngle = Math.PI / 2 * 1.1
  controls.minPolarAngle = Math.PI / 2 * 0.6
  controls.minDistance = 0 // camera可以走到的最近的地方
  controls.maxDistance = 800 // camera可以走到的最远的地方
  controls.enableDamping = true // 惯性转动
  controls.dampingFactor = 0.15
  controls.enablePan = false // 禁止平移
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.3
  controls.enableZoom = false
  // 加入星尘粒子
  particleSystem = new ParticleSystem({
    radius: 1000,
    particleNum: 1000,
  })
  webGLScene.add(particleSystem.mesh)

  // 加入地球
  earth = new Earth({ radius: 200 })
  earth.mesh.rotation.z = 0.2 * Math.PI
  webGLScene.add(earth.mesh)
  
  // 加入环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75)
  webGLScene.add(ambientLight)

 

  const spotlight1 = new THREE.SpotLight(0x016bef, 3, 1000)
  spotlight1.position.set(-400,-200,0)
  webGLScene.add(spotlight1);


  const spotlight2 = new THREE.SpotLight(0x016bef, 3, 1000)
  spotlight1.castShadow = true
  spotlight2.position.set(400,100,0)
  webGLScene.add(spotlight2)

  // 加入粒子海洋
  wave = new Wave({
    particleSize: 3,
    dist: 100,
    amp: 10,
    color: 0x9AA8FF,
  })
  wave.mesh.rotation.x = -Math.PI / 2
  wave.mesh.position.y = -250
  wave.receiveShadow = true
  webGLScene.add(wave.mesh)

  // 加入旋木图形
  carousel = new Carousel({
    radius: 500, 
    srcMap: config.flatSrcMap,
    flatSize: [192, 108],
    borderMap: config.flatBorderMap,
  })
  webGLScene.add(carousel.mesh)

  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()

}

// initWorld()
// render()
// window.addEventListener('resize', handleResize)
// document.addEventListener('click', chooseFlat)
// $('#goback').click(backToPrev)
