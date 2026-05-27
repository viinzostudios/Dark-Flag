/**
 * Genera avatares 41-200 individualmente, en paralelo (5 a la vez).
 * Estilo: masculino/rudo adaptado al tier de precio.
 *   Tier 1 (200c, 41-65):  cool y variado, algo rudo
 *   Tier 2 (500c, 66-125): feroz, intimidante, poderoso
 *   Tier 3 (1000c, 126-175): épico, legendario, imposible de ignorar
 *   Tier 4 (2000c, 176-200): nivel dios, definitivo
 *
 * Uso: node scripts/generate-avatars-41-200.js [start] [end]
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');
const sharp = require('sharp');

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) { console.error('Falta OPENAI_API_KEY'); process.exit(1); }

const REVIEW_DIR = path.join(__dirname, '../docs/08-assets/review/avatars/individual');
const OUT_DIR    = path.join(__dirname, '../frontend/public/assets/avatars');
const OUT_SIZE   = 128;
const BATCH_SIZE  = 2;    // requests concurrentes (conservador para evitar 429)
const BATCH_DELAY = 12000; // ms entre lotes

if (!fs.existsSync(REVIEW_DIR)) fs.mkdirSync(REVIEW_DIR, { recursive: true });
if (!fs.existsSync(OUT_DIR))    fs.mkdirSync(OUT_DIR,    { recursive: true });

const S = 'thick black outlines, cel-shaded cartoon style, chunky proportions, vibrant saturated colors, centered on pure transparent background, no text, no border, single centered element';

const AVATARS = [
  // ── TIER 1 — 200 coins (41-65) — cool, masculino, algo rudo ────────────────
  { slug: 'avatar-41', prompt: `Fierce cartoon Viking warrior face sticker, horned battle helmet with dents, thick red braided beard, deep battle scar across cheek, battle cry expression, war paint under eyes, ${S}` },
  { slug: 'avatar-42', prompt: `Shadowy cartoon ninja sticker, all-black tactical outfit, only glowing red eyes visible in darkness, kunai blade held ready, smoke cloud around, stealth assassin vibe, ${S}` },
  { slug: 'avatar-43', prompt: `Epic cartoon armored knight sticker, battle-worn full plate helmet with visor down, flaming sword raised in strike pose, dented shield with crest, intimidating warrior stance, ${S}` },
  { slug: 'avatar-44', prompt: `Menacing cartoon dark sorcerer sticker, hooded skull face mask, crackling dark purple lightning in clenched fists, glowing sinister eyes under hood, dark energy swirling, ${S}` },
  { slug: 'avatar-45', prompt: `Tough cartoon firefighter sticker, battle-worn helmet with cracked visor, large fire axe over shoulder, soot and ash on face, intense determined jaw, flames in background, ${S}` },
  { slug: 'avatar-46', prompt: `Intense male cartoon soccer player sticker, explosive kick with fire trail on ball, fierce focused expression, ripped jersey, mud and sweat, stadium crowd shadows behind, ${S}` },
  { slug: 'avatar-47', prompt: `Battle-ready cartoon chef sticker, cleaver and ladle crossed like weapons, chef hat askew, fire blazing behind, intense competitive expression, flame burns on arms, kitchen war, ${S}` },
  { slug: 'avatar-48', prompt: `Crazy cartoon mad scientist sticker, wild disheveled hair, cracked laboratory goggles pushed up, huge manic grin, explosive chemical reaction in hand, sparks flying everywhere, ${S}` },
  { slug: 'avatar-49', prompt: `Powerful military cartoon lightning bolt symbol sticker, jagged electric bolt with impact cracks, crackling electricity field, dramatic energy radiating outward, tactical emblem style, ${S}` },
  { slug: 'avatar-50', prompt: `Classic cartoon bomb sticker, round black bomb with lit sparking fuse, skull and crossbones painted on it, danger sparks, retro military style, menacing expression, ${S}` },
  { slug: 'avatar-51', prompt: `Sinister cartoon skull dice sticker, black dice with bone-white skull dots, cracked and chipped corners, dark shadow energy radiating, gambling with death theme, ${S}` },
  { slug: 'avatar-52', prompt: `Heavy-duty cartoon wrench sticker, massive industrial steel wrench with bolts and battle scratches, metal sparks, oil stains, riveted heavy machinery aesthetic, ${S}` },
  { slug: 'avatar-53', prompt: `Industrial cartoon gear cog sticker, heavy spiked metal gear with rivets, rust streaks, spinning motion blur, sharp teeth on gear, factory titan, menacing mechanical, ${S}` },
  { slug: 'avatar-54', prompt: `Rugged military cartoon compass sticker, cracked glass face, needle pointing to a skull instead of N, battle-damaged brass casing, explorer meets soldier aesthetic, ${S}` },
  { slug: 'avatar-55', prompt: `Menacing cartoon all-seeing eye sticker, giant bloodshot eye with dark veins radiating, glowing red pupil with crosshair, dark energy swirling around iris, ominous power, ${S}` },
  { slug: 'avatar-56', prompt: `Battle-hardened cartoon egg sticker, egg wearing a tiny cracked military helmet and battle vest, fierce war face drawn on shell, tiny clenched fists, soldier egg ready for war, ${S}` },
  { slug: 'avatar-57', prompt: `Tough cartoon battle cactus sticker, cactus wearing military helmet with camo pattern, arms spread like machine guns with spines as bullets, desert warrior, stoic expression, ${S}` },
  { slug: 'avatar-58', prompt: `Raging cartoon wild flame sticker, intense fire with an aggressive angry face inside, orange-red-yellow inferno, heat waves distorting air, explosive energy, primal fire force, ${S}` },
  { slug: 'avatar-59', prompt: `Military cartoon space rocket sticker, sleek warhead rocket design with exhaust flames, battle stars painted on hull, smoke trail, space and war aesthetic combined, ${S}` },
  { slug: 'avatar-60', prompt: `Epic cartoon Thor's hammer Mjolnir sticker, massive war hammer with lightning crackling around it, Norse rune inscriptions glowing, divine power sparks, godlike weapon energy, ${S}` },
  { slug: 'avatar-61', prompt: `Powerful cartoon arcane war staff sticker, ancient battle staff with glowing blue runes carved into it, dark energy orbs orbiting the top, war mage weapon, arcane power radiating, ${S}` },
  { slug: 'avatar-62', prompt: `Blazing cartoon shooting star sticker, comet with intense fire trail leaving destruction path, impact shockwave, speed lines, cosmic destruction energy, not gentle but forceful, ${S}` },
  { slug: 'avatar-63', prompt: `Dark cartoon death moth sticker, large moth with skull pattern on wings, glowing red compound eyes, dark neon purple-black wings, sinister and ominous, death omen vibe, ${S}` },
  { slug: 'avatar-64', prompt: `Fierce cartoon chameleon sticker in battle stance, scales shifting camouflage colors, one eye targeting like a sniper, tongue extended like a whip, tactical predator, war paint on scales, ${S}` },
  { slug: 'avatar-65', prompt: `Ninja cartoon octopus sticker, black octopus wearing ninja headband, each of 8 tentacles holds different weapon: katana, shuriken, kunai, smoke bomb, chain, hook, bow, dagger, fierce battle face, ${S}` },

  // ── TIER 2 — 500 coins (66-125) — feroz, intimidante, bestial ─────────────
  { slug: 'avatar-66', prompt: `Sleek fierce cartoon black panther head sticker, pitch-black fur, glowing green predator eyes, deep battle scar across face, fangs bared in snarl, jungle shadow aura, apex predator, ${S}` },
  { slug: 'avatar-67', prompt: `Majestic fierce cartoon golden eagle sticker, talons raised in strike, fierce amber eyes with battle focus, war paint streaks under eyes, wings spread like a fighter jet, golden warrior bird, ${S}` },
  { slug: 'avatar-68', prompt: `Deadly cartoon king cobra sticker, hood fully spread in threat display, hypnotic spiral eyes, venom dripping from long fangs, gold and black scale pattern, strike position, lethal, ${S}` },
  { slug: 'avatar-69', prompt: `Enormous cartoon silverback gorilla sticker, beating massive chest with war paint tribal marks, snarling fangs, bulging muscles, dominant alpha stance, ground cracking under fists, ${S}` },
  { slug: 'avatar-70', prompt: `Deadly cartoon praying mantis sticker, serrated forearms raised in battle position, compound eyes with targeting crosshairs, camouflage armor texture, surgical killer precision, ${S}` },
  { slug: 'avatar-71', prompt: `Armored cartoon red crab sticker, massive battle-claw raised menacingly, armored shell with battle dents, aggressive posture, bubbles and water splash, crustacean warrior, ${S}` },
  { slug: 'avatar-72', prompt: `Fearsome cartoon black scorpion sticker, stinger arched overhead ready to strike, massive claws snapping, black chitinous armor, venom drop on stinger tip, desert executioner, ${S}` },
  { slug: 'avatar-73', prompt: `Battle-ready cartoon blue dolphin sticker, war paint stripes on body, jumping through waves with sonic boom shockwave, battle cry face, speed lines, warrior of the sea, ${S}` },
  { slug: 'avatar-74', prompt: `Gothic cartoon black raven sticker, wings spread wide in dark display, blood-red glowing eyes, dark smoke aura rising from feathers, skull talons, omen of battle death, ${S}` },
  { slug: 'avatar-75', prompt: `Hypnotic danger cartoon eye vortex sticker, spiraling hypnotic pattern in electric colors, pupil with targeting crosshair, menacing dark energy, mind control danger symbol, ${S}` },
  { slug: 'avatar-76', prompt: `Powerful cartoon arcane wizard sticker, older male wizard with dramatic battle-worn robes, crackling staff with blue energy, intense piercing eyes, battle beard, magical destruction power, ${S}` },
  { slug: 'avatar-77', prompt: `Heavy-duty cartoon guardian robot sticker, massive armored military robot, glowing single optical sensor eye, battle damage on chassis, armored plating with bullet dents, combat mode active, ${S}` },
  { slug: 'avatar-78', prompt: `Fierce cartoon samurai face sticker wearing an oni battle mask, dramatic helmet with horns, gleaming katana edge visible, honor and deadly skill, battle-scarred warrior expression, ${S}` },
  { slug: 'avatar-79', prompt: `Intense cartoon Roman gladiator sticker, crested battle helmet, gladius sword raised, dented shield, arena sand on armor, battle wounds, fierce warrior spirit, crowd-roaring moment, ${S}` },
  { slug: 'avatar-80', prompt: `Military cartoon elite hunter sticker, tactical gear with night vision goggles pushed up, battle-scarred face with stubble, sniper rifle scope, camouflage paint, predator mode, ${S}` },
  { slug: 'avatar-81', prompt: `Edgy cartoon neon hacker sticker, male in dark balaclava with skull pattern, green code matrix streaming from eyes, glowing keyboard, cyberpunk neon colors, data warfare, ${S}` },
  { slug: 'avatar-82', prompt: `Intense cartoon male alchemist sticker, bubbling explosive potions in hand, wild eyes with round goggles, smoke and sparks from failed experiment, arcane symbols on coat, eccentric danger, ${S}` },
  { slug: 'avatar-83', prompt: `Fierce cartoon male elven archer sticker, focused intense eyes with war paint, drawn bow with glowing arrow tip, pointed ear with battle scar, forest warrior, perfect aim, ${S}` },
  { slug: 'avatar-84', prompt: `Mysterious cartoon shadow spy sticker, male operative in all-black suit, silenced pistol raised, red laser sight dot, stealth operative visor, dark mission, tactical silence, ${S}` },
  { slug: 'avatar-85', prompt: `Battle-hardened cartoon male field medic sticker, military helmet with red cross, intense determined face with blood and smoke, combat bandages kit, still fighting to save soldiers, ${S}` },
  { slug: 'avatar-86', prompt: `Blazing cartoon phoenix sticker, enormous fire wings spread wide, reborn from white-hot ashes, talons with flame tips, battle cry beak open, heat distortion halo, unstoppable rebirth, ${S}` },
  { slug: 'avatar-87', prompt: `Terrifying cartoon sea kraken sticker, massive dark tentacles crushing a ship, deep-sea glowing eyes in the darkness, crushing grip power, ancient ocean horror, sailors' nightmare, ${S}` },
  { slug: 'avatar-88', prompt: `Majestic cartoon golden griffin sticker, rearing up in battle roar, eagle beak open in war cry, powerful lion body with armored feathers, massive wings spread, golden warrior beast, ${S}` },
  { slug: 'avatar-89', prompt: `Fearsome cartoon red demon sticker, curved ram horns, glowing yellow slit-pupil eyes, sharp fangs in wide snarl, hellfire aura, war scars on face, infernal warrior energy, ${S}` },
  { slug: 'avatar-90', prompt: `Dark cartoon fallen angel sticker, male warrior with tattered black burnt wings, battle scars from divine war, sword raised defiantly, armor half-destroyed, eternal rebel energy, ${S}` },
  { slug: 'avatar-91', prompt: `Massive cartoon stone golem sticker, enormous rocky fist raised to crush, rune carvings glowing orange along body, ancient power rumbling, unstoppable earth force, rubble falling, ${S}` },
  { slug: 'avatar-92', prompt: `Menacing cartoon vampire count sticker, pale aristocratic face with red eyes, long fangs fully bared, cape rising dramatically, blood drip, eternal predator with noble deadly elegance, ${S}` },
  { slug: 'avatar-93', prompt: `Raging cartoon werewolf sticker, mid-transformation fury, massive claws extended, howling at full moon, muscles and fur bursting through, battle-scarred beast, wolf pack alpha, ${S}` },
  { slug: 'avatar-94', prompt: `Dangerous cartoon dark siren sticker, razor-sharp claws, hypnotic predator gaze, dark fish scales armor, shipwreck debris aura, luring males to doom, underwater apex, ${S}` },
  { slug: 'avatar-95', prompt: `Mighty cartoon centaur warrior sticker, muscular male human torso on armored horse body, battle bow drawn, war paint, charging hooves, Greek hero battle aura, power and speed, ${S}` },
  { slug: 'avatar-96', prompt: `Blazing cartoon fire shield sticker, round warrior shield engulfed in intense flames, battle-worn dents, protective rune carved into center, warrior clan emblem, combat-hardened, ${S}` },
  { slug: 'avatar-97', prompt: `Legendary cartoon magic sword sticker, gleaming enchanted blade thrust forward in battle strike, glowing rune inscriptions along edge, power aura emanating, warrior weapon of destiny, ${S}` },
  { slug: 'avatar-98', prompt: `Ominous cartoon dark crystal orb sticker, swirling storm trapped inside, lightning reflecting in depths, dangerous arcane energy leaking, forbidden power, sorcerer's ultimate tool, ${S}` },
  { slug: 'avatar-99', prompt: `Fierce cartoon tribal war mask sticker, menacing wooden battle mask with war paint, feathers and bone decorations, intimidating hollow eyes, warrior tribe protector, battle ritual artifact, ${S}` },
  { slug: 'avatar-100', prompt: `Dangerous cartoon cursed potion sticker, dark purple bottle with skull warning label, bubbling toxic contents, smoking fumes, cracked glass, alchemical weapon, do not touch vibe, ${S}` },
  { slug: 'avatar-101', prompt: `Extreme cartoon lava hamburger sticker, bun charred black, molten cheese flowing like lava, volcanic eruption from patty, infernal heat, fire emoji overload, this burger kills, ${S}` },
  { slug: 'avatar-102', prompt: `Dangerously spicy cartoon fire ramen sticker, bowl with actual flames as broth, skull spice rating on bowl, steam shaped like angry face, chopsticks made of burning swords, ${S}` },
  { slug: 'avatar-103', prompt: `Fierce one-eyed cartoon pirate coconut sticker, eyepatch, bandana with skull, machete scar on face, rum bottle in tiny arm, treasure island in background, seasoned pirate character, ${S}` },
  { slug: 'avatar-104', prompt: `Dark cartoon cursed candy skull sticker, sinister dark candy with skull emblem carved in, black energy swirl, Day of the Dead meets candy, sinister glow, evil sugar rush, ${S}` },
  { slug: 'avatar-105', prompt: `Tactical cartoon military boba tea sticker, boba cup in camouflage pattern, dog tags hanging from straw, skull on cup, battlefield canteen meets street food, soldier refreshment, ${S}` },
  { slug: 'avatar-106', prompt: `Battle cartoon corn sticker, individual corn kernels wearing tiny helmets and holding spears, full corn cob army formation, maize warriors charging, cartoony absurd war, ${S}` },
  { slug: 'avatar-107', prompt: `Explosive cartoon spicy mango sticker, mango cut open revealing lava interior, fire erupting from center, skull crossbones spice warning, extreme heat waves, volcanic fruit power, ${S}` },
  { slug: 'avatar-108', prompt: `Deadly cartoon coral snake sticker, vivid red-black-yellow banded pattern coiled in strike pose, fangs dripping bright venom, hypnotic eyes, nature's warning colors, lethal beauty, ${S}` },
  { slug: 'avatar-109', prompt: `Tactical cartoon military bat sticker, dark bat spreading wings with night vision goggles, stealth mission gear, sonar waves visible, darkness hunter, special ops night predator, ${S}` },
  { slug: 'avatar-110', prompt: `Fierce cartoon jungle jaguar sticker, spotted coat with tribal war paint added, powerful snarl baring fangs, amber eyes glowing, jungle warrior, silent apex killer, ${S}` },
  { slug: 'avatar-111', prompt: `Powerful cartoon bull sticker, massive horns lowered for charge, steam blasting from nostrils, fire in eyes, war paint on flanks, ground cracking under hooves, unstoppable force, ${S}` },
  { slug: 'avatar-112', prompt: `Armored cartoon rhinoceros sticker, battle-scarred massive horn pointed forward like a lance, muscles rippling, war paint, charging unstoppable force, tank-like beast energy, ${S}` },
  { slug: 'avatar-113', prompt: `Sleek cartoon manta ray sticker in attack dive, dark shadow hunter, electric blue energy crackling from wing tips, deep ocean warrior, silent predator from the abyss, ${S}` },
  { slug: 'avatar-114', prompt: `Fierce cartoon battle hummingbird sticker, metallic armored wings like spinning blade turbines, combat dive pose, speed lines, beak like a lance, tiniest but deadliest warrior, ${S}` },
  { slug: 'avatar-115', prompt: `Dominant cartoon male peacock sticker, spreading electric blue-green tail feathers in battle display, fierce warrior eye, dominant male energy, spectacular power display intimidation, ${S}` },
  { slug: 'avatar-116', prompt: `Mutant cartoon axolotl sticker, cybernetic implants on spine and head, glowing toxic green gills, battle-hardened expression, biohazard markings, mutant experiment gone powerful, ${S}` },
  { slug: 'avatar-117', prompt: `Fierce cartoon battle canary sticker, armored golden wings with razor blade feathers, war cry beak open, talons like curved daggers, lightning aura, tiny but absolute terror, ${S}` },
  { slug: 'avatar-118', prompt: `Battle cartoon purple octopus sticker, wielding 8 different weapons in 8 tentacles, ink cloud grenade deploying, fierce warrior face, eight-armed army of one, ${S}` },
  { slug: 'avatar-119', prompt: `Lethal cartoon mechanical wasp sticker, metallic exoskeleton with hydraulic armor plating, oversized venomous hydraulic stinger, targeting laser eye, missile launcher thorax, kill mode, ${S}` },
  { slug: 'avatar-120', prompt: `Ghost warrior cartoon fox spirit sticker, ethereal body half-visible in smoke, samurai clan armor with markings, spectral blade drawn, warrior spirit of fallen soldier, haunting and powerful, ${S}` },
  { slug: 'avatar-121', prompt: `Terrifying cartoon cosmic jellyfish sticker, galaxy-pattern translucent body, tentacles made of dark matter streams, swallowing stars, deep space horror predator, cosmic scale terror, ${S}` },
  { slug: 'avatar-122', prompt: `Powerful cartoon skeleton mage sticker, animated skull with crown of bones, crackling dark fire from empty eye sockets, arcane staff with cursed runes, undead archmage rising, ${S}` },
  { slug: 'avatar-123', prompt: `Terrifying cartoon banshee warrior spirit sticker, wailing ghost with battle energy scream destroying everything, torn spirit armor, sonic shockwave from open mouth, battlefield fear embodied, ${S}` },
  { slug: 'avatar-124', prompt: `Massive cartoon ice titan sticker, enormous warrior made of living glacier, fist of frozen spikes raised, frost breath cloud, ancient glacial power, frozen armor with trapped enemies inside, ${S}` },
  { slug: 'avatar-125', prompt: `Raging cartoon fire elemental sticker, humanoid form made of pure white-hot living fire, heat distortion visible, lava core heart glowing, volcanic energy, primal destruction force, ${S}` },

  // ── TIER 3 — 1000 coins (126-175) — épico, legendario, imposible de ignorar ─
  { slug: 'avatar-126', prompt: `Sacred warrior cartoon quetzal bird sticker, magnificent iridescent green-red battle feathers, Mayan warrior headdress, ancient divine power, jade blade in talons, god-bird of war, ${S}` },
  { slug: 'avatar-127', prompt: `Epic cartoon alpha moon wolf sticker, massive wolf howling at blood moon, silver-white battle fur, lunar energy aura, pack leader, glowing ice-blue eyes, mountain destroyer, ${S}` },
  { slug: 'avatar-128', prompt: `Fearsome cartoon Siberian tiger face sticker, massive battle scars across face, intense ice-blue eyes, arctic war paint markings on striped fur, apex predator of frozen tundra, ${S}` },
  { slug: 'avatar-129', prompt: `Fierce cartoon blue ice dragon sticker, scales like frozen steel, breathing cryo-lightning, wings spread in battle stance, arctic predator, sky warrior, dragon roar shaking mountains, ${S}` },
  { slug: 'avatar-130', prompt: `Ancient cartoon emerald green dragon sticker, acid breath melting stone, forest predator of the ages, mossy ancient scales with battle scars, coiled ready for attack, primal beast, ${S}` },
  { slug: 'avatar-131', prompt: `Supreme cartoon golden dragon sticker, divine battle stance with treasure hoard glow, ornate imperial armor scales, celestial power, ultimate serpent king, wings blocking the sun, ${S}` },
  { slug: 'avatar-132', prompt: `Terrifying cartoon Lich King sticker, skeletal king in jet-black armor, crown of cursed bones, phylactery glowing green, undead army shadows behind, death itself enthroned, ${S}` },
  { slug: 'avatar-133', prompt: `Godlike cartoon thunder titan sticker, massive humanoid storm giant hurling divine lightning bolts, storm clouds forming from his shoulders, mountains crumbling at his feet, ${S}` },
  { slug: 'avatar-134', prompt: `Deadly cartoon basilisk sticker, serpent-king with bone crown, stone-turning gaze eyes, giant venomous coils, king of all serpents, everything nearby turning to stone, ${S}` },
  { slug: 'avatar-135', prompt: `Enormous cartoon Leviathan sticker, ancient biblical sea monster rising from the abyss, crushing darkness, glowing abyssal eyes, ship-swallowing jaw, oldest ocean horror, ${S}` },
  { slug: 'avatar-136', prompt: `Futuristic cartoon cyber samurai sticker, full cyber-armor with neon circuit patterns, holographic katana blade of pure energy, targeting HUD visor, digital bushido warrior, ${S}` },
  { slug: 'avatar-137', prompt: `Intense cartoon mech pilot sticker, armored battle suit cockpit cracking open, pilot with battle-worn face and HUD visor, targeting systems active, war machine operator, ${S}` },
  { slug: 'avatar-138', prompt: `Lethal cartoon dark assassin sticker, twin curved obsidian blades crossed at throat level, skull mask, shadow cloak dissolving into darkness, silent death incarnate, ${S}` },
  { slug: 'avatar-139', prompt: `Powerful cartoon archangel sticker, male divine warrior with blazing golden sword raised, white-gold armor, enormous feathered wings spread in battle, holy fire halo, heavenly army general, ${S}` },
  { slug: 'avatar-140', prompt: `Terrifying cartoon dark lord sticker, shadow crown melting reality, black void armor, burning red eyes the only visible feature in the darkness, armies of darkness behind, ${S}` },
  { slug: 'avatar-141', prompt: `Ancient cartoon warrior prophet sticker, battle-worn elder with cosmic staff, runic tattoos glowing across weathered face and arms, divine insight eyes, seer of doom and victory, ${S}` },
  { slug: 'avatar-142', prompt: `Raging cartoon Nordic berserker sticker, male warrior in pure battle fury, twin battle axes raised, war paint, muscles beyond human size, mouth open in berserker war scream, ${S}` },
  { slug: 'avatar-143', prompt: `Mysterious cartoon shadow master sticker, male figure controlling multiple shadow clones like an army, void energy manipulation, darkness bending to will, master of all shadows, ${S}` },
  { slug: 'avatar-144', prompt: `Battle-worn cartoon immortal warrior sticker, ancient armor with countless healed sword wounds glowing gold, eyes that have seen thousand wars, cannot be killed, eternal soldier, ${S}` },
  { slug: 'avatar-145', prompt: `Fierce cartoon ancient martial arts master sticker, elderly male with dramatic white battle beard, intense burning eyes, one hand raised in ultimate martial arts strike, chi energy visible, ${S}` },
  { slug: 'avatar-146', prompt: `Divine cartoon Eye of God sticker, all-seeing eye radiating holy rays, pyramid silhouette behind, cosmic vision power, ancient god symbol, universe watching through it, ${S}` },
  { slug: 'avatar-147', prompt: `Glowing cartoon ancient war rune sticker, Nordic rune symbol crackling with battle energy, carved in rugged stone, power lines radiating, call-to-arms inscription, warrior magic, ${S}` },
  { slug: 'avatar-148', prompt: `Ominous cartoon Necronomicon sticker, dark forbidden tome with bone-clasp lock, eldritch symbols glowing, dark energy escaping pages, reality warping around it, forbidden knowledge, ${S}` },
  { slug: 'avatar-149', prompt: `Fierce cartoon war totem sticker, tribal totem pole face with battle war paint markings, hollow glowing eyes, warrior spirit channeled, sacred power of fallen warriors, ${S}` },
  { slug: 'avatar-150', prompt: `Dangerous cartoon shattered black crystal sticker, razor-sharp crystal shards exploding outward, void energy released from core, dimensional tear, forbidden power unleashed, ${S}` },
  { slug: 'avatar-151', prompt: `Battle-ready cartoon orca sticker, war-painted killer whale with tribal markings, powerful breach explosion from ocean, battle cry, apex ocean predator in full attack mode, ${S}` },
  { slug: 'avatar-152', prompt: `Armored cartoon Arctic narwhal sticker, battle-scarred narwhal with reinforced spiral horn-lance, arctic ice armor, charging with devastating force, ocean lance champion, ${S}` },
  { slug: 'avatar-153', prompt: `Fierce cartoon sea dragon sticker, massive marine dragon emerging from storm waves, water predator with ancient scale armor, electric eel patterns, ocean storm destroyer, ${S}` },
  { slug: 'avatar-154', prompt: `Divine cartoon celestial war stag sticker, majestic stag with glowing star antlers like curved swords, constellation armor, divine warrior of the forest, astronomical power, ${S}` },
  { slug: 'avatar-155', prompt: `Fierce cartoon nine-tailed Kitsune warrior sticker, powerful male fox spirit with nine blazing fire tails, battle mask, spirit energy crackling, legendary trickster warrior, ${S}` },
  { slug: 'avatar-156', prompt: `Intimidating cartoon Tengu warrior sticker, red demon mask oni face, black crow wings, traditional war fans as weapons, mountain air warrior, ancient Japanese martial spirit, ${S}` },
  { slug: 'avatar-157', prompt: `Divine cartoon Qilin sticker, celestial dragon-scaled deer with flame hooves, cloud-walking, divine armor plating, cosmic justice enforcer, breathes holy fire, legendary guardian, ${S}` },
  { slug: 'avatar-158', prompt: `Warrior cartoon Peri sticker, golden divine Persian angel warrior with twin blazing swords, radiant armored wings, divine Persian battle spirit, ancient mythological warrior power, ${S}` },
  { slug: 'avatar-159', prompt: `Mighty cartoon Garuda sticker, divine Hindu bird of war, massive golden eagle wings with divine armor, serpent enemies crushed in talons, celestial battle mount, sun fire aura, ${S}` },
  { slug: 'avatar-160', prompt: `Legendary cartoon Simurgh sticker, magnificent Persian mythical war phoenix, rainbow-feathered battle wings spread wide, ancient divine wisdom and firepower combined, legendary protector, ${S}` },
  { slug: 'avatar-161', prompt: `Electric cartoon lightning dragon sticker, metallic storm-grey scales crackling with electricity, thunder cloud wings spread, electromagnetic roar, storm itself given dragon form, ${S}` },
  { slug: 'avatar-162', prompt: `Apocalyptic cartoon Fenrir sticker, titanic wolf of Norse prophecy, world-ending size, binding chains shattering, jaws large enough to swallow the sun, end-times predator, ${S}` },
  { slug: 'avatar-163', prompt: `Multi-headed cartoon Hydra sticker, seven serpent heads each breathing different elemental attack, regenerating when struck, ancient indestructible monster, battlefield nightmare, ${S}` },
  { slug: 'avatar-164', prompt: `Powerful cartoon Nüwa deity sticker, Chinese creator goddess with serpent lower body, holding cosmic creation tools, universe threads in hands, divine feminine power creating worlds, ${S}` },
  { slug: 'avatar-165', prompt: `Epic cartoon Anubis sticker, Egyptian jackal-headed god of death in black gold war armor, scales of judgment in one hand, spear in other, underworld general, death's commander, ${S}` },
  { slug: 'avatar-166', prompt: `Raging cartoon Minotaur sticker, massive bull-headed warrior, double battle axe raised overhead, labyrinth walls crumbling around him, absolute brutality, unstoppable charging force, ${S}` },
  { slug: 'avatar-167', prompt: `Terrifying cartoon golden Medusa Gorgon sticker, snakes for hair in battle position, golden scales, stone-turning gaze power radiating, ancient monster queen, petrifying beauty of death, ${S}` },
  { slug: 'avatar-168', prompt: `Intimidating cartoon Cyclops sticker, massive one-eyed giant, single glowing battle eye with targeting crosshair, boulder weapon overhead, mountain-sized warrior, ancient Titan kin, ${S}` },
  { slug: 'avatar-169', prompt: `Regal cartoon Sphinx sticker, lion body with battle-scarred warrior male human head, desert guardian of secrets, enigmatic and deadly, guarding with absolute power, riddle or die, ${S}` },
  { slug: 'avatar-170', prompt: `Magnificent cartoon Aurora dragon sticker, northern lights pattern wings, ice and prismatic light powers, arctic titan dragon, aurora borealis given dragon form, breathtaking and deadly, ${S}` },
  { slug: 'avatar-171', prompt: `Cosmic cartoon titan sticker, universe-scale humanoid holding galaxies in hand, galactic armor, star-forge power, planets orbiting him, cosmic god-warrior beyond mortal comprehension, ${S}` },

  // ── TIER 4 — 2000 coins (172-200) — nivel DIOS, máximo poder definitivo ────
  { slug: 'avatar-172', prompt: `Unstoppable cartoon Juggernaut sticker, colossal armored warrior of pure force, massive spiked armor, ground cracking and exploding underfoot, walls shattering on contact, nothing stops him, ${S}` },
  { slug: 'avatar-173', prompt: `Spectral cartoon Phantom warrior sticker, half-ghost half-armored warrior, visible armor dissolving into ghost mist, battle energy between worlds, both deadly and untouchable, ${S}` },
  { slug: 'avatar-174', prompt: `Supreme cartoon Overlord sticker, armored warlord seated on war throne, commanding vast armies, dark iron crown of conquest, absolute military authority, overlord of overlords, ${S}` },
  { slug: 'avatar-175', prompt: `Primordial cartoon Genesis entity sticker, first being at origin of existence, universe forming in hands, pure creation energy, endless power, before anything else there was this, ${S}` },
  { slug: 'avatar-176', prompt: `Divine cartoon Thunder God sticker, Nordic/Asian god hybrid with storm hammer and lightning crown, riding storm clouds, divine fury unleashed, thunder itself bows to him, god-tier power, ${S}` },
  { slug: 'avatar-177', prompt: `Ultimate cartoon Omega Dragon sticker, jet-black scales containing all energy colors swirling inside, maximum power final form, draconic god, dragon beyond all dragons, universe-shaking roar, ${S}` },
  { slug: 'avatar-178', prompt: `Defiant cartoon Last Guardian sticker, lone armored warrior standing in ruined battlefield, broken armor but spirit unbreakable, blood and scars, last defender standing against impossible odds, ${S}` },
  { slug: 'avatar-179', prompt: `Fallen cartoon Dark Archangel sticker, corrupted divine warrior with massive black burning wings, shadow sword, divine armor cracked and dark, corrupted halo, heavenly power turned evil, ${S}` },
  { slug: 'avatar-180', prompt: `Regal cartoon King of the Cosmos sticker, universal monarch on throne of condensed stars, galaxy crown, scepter of planetary rings, sovereign of all existence, cosmic king above all kings, ${S}` },
  { slug: 'avatar-181', prompt: `Pinnacle cartoon Alpha Prime sticker, ultimate apex being at top of all evolution, primal power perfected, first and strongest of all things, evolution's final form, absolute primal force, ${S}` },
  { slug: 'avatar-182', prompt: `Ancient cartoon Primordial being sticker, entity from before time itself, ancient beyond comprehension, cosmic dark energy body, reality warps around its presence, oldest power in existence, ${S}` },
  { slug: 'avatar-183', prompt: `Eldritch cartoon Azathoth sticker, outer god from beyond reality, stylized cartoon but deeply ominous, reality-warping aura, cosmic horror made somewhat adorable but still frightening, ${S}` },
  { slug: 'avatar-184', prompt: `Timeless cartoon Eternal Dragon sticker, dragon existing outside time, crystalline ancient scales reflecting past and future simultaneously, infinity loop body, temporal god beast, ${S}` },
  { slug: 'avatar-185', prompt: `Concept cartoon The Infinite sticker, being that exists in all dimensions simultaneously, fractal warrior body extending into infinity, omnipresent cosmic force, beyond singular existence, ${S}` },
  { slug: 'avatar-186', prompt: `Supreme cartoon Shogun sticker, elite supreme Japanese warlord, ceremonial battle armor of finest craftsmanship, commanding thousands, iron discipline face, military genius embodied, ${S}` },
  { slug: 'avatar-187', prompt: `Destiny cartoon The Chosen One sticker, young but ancient-eyed male warrior, destiny's sword glowing with prophecy, the one foretold, chosen by universe for final battle, epic hero, ${S}` },
  { slug: 'avatar-188', prompt: `Massive cartoon Ultima Ratio sticker, last resort enormous artillery cannon decorated with skull emblems and war scars, final argument of kings, ultimate weapon, fire when all else fails, ${S}` },
  { slug: 'avatar-189', prompt: `Divine cartoon Nemesis sticker, goddess of divine retribution in battle, scales and war sword, armor of inevitable justice, pursues the guilty forever, wrath of cosmic balance, ${S}` },
  { slug: 'avatar-190', prompt: `Transcendent cartoon Apotheon sticker, human warrior ascending to godhood mid-battle, half-mortal half-divine transformation, divine light consuming body, apotheosis moment frozen in time, ${S}` },
  { slug: 'avatar-191', prompt: `Cosmic cartoon lion sticker, majestic lion with galaxy mane of stars and nebulae, constellation spots on fur, supernova claws, guardian of the universe, celestial apex predator, ${S}` },
  { slug: 'avatar-192', prompt: `Stellar cartoon wolf sticker, enormous wolf with nebula-pattern fur, star clusters for eyes, running through galaxy leaving comet trail, space apex predator, stellar wolf pack leader, ${S}` },
  { slug: 'avatar-193', prompt: `Space cartoon cosmic orca sticker, killer whale with universe inside body visible through translucent skin, stars and galaxies within, breaching through space itself, cosmic apex, ${S}` },
  { slug: 'avatar-194', prompt: `Galactic cartoon nebula eagle sticker, eagle with galaxy wings, star field body pattern, cosmic raptor diving through universe, nebula explosion from wingtips, space predator supreme, ${S}` },
  { slug: 'avatar-195', prompt: `God-tier cartoon divine dragon sticker, maximum power golden-white dragon at peak divinity, cosmic divine light, all other dragons bow before this one, universe trembles at its roar, ${S}` },
  { slug: 'avatar-196', prompt: `Cosmic cartoon Primordial Seal sticker, universe-forged seal containing all creation power, runes of existence carved by gods, cosmic energy barely contained within, first sigil ever made, ${S}` },
  { slug: 'avatar-197', prompt: `Ultimate cartoon Omega Rune sticker, the final rune of power, pulsing with reality-warping energy, inscribed by the last god, destruction and creation in one symbol, supreme inscription, ${S}` },
  { slug: 'avatar-198', prompt: `Mystical cartoon Cosmos Key sticker, key that unlocks all of reality, dimensional portal energy swirling from keyhole, universe visible through it, the key to everything that exists, ${S}` },
  { slug: 'avatar-199', prompt: `All-knowing cartoon Absolute Eye sticker, the eye that sees all of creation and destruction simultaneously, universe visible in iris, total omniscience, judgment of all things, absolute awareness, ${S}` },
  { slug: 'avatar-200', prompt: `Legendary cartoon war tank avatar sticker, epic battle tank covered in victory tally marks and battle scars, massive cannon blazing fire, skull and crossbones flag, enemy crests as trophies welded on hull, glowing engine exhaust, this is THE tank, ultimate war machine, ${S}` },

  // ── HEROÍNAS (201-210) ────────────────────────────────────────────────────
  { slug: 'avatar-201', prompt: `Brave cartoon female warrior sticker, strong young woman in battle armor with sword raised, fierce determined expression, battle-ready stance, warrior braid, war paint on cheeks, powerful heroic pose, ${S}` },
  { slug: 'avatar-202', prompt: `Magical cartoon fairy sticker, small enchanting fairy with large iridescent glowing wings, fierce playful expression, star wand bursting with energy, magical sparkles swirling, fantasy enchantment aura, ${S}` },
  { slug: 'avatar-203', prompt: `Fierce cartoon elven archer sticker, sleek female elf with pointed ears, drawing a glowing energy bow with focused intensity, forest camouflage outfit with leaf armor, sharp eyes locked on target, wind and leaves swirling, ${S}` },
  { slug: 'avatar-204', prompt: `Powerful cartoon warrior mermaid sticker, fierce mermaid in battle stance wielding a trident, ocean wave armor scales, glowing sea-green eyes, crashing wave energy surge, fierce defender of the deep, ${S}` },
  { slug: 'avatar-205', prompt: `Fierce cartoon amazon warrior sticker, powerful muscular woman warrior in tribal battle armor, hurling a blazing spear, bold tribal war paint, fierce battle cry expression, raw unstoppable power, ${S}` },
  { slug: 'avatar-206', prompt: `Dangerous cartoon storm witch sticker, intense young sorceress with crackling lightning in both hands, dark storm clouds swirling from her fingertips, electric violet eyes, dramatic battle magic explosion, ${S}` },
  { slug: 'avatar-207', prompt: `Epic cartoon valkyrie sticker, Norse female warrior in gleaming golden armor with winged helmet, spear raised toward the heavens, lightning bolts behind her, divine chosen warrior of Valhalla, radiant and fearsome, ${S}` },
  { slug: 'avatar-208', prompt: `Mysterious cartoon dark priestess sticker, powerful woman cloaked in living shadows, glowing purple forbidden ritual symbols orbiting her, ancient dark power emanating, forbidden magic, ominous regal authority, ${S}` },
  { slug: 'avatar-209', prompt: `Legendary cartoon dragon goddess sticker, magnificent woman fused with dragon power, massive fire dragon wings spreading behind her, blazing dragon eyes, fire and primal energy radiating, goddess of destruction and rebirth, ${S}` },
  { slug: 'avatar-210', prompt: `Supreme cartoon queen of shadows sticker, absolute regal dark queen wearing obsidian crown and armor, shadow tendrils radiating outward in all directions, conquering queen's gaze, absolute darkness bows to her will, she is the night itself, ${S}` },
];

// ─── OpenAI API ───────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function generateImage(prompt, retries = 4) {
  const body = JSON.stringify({
    model: 'gpt-image-1',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'low',
    output_format: 'png',
    background: 'transparent',
  });

  for (let attempt = 0; attempt <= retries; attempt++) {
    const result = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.openai.com',
        path: '/v1/images/generations',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Length': Buffer.byteLength(body),
        },
      }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 429) resolve({ rateLimited: true, data });
          else if (res.statusCode !== 200) reject(new Error(`OpenAI ${res.statusCode}: ${data.slice(0,200)}`));
          else resolve({ ok: true, buf: Buffer.from(JSON.parse(data).data[0].b64_json, 'base64') });
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });

    if (result.ok) return result.buf;
    if (result.rateLimited) {
      const wait = (attempt + 1) * 30000; // 30s, 60s, 90s, 120s
      process.stdout.write(`\n  [429] rate limited, esperando ${wait/1000}s (intento ${attempt+1}/${retries})...\n`);
      await sleep(wait);
      continue;
    }
  }
  throw new Error('Máximo de reintentos por rate limit alcanzado');
}

// ─── Crop individual ──────────────────────────────────────────────────────────

async function cropToStandard(pngBuffer) {
  let trimmed;
  try {
    trimmed = await sharp(pngBuffer)
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 15 })
      .toBuffer();
  } catch {
    trimmed = pngBuffer;
  }
  const { width: tw, height: th } = await sharp(trimmed).metadata();
  const maxContent = Math.round(OUT_SIZE * 0.88);
  const scale  = Math.min(maxContent / tw, maxContent / th, 1);
  const scaledW = Math.round(tw * scale);
  const scaledH = Math.round(th * scale);
  const padLeft = Math.floor((OUT_SIZE - scaledW) / 2);
  const padTop  = Math.floor((OUT_SIZE - scaledH) / 2);
  return sharp(trimmed)
    .resize(scaledW, scaledH, { fit: 'fill' })
    .extend({
      left: padLeft, right: OUT_SIZE - scaledW - padLeft,
      top: padTop,   bottom: OUT_SIZE - scaledH - padTop,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

// ─── Generar y guardar 1 avatar ───────────────────────────────────────────────

async function generateAndSave(avatar) {
  const outPath = path.join(OUT_DIR, `${avatar.slug}.png`);
  if (fs.existsSync(outPath)) {
    process.stdout.write(`·${avatar.slug.slice(7)} `);  // ya existe
    return;
  }
  try {
    const pngBuf  = await generateImage(avatar.prompt);
    fs.writeFileSync(path.join(REVIEW_DIR, `${avatar.slug}-draft.png`), pngBuf);
    const cropped = await cropToStandard(pngBuf);
    await sharp(cropped).toFile(outPath);
    process.stdout.write(`✓${avatar.slug.slice(7)} `);
  } catch (err) {
    process.stdout.write(`✗${avatar.slug}(${err.message.slice(0,30)}) `);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const startNum = parseInt(process.argv[2] ?? '41');
  const endNum   = parseInt(process.argv[3] ?? '200');

  const toGenerate = AVATARS.filter(a => {
    const n = parseInt(a.slug.replace('avatar-', ''));
    return n >= startNum && n <= endNum;
  });

  console.log(`\nGenerando ${toGenerate.length} avatares (${startNum} → ${endNum}) en lotes de ${BATCH_SIZE} paralelos\n`);

  let done = 0;
  for (let i = 0; i < toGenerate.length; i += BATCH_SIZE) {
    const batch = toGenerate.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(a => generateAndSave(a)));
    done += batch.length;
    process.stdout.write(`  [${done}/${toGenerate.length}]\n`);
    if (i + BATCH_SIZE < toGenerate.length) await sleep(BATCH_DELAY);
  }

  console.log('\n\n✅ Completado.');
}

main().catch(err => { console.error(err); process.exit(1); });
