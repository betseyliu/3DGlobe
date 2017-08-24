import * as THREE from 'three'
import OrbitControls from 'three-orbitcontrols'
import $ from 'jquery'
import { drawThreeGeo } from './libs/threeGeoJSON.js'
import './libs/CSS3DRenderer.js'
import Stats from 'stats-js'

let stats, webGLRenderer, css3DRenderer, webGLScene, css3DScene, camera, controls, particleSystem
const config = {
	width: window.innerWidth,
	height: window.innerHeight,
	fov: 70,
	near: 0,
	far: 1,
	container: document.body,
	particle: {
		number: 400,
		color: 0xffffff,
		size: 1,
		radius: 500
	}
}


const loop = () => {
	// console.log(camera)
	webGLRenderer.render(webGLScene, camera)
	stats.update()
	requestAnimationFrame(loop)

}





class ParticleSystem {
	constructor({particleNum = 400, size = 1, color = 0xffffff, radius = 500}) {
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

		}
		this.mesh = new THREE.Points(particles, particleMat)
		this.mesh.sortParticles = true
	}
}


class Earth {
	constructor({radius}) {
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
			parentMesh: innerGlobe
		})

		const lineGlobe = new THREE.Object3D()
		lineGlobe.add(new THREE.Mesh(this.getGlobeGeo(this.radius), this.getGlobeMat({
			color: 0x333333,
			wireframe: true
		})))

		this.mesh.add(innerGlobe)
		this.mesh.add(lineGlobe)
	}
	getGlobeMat({color, wireframe = false}) {
		return new THREE.MeshLambertMaterial({
			color: color,
			wireframe: wireframe
		})
	}
	getGlobeGeo(radius){
		return new THREE.SphereGeometry(radius, 200, 200)
	}
	drawGeoJson({jsonFile, color, shape = 'sphere', parentMesh}) {
		$.getJSON(jsonFile, (data) => {
			drawThreeGeo(data, 201, shape, {
				color: color,
			}, parentMesh)
		})
	}
}


const initWorld = () => {

	// webgl渲染器
	webGLRenderer = new THREE.WebGLRenderer({
		// alpha: true,
		antialias: true
	})
	webGLRenderer.setSize(config.width, config.height)
	webGLRenderer.setPixelRatio(window.devicePixelRatio)
	config.container.appendChild(webGLRenderer.domElement)

	// css3D渲染器
	// css3DRenderer = new THREE.CSS3DRenderer()
	// css3DRenderer.setSize(config.width, config.height)
	// css3DRenderer.domElement.style.position = 'absolute'
	// css3DRenderer.domElement.style.top = 0
	// config.container.appendChild(css3DRenderer.domElement)

	// 相机
	camera = new THREE.PerspectiveCamera( config.fov, config.width / config.height, config.near, config.far )
	camera.position.set(0, 100, 600)
	camera.lookAt(0, 0, 0)

	// 相机控制
	controls = new OrbitControls(camera)

	webGLScene = new THREE.Scene()
	css3DScene = new THREE.Scene()

	// 性能监控
	stats = new Stats()
	stats.domElement.style.position = 'absolute'
	stats.domElement.style.top = stats.domElement.style.left = '0px'
	config.container.appendChild(stats.domElement)

	particleSystem = new ParticleSystem({
		particleNum: config.particle.number,
		size: config.particle.size,
		color: config.particle.color,
		radius: config.particle.radius
	})

	webGLScene.add(particleSystem.mesh)

	const ambientLight = new THREE.AmbientLight( 0xffffff )
	webGLScene.add(ambientLight)
	const geo =  new THREE.SphereGeometry(20,20,20)
	const mat =  new THREE.MeshNormalMaterial()
	webGLScene.add(new THREE.Mesh(geo, mat))

	const earth = new Earth({
		radius: 200
	})
	webGLScene.add(earth.mesh)
	// 动画开始
	webGLScene.add(new THREE.Mesh(
		new THREE.SphereGeometry(20,20,20),
		new THREE.MeshLambertMaterial({
			color: 0xffffff,
		})
	))
	loop()
}



initWorld()
