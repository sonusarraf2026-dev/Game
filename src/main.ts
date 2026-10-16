import { Engine } from '@babylonjs/core/Engines/engine'
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { Scene } from '@babylonjs/core/scene'
import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('Game root element #app was not found')

app.innerHTML = `
  <main class="game-shell">
    <canvas id="game-canvas" aria-label="Neon Clash fighting game"></canvas>
    <div class="hit-flash" id="hit-flash"></div>
    <header class="topbar">
      <a class="wordmark" href="#" aria-label="Neon Clash home"><span class="wordmark-icon">N</span> NEON<span>CLASH</span></a>
      <div class="prototype-tag"><span></span> LOCAL MATCH</div>
      <button class="restart-small" id="restart-small" type="button" aria-label="Restart match">↻ <span>RESTART</span></button>
    </header>
    <section class="fight-hud" aria-label="Fighter status">
      <div class="fighter-card fighter-card--left">
        <div class="fighter-meta"><span class="player-index">PLAYER 01</span><span class="fighter-name">VOLT</span></div>
        <div class="health-track"><div class="health-fill health-fill--blue" id="player-health"></div></div>
        <div class="health-caption"><span id="player-state">READY</span><span id="player-percent">100%</span></div>
      </div>
      <div class="round-display">
        <span class="round-label">ROUND <b id="round-number">01</b></span>
        <strong id="timer">60</strong>
        <span class="round-score" id="round-score">○ &nbsp;—&nbsp; ○</span>
      </div>
      <div class="fighter-card fighter-card--right">
        <div class="fighter-meta"><span class="fighter-name">CINDER</span><span class="player-index">CPU / 01</span></div>
        <div class="health-track"><div class="health-fill health-fill--orange" id="cpu-health"></div></div>
        <div class="health-caption"><span id="cpu-percent">100%</span><span id="cpu-state">AI READY</span></div>
      </div>
    </section>
    <div class="match-message" id="match-message" aria-live="polite"></div>
    <div class="arena-caption"><span class="caption-line"></span><span>THE GRID / TRAINING FLOOR</span><span class="caption-line"></span></div>
    <footer class="control-dock">
      <div class="control-player">
        <div class="control-title"><span class="control-dot control-dot--blue"></span><span>PLAYER 01</span></div>
        <div class="key-row"><kbd>A</kbd><kbd>D</kbd><span>MOVE</span></div>
      </div>
      <div class="dock-divider"></div>
      <div class="control-player control-player--actions">
        <div class="control-title"><span class="control-dot control-dot--blue"></span><span>FIGHT</span></div>
        <div class="key-row action-keys"><kbd>W</kbd><span>JUMP</span><kbd>S</kbd><span>BLOCK</span></div>
      </div>
      <div class="dock-divider dock-divider--actions"></div>
      <div class="control-player control-player--actions">
        <div class="control-title"><span class="control-dot control-dot--blue"></span><span>ATTACK</span></div>
        <div class="key-row action-keys"><kbd>J</kbd><span>LIGHT</span><kbd>K</kbd><span>HEAVY</span><kbd>L</kbd><span>SPECIAL</span></div>
      </div>
      <div class="dock-hint"><span class="hint-icon">↔</span> FIRST TO 2 ROUNDS</div>
    </footer>
    <div class="corner-mark corner-mark--left">NC / 001</div>
    <div class="corner-mark corner-mark--right">2.5D COMBAT LAB</div>
    <section class="result-overlay" id="result-overlay" aria-modal="true" role="dialog" aria-labelledby="result-title">
      <div class="result-card">
        <span class="result-kicker">MATCH COMPLETE</span>
        <h1 id="result-title">VICTORY</h1>
        <p id="result-detail">Volt wins the match.</p>
        <button id="play-again" type="button">PLAY AGAIN <span>↻</span></button>
      </div>
    </section>
  </main>
`

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')
if (!canvas) throw new Error('Game canvas was not found')

const engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: true })
const scene = new Scene(engine)
scene.clearColor = new Color4(0.68, 0.79, 0.88, 1)

const camera = new FreeCamera('arena-camera', new Vector3(0, 5.2, -16.5), scene)
camera.setTarget(new Vector3(0, 2.1, 0))
camera.fov = 0.72
camera.minZ = 0.1

const fillLight = new HemisphericLight('ambient-light', new Vector3(0, 1, -0.25), scene)
fillLight.intensity = 1.05
fillLight.groundColor = new Color3(0.48, 0.54, 0.62)
const keyLight = new DirectionalLight('stage-light', new Vector3(-0.35, -1, 0.65), scene)
keyLight.position = new Vector3(0, 10, -8)
keyLight.intensity = 1.25

function material(name: string, color: Color3, metallic = 0.15, roughness = 0.5): StandardMaterial {
  const result = new StandardMaterial(name, scene)
  result.diffuseColor = color
  result.specularColor = color.scale(metallic)
  result.specularPower = 128 * (1 - roughness) + 8
  return result
}

const floorMaterial = material('arena-floor', new Color3(0.31, 0.42, 0.52), 0.24, 0.72)
const wallMaterial = material('arena-wall', new Color3(0.58, 0.69, 0.77), 0.18, 0.62)
const blueMaterial = material('volt-armor', new Color3(0.04, 0.48, 0.92), 0.5, 0.32)
const orangeMaterial = material('cinder-armor', new Color3(0.95, 0.23, 0.08), 0.42, 0.34)
const darkMaterial = material('fighter-joints', new Color3(0.08, 0.13, 0.2), 0.3, 0.48)
const glowBlue = new StandardMaterial('blue-emission', scene)
glowBlue.emissiveColor = new Color3(0.08, 0.64, 1)
const glowOrange = new StandardMaterial('orange-emission', scene)
glowOrange.emissiveColor = new Color3(1, 0.29, 0.08)
const trimMaterial = new StandardMaterial('arena-trim', scene)
trimMaterial.emissiveColor = new Color3(0.12, 0.25, 0.34)

const floor = MeshBuilder.CreateGround('stage-floor', { width: 17, height: 11 }, scene)
floor.position.z = 2
floor.material = floorMaterial
const rearWall = MeshBuilder.CreateBox('rear-wall', { width: 19, height: 8, depth: 0.5 }, scene)
rearWall.position.set(0, 3.9, 6.1)
rearWall.material = wallMaterial
const platform = MeshBuilder.CreateBox('stage-platform', { width: 15.2, height: 0.34, depth: 8.6 }, scene)
platform.position.set(0, 0.06, 1.7)
platform.material = material('platform-edge', new Color3(0.37, 0.48, 0.57), 0.35, 0.38)

for (let x = -7; x <= 7; x += 1) {
  const line = MeshBuilder.CreateBox(`floor-grid-x-${x}`, { width: 0.018, height: 0.012, depth: 8.5 }, scene)
  line.position.set(x, 0.24, 1.7)
  line.material = trimMaterial
  line.isPickable = false
}
for (let z = -2; z <= 5; z += 1) {
  const line = MeshBuilder.CreateBox(`floor-grid-z-${z}`, { width: 15.1, height: 0.012, depth: 0.018 }, scene)
  line.position.set(0, 0.24, z + 1.7)
  line.material = trimMaterial
  line.isPickable = false
}
for (const x of [-8.2, 8.2]) {
  const pillar = MeshBuilder.CreateBox('light-pillar', { width: 0.34, height: 6, depth: 0.5 }, scene)
  pillar.position.set(x, 3, 5.5)
  pillar.material = material('pillar-metal', new Color3(0.25, 0.35, 0.44), 0.45, 0.4)
  const strip = MeshBuilder.CreateBox('pillar-light', { width: 0.045, height: 5.4, depth: 0.03 }, scene)
  strip.position.set(x, 3, 5.22)
  strip.material = trimMaterial
}

function makeFighter(name: string, armor: StandardMaterial, accent: StandardMaterial) {
  const root = new TransformNode(name, scene)
  const arms: TransformNode[] = []
  const legs: TransformNode[] = []

  const torso = MeshBuilder.CreateCapsule(`${name}-torso`, { height: 1.42, radius: 0.39, subdivisions: 6 }, scene)
  torso.parent = root
  torso.position.y = 1.65
  torso.material = armor

  const chest = MeshBuilder.CreateBox(`${name}-chest-plate`, { width: 0.58, height: 0.42, depth: 0.13 }, scene)
  chest.parent = root
  chest.position.set(0, 1.9, -0.34)
  chest.material = accent

  const head = MeshBuilder.CreateSphere(`${name}-head`, { diameter: 0.63, segments: 12 }, scene)
  head.parent = root
  head.position.y = 2.63
  head.material = darkMaterial

  const visor = MeshBuilder.CreateBox(`${name}-visor`, { width: 0.34, height: 0.1, depth: 0.07 }, scene)
  visor.parent = root
  visor.position.set(0, 2.66, -0.29)
  visor.material = accent

  for (const side of [-1, 1]) {
    const armPivot = new TransformNode(`${name}-arm-pivot-${side}`, scene)
    armPivot.parent = root
    armPivot.position.set(side * 0.43, 2.1, -0.01)
    const arm = MeshBuilder.CreateCapsule(`${name}-arm-${side}`, { height: 0.88, radius: 0.155, subdivisions: 6 }, scene)
    arm.parent = armPivot
    arm.position.set(0, -0.34, -0.015)
    arm.material = armor
    const fist = MeshBuilder.CreateSphere(`${name}-fist-${side}`, { diameter: 0.31, segments: 10 }, scene)
    fist.parent = armPivot
    fist.position.set(0, -0.72, -0.035)
    fist.material = accent
    arms.push(armPivot)

    const legPivot = new TransformNode(`${name}-leg-pivot-${side}`, scene)
    legPivot.parent = root
    legPivot.position.set(side * 0.21, 0.95, 0)
    const leg = MeshBuilder.CreateCapsule(`${name}-leg-${side}`, { height: 0.88, radius: 0.19, subdivisions: 6 }, scene)
    leg.parent = legPivot
    leg.position.set(0, -0.31, 0)
    leg.material = darkMaterial

    const boot = MeshBuilder.CreateBox(`${name}-boot-${side}`, { width: 0.36, height: 0.2, depth: 0.56 }, scene)
    boot.parent = legPivot
    boot.position.set(0, -0.75, -0.09)
    boot.material = armor
    legs.push(legPivot)
  }

  const belt = MeshBuilder.CreateBox(`${name}-belt`, { width: 0.68, height: 0.15, depth: 0.53 }, scene)
  belt.parent = root
  belt.position.y = 1.08
  belt.material = accent

  root.getChildMeshes().forEach((mesh) => { mesh.isPickable = false })
  return { root, arms, legs, torso }
}

type MoveName = 'light' | 'heavy' | 'special'
type AttackState = { move: MoveName; elapsed: number; hit: boolean }
type Fighter = {
  root: TransformNode
  arms: TransformNode[]
  legs: TransformNode[]
  torso: ReturnType<typeof MeshBuilder.CreateCapsule>
  direction: number
  facing: number
  speed: number
  phase: number
  health: number
  verticalVelocity: number
  grounded: boolean
  blocking: boolean
  hitstun: number
  knockback: number
  attack: AttackState | null
  specialCooldown: number
  cpuThink: number
  cpuBlock: number
  flash: number
  cpu: boolean
}

const voltModel = makeFighter('volt', blueMaterial, glowBlue)
const cinderModel = makeFighter('cinder', orangeMaterial, glowOrange)

const fighters: [Fighter, Fighter] = [
  {
    root: voltModel.root, arms: voltModel.arms, legs: voltModel.legs, torso: voltModel.torso,
    direction: 0, facing: 1, speed: 5.1, phase: 0, health: 100, verticalVelocity: 0, grounded: true,
    blocking: false, hitstun: 0, knockback: 0, attack: null, specialCooldown: 0,
    cpuThink: 0, cpuBlock: 0, flash: 0, cpu: false,
  },
  {
    root: cinderModel.root, arms: cinderModel.arms, legs: cinderModel.legs, torso: cinderModel.torso,
    direction: 0, facing: -1, speed: 3.45, phase: 1.3, health: 100, verticalVelocity: 0, grounded: true,
    blocking: false, hitstun: 0, knockback: 0, attack: null, specialCooldown: 0,
    cpuThink: 0.8, cpuBlock: 0, flash: 0, cpu: true,
  },
]
fighters[0].root.position.set(-3.25, 0.14, 0)
fighters[1].root.position.set(3.25, 0.14, 0)
fighters[0].root.rotation.y = -Math.PI / 3
fighters[1].root.rotation.y = Math.PI / 3
fighters.forEach((fighter) => {
  fighter.arms.forEach((arm) => { arm.rotation.x = 0.34 })
})

const shadowMaterial = new StandardMaterial('fighter-shadow', scene)
shadowMaterial.diffuseColor = new Color3(0.12, 0.18, 0.23)
shadowMaterial.alpha = 0.2
const fighterShadows = fighters.map((fighter) => {
  const shadow = MeshBuilder.CreateDisc('fighter-shadow', { radius: 0.8, tessellation: 32 }, scene)
  shadow.rotation.x = Math.PI / 2
  shadow.position.set(fighter.root.position.x, 0.247, 0)
  shadow.scaling.set(1.35, 0.7, 1)
  shadow.material = shadowMaterial
  shadow.isPickable = false
  return shadow
})

const moves: Record<MoveName, { startup: number; active: number; recovery: number; damage: number; range: number; knockback: number }> = {
  light: { startup: 0.12, active: 0.16, recovery: 0.28, damage: 7, range: 1.45, knockback: 1.5 },
  heavy: { startup: 0.3, active: 0.2, recovery: 0.48, damage: 15, range: 1.8, knockback: 2.7 },
  special: { startup: 0.4, active: 0.22, recovery: 0.58, damage: 23, range: 2.45, knockback: 4.1 },
}

const keys = new Set<string>()
const playerKeys: [string, string] = ['a', 'd']
const arenaLimit = 6.35
const preferredCpuDistance = 1.35
const baseY = 0.14
let roundTime = 60
let roundNumber = 1
let playerWins = 0
let cpuWins = 0
let roundEnding = 0
let matchOver = false
let messageTimer = 0

const playerHealth = document.querySelector<HTMLElement>('#player-health')!
const cpuHealth = document.querySelector<HTMLElement>('#cpu-health')!
const playerPercent = document.querySelector<HTMLElement>('#player-percent')!
const cpuPercent = document.querySelector<HTMLElement>('#cpu-percent')!
const playerState = document.querySelector<HTMLElement>('#player-state')!
const cpuState = document.querySelector<HTMLElement>('#cpu-state')!
const timerText = document.querySelector<HTMLElement>('#timer')!
const roundText = document.querySelector<HTMLElement>('#round-number')!
const scoreText = document.querySelector<HTMLElement>('#round-score')!
const matchMessage = document.querySelector<HTMLElement>('#match-message')!
const resultOverlay = document.querySelector<HTMLElement>('#result-overlay')!
const resultTitle = document.querySelector<HTMLElement>('#result-title')!
const resultDetail = document.querySelector<HTMLElement>('#result-detail')!
const hitFlash = document.querySelector<HTMLElement>('#hit-flash')!

function updateHud(): void {
  playerHealth.style.width = `${fighters[0].health}%`
  cpuHealth.style.width = `${fighters[1].health}%`
  playerPercent.textContent = `${Math.ceil(fighters[0].health)}%`
  cpuPercent.textContent = `${Math.ceil(fighters[1].health)}%`
  roundText.textContent = String(roundNumber).padStart(2, '0')
  scoreText.textContent = `${'●'.repeat(playerWins)}${'○'.repeat(2 - playerWins)}  —  ${'●'.repeat(cpuWins)}${'○'.repeat(2 - cpuWins)}`
  timerText.textContent = String(Math.ceil(roundTime)).padStart(2, '0')
  playerState.textContent = fighters[0].blocking ? 'BLOCKING' : fighters[0].hitstun > 0 ? 'HIT' : fighters[0].attack ? fighters[0].attack.move.toUpperCase() : 'READY'
  cpuState.textContent = fighters[1].blocking ? 'BLOCKING' : fighters[1].hitstun > 0 ? 'HIT' : fighters[1].attack ? fighters[1].attack.move.toUpperCase() : 'AI READY'
}

function showMessage(text: string, duration: number): void {
  matchMessage.textContent = text
  matchMessage.classList.add('is-visible')
  messageTimer = duration
}

function startAttack(fighter: Fighter, move: MoveName): void {
  if (matchOver || roundEnding > 0 || fighter.hitstun > 0 || fighter.attack || fighter.blocking) return
  if (move === 'special' && fighter.specialCooldown > 0) return
  fighter.attack = { move, elapsed: 0, hit: false }
  if (move === 'special') fighter.specialCooldown = fighter.cpu ? 3.8 : 4.5
}

function jump(fighter: Fighter): void {
  if (matchOver || roundEnding > 0 || fighter.hitstun > 0 || !fighter.grounded || fighter.blocking || fighter.attack) return
  fighter.verticalVelocity = 7.2
  fighter.grounded = false
}

function resetRound(): void {
  fighters[0].root.position.set(-3.25, baseY, 0)
  fighters[1].root.position.set(3.25, baseY, 0)
  fighters.forEach((fighter) => {
    fighter.health = 100
    fighter.verticalVelocity = 0
    fighter.grounded = true
    fighter.blocking = false
    fighter.hitstun = 0
    fighter.knockback = 0
    fighter.attack = null
    fighter.flash = 0
    fighter.direction = 0
    fighter.specialCooldown = 0
  })
  roundTime = 60
  roundEnding = 0
  keys.clear()
  updateHud()
}

function restartMatch(): void {
  playerWins = 0
  cpuWins = 0
  roundNumber = 1
  matchOver = false
  resultOverlay.classList.remove('is-open')
  matchMessage.classList.remove('is-visible')
  resetRound()
  showMessage('FIGHT!', 1.2)
}

function finishRound(): void {
  if (roundEnding > 0 || matchOver) return
  roundEnding = 2.2
  const playerWon = fighters[0].health > fighters[1].health
  const cpuWon = fighters[1].health > fighters[0].health
  if (playerWon) playerWins += 1
  else if (cpuWon) cpuWins += 1

  if (playerWins === 2 || cpuWins === 2) {
    matchOver = true
    resultTitle.textContent = playerWins === 2 ? 'VICTORY' : 'DEFEAT'
    resultTitle.classList.toggle('is-defeat', playerWins !== 2)
    resultDetail.textContent = `${playerWins === 2 ? 'Volt' : 'Cinder'} wins ${playerWins}–${cpuWins}.`
    resultOverlay.classList.add('is-open')
    return
  }
  showMessage(playerWon ? 'VOLT TAKES THE ROUND' : cpuWon ? 'CINDER TAKES THE ROUND' : 'ROUND DRAW', 2.1)
}

function applyHit(attacker: Fighter, defender: Fighter, move: MoveName): void {
  const stats = moves[move]
  const direction = Math.sign(defender.root.position.x - attacker.root.position.x)
  const distance = Math.abs(defender.root.position.x - attacker.root.position.x)
  const attackActive = attacker.attack && attacker.attack.elapsed >= stats.startup
    && attacker.attack.elapsed <= stats.startup + stats.active
  if (!attackActive || distance > stats.range || direction !== attacker.facing) return

  const blocked = defender.blocking && defender.grounded
  const damage = blocked ? Math.max(1, Math.round(stats.damage * 0.22)) : stats.damage
  defender.health = Math.max(0, defender.health - damage)
  defender.flash = 0.16
  defender.knockback = blocked ? stats.knockback * 0.2 : stats.knockback
  if (!blocked) {
    defender.hitstun = move === 'special' ? 0.48 : move === 'heavy' ? 0.32 : 0.2
    defender.attack = null
  }
  attacker.attack!.hit = true
  hitFlash.classList.remove('is-flashing')
  void hitFlash.offsetWidth
  hitFlash.classList.add('is-flashing')
  updateHud()
}

window.addEventListener('keydown', (event: KeyboardEvent) => {
  const key = event.key.toLowerCase()
  if (['a', 'd', 'w', 's', 'j', 'k', 'l'].includes(key)) event.preventDefault()
  if (keys.has(key)) return
  keys.add(key)
  if (key === 'w') jump(fighters[0])
  if (key === 'j') startAttack(fighters[0], 'light')
  if (key === 'k') startAttack(fighters[0], 'heavy')
  if (key === 'l') startAttack(fighters[0], 'special')
})
window.addEventListener('keyup', (event: KeyboardEvent) => keys.delete(event.key.toLowerCase()))
window.addEventListener('blur', () => keys.clear())
document.querySelector<HTMLButtonElement>('#play-again')!.addEventListener('click', restartMatch)
document.querySelector<HTMLButtonElement>('#restart-small')!.addEventListener('click', restartMatch)

showMessage('FIGHT!', 1.3)

engine.runRenderLoop(() => {
  const delta = Math.min(engine.getDeltaTime() / 1000, 0.04)
  const [player, cpu] = fighters

  if (!matchOver && roundEnding <= 0) {
    roundTime = Math.max(0, roundTime - delta)
    if (roundTime === 0 || player.health <= 0 || cpu.health <= 0) finishRound()
  }
  if (roundEnding > 0 && !matchOver) {
    roundEnding -= delta
    if (roundEnding <= 0) {
      roundNumber += 1
      resetRound()
      showMessage('ROUND ' + String(roundNumber).padStart(2, '0'), 1.2)
    }
  }
  if (messageTimer > 0) {
    messageTimer -= delta
    if (messageTimer <= 0 && !matchOver) matchMessage.classList.remove('is-visible')
  }

  player.direction = Number(keys.has(playerKeys[1])) - Number(keys.has(playerKeys[0]))
  player.facing = Math.sign(cpu.root.position.x - player.root.position.x) || player.facing
  cpu.facing = Math.sign(player.root.position.x - cpu.root.position.x) || cpu.facing
  player.root.rotation.y = player.facing > 0 ? -Math.PI / 3 : Math.PI / 3
  cpu.root.rotation.y = cpu.facing > 0 ? -Math.PI / 3 : Math.PI / 3
  player.blocking = keys.has('s') && player.grounded && !player.attack && player.hitstun <= 0 && !matchOver && roundEnding <= 0
  const gap = cpu.root.position.x - player.root.position.x
  const distance = Math.abs(gap)
  const playerThreatening = Boolean(player.attack && player.attack.elapsed < moves[player.attack.move].startup + moves[player.attack.move].active)
  cpu.cpuBlock = Math.max(0, cpu.cpuBlock - delta)
  if (playerThreatening && distance < 2.5 && cpu.cpuThink <= 0 && !cpu.attack && cpu.hitstun <= 0 && Math.random() < 0.22) {
    cpu.cpuBlock = 0.42
    cpu.cpuThink = 0.8
  }
  cpu.blocking = cpu.cpuBlock > 0 && cpu.grounded && !cpu.attack && cpu.hitstun <= 0 && !matchOver && roundEnding <= 0

  if (!matchOver && roundEnding <= 0) {
    if (distance > preferredCpuDistance + 0.28) cpu.direction = Math.sign(player.root.position.x - cpu.root.position.x)
    else if (distance < preferredCpuDistance - 0.28) cpu.direction = -Math.sign(player.root.position.x - cpu.root.position.x)
    else cpu.direction = 0

    cpu.cpuThink -= delta
    if (cpu.cpuThink <= 0 && !cpu.attack && cpu.hitstun <= 0 && !cpu.blocking && distance < 2.05) {
      const choice: MoveName = cpu.specialCooldown <= 0 && distance < 2.35 && Math.random() < 0.14
        ? 'special'
        : distance < 1.65 && Math.random() < 0.62 ? 'light' : 'heavy'
      startAttack(cpu, choice)
      cpu.cpuThink = 0.55 + Math.random() * 0.42
    }
  } else {
    player.direction = 0
    cpu.direction = 0
    player.blocking = false
    cpu.blocking = false
  }

  fighters.forEach((fighter, fighterIndex) => {
    fighter.specialCooldown = Math.max(0, fighter.specialCooldown - delta)
    fighter.hitstun = Math.max(0, fighter.hitstun - delta)
    fighter.flash = Math.max(0, fighter.flash - delta)
    if (!matchOver && roundEnding <= 0 && fighter.hitstun <= 0) {
      const speedFactor = fighter.blocking ? 0.3 : fighter.attack ? 0.16 : 1
      fighter.root.position.x += fighter.direction * fighter.speed * speedFactor * delta
    }
    fighter.root.position.x += fighter.knockback * Math.sign(fighter.root.position.x - (fighter.cpu ? player.root.position.x : cpu.root.position.x)) * delta
    fighter.knockback = Math.max(0, fighter.knockback - delta * 9)
    fighter.root.position.x = Math.max(-arenaLimit, Math.min(arenaLimit, fighter.root.position.x))

    if (!fighter.grounded) {
      fighter.verticalVelocity -= 18 * delta
      fighter.root.position.y += fighter.verticalVelocity * delta
      if (fighter.root.position.y <= baseY) {
        fighter.root.position.y = baseY
        fighter.verticalVelocity = 0
        fighter.grounded = true
      }
    }

    if (fighter.attack) {
      fighter.attack.elapsed += delta
      const move = moves[fighter.attack.move]
      const opponent = fighter === player ? cpu : player
      if (!fighter.attack.hit) applyHit(fighter, opponent, fighter.attack.move)
      if (fighter.attack.elapsed >= move.startup + move.active + move.recovery) fighter.attack = null
    }

    const moving = fighter.direction !== 0 && !fighter.blocking && !fighter.attack && fighter.grounded
    fighter.phase += delta * (moving ? 11 : 2.4)
    const gait = moving ? Math.sin(fighter.phase) : 0
    const jumpHeight = fighter.root.position.y - baseY
    fighterShadows[fighterIndex].position.x = fighter.root.position.x
    fighterShadows[fighterIndex].scaling.x = 1.35 + Math.min(0.5, jumpHeight * 0.12)
    fighterShadows[fighterIndex].scaling.y = Math.max(0.38, 0.7 - jumpHeight * 0.16)
    const attack = fighter.attack
    const attackStats = attack ? moves[attack.move] : null
    const attackProgress = attack && attackStats
      ? Math.max(0, Math.min(1, (attack.elapsed - attackStats.startup) / attackStats.active))
      : 0
    const recovery = attack && attackStats && attack.elapsed > attackStats.startup + attackStats.active
      ? Math.max(0, 1 - (attack.elapsed - attackStats.startup - attackStats.active) / attackStats.recovery)
      : 0
    const windup = attack && attackStats && attack.elapsed < attackStats.startup
      ? attack.elapsed / attackStats.startup
      : 0

    fighter.torso.position.y = 1.65
      + (moving ? Math.abs(gait) * 0.035 : Math.sin(fighter.phase) * 0.018)
      - (fighter.blocking ? 0.08 : 0)
    fighter.torso.rotation.z = fighter.hitstun > 0
      ? -fighter.facing * 0.24
      : attack ? fighter.facing * (0.05 + windup * 0.12 + attackProgress * 0.16) : 0

    fighter.arms.forEach((arm, armIndex) => {
      let pitch = 0.34 + (moving ? (armIndex === 0 ? -gait : gait) * 0.48 : 0)
      let spread = armIndex === 0 ? -0.08 : 0.08
      if (fighter.blocking) {
        pitch = 1.08 - armIndex * 0.12
        spread = armIndex === 0 ? 0.32 : -0.32
      } else if (fighter.hitstun > 0) {
        pitch = armIndex === 0 ? -0.45 : 0.9
        spread = armIndex === 0 ? -0.5 : 0.5
      } else if (attack && attackStats) {
        const isPrimaryArm = armIndex === (attack.move === 'light' ? 0 : 1)
        if (isPrimaryArm) {
          const extension = attackProgress > 0
            ? Math.sin(attackProgress * Math.PI * 0.5)
            : recovery
          pitch = 0.34 - windup * 0.5 + extension * (attack.move === 'light' ? 1.65 : 1.95) - recovery * 0.3
          spread = (armIndex === 0 ? -0.08 : 0.08) + extension * (attack.move === 'special' ? -0.18 : 0)
        } else if (attack.move !== 'light') {
          pitch = 0.34 + attackProgress * 1.15 - recovery * 0.2
        }
      } else if (jumpHeight > 0.15) {
        pitch = 0.34 - Math.min(0.8, jumpHeight * 0.28)
        spread = armIndex === 0 ? -0.38 : 0.38
      }
      arm.rotation.x = pitch
      arm.rotation.z = spread
    })

    fighter.legs.forEach((leg, legIndex) => {
      let stride = moving ? (legIndex === 0 ? 1 : -1) * gait * 0.62 : 0
      if (fighter.blocking) stride = (legIndex === 0 ? 1 : -1) * 0.13
      if (fighter.hitstun > 0) stride = legIndex === 0 ? -0.2 : 0.28
      if (attack && attack.move !== 'light' && attackProgress > 0) {
        stride += (legIndex === 0 ? -1 : 1) * attackProgress * (attack.move === 'special' ? 0.28 : 0.16)
      }
      if (jumpHeight > 0.15) stride = (legIndex === 0 ? 1 : -1) * Math.min(0.48, jumpHeight * 0.3)
      leg.rotation.x = stride
      leg.rotation.z = fighter.blocking ? (legIndex === 0 ? -0.08 : 0.08) : 0
    })
  })

  if (player.attack && !player.attack.hit) applyHit(player, cpu, player.attack.move)
  if (cpu.attack && !cpu.attack.hit) applyHit(cpu, player, cpu.attack.move)
  if (player.health <= 0 || cpu.health <= 0) finishRound()
  updateHud()
  scene.render()
})

window.addEventListener('resize', () => engine.resize())
