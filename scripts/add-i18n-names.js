/* eslint-disable */
'use strict';
const fs   = require('fs');
const path = require('path');

const I18N_DIR = path.join(__dirname, '..', 'frontend', 'public', 'i18n');

// ─── Skins ────────────────────────────────────────────────────────────────────

const SKINS_ES = {
  'base-clasico': 'Base Clásico', 'el-verde': 'El Verde', 'el-rojo': 'El Rojo',
  'el-azul': 'El Azul', 'el-amarillo': 'El Amarillo', 'gris-tormenta': 'Gris Tormenta',
  'morado-pasion': 'Morado Pasión', 'rosa-retro': 'Rosa Retro',
  'naranja-llamarada': 'Naranja Llamarada', 'turquesa-marino': 'Turquesa Marino',
  'lima-toxico': 'Lima Tóxico', 'marron-terroso': 'Marrón Terroso',
  'negro-carbon': 'Negro Carbón', 'blanco-nieve': 'Blanco Nieve',
  'el-barrilito': 'El Barrilito', 'helado-de-vainilla': 'Helado de Vainilla',
  'helado-de-fresa': 'Helado de Fresa', 'helado-de-chocolate': 'Helado de Chocolate',
  'el-vecindario': 'El Vecindario', 'camuflaje-tropical': 'Camuflaje Tropical',
  'el-paletero': 'El Paletero', 'tanque-solar': 'Tanque Solar',
  'el-marino': 'El Marino', 'el-vaquero': 'El Vaquero', 'invierno-polar': 'Invierno Polar',
  'tanque-acuatico': 'Tanque Acuático', 'el-ninja': 'El Ninja', 'el-pirata': 'El Pirata',
  'el-bombero': 'El Bombero', 'el-astronauta': 'El Astronauta',
  'el-cientifico': 'El Científico', 'el-robot': 'El Robot',
  'desierto-elite': 'Desierto Élite', 'jungla-oscura': 'Jungla Oscura',
  'el-vikingo': 'El Vikingo', 'tanque-futurista': 'Tanque Futurista',
  'el-samurai': 'El Samurái', 'el-fantoche': 'El Fantoche', 'el-vampiro': 'El Vampiro',
  'el-esqueleto': 'El Esqueleto', 'el-gnomo-del-bosque': 'El Gnomo del Bosque',
  'el-cocinero': 'El Cocinero', 'el-navideno': 'El Navideño', 'el-surfista': 'El Surfista',
  'el-alpinista': 'El Alpinista', 'el-domador': 'El Domador', 'el-tamalero': 'El Tamalero',
  'el-gladiador': 'El Gladiador', 'tanque-retro': 'Tanque Retro', 'el-barquero': 'El Barquero',
  'tanque-electrico': 'Tanque Eléctrico', 'el-panadero': 'El Panadero',
  'tanque-de-hielo': 'Tanque de Hielo', 'el-campeon': 'El Campeón',
  'tanque-tornado': 'Tanque Tornado', 'el-medico-de-campo': 'El Médico de Campo',
  'el-carpintero': 'El Carpintero', 'el-mago-aprendiz': 'El Mago Aprendiz',
  'tanque-fantasma': 'Tanque Fantasma', 'el-bombero-espacial': 'El Bombero Espacial',
  'tanque-espacial-omega': 'Tanque Espacial Omega', 'el-dragon-carmesi': 'El Dragón Carmesí',
  'tanque-nuclear': 'Tanque Nuclear', 'el-titan-glaciar': 'El Titán Glaciar',
  'tanque-de-cristal': 'Tanque de Cristal', 'el-fantasma-mayor': 'El Fantasma Mayor',
  'tanque-steampunk': 'Tanque Steampunk', 'el-samurai-oscuro': 'El Samurái Oscuro',
  'tanque-lava-supremo': 'Tanque Lava Supremo', 'el-maestro-del-caos': 'El Maestro del Caos',
  'el-guerrero-trueno': 'El Guerrero Trueno', 'el-explorador-estelar': 'El Explorador Estelar',
  'el-berserker-vikingo': 'El Berserker Vikingo', 'el-mago-supremo': 'El Mago Supremo',
  'el-guardian-eterno': 'El Guardián Eterno', 'el-capitan-estelar': 'El Capitán Estelar',
  'tanque-cuantico': 'Tanque Cuántico', 'tanque-volcanico': 'Tanque Volcánico',
  'el-rey-del-carnaval': 'El Rey del Carnaval', 'el-rey-del-hielo': 'El Rey del Hielo',
  'el-ultimo-guerrero': 'El Último Guerrero', 'nebulosa': 'Nebulosa',
  'tormenta-suprema': 'Tormenta Suprema', 'el-invocador': 'El Invocador',
  'el-fantasma-de-sombra': 'El Fantasma de Sombra', 'tanque-galactico': 'Tanque Galáctico',
  'el-leviatan': 'El Leviatán', 'el-fenix': 'El Fénix', 'tanque-dimensional': 'Tanque Dimensional',
  'el-titan-supremo': 'El Titán Supremo', 'el-senor-del-vacio': 'El Señor del Vacío',
  'el-dios-del-trueno': 'El Dios del Trueno', 'tanque-apocalipsis': 'Tanque Apocalipsis',
  'el-angel-oscuro': 'El Ángel Oscuro', 'el-dios-del-hielo': 'El Dios del Hielo',
  'tanque-primordial': 'Tanque Primordial', 'el-maestro-del-universo': 'El Maestro del Universo',
  'el-gran-senor-de-la-guerra': 'El Gran Señor de la Guerra',
  'el-absoluto': 'El Absoluto', 'el-mitico': 'El Mítico',
};

const SKINS_EN = {
  'base-clasico': 'Classic Base', 'el-verde': 'The Green', 'el-rojo': 'The Red',
  'el-azul': 'The Blue', 'el-amarillo': 'The Yellow', 'gris-tormenta': 'Storm Gray',
  'morado-pasion': 'Passion Purple', 'rosa-retro': 'Retro Pink',
  'naranja-llamarada': 'Blaze Orange', 'turquesa-marino': 'Marine Teal',
  'lima-toxico': 'Toxic Lime', 'marron-terroso': 'Earthy Brown',
  'negro-carbon': 'Charcoal Black', 'blanco-nieve': 'Snow White',
  'el-barrilito': 'The Little Barrel', 'helado-de-vainilla': 'Vanilla Ice Cream',
  'helado-de-fresa': 'Strawberry Ice Cream', 'helado-de-chocolate': 'Chocolate Ice Cream',
  'el-vecindario': 'The Neighborhood', 'camuflaje-tropical': 'Tropical Camo',
  'el-paletero': 'The Ice Cream Man', 'tanque-solar': 'Solar Tank',
  'el-marino': 'The Sailor', 'el-vaquero': 'The Cowboy', 'invierno-polar': 'Polar Winter',
  'tanque-acuatico': 'Aquatic Tank', 'el-ninja': 'The Ninja', 'el-pirata': 'The Pirate',
  'el-bombero': 'The Firefighter', 'el-astronauta': 'The Astronaut',
  'el-cientifico': 'The Scientist', 'el-robot': 'The Robot',
  'desierto-elite': 'Elite Desert', 'jungla-oscura': 'Dark Jungle',
  'el-vikingo': 'The Viking', 'tanque-futurista': 'Futuristic Tank',
  'el-samurai': 'The Samurai', 'el-fantoche': 'The Puppet', 'el-vampiro': 'The Vampire',
  'el-esqueleto': 'The Skeleton', 'el-gnomo-del-bosque': 'The Forest Gnome',
  'el-cocinero': 'The Cook', 'el-navideno': 'The Christmas One',
  'el-surfista': 'The Surfer', 'el-alpinista': 'The Mountaineer',
  'el-domador': 'The Tamer', 'el-tamalero': 'The Tamale Man',
  'el-gladiador': 'The Gladiator', 'tanque-retro': 'Retro Tank',
  'el-barquero': 'The Boatman', 'tanque-electrico': 'Electric Tank',
  'el-panadero': 'The Baker', 'tanque-de-hielo': 'Ice Tank',
  'el-campeon': 'The Champion', 'tanque-tornado': 'Tornado Tank',
  'el-medico-de-campo': 'Field Medic', 'el-carpintero': 'The Carpenter',
  'el-mago-aprendiz': 'The Apprentice Mage', 'tanque-fantasma': 'Ghost Tank',
  'el-bombero-espacial': 'Space Firefighter', 'tanque-espacial-omega': 'Omega Space Tank',
  'el-dragon-carmesi': 'The Crimson Dragon', 'tanque-nuclear': 'Nuclear Tank',
  'el-titan-glaciar': 'The Glacier Titan', 'tanque-de-cristal': 'Crystal Tank',
  'el-fantasma-mayor': 'The Greater Ghost', 'tanque-steampunk': 'Steampunk Tank',
  'el-samurai-oscuro': 'The Dark Samurai', 'tanque-lava-supremo': 'Supreme Lava Tank',
  'el-maestro-del-caos': 'The Chaos Master', 'el-guerrero-trueno': 'The Thunder Warrior',
  'el-explorador-estelar': 'The Stellar Explorer', 'el-berserker-vikingo': 'The Viking Berserker',
  'el-mago-supremo': 'The Supreme Mage', 'el-guardian-eterno': 'The Eternal Guardian',
  'el-capitan-estelar': 'The Stellar Captain', 'tanque-cuantico': 'Quantum Tank',
  'tanque-volcanico': 'Volcanic Tank', 'el-rey-del-carnaval': 'The Carnival King',
  'el-rey-del-hielo': 'The Ice King', 'el-ultimo-guerrero': 'The Last Warrior',
  'nebulosa': 'Nebula', 'tormenta-suprema': 'Supreme Storm',
  'el-invocador': 'The Summoner', 'el-fantasma-de-sombra': 'The Shadow Ghost',
  'tanque-galactico': 'Galactic Tank', 'el-leviatan': 'The Leviathan',
  'el-fenix': 'The Phoenix', 'tanque-dimensional': 'Dimensional Tank',
  'el-titan-supremo': 'The Supreme Titan', 'el-senor-del-vacio': 'The Void Lord',
  'el-dios-del-trueno': 'The Thunder God', 'tanque-apocalipsis': 'Apocalypse Tank',
  'el-angel-oscuro': 'The Dark Angel', 'el-dios-del-hielo': 'The Ice God',
  'tanque-primordial': 'Primordial Tank', 'el-maestro-del-universo': 'Master of the Universe',
  'el-gran-senor-de-la-guerra': 'The Great Warlord',
  'el-absoluto': 'The Absolute', 'el-mitico': 'The Mythic',
};

const SKINS_PT = {
  'base-clasico': 'Base Clássico', 'el-verde': 'O Verde', 'el-rojo': 'O Vermelho',
  'el-azul': 'O Azul', 'el-amarillo': 'O Amarelo', 'gris-tormenta': 'Cinza Tempestade',
  'morado-pasion': 'Roxo Paixão', 'rosa-retro': 'Rosa Retrô',
  'naranja-llamarada': 'Laranja Chama', 'turquesa-marino': 'Turquesa Marinho',
  'lima-toxico': 'Lima Tóxico', 'marron-terroso': 'Marrom Terra',
  'negro-carbon': 'Preto Carvão', 'blanco-nieve': 'Branco Neve',
  'el-barrilito': 'O Barrilinho', 'helado-de-vainilla': 'Sorvete de Baunilha',
  'helado-de-fresa': 'Sorvete de Morango', 'helado-de-chocolate': 'Sorvete de Chocolate',
  'el-vecindario': 'A Vizinhança', 'camuflaje-tropical': 'Camuflagem Tropical',
  'el-paletero': 'O Sorveteiro', 'tanque-solar': 'Tanque Solar',
  'el-marino': 'O Marinheiro', 'el-vaquero': 'O Cowboy', 'invierno-polar': 'Inverno Polar',
  'tanque-acuatico': 'Tanque Aquático', 'el-ninja': 'O Ninja', 'el-pirata': 'O Pirata',
  'el-bombero': 'O Bombeiro', 'el-astronauta': 'O Astronauta',
  'el-cientifico': 'O Cientista', 'el-robot': 'O Robô',
  'desierto-elite': 'Deserto Elite', 'jungla-oscura': 'Selva Sombria',
  'el-vikingo': 'O Viking', 'tanque-futurista': 'Tanque Futurista',
  'el-samurai': 'O Samurai', 'el-fantoche': 'O Fantoche', 'el-vampiro': 'O Vampiro',
  'el-esqueleto': 'O Esqueleto', 'el-gnomo-del-bosque': 'O Gnomo da Floresta',
  'el-cocinero': 'O Cozinheiro', 'el-navideno': 'O Natalino',
  'el-surfista': 'O Surfista', 'el-alpinista': 'O Alpinista',
  'el-domador': 'O Domador', 'el-tamalero': 'O Tamale',
  'el-gladiador': 'O Gladiador', 'tanque-retro': 'Tanque Retrô',
  'el-barquero': 'O Barqueiro', 'tanque-electrico': 'Tanque Elétrico',
  'el-panadero': 'O Padeiro', 'tanque-de-hielo': 'Tanque de Gelo',
  'el-campeon': 'O Campeão', 'tanque-tornado': 'Tanque Tornado',
  'el-medico-de-campo': 'Médico de Campo', 'el-carpintero': 'O Carpinteiro',
  'el-mago-aprendiz': 'O Mago Aprendiz', 'tanque-fantasma': 'Tanque Fantasma',
  'el-bombero-espacial': 'Bombeiro Espacial', 'tanque-espacial-omega': 'Tanque Espacial Omega',
  'el-dragon-carmesi': 'O Dragão Carmesim', 'tanque-nuclear': 'Tanque Nuclear',
  'el-titan-glaciar': 'O Titã Glaciar', 'tanque-de-cristal': 'Tanque de Cristal',
  'el-fantasma-mayor': 'O Grande Fantasma', 'tanque-steampunk': 'Tanque Steampunk',
  'el-samurai-oscuro': 'O Samurai Sombrio', 'tanque-lava-supremo': 'Tanque Lava Supremo',
  'el-maestro-del-caos': 'O Mestre do Caos', 'el-guerrero-trueno': 'O Guerreiro Trovão',
  'el-explorador-estelar': 'O Explorador Estelar', 'el-berserker-vikingo': 'O Berserker Viking',
  'el-mago-supremo': 'O Mago Supremo', 'el-guardian-eterno': 'O Guardião Eterno',
  'el-capitan-estelar': 'O Capitão Estelar', 'tanque-cuantico': 'Tanque Quântico',
  'tanque-volcanico': 'Tanque Vulcânico', 'el-rey-del-carnaval': 'O Rei do Carnaval',
  'el-rey-del-hielo': 'O Rei do Gelo', 'el-ultimo-guerrero': 'O Último Guerreiro',
  'nebulosa': 'Nebulosa', 'tormenta-suprema': 'Tempestade Suprema',
  'el-invocador': 'O Invocador', 'el-fantasma-de-sombra': 'O Fantasma Sombra',
  'tanque-galactico': 'Tanque Galáctico', 'el-leviatan': 'O Leviatã',
  'el-fenix': 'A Fênix', 'tanque-dimensional': 'Tanque Dimensional',
  'el-titan-supremo': 'O Titã Supremo', 'el-senor-del-vacio': 'O Senhor do Vazio',
  'el-dios-del-trueno': 'O Deus do Trovão', 'tanque-apocalipsis': 'Tanque Apocalipse',
  'el-angel-oscuro': 'O Anjo Sombrio', 'el-dios-del-hielo': 'O Deus do Gelo',
  'tanque-primordial': 'Tanque Primordial', 'el-maestro-del-universo': 'Mestre do Universo',
  'el-gran-senor-de-la-guerra': 'O Grande Senhor da Guerra',
  'el-absoluto': 'O Absoluto', 'el-mitico': 'O Mítico',
};

// For fr, de, it, ru, zh, ja, ar — start from EN and override key terms
const mkFrom = (base, overrides) => ({ ...base, ...overrides });

const SKINS_FR = mkFrom(SKINS_EN, {
  'base-clasico': 'Base Classique', 'el-verde': 'Le Vert', 'el-rojo': 'Le Rouge',
  'el-azul': 'Le Bleu', 'el-amarillo': 'Le Jaune', 'gris-tormenta': 'Gris Tempête',
  'morado-pasion': 'Violet Passion', 'rosa-retro': 'Rose Rétro',
  'naranja-llamarada': 'Orange Flamme', 'turquesa-marino': 'Turquoise Marin',
  'lima-toxico': 'Citron Toxique', 'marron-terroso': 'Brun Terreux',
  'negro-carbon': 'Noir Carbone', 'blanco-nieve': 'Blanc Neige',
  'helado-de-vainilla': 'Glace Vanille', 'helado-de-fresa': 'Glace Fraise',
  'helado-de-chocolate': 'Glace Chocolat', 'el-marino': 'Le Marin',
  'el-vaquero': 'Le Cowboy', 'el-pirata': 'Le Pirate', 'el-bombero': 'Le Pompier',
  'el-cocinero': 'Le Cuisinier', 'el-navideno': 'Le Noël', 'el-surfista': 'Le Surfeur',
  'el-domador': 'Le Dompteur', 'el-gladiador': 'Le Gladiateur',
  'el-campeon': 'Le Champion', 'el-carpintero': 'Le Charpentier',
  'el-panadero': 'Le Boulanger', 'el-invocador': "L'Invocateur",
  'el-absoluto': "L'Absolu", 'el-mitico': 'Le Mythique',
  'nebulosa': 'Nébuleuse', 'tormenta-suprema': 'Tempête Suprême',
  'el-berserker-vikingo': 'Le Berserker Viking', 'el-dragon-carmesi': 'Le Dragon Cramoisi',
  'el-leviatan': 'Le Léviathan', 'el-fenix': 'Le Phénix',
  'el-dios-del-trueno': 'Le Dieu du Tonnerre', 'el-dios-del-hielo': 'Le Dieu des Glaces',
  'el-senor-del-vacio': 'Le Seigneur du Vide', 'el-angel-oscuro': "L'Ange Sombre",
  'el-ultimo-guerrero': 'Le Dernier Guerrier',
});

const SKINS_DE = mkFrom(SKINS_EN, {
  'base-clasico': 'Klassische Basis', 'el-verde': 'Der Grüne', 'el-rojo': 'Der Rote',
  'el-azul': 'Der Blaue', 'el-amarillo': 'Der Gelbe', 'gris-tormenta': 'Sturmgrau',
  'morado-pasion': 'Lila Leidenschaft', 'rosa-retro': 'Retro Rosa',
  'naranja-llamarada': 'Glut Orange', 'negro-carbon': 'Kohlschwarz',
  'blanco-nieve': 'Schneeweiß', 'helado-de-vainilla': 'Vanilleeis',
  'helado-de-fresa': 'Erdbeereis', 'helado-de-chocolate': 'Schokoladeneis',
  'el-vikingo': 'Der Wikinger', 'el-berserker-vikingo': 'Der Wikinger-Berserker',
  'el-vampiro': 'Der Vampir', 'el-esqueleto': 'Das Skelett',
  'el-fantasma-mayor': 'Das Große Gespenst', 'tanque-fantasma': 'Geisterpanzer',
  'el-fantasma-de-sombra': 'Der Schattengeist', 'el-navideno': 'Der Weihnachtliche',
  'el-cocinero': 'Der Koch', 'el-panadero': 'Der Bäcker', 'el-campeon': 'Der Champion',
  'el-gladiador': 'Der Gladiator', 'el-carpintero': 'Der Zimmermann',
  'el-surfista': 'Der Surfer', 'el-alpinista': 'Der Bergsteiger',
  'el-astronauta': 'Der Astronaut', 'el-pirata': 'Der Pirat', 'el-ninja': 'Der Ninja',
  'el-samurai': 'Der Samurai', 'el-samurai-oscuro': 'Der Dunkle Samurai',
  'el-robot': 'Der Roboter', 'el-cientifico': 'Der Wissenschaftler',
  'el-bombero': 'Der Feuerwehrmann', 'el-bombero-espacial': 'Der Weltraum-Feuerwehrmann',
  'el-mitico': 'Der Mythische', 'el-absoluto': 'Das Absolute',
  'nebulosa': 'Nebel', 'tormenta-suprema': 'Höchster Sturm', 'el-invocador': 'Der Beschwörer',
  'el-leviatan': 'Der Leviathan', 'el-fenix': 'Der Phönix',
  'el-senor-del-vacio': 'Der Herr des Nichts', 'el-dios-del-trueno': 'Der Donnergott',
  'el-dios-del-hielo': 'Der Eisgott', 'el-angel-oscuro': 'Der Dunkle Engel',
  'el-dragon-carmesi': 'Der Karmesindrache', 'el-ultimo-guerrero': 'Der Letzte Krieger',
});

const SKINS_IT = mkFrom(SKINS_EN, {
  'base-clasico': 'Base Classico', 'el-verde': 'Il Verde', 'el-rojo': 'Il Rosso',
  'el-azul': "L'Azzurro", 'el-amarillo': 'Il Giallo', 'gris-tormenta': 'Grigio Tempesta',
  'morado-pasion': 'Viola Passione', 'rosa-retro': 'Rosa Retrò',
  'naranja-llamarada': 'Arancio Fiamma', 'negro-carbon': 'Nero Carbone',
  'blanco-nieve': 'Bianco Neve', 'helado-de-vainilla': 'Gelato alla Vaniglia',
  'helado-de-fresa': 'Gelato alla Fragola', 'helado-de-chocolate': 'Gelato al Cioccolato',
  'el-vikingo': 'Il Vichingo', 'el-berserker-vikingo': 'Il Berserker Vichingo',
  'el-vampiro': 'Il Vampiro', 'el-esqueleto': 'Lo Scheletro',
  'el-ninja': 'Il Ninja', 'el-pirata': 'Il Pirata', 'el-bombero': 'Il Pompiere',
  'el-cocinero': 'Il Cuoco', 'el-panadero': 'Il Fornaio', 'el-gladiador': 'Il Gladiatore',
  'el-samurai': 'Il Samurai', 'el-campeon': 'Il Campione',
  'el-carpintero': 'Il Falegname', 'el-robot': 'Il Robot',
  'el-cientifico': 'Lo Scienziato', 'el-astronauta': "L'Astronauta",
  'el-mitico': 'Il Mitico', 'el-absoluto': "L'Assoluto",
  'nebulosa': 'Nebulosa', 'tormenta-suprema': 'Tempesta Suprema',
  'el-invocador': "L'Evocatore", 'el-leviatan': 'Il Leviatano',
  'el-fenix': 'La Fenice', 'el-senor-del-vacio': 'Il Signore del Vuoto',
  'el-dios-del-trueno': 'Il Dio del Tuono', 'el-dios-del-hielo': 'Il Dio del Ghiaccio',
  'el-angel-oscuro': "L'Angelo Oscuro", 'el-dragon-carmesi': 'Il Drago Cremisi',
  'el-ultimo-guerrero': "L'Ultimo Guerriero",
});

const SKINS_RU = mkFrom(SKINS_EN, {
  'base-clasico': 'Классика', 'el-verde': 'Зелёный', 'el-rojo': 'Красный',
  'el-azul': 'Синий', 'el-amarillo': 'Жёлтый', 'gris-tormenta': 'Штормовой Серый',
  'morado-pasion': 'Страстный Фиолетовый', 'rosa-retro': 'Ретро Розовый',
  'naranja-llamarada': 'Огненный Оранжевый', 'negro-carbon': 'Угольно Чёрный',
  'blanco-nieve': 'Снежно Белый', 'helado-de-vainilla': 'Ванильное Мороженое',
  'helado-de-fresa': 'Клубничное Мороженое', 'helado-de-chocolate': 'Шоколадное Мороженое',
  'el-vikingo': 'Викинг', 'el-ninja': 'Ниндзя', 'el-pirata': 'Пират',
  'el-vampiro': 'Вампир', 'el-samurai': 'Самурай', 'el-robot': 'Робот',
  'el-astronauta': 'Астронавт', 'el-bombero': 'Пожарный',
  'el-campeon': 'Чемпион', 'el-gladiador': 'Гладиатор',
  'el-mitico': 'Мифический', 'el-absoluto': 'Абсолют',
  'nebulosa': 'Туманность', 'tormenta-suprema': 'Верховный Шторм',
  'el-invocador': 'Призыватель', 'el-leviatan': 'Левиафан', 'el-fenix': 'Феникс',
  'el-senor-del-vacio': 'Повелитель Пустоты', 'el-dios-del-trueno': 'Бог Грома',
  'el-dios-del-hielo': 'Бог Льда', 'tanque-galactico': 'Галактический Танк',
  'tanque-nuclear': 'Ядерный Танк', 'tanque-apocalipsis': 'Танк Апокалипсиса',
  'el-angel-oscuro': 'Тёмный Ангел', 'el-dragon-carmesi': 'Алый Дракон',
  'el-berserker-vikingo': 'Берсерк Викинг', 'el-ultimo-guerrero': 'Последний Воин',
});

const SKINS_ZH = mkFrom(SKINS_EN, {
  'base-clasico': '经典基础', 'el-verde': '绿色坦克', 'el-rojo': '红色坦克',
  'el-azul': '蓝色坦克', 'el-amarillo': '黄色坦克', 'gris-tormenta': '风暴灰',
  'morado-pasion': '激情紫', 'rosa-retro': '复古粉', 'naranja-llamarada': '烈焰橙',
  'negro-carbon': '碳黑', 'blanco-nieve': '雪白', 'helado-de-vainilla': '香草冰淇淋',
  'helado-de-fresa': '草莓冰淇淋', 'helado-de-chocolate': '巧克力冰淇淋',
  'el-ninja': '忍者', 'el-pirata': '海盗', 'el-vikingo': '维京人',
  'el-samurai': '武士', 'el-vampiro': '吸血鬼', 'el-robot': '机器人',
  'el-astronauta': '宇航员', 'el-bombero': '消防员', 'el-gladiador': '角斗士',
  'el-campeon': '冠军', 'nebulosa': '星云', 'el-mitico': '神话级',
  'el-absoluto': '绝对', 'el-leviatan': '利维坦', 'el-fenix': '凤凰',
  'el-dios-del-trueno': '雷神', 'el-dios-del-hielo': '冰神',
  'el-senor-del-vacio': '虚空领主', 'tanque-galactico': '银河坦克',
  'tanque-nuclear': '核弹坦克', 'tanque-apocalipsis': '末日坦克',
  'el-angel-oscuro': '黑暗天使', 'el-dragon-carmesi': '绯红龙',
  'tormenta-suprema': '至高风暴', 'el-invocador': '召唤者', 'el-ultimo-guerrero': '最后战士',
});

const SKINS_JA = mkFrom(SKINS_EN, {
  'base-clasico': 'クラシック', 'el-verde': 'グリーン', 'el-rojo': 'レッド',
  'el-azul': 'ブルー', 'el-amarillo': 'イエロー', 'gris-tormenta': 'ストームグレー',
  'morado-pasion': 'パッションパープル', 'rosa-retro': 'レトロピンク',
  'naranja-llamarada': 'ブレイズオレンジ', 'negro-carbon': 'チャコールブラック',
  'blanco-nieve': 'スノーホワイト', 'helado-de-vainilla': 'バニラアイス',
  'helado-de-fresa': 'ストロベリーアイス', 'helado-de-chocolate': 'チョコアイス',
  'el-ninja': '忍者', 'el-pirata': '海賊', 'el-vikingo': 'バイキング',
  'el-samurai': '侍', 'el-vampiro': 'ヴァンパイア', 'el-robot': 'ロボット',
  'el-astronauta': '宇宙飛行士', 'el-gladiador': 'グラディエーター',
  'el-campeon': 'チャンピオン', 'nebulosa': '星雲', 'el-mitico': '神話級',
  'el-absoluto': '絶対', 'el-leviatan': 'リヴァイアサン', 'el-fenix': 'フェニックス',
  'el-dios-del-trueno': '雷神', 'el-dios-del-hielo': '氷神',
  'el-senor-del-vacio': '虚空の主', 'tanque-galactico': '銀河タンク',
  'tanque-nuclear': '核タンク', 'tanque-apocalipsis': '黙示録タンク',
  'el-angel-oscuro': '暗黒天使', 'el-dragon-carmesi': '深紅の龍',
  'tormenta-suprema': '究極の嵐', 'el-invocador': '召喚師', 'el-ultimo-guerrero': '最後の戦士',
});

const SKINS_AR = mkFrom(SKINS_EN, {
  'base-clasico': 'الكلاسيكي', 'el-verde': 'الأخضر', 'el-rojo': 'الأحمر',
  'el-azul': 'الأزرق', 'el-amarillo': 'الأصفر', 'gris-tormenta': 'الرمادي العاصف',
  'morado-pasion': 'البنفسجي الشغوف', 'rosa-retro': 'الوردي الكلاسيكي',
  'naranja-llamarada': 'البرتقالي المشتعل', 'negro-carbon': 'الأسود الفحمي',
  'blanco-nieve': 'الأبيض الثلجي', 'helado-de-vainilla': 'آيس كريم الفانيليا',
  'helado-de-fresa': 'آيس كريم الفراولة', 'helado-de-chocolate': 'آيس كريم الشوكولاتة',
  'el-ninja': 'النينجا', 'el-pirata': 'القرصان', 'el-vikingo': 'الفايكنج',
  'el-samurai': 'الساموراي', 'el-vampiro': 'مصاص الدماء', 'el-robot': 'الروبوت',
  'el-astronauta': 'رائد الفضاء', 'el-gladiador': 'المجالد', 'el-campeon': 'البطل',
  'nebulosa': 'السديم', 'el-mitico': 'الأسطوري', 'el-absoluto': 'المطلق',
  'el-leviatan': 'اللوياثان', 'el-fenix': 'العنقاء',
  'el-dios-del-trueno': 'إله الرعد', 'el-dios-del-hielo': 'إله الجليد',
  'el-senor-del-vacio': 'سيد الفراغ', 'tanque-galactico': 'الدبابة المجرية',
  'tanque-nuclear': 'الدبابة النووية', 'tanque-apocalipsis': 'دبابة نهاية العالم',
  'el-angel-oscuro': 'الملاك المظلم', 'el-dragon-carmesi': 'التنين القرمزي',
  'tormenta-suprema': 'العاصفة العظمى', 'el-invocador': 'الاستدعاء',
  'el-ultimo-guerrero': 'المحارب الأخير',
});

// ─── Arenas ────────────────────────────────────────────────────────────────────

const ARENAS_ES = {
  'lava-subterranea': 'Lava Subterránea', 'profundidades': 'Profundidades',
  'cienaga-toxica': 'Ciénaga Tóxica', 'desierto-nocturno': 'Desierto Nocturno',
  'glaciar': 'Glaciar', 'ceniza-volcanica': 'Ceniza Volcánica',
  'bosque-oscuro': 'Bosque Oscuro', 'cosmos': 'Cosmos',
  'metal-oxido': 'Metal Oxidado', 'neon-urbano': 'Neón Urbano',
  'cristales-oscuros': 'Cristales Oscuros', 'barro-trinchera': 'Barro de Trinchera',
  'tundra-helada': 'Tundra Helada', 'nebulosa': 'Nebulosa',
  'ruinas-antiguas': 'Ruinas Antiguas', 'metal-quemado': 'Metal Quemado',
  'caverna-humeda': 'Caverna Húmeda', 'sangre-dragon': 'Sangre de Dragón',
  'abismo-digital': 'Abismo Digital', 'arena-sangrienta': 'Arena Sangrienta',
};

const ARENAS_EN = {
  'lava-subterranea': 'Underground Lava', 'profundidades': 'The Depths',
  'cienaga-toxica': 'Toxic Swamp', 'desierto-nocturno': 'Night Desert',
  'glaciar': 'Glacier', 'ceniza-volcanica': 'Volcanic Ash',
  'bosque-oscuro': 'Dark Forest', 'cosmos': 'Cosmos',
  'metal-oxido': 'Rusted Metal', 'neon-urbano': 'Urban Neon',
  'cristales-oscuros': 'Dark Crystals', 'barro-trinchera': 'Trench Mud',
  'tundra-helada': 'Frozen Tundra', 'nebulosa': 'Nebula',
  'ruinas-antiguas': 'Ancient Ruins', 'metal-quemado': 'Burnt Metal',
  'caverna-humeda': 'Damp Cavern', 'sangre-dragon': 'Dragon Blood',
  'abismo-digital': 'Digital Abyss', 'arena-sangrienta': 'Bloody Arena',
};

const ARENAS_PT = mkFrom(ARENAS_EN, {
  'lava-subterranea': 'Lava Subterrânea', 'profundidades': 'Profundezas',
  'cienaga-toxica': 'Pântano Tóxico', 'desierto-nocturno': 'Deserto Noturno',
  'ceniza-volcanica': 'Cinzas Vulcânicas', 'bosque-oscuro': 'Floresta Sombria',
  'metal-oxido': 'Metal Enferrujado', 'cristales-oscuros': 'Cristais Sombrios',
  'barro-trinchera': 'Lama de Trincheira', 'tundra-helada': 'Tundra Congelada',
  'nebulosa': 'Nebulosa', 'ruinas-antiguas': 'Ruínas Antigas',
  'metal-quemado': 'Metal Queimado', 'caverna-humeda': 'Caverna Úmida',
  'sangre-dragon': 'Sangue de Dragão', 'arena-sangrienta': 'Arena Sangrenta',
});

const ARENAS_FR = mkFrom(ARENAS_EN, {
  'profundidades': 'Les Profondeurs', 'cienaga-toxica': 'Marais Toxique',
  'desierto-nocturno': 'Désert Nocturne', 'bosque-oscuro': 'Forêt Sombre',
  'nebulosa': 'Nébuleuse', 'ruinas-antiguas': 'Ruines Antiques',
  'sangre-dragon': 'Sang de Dragon', 'arena-sangrienta': 'Arène Sanglante',
  'tundra-helada': 'Toundra Gelée', 'caverna-humeda': 'Caverne Humide',
});

const ARENAS_DE = mkFrom(ARENAS_EN, {
  'cienaga-toxica': 'Giftsumpf', 'desierto-nocturno': 'Nachtwüste',
  'bosque-oscuro': 'Dunkler Wald', 'nebulosa': 'Nebel',
  'ruinas-antiguas': 'Alte Ruinen', 'sangre-dragon': 'Drachenblut',
  'arena-sangrienta': 'Blutige Arena', 'tundra-helada': 'Gefrorene Tundra',
  'caverna-humeda': 'Feuchte Höhle',
});

const ARENAS_IT = mkFrom(ARENAS_EN, {
  'profundidades': 'Profondità', 'cienaga-toxica': 'Palude Tossica',
  'bosque-oscuro': 'Foresta Oscura', 'nebulosa': 'Nebulosa',
  'ruinas-antiguas': 'Rovine Antiche', 'sangre-dragon': 'Sangue di Drago',
  'arena-sangrienta': 'Arena Insanguinata', 'tundra-helada': 'Tundra Gelata',
  'caverna-humeda': 'Caverna Umida',
});

const ARENAS_RU = mkFrom(ARENAS_EN, {
  'profundidades': 'Глубины', 'cienaga-toxica': 'Токсичное Болото',
  'bosque-oscuro': 'Тёмный Лес', 'nebulosa': 'Туманность',
  'ruinas-antiguas': 'Древние Руины', 'sangre-dragon': 'Кровь Дракона',
  'arena-sangrienta': 'Кровавая Арена', 'tundra-helada': 'Ледяная Тундра',
  'caverna-humeda': 'Влажная Пещера',
});

const ARENAS_ZH = mkFrom(ARENAS_EN, {
  'profundidades': '深渊', 'cienaga-toxica': '毒沼泽',
  'bosque-oscuro': '黑暗森林', 'nebulosa': '星云',
  'ruinas-antiguas': '远古遗迹', 'sangre-dragon': '龙血',
  'arena-sangrienta': '血腥竞技场', 'tundra-helada': '冻原',
  'caverna-humeda': '潮湿洞穴',
});

const ARENAS_JA = mkFrom(ARENAS_EN, {
  'profundidades': '深淵', 'cienaga-toxica': '毒の沼',
  'bosque-oscuro': '暗黒の森', 'nebulosa': '星雲',
  'ruinas-antiguas': '古代遺跡', 'sangre-dragon': 'ドラゴンの血',
  'arena-sangrienta': '血の闘技場', 'tundra-helada': '凍った凍土',
  'caverna-humeda': '湿った洞窟',
});

const ARENAS_AR = mkFrom(ARENAS_EN, {
  'profundidades': 'الأعماق', 'cienaga-toxica': 'المستنقع السام',
  'bosque-oscuro': 'الغابة المظلمة', 'nebulosa': 'السديم',
  'ruinas-antiguas': 'الأطلال القديمة', 'sangre-dragon': 'دم التنين',
  'arena-sangrienta': 'الساحة الدموية', 'tundra-helada': 'التندرا المتجمدة',
  'caverna-humeda': 'الكهف الرطب',
});

// ─── Update files ─────────────────────────────────────────────────────────────

const LANGS = ['es','en','pt','fr','de','it','ru','zh','ja','ar'];
const SKINS_MAP  = { es: SKINS_ES, en: SKINS_EN, pt: SKINS_PT, fr: SKINS_FR, de: SKINS_DE, it: SKINS_IT, ru: SKINS_RU, zh: SKINS_ZH, ja: SKINS_JA, ar: SKINS_AR };
const ARENAS_MAP = { es: ARENAS_ES, en: ARENAS_EN, pt: ARENAS_PT, fr: ARENAS_FR, de: ARENAS_DE, it: ARENAS_IT, ru: ARENAS_RU, zh: ARENAS_ZH, ja: ARENAS_JA, ar: ARENAS_AR };

for (const lang of LANGS) {
  const fp = path.join(I18N_DIR, lang + '.json');
  const json = JSON.parse(fs.readFileSync(fp, 'utf8'));
  json.skins  = SKINS_MAP[lang];
  json.arenas = ARENAS_MAP[lang];
  fs.writeFileSync(fp, JSON.stringify(json, null, 2) + '\n', 'utf8');
  const sc = Object.keys(json.skins).length;
  const ac = Object.keys(json.arenas).length;
  console.log(`Updated ${lang}.json — skins: ${sc}, arenas: ${ac}`);
}
console.log('Done!');
