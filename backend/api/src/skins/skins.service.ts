import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Character, CharacterRarity } from './entities/skin.entity';
import { UserCharacter } from './entities/user-skin.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { PlayerStats } from '../stats/entities/player-stats.entity';
import { EconomyService } from '../economy/economy.service';

type CharacterSeed = Omit<Character, 'id' | 'createdAt'>;

/* eslint-disable max-len */
const SEED: CharacterSeed[] = [
  // ── COMMON (40) ──────────────────────────────────────────────────────────────
  { slug: 'novato',              name: 'El Novato',              description: 'Agente recién llegado a la oscuridad. Linterna básica, determinación infinita.',                  rarity: 'common', bodyColor: '#4a6fa5', priceCoins: 0,     gemPrice: 0,   matchesUnlock: 0,    isDefault: true,  isAvailable: true, sortOrder: 1  },
  { slug: 'sombra-gris',         name: 'Sombra Gris',            description: 'Un espectro entre las sombras. Gris como el humo, igual de elusivo.',                             rarity: 'common', bodyColor: '#6b7280', priceCoins: 500,   gemPrice: 0,   matchesUnlock: 10,   isDefault: false, isAvailable: true, sortOrder: 2  },
  { slug: 'noctambulo',          name: 'El Noctámbulo',          description: 'Vive donde el sol nunca llega. Navega la oscuridad con confianza absoluta.',                       rarity: 'common', bodyColor: '#1e3a5f', priceCoins: 500,   gemPrice: 0,   matchesUnlock: 10,   isDefault: false, isAvailable: true, sortOrder: 3  },
  { slug: 'centinela',           name: 'El Centinela',           description: 'Guardia silencioso en la penumbra. Sus ojos ven lo que otros pasan por alto.',                    rarity: 'common', bodyColor: '#2d4a22', priceCoins: 500,   gemPrice: 0,   matchesUnlock: 15,   isDefault: false, isAvailable: true, sortOrder: 4  },
  { slug: 'acechador',           name: 'El Acechador',           description: 'Negro como la noche más profunda. Nadie sabe cuándo está cerca.',                                  rarity: 'common', bodyColor: '#1a1a1a', priceCoins: 500,   gemPrice: 0,   matchesUnlock: 15,   isDefault: false, isAvailable: true, sortOrder: 5  },
  { slug: 'linternero',          name: 'El Linternero',          description: 'Su linterna es su espada. Dorado apagado, iluminador de secretos.',                                rarity: 'common', bodyColor: '#b8860b', priceCoins: 800,   gemPrice: 0,   matchesUnlock: 20,   isDefault: false, isAvailable: true, sortOrder: 6  },
  { slug: 'vagabundo',           name: 'El Vagabundo',           description: 'Errante sin hogar entre las sombras. Conoce cada rincón oscuro.',                                  rarity: 'common', bodyColor: '#8b4513', priceCoins: 800,   gemPrice: 0,   matchesUnlock: 20,   isDefault: false, isAvailable: true, sortOrder: 7  },
  { slug: 'silencioso',          name: 'El Silencioso',          description: 'Sus pasos no hacen sonido. Azul violáceo como medianoche callada.',                                rarity: 'common', bodyColor: '#4a4a6a', priceCoins: 800,   gemPrice: 0,   matchesUnlock: 25,   isDefault: false, isAvailable: true, sortOrder: 8  },
  { slug: 'rastreador',          name: 'El Rastreador',          description: 'Sigue rastros invisibles en la oscuridad. Morado oscuro, instintos agudos.',                       rarity: 'common', bodyColor: '#5c4d7d', priceCoins: 800,   gemPrice: 0,   matchesUnlock: 25,   isDefault: false, isAvailable: true, sortOrder: 9  },
  { slug: 'explorador',          name: 'El Explorador',          description: 'Cartógrafo de zonas prohibidas. Verde selva, siempre avanzando.',                                  rarity: 'common', bodyColor: '#2e7d32', priceCoins: 1000,  gemPrice: 0,   matchesUnlock: 30,   isDefault: false, isAvailable: true, sortOrder: 10 },
  { slug: 'vigilante',           name: 'El Vigilante',           description: 'Ojo que todo lo observa en la penumbra. Gris acero impenetrable.',                                 rarity: 'common', bodyColor: '#37474f', priceCoins: 1000,  gemPrice: 0,   matchesUnlock: 30,   isDefault: false, isAvailable: true, sortOrder: 11 },
  { slug: 'fugitivo',            name: 'El Fugitivo',            description: 'Siempre en movimiento, nunca atrapado. Rojo intenso de alguien que sobrevive.',                   rarity: 'common', bodyColor: '#c0392b', priceCoins: 1000,  gemPrice: 0,   matchesUnlock: 35,   isDefault: false, isAvailable: true, sortOrder: 12 },
  { slug: 'intruso',             name: 'El Intruso',             description: 'Se cuela por donde nadie puede. Azul nocturno profundo.',                                          rarity: 'common', bodyColor: '#283593', priceCoins: 1000,  gemPrice: 0,   matchesUnlock: 35,   isDefault: false, isAvailable: true, sortOrder: 13 },
  { slug: 'perdido',             name: 'El Perdido',             description: 'Desorientado pero peligroso. Marrón tierra de quien no tiene nada que perder.',                   rarity: 'common', bodyColor: '#795548', priceCoins: 1200,  gemPrice: 0,   matchesUnlock: 40,   isDefault: false, isAvailable: true, sortOrder: 14 },
  { slug: 'umbral',              name: 'El Umbral',              description: 'Existe entre la luz y la oscuridad. Gris-azul de frontera perpetua.',                              rarity: 'common', bodyColor: '#455a64', priceCoins: 1200,  gemPrice: 0,   matchesUnlock: 40,   isDefault: false, isAvailable: true, sortOrder: 15 },
  { slug: 'niebla',              name: 'La Niebla',              description: 'Se disuelve en el ambiente oscuro. Gris pálido como niebla matinal.',                              rarity: 'common', bodyColor: '#90a4ae', priceCoins: 1200,  gemPrice: 0,   matchesUnlock: 45,   isDefault: false, isAvailable: true, sortOrder: 16 },
  { slug: 'susurro',             name: 'El Susurro',             description: 'Su voz es solo un eco en la oscuridad. Marrón oscuro de secretos.',                                rarity: 'common', bodyColor: '#5d4037', priceCoins: 1500,  gemPrice: 0,   matchesUnlock: 50,   isDefault: false, isAvailable: true, sortOrder: 17 },
  { slug: 'testigo',             name: 'El Testigo',             description: 'Ha visto demasiado. Azul marino de quien carga con la verdad.',                                    rarity: 'common', bodyColor: '#1565c0', priceCoins: 1500,  gemPrice: 0,   matchesUnlock: 50,   isDefault: false, isAvailable: true, sortOrder: 18 },
  { slug: 'errante',             name: 'El Errante',             description: 'Sin destino fijo en la arena oscura. Verde oliva de superviviente.',                               rarity: 'common', bodyColor: '#558b2f', priceCoins: 1500,  gemPrice: 0,   matchesUnlock: 55,   isDefault: false, isAvailable: true, sortOrder: 19 },
  { slug: 'penumbra',            name: 'La Penumbra',            description: 'Mora en la semioscuridad eterna. Morado profundo de misterio.',                                    rarity: 'common', bodyColor: '#6a1b9a', priceCoins: 1500,  gemPrice: 0,   matchesUnlock: 55,   isDefault: false, isAvailable: true, sortOrder: 20 },
  { slug: 'cazador',             name: 'El Cazador',             description: 'Persigue el rastro de la bandera sin descanso. Naranja tostado ardiente.',                         rarity: 'common', bodyColor: '#bf360c', priceCoins: 1800,  gemPrice: 0,   matchesUnlock: 60,   isDefault: false, isAvailable: true, sortOrder: 21 },
  { slug: 'anonimo',             name: 'El Anónimo',             description: 'Sin nombre, sin rostro. Gris oscuro de identidad borrada.',                                        rarity: 'common', bodyColor: '#424242', priceCoins: 1800,  gemPrice: 0,   matchesUnlock: 65,   isDefault: false, isAvailable: true, sortOrder: 22 },
  { slug: 'reflejo',             name: 'El Reflejo',             description: 'Una ilusión de luz en la oscuridad. Verde-azul de espejo roto.',                                   rarity: 'common', bodyColor: '#80cbc4', priceCoins: 1800,  gemPrice: 0,   matchesUnlock: 65,   isDefault: false, isAvailable: true, sortOrder: 23 },
  { slug: 'escondido',           name: 'El Escondido',           description: 'Maestro del ocultamiento en sombras. Verde oscuro casi invisible.',                                rarity: 'common', bodyColor: '#33691e', priceCoins: 1800,  gemPrice: 0,   matchesUnlock: 70,   isDefault: false, isAvailable: true, sortOrder: 24 },
  { slug: 'infiltrado',          name: 'El Infiltrado',          description: 'Ya está adentro antes de que lo notes. Gris carbón de operativo.',                                 rarity: 'common', bodyColor: '#263238', priceCoins: 2000,  gemPrice: 0,   matchesUnlock: 75,   isDefault: false, isAvailable: true, sortOrder: 25 },
  { slug: 'brecha',              name: 'La Brecha',              description: 'La apertura en la oscuridad que todos buscan. Carmesí de acceso.',                                  rarity: 'common', bodyColor: '#880e4f', priceCoins: 2000,  gemPrice: 0,   matchesUnlock: 80,   isDefault: false, isAvailable: true, sortOrder: 26 },
  { slug: 'viajero-nocturno',    name: 'Viajero Nocturno',       description: 'Cruza la arena de noche en noche. Azul índigo de aventurero perpetuo.',                            rarity: 'common', bodyColor: '#1a237e', priceCoins: 2000,  gemPrice: 0,   matchesUnlock: 85,   isDefault: false, isAvailable: true, sortOrder: 27 },
  { slug: 'observador',          name: 'El Observador',          description: 'Todo lo registra sin intervenir. Marrón cálido de archivista.',                                    rarity: 'common', bodyColor: '#4e342e', priceCoins: 2000,  gemPrice: 0,   matchesUnlock: 90,   isDefault: false, isAvailable: true, sortOrder: 28 },
  { slug: 'acosador',            name: 'El Acosador',            description: 'Sigue a su presa en la oscuridad sin rendirse. Verde abismal.',                                    rarity: 'common', bodyColor: '#004d40', priceCoins: 2000,  gemPrice: 0,   matchesUnlock: 95,   isDefault: false, isAvailable: true, sortOrder: 29 },
  { slug: 'tinieblas',           name: 'Las Tinieblas',          description: 'Encarna la oscuridad misma. Negro casi absoluto, el vacío vivo.',                                  rarity: 'common', bodyColor: '#0d0d0d', priceCoins: 2000,  gemPrice: 0,   matchesUnlock: 100,  isDefault: false, isAvailable: true, sortOrder: 30 },
  { slug: 'mascara-roja',        name: 'Máscara Roja',           description: 'Identidad oculta tras una máscara de peligro. Rojo alarma.',                                       rarity: 'common', bodyColor: '#d32f2f', priceCoins: 2200,  gemPrice: 0,   matchesUnlock: null, isDefault: false, isAvailable: true, sortOrder: 31 },
  { slug: 'eco',                 name: 'El Eco',                 description: 'Solo escucha ecos en la oscuridad. Gris azulado de resonancia.',                                   rarity: 'common', bodyColor: '#607d8b', priceCoins: 2200,  gemPrice: 0,   matchesUnlock: null, isDefault: false, isAvailable: true, sortOrder: 32 },
  { slug: 'murmullo',            name: 'El Murmullo',            description: 'Mensaje que se pierde en la oscuridad. Morado suave de misterio.',                                 rarity: 'common', bodyColor: '#7b1fa2', priceCoins: 2200,  gemPrice: 0,   matchesUnlock: null, isDefault: false, isAvailable: true, sortOrder: 33 },
  { slug: 'fosforito',           name: 'Fosforito',              description: 'Brilla en la oscuridad como radiación. Lima fosforescente peligroso.',                             rarity: 'common', bodyColor: '#cddc39', priceCoins: 2200,  gemPrice: 0,   matchesUnlock: null, isDefault: false, isAvailable: true, sortOrder: 34 },
  { slug: 'eco-azul',            name: 'Eco Azul',               description: 'Azul brillante que reverbera en la arena. Cian de eco lejano.',                                   rarity: 'common', bodyColor: '#0288d1', priceCoins: 2500,  gemPrice: 0,   matchesUnlock: null, isDefault: false, isAvailable: true, sortOrder: 35 },
  { slug: 'polilla',             name: 'La Polilla',             description: 'Atraída por la luz de la bandera, imposible de ignorar. Beige blanquecino.',                       rarity: 'common', bodyColor: '#d7ccc8', priceCoins: 2500,  gemPrice: 0,   matchesUnlock: null, isDefault: false, isAvailable: true, sortOrder: 36 },
  { slug: 'vela',                name: 'La Vela',                description: 'Pequeña luz contra la oscuridad infinita. Amarillo cálido de flama tenue.',                        rarity: 'common', bodyColor: '#fff176', priceCoins: 2500,  gemPrice: 0,   matchesUnlock: null, isDefault: false, isAvailable: true, sortOrder: 37 },
  { slug: 'cuervo',              name: 'El Cuervo',              description: 'Negro ominoso de mal presagio. Mensajero de la arena oscura.',                                     rarity: 'common', bodyColor: '#212121', priceCoins: 2500,  gemPrice: 0,   matchesUnlock: null, isDefault: false, isAvailable: true, sortOrder: 38 },
  { slug: 'luna-menguante',      name: 'Luna Menguante',         description: 'Pálido como la luna en su último cuarto. Naranja blancuzco celestial.',                            rarity: 'common', bodyColor: '#ffe0b2', priceCoins: 2500,  gemPrice: 0,   matchesUnlock: null, isDefault: false, isAvailable: true, sortOrder: 39 },
  { slug: 'sombra-esmeralda',    name: 'Sombra Esmeralda',       description: 'Verde profundo de jungla nocturna. Misterioso como la naturaleza misma.',                          rarity: 'common', bodyColor: '#1b5e20', priceCoins: 2800,  gemPrice: 0,   matchesUnlock: null, isDefault: false, isAvailable: true, sortOrder: 40 },

  // ── RARE (30) ─────────────────────────────────────────────────────────────────
  { slug: 'recluso',             name: 'El Recluso',             description: 'Aislado en su propia oscuridad. Azul oscuro de soledad elegida.',                                  rarity: 'rare', bodyColor: '#0d47a1', priceCoins: 3000,  gemPrice: 0, matchesUnlock: 120, isDefault: false, isAvailable: true, sortOrder: 41 },
  { slug: 'espectro',            name: 'El Espectro',            description: 'Ni vivo ni muerto, solo presente en la sombra. Gris plateado etéreo.',                             rarity: 'rare', bodyColor: '#b0bec5', priceCoins: 3000,  gemPrice: 0, matchesUnlock: 130, isDefault: false, isAvailable: true, sortOrder: 42 },
  { slug: 'destello',            name: 'El Destello',            description: 'Aparece y desaparece como un flash. Ámbar dorado de destello.',                                    rarity: 'rare', bodyColor: '#f9a825', priceCoins: 3000,  gemPrice: 0, matchesUnlock: 130, isDefault: false, isAvailable: true, sortOrder: 43 },
  { slug: 'emboscada',           name: 'La Emboscada',           description: 'Siempre donde no la esperan. Verde militar de ataque sorpresa.',                                   rarity: 'rare', bodyColor: '#2e7d32', priceCoins: 3500,  gemPrice: 0, matchesUnlock: 140, isDefault: false, isAvailable: true, sortOrder: 44 },
  { slug: 'tormenta-arena',      name: 'Tormenta de Arena',      description: 'Azota la arena dejando rastro de caos. Marrón arenoso tormenta.',                                  rarity: 'rare', bodyColor: '#8d6e63', priceCoins: 3500,  gemPrice: 0, matchesUnlock: 150, isDefault: false, isAvailable: true, sortOrder: 45 },
  { slug: 'voraz',               name: 'El Voraz',               description: 'Devora oportunidades en la oscuridad. Rojo apasionado insaciable.',                                rarity: 'rare', bodyColor: '#e53935', priceCoins: 4000,  gemPrice: 0, matchesUnlock: 160, isDefault: false, isAvailable: true, sortOrder: 46 },
  { slug: 'corsario',            name: 'El Corsario',            description: 'Saquea sin piedad en la oscuridad. Azul profundo de mar nocturno.',                                rarity: 'rare', bodyColor: '#1565c0', priceCoins: 4000,  gemPrice: 0, matchesUnlock: 165, isDefault: false, isAvailable: true, sortOrder: 47 },
  { slug: 'alquimista',          name: 'El Alquimista',          description: 'Transforma la oscuridad en ventaja. Morado alquímico de transformación.',                          rarity: 'rare', bodyColor: '#6a1b9a', priceCoins: 4000,  gemPrice: 0, matchesUnlock: 170, isDefault: false, isAvailable: true, sortOrder: 48 },
  { slug: 'mercenario',          name: 'El Mercenario',          description: 'Su lealtad es al mejor postor. Gris acero de profesionalismo frío.',                               rarity: 'rare', bodyColor: '#546e7a', priceCoins: 4500,  gemPrice: 0, matchesUnlock: 175, isDefault: false, isAvailable: true, sortOrder: 49 },
  { slug: 'cazarrecompensas',    name: 'Cazarrecompensas',       description: 'Sigue el rastro de la bandera hasta el fin. Dorado bronceado de caza.',                            rarity: 'rare', bodyColor: '#bf6f00', priceCoins: 4500,  gemPrice: 0, matchesUnlock: 180, isDefault: false, isAvailable: true, sortOrder: 50 },
  { slug: 'asesino-sombra',      name: 'Asesino de Sombra',      description: 'Uno con la oscuridad. Negro absoluto de maestro del sigilo.',                                      rarity: 'rare', bodyColor: '#212121', priceCoins: 4500,  gemPrice: 0, matchesUnlock: 185, isDefault: false, isAvailable: true, sortOrder: 51 },
  { slug: 'saboteador',          name: 'El Saboteador',          description: 'Frustra planes en la penumbra. Naranja alerta de disrupción.',                                     rarity: 'rare', bodyColor: '#f57f17', priceCoins: 4500,  gemPrice: 0, matchesUnlock: 185, isDefault: false, isAvailable: true, sortOrder: 52 },
  { slug: 'pionero-oscuro',      name: 'Pionero Oscuro',         description: 'Explora lo inexplorado en la noche. Verde selva de frontera.',                                     rarity: 'rare', bodyColor: '#1b5e20', priceCoins: 7500,  gemPrice: 0, matchesUnlock: 200, isDefault: false, isAvailable: true, sortOrder: 53 },
  { slug: 'escolta',             name: 'El Escolta',             description: 'Protege la bandera sin importar el costo. Azul guardia de honor.',                                 rarity: 'rare', bodyColor: '#0277bd', priceCoins: 7500,  gemPrice: 0, matchesUnlock: 205, isDefault: false, isAvailable: true, sortOrder: 54 },
  { slug: 'profeta-oscuro',      name: 'Profeta Oscuro',         description: 'Ve el futuro en la oscuridad presente. Morado oscuro de visión.',                                  rarity: 'rare', bodyColor: '#4a148c', priceCoins: 7500,  gemPrice: 0, matchesUnlock: 210, isDefault: false, isAvailable: true, sortOrder: 55 },
  { slug: 'demonio-silente',     name: 'Demonio Silente',        description: 'El mal más peligroso es el que no hace ruido. Rojo sangre sigiloso.',                              rarity: 'rare', bodyColor: '#b71c1c', priceCoins: 7500,  gemPrice: 0, matchesUnlock: 215, isDefault: false, isAvailable: true, sortOrder: 56 },
  { slug: 'vigia',               name: 'El Vigía',               description: 'Atalayas en la oscuridad, nada escapa. Verde oscuro de observación.',                              rarity: 'rare', bodyColor: '#00695c', priceCoins: 8250,  gemPrice: 0, matchesUnlock: 220, isDefault: false, isAvailable: true, sortOrder: 57 },
  { slug: 'mente-colmena',       name: 'Mente Colmena',          description: 'Procesa la oscuridad como un enjambre. Naranja ardiente de inteligencia colectiva.',               rarity: 'rare', bodyColor: '#e65100', priceCoins: 8250,  gemPrice: 0, matchesUnlock: 225, isDefault: false, isAvailable: true, sortOrder: 58 },
  { slug: 'orador',              name: 'El Orador',              description: 'Sus palabras resuenan en el vacío oscuro. Gris oscuro de autoridad.',                              rarity: 'rare', bodyColor: '#37474f', priceCoins: 8250,  gemPrice: 0, matchesUnlock: 230, isDefault: false, isAvailable: true, sortOrder: 59 },
  { slug: 'depredador',          name: 'El Depredador',          description: 'En lo alto de la cadena alimentaria nocturna. Marrón oscuro de bestia.',                           rarity: 'rare', bodyColor: '#4e342e', priceCoins: 9000,  gemPrice: 0, matchesUnlock: 240, isDefault: false, isAvailable: true, sortOrder: 60 },
  { slug: 'heraldo',             name: 'El Heraldo',             description: 'Anuncia el caos antes de que llegue. Azul índigo de proclamación.',                                rarity: 'rare', bodyColor: '#1a237e', priceCoins: 9000,  gemPrice: 0, matchesUnlock: 250, isDefault: false, isAvailable: true, sortOrder: 61 },
  { slug: 'forjador',            name: 'El Forjador',            description: 'Da forma a la oscuridad con voluntad. Marrón ferroso de creación.',                                rarity: 'rare', bodyColor: '#5d4037', priceCoins: 9000,  gemPrice: 0, matchesUnlock: 255, isDefault: false, isAvailable: true, sortOrder: 62 },
  { slug: 'nomada',              name: 'El Nómada',              description: 'Sin base fija, la arena es su hogar. Arena rojiza de viajero perpetuo.',                           rarity: 'rare', bodyColor: '#8d6e63', priceCoins: 9750,  gemPrice: 0, matchesUnlock: 265, isDefault: false, isAvailable: true, sortOrder: 63 },
  { slug: 'encapuchado',         name: 'El Encapuchado',         description: 'Rostro oculto, intenciones inciertas. Gris carbón de anonimato.',                                  rarity: 'rare', bodyColor: '#263238', priceCoins: 9750,  gemPrice: 0, matchesUnlock: 270, isDefault: false, isAvailable: true, sortOrder: 64 },
  { slug: 'exiliado',            name: 'El Exiliado',            description: 'Desterrado al corazón de la oscuridad. Carmesí de proscrito.',                                     rarity: 'rare', bodyColor: '#880e4f', priceCoins: 9750,  gemPrice: 0, matchesUnlock: 275, isDefault: false, isAvailable: true, sortOrder: 65 },
  { slug: 'jinete-nocturno',     name: 'Jinete Nocturno',        description: 'Galopa por la oscuridad sin freno. Índigo profundo de velocidad.',                                 rarity: 'rare', bodyColor: '#311b92', priceCoins: 10500, gemPrice: 0, matchesUnlock: 280, isDefault: false, isAvailable: true, sortOrder: 66 },
  { slug: 'susurrador',          name: 'El Susurrador',          description: 'Comunica secretos que la oscuridad no debería revelar. Verde abismal.',                            rarity: 'rare', bodyColor: '#004d40', priceCoins: 10500, gemPrice: 0, matchesUnlock: 290, isDefault: false, isAvailable: true, sortOrder: 67 },
  { slug: 'escorpion-negro',     name: 'Escorpión Negro',        description: 'Aguijón letal en la oscuridad profunda. Negro venenoso de amenaza.',                               rarity: 'rare', bodyColor: '#1c1c1c', priceCoins: 10500, gemPrice: 0, matchesUnlock: 300, isDefault: false, isAvailable: true, sortOrder: 68 },
  { slug: 'luz-rota',            name: 'Luz Rota',               description: 'Fragmentos de luz que no iluminan del todo. Amarillo cálido de linterna fallida.',                 rarity: 'rare', bodyColor: '#fdd835', priceCoins: 10500, gemPrice: 0, matchesUnlock: 320, isDefault: false, isAvailable: true, sortOrder: 69 },
  { slug: 'corriente-oscura',    name: 'Corriente Oscura',       description: 'Fluye entre sombras sin resistencia. Cian oscuro de río nocturno.',                                rarity: 'rare', bodyColor: '#006064', priceCoins: 10500, gemPrice: 0, matchesUnlock: 340, isDefault: false, isAvailable: true, sortOrder: 70 },

  // ── EPIC (20) ─────────────────────────────────────────────────────────────────
  { slug: 'cazador-almas',       name: 'Cazador de Almas',       description: 'Colecta presencias en la oscuridad eterna. Morado de cazador sobrenatural.',                       rarity: 'epic', bodyColor: '#4a148c', priceCoins: 12000, gemPrice: 0, matchesUnlock: 400, isDefault: false, isAvailable: true, sortOrder: 71 },
  { slug: 'guardia-caido',       name: 'Guardia Caído',          description: 'Protector corrompido por la oscuridad. Gris acero de lealtad quebrada.',                           rarity: 'epic', bodyColor: '#37474f', priceCoins: 13500, gemPrice: 0, matchesUnlock: 420, isDefault: false, isAvailable: true, sortOrder: 72 },
  { slug: 'senor-tinieblas',     name: 'Señor de Tinieblas',     description: 'Gobierna desde la oscuridad absoluta. Morado negro de dominio supremo.',                           rarity: 'epic', bodyColor: '#1a0533', priceCoins: 13500, gemPrice: 0, matchesUnlock: 440, isDefault: false, isAvailable: true, sortOrder: 73 },
  { slug: 'sombra-viviente',     name: 'Sombra Viviente',        description: 'Una sombra que tomó vida propia. Negro vivo de pesadilla real.',                                   rarity: 'epic', bodyColor: '#212121', priceCoins: 15000, gemPrice: 0, matchesUnlock: 460, isDefault: false, isAvailable: true, sortOrder: 74 },
  { slug: 'ejecutor',            name: 'El Ejecutor',            description: 'Cumple órdenes sin cuestionar en la oscuridad. Rojo decisivo de acción.',                          rarity: 'epic', bodyColor: '#b71c1c', priceCoins: 15000, gemPrice: 0, matchesUnlock: 480, isDefault: false, isAvailable: true, sortOrder: 75 },
  { slug: 'centinela-eterno',    name: 'Centinela Eterno',       description: 'Vigila la arena por toda la eternidad. Azul profundo de deber eterno.',                            rarity: 'epic', bodyColor: '#0d47a1', priceCoins: 15000, gemPrice: 0, matchesUnlock: 500, isDefault: false, isAvailable: true, sortOrder: 76 },
  { slug: 'gearhead',            name: 'Gearhead',               description: 'Robot steampunk de cobre y vapor victoriano. Engranajes giran con cada paso en la oscuridad.',     rarity: 'epic', bodyColor: '#bf7a28', priceCoins: 20000, gemPrice: 0, matchesUnlock: 520, isDefault: false, isAvailable: true, sortOrder: 77 },
  { slug: 'mente-oscura',        name: 'Mente Oscura',           description: 'Inteligencia que procesa la oscuridad como datos. Verde esmeralda de cálculo frío.',               rarity: 'epic', bodyColor: '#00897b', priceCoins: 22000, gemPrice: 0, matchesUnlock: 540, isDefault: false, isAvailable: true, sortOrder: 78 },
  { slug: 'portador-caos',       name: 'Portador del Caos',      description: 'Donde aparece, el orden se derrumba. Rojo caos de destrucción activa.',                            rarity: 'epic', bodyColor: '#e53935', priceCoins: 22000, gemPrice: 0, matchesUnlock: 560, isDefault: false, isAvailable: true, sortOrder: 79 },
  { slug: 'silencio-eterno',     name: 'Silencio Eterno',        description: 'Blanco que absorbe todo sonido en la oscuridad. Silencio hecho figura.',                           rarity: 'epic', bodyColor: '#eceff1', priceCoins: 22000, gemPrice: 0, matchesUnlock: 580, isDefault: false, isAvailable: true, sortOrder: 80 },
  { slug: 'angel-negro',         name: 'Ángel Negro',            description: 'Caído del cielo a la oscuridad eterna. Negro de alas quebradas.',                                  rarity: 'epic', bodyColor: '#0d0d0d', priceCoins: 24000, gemPrice: 0, matchesUnlock: 600, isDefault: false, isAvailable: true, sortOrder: 81 },
  { slug: 'volatil',             name: 'El Volátil',             description: 'Impredecible en la arena oscura. Naranja explosivo de inestabilidad pura.',                        rarity: 'epic', bodyColor: '#ff6d00', priceCoins: 24000, gemPrice: 0, matchesUnlock: 620, isDefault: false, isAvailable: true, sortOrder: 82 },
  { slug: 'guardian-reliquias',  name: 'Guardián de Reliquias',  description: 'Protege artefactos sagrados en la oscuridad. Dorado antiguo de custodia.',                         rarity: 'epic', bodyColor: '#d4ac0d', priceCoins: 24000, gemPrice: 0, matchesUnlock: 640, isDefault: false, isAvailable: true, sortOrder: 83 },
  { slug: 'hijo-sombras',        name: 'Hijo de las Sombras',    description: 'Nació y creció en la oscuridad total. Marrón noche de origen primigenio.',                         rarity: 'epic', bodyColor: '#3e2723', priceCoins: 26000, gemPrice: 0, matchesUnlock: 660, isDefault: false, isAvailable: true, sortOrder: 84 },
  { slug: 'espectro-violeta',    name: 'Espectro Violeta',       description: 'Fantasma de morado intenso entre las sombras. Violeta sobrenatural.',                              rarity: 'epic', bodyColor: '#7b1fa2', priceCoins: 26000, gemPrice: 0, matchesUnlock: 680, isDefault: false, isAvailable: true, sortOrder: 85 },
  { slug: 'tormenta-profunda',   name: 'Tormenta Profunda',      description: 'Devastación silenciosa en las profundidades oscuras. Azul tormenta submarina.',                    rarity: 'epic', bodyColor: '#1565c0', priceCoins: 28000, gemPrice: 0, matchesUnlock: 700, isDefault: false, isAvailable: true, sortOrder: 86 },
  { slug: 'sombra-dorada',       name: 'Sombra Dorada',          description: 'Irónico: una sombra brillante. Dorado oscuro de paradoja luminosa.',                               rarity: 'epic', bodyColor: '#f9a825', priceCoins: 28000, gemPrice: 0, matchesUnlock: 720, isDefault: false, isAvailable: true, sortOrder: 87 },
  { slug: 'ultimo-linternero',   name: 'Último Linternero',      description: 'El último portador de luz en la arena sin fin. Verde esperanza final.',                            rarity: 'epic', bodyColor: '#4caf50', priceCoins: 28000, gemPrice: 0, matchesUnlock: 750, isDefault: false, isAvailable: true, sortOrder: 88 },
  { slug: 'abismo-caminante',    name: 'Abismo Caminante',       description: 'Camina por el fondo del abismo oscuro. Azul marino de profundidad total.',                         rarity: 'epic', bodyColor: '#001f3f', priceCoins: 30000, gemPrice: 0, matchesUnlock: 800, isDefault: false, isAvailable: true, sortOrder: 89 },
  { slug: 'portavoz-oscuridad',  name: 'Portavoz de Oscuridad',  description: 'Voz de la oscuridad misma en la arena. Verde negro de dominio absoluto.',                          rarity: 'epic', bodyColor: '#1b2e1b', priceCoins: 30000, gemPrice: 0, matchesUnlock: 850, isDefault: false, isAvailable: true, sortOrder: 90 },

  // ── LEGENDARY (10) ────────────────────────────────────────────────────────────
  { slug: 'dios-linterna',       name: 'Dios Linterna',          description: 'La luz más poderosa en la arena más oscura. Dorado radiante de deidad luminosa.',                  rarity: 'legendary', bodyColor: '#ffd600', priceCoins: 0, gemPrice: 150, matchesUnlock: 2000, isDefault: false, isAvailable: true, sortOrder: 91  },
  { slug: 'devorador-luz',       name: 'Devorador de Luz',       description: 'Consume toda luz a su paso. Morado abismal de hambre eterna.',                                     rarity: 'legendary', bodyColor: '#1a0533', priceCoins: 0, gemPrice: 150, matchesUnlock: 2000, isDefault: false, isAvailable: true, sortOrder: 92  },
  { slug: 'senor-banderas',      name: 'Señor de Banderas',      description: 'Nacido para capturar. Rojo sangre de campeonato eterno.',                                          rarity: 'legendary', bodyColor: '#b71c1c', priceCoins: 0, gemPrice: 200, matchesUnlock: 2500, isDefault: false, isAvailable: true, sortOrder: 93  },
  { slug: 'tiempo-oscuro',       name: 'Tiempo Oscuro',          description: 'Antiguo como la oscuridad misma. Gris obsidiana de eons de noche.',                                rarity: 'legendary', bodyColor: '#263238', priceCoins: 0, gemPrice: 200, matchesUnlock: 2500, isDefault: false, isAvailable: true, sortOrder: 94  },
  { slug: 'maestro-sombras',     name: 'Maestro de Sombras',     description: 'Control absoluto sobre la oscuridad. Negro cosmos de poder supremo.',                              rarity: 'legendary', bodyColor: '#0a0a1f', priceCoins: 0, gemPrice: 200, matchesUnlock: 2500, isDefault: false, isAvailable: true, sortOrder: 95  },
  { slug: 'phantom',             name: 'Phantom',                description: 'Entidad spectral oscura con orbe cian. Capa navy profundo, presencia que paraliza la voluntad.',   rarity: 'legendary', bodyColor: '#1a1a2e', priceCoins: 0, gemPrice: 250, matchesUnlock: 3000, isDefault: false, isAvailable: true, sortOrder: 96  },
  { slug: 'fragmento-destino',   name: 'Fragmento del Destino',  description: 'Un trozo del universo en la arena oscura. Morado cósmico de inevitabilidad.',                      rarity: 'legendary', bodyColor: '#6a1b9a', priceCoins: 0, gemPrice: 250, matchesUnlock: 3000, isDefault: false, isAvailable: true, sortOrder: 97  },
  { slug: 'primer-portador',     name: 'Primer Portador',        description: 'El primero que cargó la bandera en el origen. Dorado ancestral de leyenda.',                       rarity: 'legendary', bodyColor: '#d4ac0d', priceCoins: 0, gemPrice: 300, matchesUnlock: 3500, isDefault: false, isAvailable: true, sortOrder: 98  },
  { slug: 'abismo-total',        name: 'El Abismo Total',        description: 'La oscuridad perfecta personificada. Negro absoluto de vacío completo.',                           rarity: 'legendary', bodyColor: '#000000', priceCoins: 0, gemPrice: 400, matchesUnlock: 4500, isDefault: false, isAvailable: true, sortOrder: 99  },
  { slug: 'leyenda-viva',        name: 'La Leyenda Viva',        description: 'Inmortalizado en la historia de la arena. Morado ultravioleta de mito viviente.',                  rarity: 'legendary', bodyColor: '#7c4dff', priceCoins: 0, gemPrice: 500, matchesUnlock: 5000, isDefault: false, isAvailable: true, sortOrder: 100 },
];
/* eslint-enable max-len */

export interface CharacterProgressionDto {
  gamesPlayed: number;
  nextFreeCharacter: {
    id: string;
    name: string;
    rarity: CharacterRarity;
    bodyColor: string;
    matchesUnlock: number;
    progressPercent: number;
  } | null;
  claimableCharacters: Array<{ id: string; name: string; rarity: CharacterRarity; bodyColor: string }>;
}

@Injectable()
export class SkinsService implements OnModuleInit {
  constructor(
    @InjectRepository(Character) private readonly charRepo: Repository<Character>,
    @InjectRepository(UserCharacter) private readonly userCharRepo: Repository<UserCharacter>,
    @InjectRepository(UserProfile) private readonly profileRepo: Repository<UserProfile>,
    @InjectRepository(PlayerStats) private readonly statsRepo: Repository<PlayerStats>,
    private readonly economy: EconomyService,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.charRepo.count();
    if (count < 100) {
      await this.charRepo.clear();
      await this.charRepo.save(SEED.map(s => this.charRepo.create(s)));
    } else {
      for (const s of SEED) {
        await this.charRepo.update({ sortOrder: s.sortOrder }, { priceCoins: s.priceCoins, gemPrice: s.gemPrice });
      }
    }
  }

  // ─── Catalog ──────────────────────────────────────────────────────────────

  async listCharacters(rarity?: CharacterRarity): Promise<Character[]> {
    const qb = this.charRepo.createQueryBuilder('c')
      .where('c.isAvailable = true')
      .orderBy('c.sortOrder', 'ASC');
    if (rarity) qb.andWhere('c.rarity = :rarity', { rarity });
    return qb.getMany();
  }

  async getCharacter(id: string): Promise<Character> {
    const char = await this.charRepo.findOne({ where: { id } });
    if (!char) throw new NotFoundException('Character not found');
    return char;
  }

  // ─── User characters ──────────────────────────────────────────────────────

  async getUserCharacters(userId: string): Promise<Array<Character & { owned: boolean; equipped: boolean; claimable: boolean }>> {
    const profile = await this.profileRepo.findOne({ where: { id: userId } });
    const owned = await this.userCharRepo.find({ where: { userId } });
    const stats = await this.statsRepo.findOne({ where: { userId } });
    const gamesPlayed = stats?.gamesPlayed ?? 0;

    const ownedIds = new Set(owned.map(uc => uc.characterId));
    const all = await this.listCharacters();

    return all.map(char => ({
      ...char,
      owned: ownedIds.has(char.id),
      equipped: profile?.activeCharacterId === char.id,
      claimable: !ownedIds.has(char.id) && char.matchesUnlock != null && char.matchesUnlock > 0
        && gamesPlayed >= char.matchesUnlock,
    }));
  }

  // ─── Progression ─────────────────────────────────────────────────────────

  async getProgression(userId: string): Promise<CharacterProgressionDto> {
    const stats = await this.statsRepo.findOne({ where: { userId } });
    const gamesPlayed = stats?.gamesPlayed ?? 0;

    const owned = await this.userCharRepo.find({ where: { userId } });
    const ownedIds = new Set(owned.map(uc => uc.characterId));

    const allChars = await this.charRepo.find({
      where: { isAvailable: true },
      order: { matchesUnlock: 'ASC' },
    });

    const claimableCharacters = allChars
      .filter(c => !ownedIds.has(c.id) && c.matchesUnlock != null && c.matchesUnlock > 0
        && gamesPlayed >= c.matchesUnlock)
      .map(c => ({ id: c.id, name: c.name, rarity: c.rarity, bodyColor: c.bodyColor }));

    const next = allChars.find(
      c => !ownedIds.has(c.id) && c.matchesUnlock != null && c.matchesUnlock > 0
        && gamesPlayed < c.matchesUnlock,
    ) ?? null;

    return {
      gamesPlayed,
      nextFreeCharacter: next
        ? {
            id: next.id,
            name: next.name,
            rarity: next.rarity,
            bodyColor: next.bodyColor,
            matchesUnlock: next.matchesUnlock!,
            progressPercent: Math.min(99, Math.floor((gamesPlayed / next.matchesUnlock!) * 100)),
          }
        : null,
      claimableCharacters,
    };
  }

  // ─── Purchase (coins) ─────────────────────────────────────────────────────

  async purchase(userId: string, charId: string): Promise<{ message: string }> {
    const char = await this.getCharacter(charId);
    if (char.priceCoins === 0) {
      throw new BadRequestException('Este personaje no se puede comprar con monedas');
    }

    const existing = await this.userCharRepo.findOne({ where: { userId, characterId: charId } });
    if (existing) throw new BadRequestException('Character already owned');

    await this.economy.spendCoins(userId, char.priceCoins, `Character: ${char.name}`);
    await this.userCharRepo.save(this.userCharRepo.create({ userId, characterId: charId }));

    return { message: `Personaje "${char.name}" comprado` };
  }

  // ─── Purchase (gems) ──────────────────────────────────────────────────────

  async purchaseWithGems(userId: string, charId: string): Promise<{ message: string }> {
    const char = await this.getCharacter(charId);
    if (char.gemPrice === 0) throw new BadRequestException('Este personaje no está disponible por gemas');

    const existing = await this.userCharRepo.findOne({ where: { userId, characterId: charId } });
    if (existing) throw new BadRequestException('Character already owned');

    await this.economy.spendPremiumCoins(userId, char.gemPrice, `Character (gemas): ${char.name}`);
    await this.userCharRepo.save(this.userCharRepo.create({ userId, characterId: charId }));

    return { message: `Personaje "${char.name}" comprado con gemas` };
  }

  // ─── Claim free ───────────────────────────────────────────────────────────

  async claimFree(userId: string, charId: string): Promise<{ message: string }> {
    const char = await this.getCharacter(charId);
    if (!char.matchesUnlock || char.matchesUnlock === 0) {
      throw new BadRequestException('Este personaje no tiene desbloqueo por partidas');
    }

    const existing = await this.userCharRepo.findOne({ where: { userId, characterId: charId } });
    if (existing) throw new BadRequestException('Character already owned');

    const stats = await this.statsRepo.findOne({ where: { userId } });
    const gamesPlayed = stats?.gamesPlayed ?? 0;

    if (gamesPlayed < char.matchesUnlock) {
      throw new BadRequestException(`Necesitas ${char.matchesUnlock} partidas. Llevas ${gamesPlayed}.`);
    }

    await this.userCharRepo.save(this.userCharRepo.create({ userId, characterId: charId }));
    return { message: `Personaje "${char.name}" desbloqueado gratis` };
  }

  // ─── Equip / unequip ──────────────────────────────────────────────────────

  async setActiveCharacter(userId: string, charId: string): Promise<{ activeCharacterId: string }> {
    const owned = await this.userCharRepo.findOne({ where: { userId, characterId: charId } });
    if (!owned) throw new BadRequestException('Character not owned');

    const profile = await this.profileRepo.findOne({ where: { id: userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    profile.activeCharacterId = charId;
    await this.profileRepo.save(profile);
    return { activeCharacterId: charId };
  }

  async unequipCharacter(userId: string): Promise<void> {
    const profile = await this.profileRepo.findOne({ where: { id: userId } });
    if (!profile) return;
    profile.activeCharacterId = '';
    await this.profileRepo.save(profile);
  }

  async getActiveCharacter(userId: string): Promise<(Character & { slug: string }) | null> {
    let profile = await this.profileRepo.findOne({ where: { id: userId } });
    if (!profile?.activeCharacterId) {
      await this.ensureStarterCharacter(userId);
      profile = await this.profileRepo.findOne({ where: { id: userId } });
    }
    if (!profile?.activeCharacterId) return null;
    const char = await this.charRepo.findOne({ where: { id: profile.activeCharacterId } });
    return char ?? null;
  }

  async ensureStarterCharacter(userId: string): Promise<void> {
    const existing = await this.userCharRepo.find({ where: { userId } });
    if (existing.length > 0) return;

    const starter = await this.charRepo.findOne({ where: { isDefault: true } });
    if (!starter) return;

    await this.userCharRepo.save(
      this.userCharRepo.create({ userId, characterId: starter.id }),
    );

    const profile = await this.profileRepo.findOne({ where: { id: userId } });
    if (profile && !profile.activeCharacterId) {
      profile.activeCharacterId = starter.id;
      await this.profileRepo.save(profile);
    }
  }
}
