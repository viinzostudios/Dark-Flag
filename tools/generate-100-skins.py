"""
Genera los 100 skins del catálogo Arena Siege Tanks.
Cada skin: imagen combinada 1536×1024 (body izq + cañón der) → extrae body 128×128 y cannon 64×64.
Progreso: detecta archivos ya existentes (draft o final) y omite lo ya hecho.

Uso:
  python generate-100-skins.py              # genera todos los pendientes
  python generate-100-skins.py 5            # solo skin #5
  python generate-100-skins.py el-ninja     # solo ese slug
  python generate-100-skins.py extract      # solo extrae drafts existentes sin API
"""

import sys, os, json, base64, urllib.request, urllib.error, re
import numpy as np
from PIL import Image

# ─── Rutas ───────────────────────────────────────────────────────────────────
KEY_PATH   = r"C:\Users\fredy\.claude\openai_key"
REVIEW     = r"c:\VIINZO\Juego-AI\docs\08-assets\review"
ASSETS     = r"c:\VIINZO\Juego-AI\frontend\public\assets\tanks\skins"
WHITE_TH   = 40
BODY_SIZE  = (128, 128)
CANNON_SIZE= (64,  64)

# ─── Catálogo de 100 skins ───────────────────────────────────────────────────
# slug, nombre, rareza, bodyColor, cannonColor, descripción visual (para el prompt)

SKINS = [
    # ── COMMON (1-25) ─────────────────────────────────────────────────────────
    {"id":1,  "slug":"base-clasico",          "name":"Base Clásico",          "rarity":"common",    "body":"#4a90d9","cannon":"#2c5f8a", "theme":"Blue combat tank, solid azure-blue armor with steel cannon"},
    {"id":2,  "slug":"el-verde",              "name":"El Verde",              "rarity":"common",    "body":"#27ae60","cannon":"#1a7a45", "theme":"Bright tropical green tank, vivid emerald tone"},
    {"id":3,  "slug":"el-rojo",               "name":"El Rojo",               "rarity":"common",    "body":"#e74c3c","cannon":"#922b21", "theme":"Bold crimson-red tank, deep red carmine"},
    {"id":4,  "slug":"el-azul",               "name":"El Azul",               "rarity":"common",    "body":"#2980b9","cannon":"#1a5276", "theme":"Navy combat blue tank, deep ocean blue"},
    {"id":5,  "slug":"el-amarillo",           "name":"El Amarillo",           "rarity":"common",    "body":"#f1c40f","cannon":"#d4ac0d", "theme":"Bright canary-yellow tank, vivid sunny yellow"},
    {"id":6,  "slug":"gris-tormenta",         "name":"Gris Tormenta",         "rarity":"common",    "body":"#7f8c8d","cannon":"#596566", "theme":"Dark slate-grey storm tank, gunmetal grey"},
    {"id":7,  "slug":"morado-pasion",         "name":"Morado Pasión",         "rarity":"common",    "body":"#8e44ad","cannon":"#6c3483", "theme":"Intense vivid purple tank, deep violet"},
    {"id":8,  "slug":"rosa-retro",            "name":"Rosa Retro",            "rarity":"common",    "body":"#ff69b4","cannon":"#c0508a", "theme":"Hot pink bubblegum 80s style, vibrant candy pink"},
    {"id":9,  "slug":"naranja-llamarada",     "name":"Naranja Llamarada",     "rarity":"common",    "body":"#e67e22","cannon":"#935116", "theme":"Bright burning orange tank, vivid blazing orange"},
    {"id":10, "slug":"turquesa-marino",       "name":"Turquesa Marino",       "rarity":"common",    "body":"#1abc9c","cannon":"#148a70", "theme":"Caribbean turquoise tank, bright sea-green"},
    {"id":11, "slug":"lima-toxico",           "name":"Lima Tóxico",           "rarity":"common",    "body":"#b8e900","cannon":"#8aae00", "theme":"Toxic neon lime-green tank, acid bright green"},
    {"id":12, "slug":"marron-terroso",        "name":"Marrón Terroso",        "rarity":"common",    "body":"#8d6e63","cannon":"#5d4037", "theme":"Earthy brown natural tank, warm terracotta brown"},
    {"id":13, "slug":"negro-carbon",          "name":"Negro Carbón",          "rarity":"common",    "body":"#2d2d2d","cannon":"#1a1a1a", "theme":"Near-black charcoal tank, very dark grey armor"},
    {"id":14, "slug":"blanco-nieve",          "name":"Blanco Nieve",          "rarity":"common",    "body":"#ecf0f1","cannon":"#bdc3c7", "theme":"Polar white snow tank, clean bright white with light silver"},
    {"id":15, "slug":"el-barrilito",          "name":"El Barrilito",          "rarity":"common",    "body":"#7b3f1c","cannon":"#5a2d10", "theme":"Dark wooden barrel-brown tank, warm dark mahogany brown with wood grain texture lines on armor panels"},
    {"id":16, "slug":"helado-de-vainilla",    "name":"Helado de Vainilla",    "rarity":"common",    "body":"#f5e6c8","cannon":"#d4a95a", "theme":"Soft cream vanilla ice cream tank, warm ivory with golden caramel accents"},
    {"id":17, "slug":"helado-de-fresa",       "name":"Helado de Fresa",       "rarity":"common",    "body":"#ff9eb5","cannon":"#e07090", "theme":"Strawberry ice cream pink tank, soft pastel pink with deeper rose accents"},
    {"id":18, "slug":"helado-de-chocolate",   "name":"Helado de Chocolate",   "rarity":"common",    "body":"#5d2e0c","cannon":"#3b1a06", "theme":"Dark chocolate brown ice cream tank, deep rich cocoa brown"},
    {"id":19, "slug":"el-vecindario",         "name":"El Vecindario",         "rarity":"common",    "body":"#ff6f00","cannon":"#c43e00", "theme":"Warm orange Latin neighborhood tank, vibrant burnt-orange with festive energy"},
    {"id":20, "slug":"camuflaje-tropical",    "name":"Camuflaje Tropical",    "rarity":"common",    "body":"#4caf50","cannon":"#2e7d32", "theme":"Tropical forest camouflage green tank, bright jungle green"},
    {"id":21, "slug":"el-paletero",           "name":"El Paletero",           "rarity":"common",    "body":"#e3f2fd","cannon":"#1565c0", "theme":"Ice cream vendor tank: near-white light-blue body with bold blue stripe accents on armor panels"},
    {"id":22, "slug":"tanque-solar",          "name":"Tanque Solar",          "rarity":"common",    "body":"#ffd600","cannon":"#f9a825", "theme":"Golden bright solar radiant tank, vivid gold with warm amber accents, subtle glowing highlight"},
    {"id":23, "slug":"el-marino",             "name":"El Marino",             "rarity":"common",    "body":"#1a237e","cannon":"#0d1257", "theme":"Deep navy blue tank, dark indigo naval blue with white anchor detail on hatch"},
    {"id":24, "slug":"el-vaquero",            "name":"El Vaquero",            "rarity":"common",    "body":"#c4882a","cannon":"#8d6020", "theme":"Camel brown cowboy tank, warm golden-brown, leather-like surface detail on armor panels"},
    {"id":25, "slug":"invierno-polar",        "name":"Invierno Polar",        "rarity":"common",    "body":"#b3e5fc","cannon":"#0288d1", "theme":"Pale glacial sky-blue tank, icy light blue with deeper blue cannon"},

    # ── RARE (26-60) ──────────────────────────────────────────────────────────
    {"id":26, "slug":"tanque-acuatico",       "name":"Tanque Acuático",       "rarity":"rare",      "body":"#039be5","cannon":"#01579b", "theme":"Bright ocean-blue tank with water-drop motifs and wave pattern lines on armor panels, deep ocean blue cannon"},
    {"id":27, "slug":"el-ninja",              "name":"El Ninja",              "rarity":"rare",      "body":"#1c1c1c","cannon":"#b71c1c", "theme":"Near-black stealthy ninja tank with subtle red trim accent lines on armor edges and hatch, red cannon"},
    {"id":28, "slug":"el-pirata",             "name":"El Pirata",             "rarity":"rare",      "body":"#212121","cannon":"#f9a825", "theme":"Near-black pirate tank with golden-yellow skull-and-crossbones motif on hatch cover, golden cannon"},
    {"id":29, "slug":"el-bombero",            "name":"El Bombero",            "rarity":"rare",      "body":"#d32f2f","cannon":"#f9a825", "theme":"Bright fire-engine red firefighter tank with yellow diagonal stripe markings on armor panels, golden cannon"},
    {"id":30, "slug":"el-astronauta",         "name":"El Astronauta",         "rarity":"rare",      "body":"#b0bec5","cannon":"#1565c0", "theme":"Silver spacesuit-gray tank with circular visor window on hatch, blue space-suit accent details, blue cannon"},
    {"id":31, "slug":"el-cientifico",         "name":"El Científico",         "rarity":"rare",      "body":"#f5f5f5","cannon":"#1b5e20", "theme":"Clean white lab-coat tank with green biohazard symbol on armor panel, green experiment tubes detail, dark green cannon"},
    {"id":32, "slug":"el-robot",              "name":"El Robot",              "rarity":"rare",      "body":"#78909c","cannon":"#455a64", "theme":"Industrial metallic robot-gray tank with hexagonal bolt patterns and mechanical grill lines on armor panels, dark slate cannon"},
    {"id":33, "slug":"desierto-elite",        "name":"Desierto Élite",        "rarity":"rare",      "body":"#d7a96b","cannon":"#c1722a", "theme":"Desert sand elite tan tank with camouflage blotch pattern in warm khaki-orange tones on armor panels"},
    {"id":34, "slug":"jungla-oscura",         "name":"Jungla Oscura",         "rarity":"rare",      "body":"#2e7d32","cannon":"#1b5e20", "theme":"Deep dark jungle-green tank with irregular darker green shadow blotch camouflage on armor panels"},
    {"id":35, "slug":"el-vikingo",            "name":"El Vikingo",            "rarity":"rare",      "body":"#90a4ae","cannon":"#d4ac0d", "theme":"Steel-gray Viking tank with Norse rune engravings and golden knotwork trim on armor panels, golden cannon"},
    {"id":36, "slug":"tanque-futurista",      "name":"Tanque Futurista",      "rarity":"rare",      "body":"#1de9b6","cannon":"#00695c", "theme":"Bright electric-teal futuristic tank with glowing cyan circuit-board line engravings on armor panels, teal cannon"},
    {"id":37, "slug":"el-samurai",            "name":"El Samurái",            "rarity":"rare",      "body":"#212121","cannon":"#c62828", "theme":"Black samurai tank with red Japanese kanji character on hatch and red trim on armor edge panels, red cannon"},
    {"id":38, "slug":"el-fantoche",           "name":"El Fantoche",           "rarity":"rare",      "body":"#f48fb1","cannon":"#7b1fa2", "theme":"Colorful pastel puppet-marionette pink tank with purple star and diamond decorative motifs on armor panels, purple cannon"},
    {"id":39, "slug":"el-vampiro",            "name":"El Vampiro",            "rarity":"rare",      "body":"#4a148c","cannon":"#880e4f", "theme":"Dark purple-black vampire tank with red bat silhouette on hatch cover and blood-red trim lines on armor panels"},
    {"id":40, "slug":"el-esqueleto",          "name":"El Esqueleto",          "rarity":"rare",      "body":"#e0e0e0","cannon":"#9e9e9e", "theme":"Pale bone-white skeleton tank with ribcage pattern engraved on armor panels and skull emblem on hatch"},
    {"id":41, "slug":"el-gnomo-del-bosque",   "name":"El Gnomo del Bosque",   "rarity":"rare",      "body":"#388e3c","cannon":"#c62828", "theme":"Forest green gnome tank with red mushroom cap motif painted on hatch and leaf-vein engraved lines on armor panels"},
    {"id":42, "slug":"el-cocinero",           "name":"El Cocinero",           "rarity":"rare",      "body":"#fafafa","cannon":"#e64a19", "theme":"Chef white tank with orange chef-hat symbol on hatch and cooking pot/spoon decorative details on armor panels"},
    {"id":43, "slug":"el-navideno",           "name":"El Navideño",           "rarity":"rare",      "body":"#c62828","cannon":"#2e7d32", "theme":"Christmas red tank with green holly-leaf and golden snowflake decorative motifs on armor panels, green cannon"},
    {"id":44, "slug":"el-surfista",           "name":"El Surfista",           "rarity":"rare",      "body":"#29b6f6","cannon":"#f9a825", "theme":"Sky blue surfer tank with yellow-orange wave and sunburst motif painted on armor panels, golden cannon"},
    {"id":45, "slug":"el-alpinista",          "name":"El Alpinista",          "rarity":"rare",      "body":"#558b2f","cannon":"#5d4037", "theme":"Olive green mountain climber tank with brown rope-knot and ice axe emblem on hatch, brown cannon"},
    {"id":46, "slug":"el-domador",            "name":"El Domador",            "rarity":"rare",      "body":"#c62828","cannon":"#d4ac0d", "theme":"Circus red lion-tamer tank with golden star and whip-spiral decorative motifs on armor panels, golden cannon"},
    {"id":47, "slug":"el-tamalero",           "name":"El Tamalero",           "rarity":"rare",      "body":"#43a047","cannon":"#c62828", "theme":"Bright green Latin street-food tamale seller tank with red corn husk and chili pepper motifs on armor panels"},
    {"id":48, "slug":"el-gladiador",          "name":"El Gladiador",          "rarity":"rare",      "body":"#d4ac0d","cannon":"#c62828", "theme":"Golden arena gladiator tank with red laurel-wreath emblem on hatch and shield-pattern engraved armor panels"},
    {"id":49, "slug":"tanque-retro",          "name":"Tanque Retro",          "rarity":"rare",      "body":"#33691e","cannon":"#1b5e20", "theme":"Dark retro 8-bit style green tank with pixel-art block pattern engravings on armor panels and pixelated hatch symbol"},
    {"id":50, "slug":"el-barquero",           "name":"El Barquero",           "rarity":"rare",      "body":"#4fc3f7","cannon":"#d4ac0d", "theme":"Venetian sky-blue gondolier tank with golden gondola-bow and wave motifs on armor panels, golden cannon"},
    {"id":51, "slug":"tanque-electrico",      "name":"Tanque Eléctrico",      "rarity":"rare",      "body":"#ffd600","cannon":"#212121", "theme":"Electric yellow voltage tank with black lightning bolt emblems and zigzag electrical circuit lines on armor panels"},
    {"id":52, "slug":"el-panadero",           "name":"El Panadero",           "rarity":"rare",      "body":"#f5e6c8","cannon":"#f9a825", "theme":"Warm cream baker tank with golden bread-loaf and wheat-sheaf motifs on armor panels, golden amber cannon"},
    {"id":53, "slug":"tanque-de-hielo",       "name":"Tanque de Hielo",       "rarity":"rare",      "body":"#80deea","cannon":"#00838f", "theme":"Pale cryogenic ice-blue tank with white snowflake and ice-crystal pattern engravings on armor panels, teal cannon"},
    {"id":54, "slug":"el-campeon",            "name":"El Campeón",            "rarity":"rare",      "body":"#ffd600","cannon":"#1565c0", "theme":"Olympic gold champion tank with blue laurel-wreath and star medal motifs on armor panels, blue cannon"},
    {"id":55, "slug":"tanque-tornado",        "name":"Tanque Tornado",        "rarity":"rare",      "body":"#607d8b","cannon":"#e64a19", "theme":"Stormy gray tornado tank with orange spiral vortex and wind-swirl pattern engravings on armor panels"},
    {"id":56, "slug":"el-medico-de-campo",    "name":"El Médico de Campo",    "rarity":"rare",      "body":"#f5f5f5","cannon":"#d32f2f", "theme":"White field medic tank with bold red cross on hatch cover and red medical stripe on armor panels, red cannon"},
    {"id":57, "slug":"el-carpintero",         "name":"El Carpintero",         "rarity":"rare",      "body":"#795548","cannon":"#d7a96b", "theme":"Warm wood-brown carpenter tank with wood grain pattern on armor panels and golden hammer-and-saw emblem on hatch"},
    {"id":58, "slug":"el-mago-aprendiz",      "name":"El Mago Aprendiz",      "rarity":"rare",      "body":"#7b1fa2","cannon":"#f9a825", "theme":"Purple apprentice wizard tank with golden star and crescent moon motifs on armor panels, golden wand cannon"},
    {"id":59, "slug":"tanque-fantasma",       "name":"Tanque Fantasma",       "rarity":"rare",      "body":"#cfd8dc","cannon":"#78909c", "theme":"Translucent ghost pale-gray tank with wispy ghost silhouette on hatch and ethereal mist pattern on armor panels"},
    {"id":60, "slug":"el-bombero-espacial",   "name":"El Bombero Espacial",   "rarity":"rare",      "body":"#f44336","cannon":"#bdbdbd", "theme":"Bright space-firefighter red tank with silver oxygen-tank and rocket-nozzle motifs on armor panels, silver cannon"},

    # ── EPIC (61-85) ──────────────────────────────────────────────────────────
    {"id":61, "slug":"tanque-espacial-omega", "name":"Tanque Espacial Omega", "rarity":"epic",      "body":"#0d0d2b","cannon":"#00e5ff", "theme":"Deep space near-black tank with glowing cyan neon circuit lines and star-cluster motif on hatch, bright cyan cannon with glow"},
    {"id":62, "slug":"el-dragon-carmesi",     "name":"El Dragón Carmesí",     "rarity":"epic",      "body":"#7f0000","cannon":"#d4ac0d", "theme":"Dark crimson dragon tank with golden dragon-scale engraving on armor panels and dragon-claw emblem on hatch, gold cannon"},
    {"id":63, "slug":"tanque-nuclear",        "name":"Tanque Nuclear",        "rarity":"epic",      "body":"#76ff03","cannon":"#ff6d00", "theme":"Radioactive neon-green tank with orange biohazard trefoil symbol on hatch and radioactive glow edge lines on armor panels"},
    {"id":64, "slug":"el-titan-glaciar",      "name":"El Titán Glaciar",      "rarity":"epic",      "body":"#0d47a1","cannon":"#b0bec5", "theme":"Deep intense blue glacial titan tank with silver ice-shard jagged pattern engravings on armor panels, silver cannon"},
    {"id":65, "slug":"tanque-de-cristal",     "name":"Tanque de Cristal",     "rarity":"epic",      "body":"#40c4ff","cannon":"#0091ea", "theme":"Crystal bright-blue transparent-looking tank with prismatic refraction light-spark pattern engravings on armor panels"},
    {"id":66, "slug":"el-fantasma-mayor",     "name":"El Fantasma Mayor",     "rarity":"epic",      "body":"#fafafa","cannon":"#212121", "theme":"Near-white major ghost tank with black shadowy phantom silhouette on hatch and dark vortex spiral engravings on armor panels"},
    {"id":67, "slug":"tanque-steampunk",      "name":"Tanque Steampunk",      "rarity":"epic",      "body":"#bf7a28","cannon":"#6d4c41", "theme":"Aged copper steampunk tank with gear-cog engravings on all armor panels, steam pipe and pressure gauge emblem on hatch, brown cannon"},
    {"id":68, "slug":"el-samurai-oscuro",     "name":"El Samurái Oscuro",     "rarity":"epic",      "body":"#0d0d0d","cannon":"#b71c1c", "theme":"Near-black dark samurai tank with blood-red brushstroke kanji and dramatic dark Japanese wave engravings on armor panels"},
    {"id":69, "slug":"tanque-lava-supremo",   "name":"Tanque Lava Supremo",   "rarity":"epic",      "body":"#ff6d00","cannon":"#d50000", "theme":"Molten orange supreme lava tank with glowing red volcanic crack patterns through armor panels and lava-drip on hatch edges"},
    {"id":70, "slug":"el-maestro-del-caos",   "name":"El Maestro del Caos",   "rarity":"epic",      "body":"#1a0533","cannon":"#9c27b0", "theme":"Near-black chaos master tank with swirling purple cosmic-chaos vortex pattern engravings and purple glowing edge lines on armor panels"},
    {"id":71, "slug":"el-guerrero-trueno",    "name":"El Guerrero Trueno",    "rarity":"epic",      "body":"#1a237e","cannon":"#ffd600", "theme":"Deep blue thunder warrior tank with bright golden lightning bolt splitting across armor panels and thunder-cloud emblem on hatch"},
    {"id":72, "slug":"el-explorador-estelar", "name":"El Explorador Estelar", "rarity":"epic",      "body":"#0a0a1f","cannon":"#90a4ae", "theme":"Near-black stellar explorer tank with silver constellation star-map engraved on all armor panels and telescope emblem on hatch"},
    {"id":73, "slug":"el-berserker-vikingo",  "name":"El Berserker Vikingo",  "rarity":"epic",      "body":"#424242","cannon":"#c62828", "theme":"Dark gray berserker Viking tank with blood-red axe-slash marks and runic skull engravings on armor panels, red cannon"},
    {"id":74, "slug":"el-mago-supremo",       "name":"El Mago Supremo",       "rarity":"epic",      "body":"#4a148c","cannon":"#d4ac0d", "theme":"Deep purple supreme mage tank with golden magical sigil and arcane rune engravings on all armor panels, gold cannon"},
    {"id":75, "slug":"el-guardian-eterno",    "name":"El Guardián Eterno",    "rarity":"epic",      "body":"#d4ac0d","cannon":"#212121", "theme":"Royal gold eternal guardian tank with black shield heraldry and ornate cross-pattern engravings on armor panels, black cannon"},
    {"id":76, "slug":"el-capitan-estelar",    "name":"El Capitán Estelar",    "rarity":"epic",      "body":"#0d47a1","cannon":"#d4ac0d", "theme":"Deep navy stellar captain tank with golden comet-trail and star constellation motifs engraved on armor panels, gold cannon"},
    {"id":77, "slug":"tanque-cuantico",       "name":"Tanque Cuántico",       "rarity":"epic",      "body":"#00e5ff","cannon":"#0d0d0d", "theme":"Bright cyan quantum tank with black quantum-wave interference pattern engravings and atom-ring symbol on hatch, black cannon"},
    {"id":78, "slug":"tanque-volcanico",      "name":"Tanque Volcánico",      "rarity":"epic",      "body":"#ff3d00","cannon":"#212121", "theme":"Vivid orange-red volcanic tank with black lava-crack fissure pattern engravings across armor panels and eruption emblem on hatch"},
    {"id":79, "slug":"el-rey-del-carnaval",   "name":"El Rey del Carnaval",   "rarity":"epic",      "body":"#e040fb","cannon":"#d4ac0d", "theme":"Vivid purple carnival king tank with golden confetti-burst and festive mask motifs on armor panels, multi-color accents"},
    {"id":80, "slug":"el-rey-del-hielo",      "name":"El Rey del Hielo",      "rarity":"epic",      "body":"#b3e5fc","cannon":"#f5f5f5", "theme":"Ice-crystal pale-blue ice king tank with white snowflake crown emblem on hatch and intricate frost-crystal engravings on all armor panels"},
    {"id":81, "slug":"el-ultimo-guerrero",    "name":"El Último Guerrero",    "rarity":"epic",      "body":"#0d0d0d","cannon":"#d4ac0d", "theme":"Near-black last warrior tank with supreme gold trophy-and-sword emblem on hatch and gold battle-scar engravings on armor panels"},
    {"id":82, "slug":"nebulosa",              "name":"Nebulosa",              "rarity":"epic",      "body":"#1a0533","cannon":"#283593", "theme":"Deep purple nebula space tank with indigo-blue cosmic cloud and star-formation engravings across all armor panels, deep blue cannon"},
    {"id":83, "slug":"tormenta-suprema",      "name":"Tormenta Suprema",      "rarity":"epic",      "body":"#37474f","cannon":"#f9a825", "theme":"Dark storm-gray supreme storm tank with golden lightning storm cell and whirlwind engravings on armor panels, golden cannon"},
    {"id":84, "slug":"el-invocador",          "name":"El Invocador",          "rarity":"epic",      "body":"#1b2e1b","cannon":"#76ff03", "theme":"Very dark green summoner tank with neon-green glowing rune circle engravings on armor panels and arcane portal symbol on hatch"},
    {"id":85, "slug":"el-fantasma-de-sombra", "name":"El Fantasma de Sombra", "rarity":"epic",      "body":"#121212","cannon":"#00e676", "theme":"Near-black shadow phantom tank with bright green ethereal ghost-shadow trailing silhouettes on armor panels, bright green cannon"},

    # ── LEGENDARY (86-100) ────────────────────────────────────────────────────
    {"id":86, "slug":"tanque-galactico",      "name":"Tanque Galáctico",      "rarity":"legendary", "body":"#0a0a2e","cannon":"#7c4dff", "theme":"Deep space near-black galactic tank with violet-purple nebula swirl and galaxy spiral engravings on all armor panels, glowing purple cannon with energy halo"},
    {"id":87, "slug":"el-leviatan",           "name":"El Leviatán",           "rarity":"legendary", "body":"#0d1b2a","cannon":"#4fc3f7", "theme":"Very dark navy leviathan sea-monster tank with bright cyan scale-pattern engravings and kraken tentacle motifs on armor panels, bright cyan cannon"},
    {"id":88, "slug":"el-fenix",              "name":"El Fénix",              "rarity":"legendary", "body":"#ff6d00","cannon":"#d4ac0d", "theme":"Blazing orange phoenix tank with golden flame-wing patterns spread across all armor panels and rebirth phoenix emblem on hatch, gold cannon with glow"},
    {"id":89, "slug":"tanque-dimensional",    "name":"Tanque Dimensional",    "rarity":"legendary", "body":"#6a1b9a","cannon":"#00e5ff", "theme":"Deep purple dimensional portal tank with cyan portal-ring and dimensional rift tear engravings on armor panels, glowing cyan cannon"},
    {"id":90, "slug":"el-titan-supremo",      "name":"El Titán Supremo",      "rarity":"legendary", "body":"#d4ac0d","cannon":"#0d0d0d", "theme":"Monumental gold supreme titan tank with black colossal titan-god relief engravings and crown emblem on hatch, black cannon"},
    {"id":91, "slug":"el-senor-del-vacio",    "name":"El Señor del Vacío",    "rarity":"legendary", "body":"#000000","cannon":"#7c4dff", "theme":"Absolute black void lord tank with purple cosmic void-hole and dimensional tear engravings on armor panels, purple cannon with subtle glow"},
    {"id":92, "slug":"el-dios-del-trueno",    "name":"El Dios del Trueno",    "rarity":"legendary", "body":"#f9a825","cannon":"#212121", "theme":"Electric storm-yellow thunder god tank with black multiple-lightning-bolt pattern across all armor panels and thunder-storm emblem on hatch"},
    {"id":93, "slug":"tanque-apocalipsis",    "name":"Tanque Apocalipsis",    "rarity":"legendary", "body":"#b71c1c","cannon":"#0d0d0d", "theme":"Deep red apocalypse tank with black destruction-and-fire engravings and four horsemen emblem on hatch, near-black cannon"},
    {"id":94, "slug":"el-angel-oscuro",       "name":"El Ángel Oscuro",       "rarity":"legendary", "body":"#0d0d0d","cannon":"#d4ac0d", "theme":"Near-black dark angel tank with golden double-wing halo engraving on hatch and elaborate golden feather-pattern on all armor panels"},
    {"id":95, "slug":"el-dios-del-hielo",     "name":"El Dios del Hielo",     "rarity":"legendary", "body":"#00b0ff","cannon":"#e3f2fd", "theme":"Vivid crystal-blue ice god tank with near-white absolute frost crystal patterns across all armor panels and ice crown emblem on hatch"},
    {"id":96, "slug":"tanque-primordial",     "name":"Tanque Primordial",     "rarity":"legendary", "body":"#795548","cannon":"#ff6d00", "theme":"Earth-brown primordial elements tank with orange fire, blue water wave, green leaf and white air gust engraved in four quadrants of armor panels"},
    {"id":97, "slug":"el-maestro-del-universo","name":"El Maestro del Universo","rarity":"legendary","body":"#1a0533","cannon":"#7c4dff", "theme":"Deepest purple universe master tank with all-constellation star-map and galaxy spiral engraved on armor panels, purple glowing cannon"},
    {"id":98, "slug":"el-gran-senor-de-la-guerra","name":"El Gran Señor de la Guerra","rarity":"legendary","body":"#880e4f","cannon":"#0d0d0d", "theme":"Dark crimson war lord tank with black battle-crown and crossed-swords war banner engraved on armor panels, near-black cannon"},
    {"id":99, "slug":"el-absoluto",           "name":"El Absoluto",           "rarity":"legendary", "body":"#080808","cannon":"#7c4dff", "theme":"Near-absolute black supreme tank with purple all-elements combined symbols and absolute power sigil engraved on armor panels, purple cannon"},
    {"id":100,"slug":"el-mitico",             "name":"El Mítico",             "rarity":"legendary", "body":"#7c4dff","cannon":"#d4ac0d", "theme":"Rainbow-to-gold mythic limited edition tank with multi-color gradient spectrum across armor panels, golden crown and mythic seal on hatch"},
]

# ─── Helpers de imagen ───────────────────────────────────────────────────────

def content_mask(arr):
    r = arr[:,:,0].astype(int)
    g = arr[:,:,1].astype(int)
    b = arr[:,:,2].astype(int)
    a = arr[:,:,3].astype(int)
    not_white = (255-r > WHITE_TH) | (255-g > WHITE_TH) | (255-b > WHITE_TH)
    return not_white & (a > 50)


def tight_bbox(mask):
    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)
    if not rows.any():
        return None
    t = int(np.argmax(rows));         b = int(len(rows)    - np.argmax(rows[::-1]))
    l = int(np.argmax(cols));         r = int(len(cols)    - np.argmax(cols[::-1]))
    return l, t, r, b


def find_gap(has_content, zone_start, zone_end):
    best_start, best_len, cur_start = None, 0, None
    for i in range(zone_start, zone_end):
        if not has_content[i]:
            if cur_start is None: cur_start = i
        else:
            if cur_start is not None:
                length = i - cur_start
                if length > best_len: best_len = length; best_start = cur_start
                cur_start = None
    if cur_start is not None:
        length = zone_end - cur_start
        if length > best_len: best_len = length; best_start = cur_start
    if best_start is None: return (zone_start + zone_end) // 2
    return best_start + best_len // 2


def scale_into(arr_slice, bbox, target):
    l, t, r, b = bbox
    cropped = Image.fromarray(arr_slice[t:b, l:r])
    cw, ch = cropped.size
    tw, th = target
    scale = min(tw/cw, th/ch)
    nw, nh = max(1, int(round(cw*scale))), max(1, int(round(ch*scale)))
    scaled = cropped.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGBA", target, (0,0,0,0))
    canvas.paste(scaled, ((tw-nw)//2, (th-nh)//2))
    return canvas


# ─── Generación de prompt ─────────────────────────────────────────────────────

RARITY_DETAIL = {
    "common":    "Clean simple design, minimal extra details, clear readable colors.",
    "rare":      "Additional thematic engravings on armor panels, moderate extra detail, clear motif on hatch.",
    "epic":      "Complex thematic engravings covering all armor panels, dramatic visual effect, strong glow or energy lines.",
    "legendary": "Maximum detail — elaborate engravings on all surfaces, glowing energy effects on edges and cannon, iconic emblem on hatch, most impressive visual quality possible.",
}

def make_prompt(skin):
    body  = skin["body"]
    cannon= skin["cannon"]
    theme = skin["theme"]
    rarity_hint = RARITY_DETAIL[skin["rarity"]]

    return (
        f"TWO cartoon tank sprites side by side on a 1536x1024 transparent canvas. "
        f"Both viewed strictly from directly above at 90 degrees (pure bird's eye zenith view, "
        f"camera pointing STRAIGHT DOWN). Transparent background. "
        f"STYLE: vibrant cartoon palette (Brawl Stars quality), bold dark charcoal outlines (#1A1A2E, 4px), "
        f"smooth cel-shading with gradient transitions, highly readable.\n\n"
        f"LEFT PANEL (left half of canvas): Chunky cartoon TANK BODY — only TOP ROOF visible. "
        f"Main body color {body}. Cel-shading: bright lighter highlight in top-left, {body} mid-tone base, "
        f"darker shadow in bottom-right. "
        f"Roof surface: layered armor panels with bold outline panel lines, circular turret mount ring in center, "
        f"small armored hatch, rear ventilation grilles, two exhaust ports. "
        f"TWO SEGMENTED TRACK STRIPS on far left and far right edges (dark warm gray, chain links visible). "
        f"THEME: {theme} {rarity_hint} "
        f"Chunky wide squat proportions. Bold dark charcoal outline 4px all edges.\n\n"
        f"RIGHT PANEL (right half of canvas): Cartoon TANK CANNON from directly above — "
        f"narrow elongated rectangle pointing UP (12 o'clock). Bottom: wider rounded turret base. "
        f"Barrel narrows toward muzzle cap. Cannon color {cannon}, soft gradient highlight stripe. "
        f"Bold charcoal outline.\n\n"
        f"Strictly 90-degree overhead. NO front face, NO side face, NO isometric angle. "
        f"Professional 2D top-down game art."
    )

NEGATIVE = (
    "side view, isometric, 3/4 view, angled perspective, front face visible, lateral face, "
    "realistic, photorealistic, pixel art, military realism, dark gritty, thin proportions, "
    "pure black outlines, flat dull colors, text, watermark, solid background, 3D render"
)


# ─── API ─────────────────────────────────────────────────────────────────────

def api_generate(prompt, draft_path):
    key = open(KEY_PATH).read().strip()
    payload = json.dumps({
        "model":         "gpt-image-1",
        "prompt":        prompt,
        "size":          "1536x1024",
        "quality":       "low",
        "output_format": "png",
        "n":             1,
    }).encode()
    req = urllib.request.Request(
        "https://api.openai.com/v1/images/generations",
        data=payload,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            result = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  ✗ HTTP {e.code}: {body[:300]}")
        return False

    item = result["data"][0]
    img_bytes = base64.b64decode(item["b64_json"]) if "b64_json" in item else \
                urllib.request.urlopen(item["url"]).read()
    os.makedirs(os.path.dirname(draft_path), exist_ok=True)
    with open(draft_path, "wb") as f:
        f.write(img_bytes)
    print(f"  draft: {len(img_bytes)//1024} KB → {draft_path}")
    return True


# ─── Extracción ──────────────────────────────────────────────────────────────

def extract(slug, draft_path):
    img  = Image.open(draft_path).convert("RGBA")
    arr  = np.array(img)
    H, W = arr.shape[:2]
    mask = content_mask(arr)
    split = find_gap(np.any(mask, axis=0), W//4, 3*W//4)
    print(f"  split col {split}  ({W}×{H})")

    bbox_body = tight_bbox(mask[:, :split])
    if bbox_body is None:
        print("  ✗ body sin contenido"); return False
    body_img = scale_into(arr[:, :split], bbox_body, BODY_SIZE)
    body_path = os.path.join(ASSETS, f"tank-{slug}-body.png")
    os.makedirs(ASSETS, exist_ok=True)
    body_img.save(body_path, "PNG")
    print(f"  body  → {body_path}")

    bbox_cannon = tight_bbox(mask[:, split:])
    if bbox_cannon is None:
        print("  ✗ cannon sin contenido"); return False
    cannon_img = scale_into(arr[:, split:], bbox_cannon, CANNON_SIZE)
    cannon_path = os.path.join(ASSETS, f"tank-{slug}-cannon.png")
    cannon_img.save(cannon_path, "PNG")
    print(f"  cannon→ {cannon_path}")

    # Preview en review/
    body_prev = os.path.join(REVIEW, f"tank-{slug}-body-draft.png")
    body_img.save(body_prev, "PNG")
    cannon_prev = os.path.join(REVIEW, f"tank-{slug}-cannon-draft.png")
    cannon_img.save(cannon_prev, "PNG")
    return True


# ─── Procesar un skin ─────────────────────────────────────────────────────────

def process(skin, force_regen=False):
    slug = skin["slug"]
    body_path   = os.path.join(ASSETS, f"tank-{slug}-body.png")
    cannon_path = os.path.join(ASSETS, f"tank-{slug}-cannon.png")
    draft_path  = os.path.join(REVIEW, f"tank-{slug}-group-draft.png")

    print(f"\n[{skin['id']:3d}] {skin['name']}  ({skin['rarity']})  slug={slug}")

    # Ya tiene los dos assets finales
    if not force_regen and os.path.exists(body_path) and os.path.exists(cannon_path):
        print("  ✓ ya existe en assets, saltando")
        return True

    # Tiene draft → solo extraer
    if not force_regen and os.path.exists(draft_path):
        print("  draft existe → extrayendo")
        return extract(slug, draft_path)

    # Generar desde API
    prompt = make_prompt(skin)
    print(f"  generando con API…")
    if not api_generate(prompt, draft_path):
        return False
    return extract(slug, draft_path)


# ─── Main ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    arg = sys.argv[1] if len(sys.argv) > 1 else "all"

    if arg == "extract":
        # Solo extrae los que tengan draft pero no tengan asset final
        for s in SKINS:
            draft = os.path.join(REVIEW, f"tank-{s['slug']}-group-draft.png")
            body  = os.path.join(ASSETS, f"tank-{s['slug']}-body.png")
            if os.path.exists(draft) and not os.path.exists(body):
                print(f"\n[{s['id']:3d}] {s['name']} → extrayendo draft")
                extract(s["slug"], draft)
        print("\n=== Extracción terminada ===")
        sys.exit(0)

    if arg == "all":
        jobs = SKINS
    elif arg.isdigit():
        n = int(arg)
        jobs = [s for s in SKINS if s["id"] == n]
    else:
        jobs = [s for s in SKINS if s["slug"] == arg]

    if not jobs:
        print(f"Skin '{arg}' no encontrado.")
        sys.exit(1)

    ok, skip, fail = 0, 0, 0
    for skin in jobs:
        result = process(skin)
        if result is True:
            body = os.path.join(ASSETS, f"tank-{skin['slug']}-body.png")
            if os.path.exists(body):
                ok += 1
            else:
                skip += 1
        else:
            fail += 1
            if arg == "all":
                print(f"\n  API falló — abortando generación masiva (tokens agotados?)")
                break

    total = len(SKINS)
    done  = sum(1 for s in SKINS if os.path.exists(os.path.join(ASSETS, f"tank-{s['slug']}-body.png")))
    print(f"\n=== Listo: {ok} generados, {skip} saltados, {fail} fallidos ===")
    print(f"    Progreso total: {done}/{total} skins en assets")
