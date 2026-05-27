import {
  Injectable, BadRequestException, OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Avatar } from './entities/avatar.entity';
import { UserAvatar } from './entities/user-avatar.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { EconomyService } from '../economy/economy.service';

// ─── Seed ─────────────────────────────────────────────────────────────────────

type AvatarSeed = Omit<Avatar, 'id' | 'createdAt'>;

/* eslint-disable max-len */
const SEED: AvatarSeed[] = [
  // ── FREE (20) — sortOrder 1–20 ────────────────────────────────────────────
  { slug: 'avatar-01', name: 'León Rugiente',    category: 'animals',    priceCoins: 0,    sortOrder: 1,   isActive: true },
  { slug: 'avatar-02', name: 'Pingüino Cool',    category: 'animals',    priceCoins: 0,    sortOrder: 2,   isActive: true },
  { slug: 'avatar-03', name: 'Dragón Bebé',      category: 'animals',    priceCoins: 0,    sortOrder: 3,   isActive: true },
  { slug: 'avatar-04', name: 'Zorro Astuto',     category: 'animals',    priceCoins: 0,    sortOrder: 4,   isActive: true },
  { slug: 'avatar-05', name: 'Rana Tropical',    category: 'animals',    priceCoins: 0,    sortOrder: 5,   isActive: true },
  { slug: 'avatar-06', name: 'Búho Sabio',       category: 'animals',    priceCoins: 0,    sortOrder: 6,   isActive: true },
  { slug: 'avatar-07', name: 'Tiburón Feral',    category: 'animals',    priceCoins: 0,    sortOrder: 7,   isActive: true },
  { slug: 'avatar-08', name: 'Gato Robot',       category: 'animals',    priceCoins: 0,    sortOrder: 8,   isActive: true },
  { slug: 'avatar-09', name: 'Unicornio',        category: 'animals',    priceCoins: 0,    sortOrder: 9,   isActive: true },
  { slug: 'avatar-10', name: 'Pulpo Colorido',   category: 'animals',    priceCoins: 0,    sortOrder: 10,  isActive: true },
  { slug: 'avatar-11', name: 'Pizza Feliz',      category: 'food',       priceCoins: 0,    sortOrder: 11,  isActive: true },
  { slug: 'avatar-12', name: 'Helado Divertido', category: 'food',       priceCoins: 0,    sortOrder: 12,  isActive: true },
  { slug: 'avatar-13', name: 'Taco Loco',        category: 'food',       priceCoins: 0,    sortOrder: 13,  isActive: true },
  { slug: 'avatar-14', name: 'Hamburguesa',      category: 'food',       priceCoins: 0,    sortOrder: 14,  isActive: true },
  { slug: 'avatar-15', name: 'Sushi Chibi',      category: 'food',       priceCoins: 0,    sortOrder: 15,  isActive: true },
  { slug: 'avatar-16', name: 'Piña Tropical',    category: 'food',       priceCoins: 0,    sortOrder: 16,  isActive: true },
  { slug: 'avatar-17', name: 'Cohete Veloz',     category: 'symbols',    priceCoins: 0,    sortOrder: 17,  isActive: true },
  { slug: 'avatar-18', name: 'Calavera Punk',    category: 'symbols',    priceCoins: 0,    sortOrder: 18,  isActive: true },
  { slug: 'avatar-19', name: 'Corona Real',      category: 'symbols',    priceCoins: 0,    sortOrder: 19,  isActive: true },
  { slug: 'avatar-20', name: 'Escudo Guerrero',  category: 'symbols',    priceCoins: 0,    sortOrder: 20,  isActive: true },

  // ── TIER 1 — 200 coins (sortOrder 21–65) ─────────────────────────────────
  { slug: 'avatar-21', name: 'Panda Ninja',       category: 'animals',   priceCoins: 2000,  sortOrder: 21,  isActive: true },
  { slug: 'avatar-22', name: 'Zombie Chévere',    category: 'fantasy',   priceCoins: 2000,  sortOrder: 22,  isActive: true },
  { slug: 'avatar-23', name: 'Tortuga Samurái',   category: 'animals',   priceCoins: 2000,  sortOrder: 23,  isActive: true },
  { slug: 'avatar-24', name: 'Ovni Amistoso',     category: 'fantasy',   priceCoins: 2000,  sortOrder: 24,  isActive: true },
  { slug: 'avatar-25', name: 'Oso Polar',         category: 'animals',   priceCoins: 2000,  sortOrder: 25,  isActive: true },
  { slug: 'avatar-26', name: 'Tiburón Punk',      category: 'animals',   priceCoins: 2000,  sortOrder: 26,  isActive: true },
  { slug: 'avatar-27', name: 'Mono Banano',       category: 'animals',   priceCoins: 2000,  sortOrder: 27,  isActive: true },
  { slug: 'avatar-28', name: 'Elefante Gris',     category: 'animals',   priceCoins: 2000,  sortOrder: 28,  isActive: true },
  { slug: 'avatar-29', name: 'Cocodrilo Verde',   category: 'animals',   priceCoins: 2000,  sortOrder: 29,  isActive: true },
  { slug: 'avatar-30', name: 'Halcón Veloz',      category: 'animals',   priceCoins: 2000,  sortOrder: 30,  isActive: true },
  { slug: 'avatar-31', name: 'Donut Glaseado',    category: 'food',      priceCoins: 2000,  sortOrder: 31,  isActive: true },
  { slug: 'avatar-32', name: 'Hot Dog Loco',      category: 'food',      priceCoins: 2000,  sortOrder: 32,  isActive: true },
  { slug: 'avatar-33', name: 'Medusa Neón',       category: 'fantasy',   priceCoins: 2000,  sortOrder: 33,  isActive: true },
  { slug: 'avatar-34', name: 'Aguacate Cool',     category: 'food',      priceCoins: 2000,  sortOrder: 34,  isActive: true },
  { slug: 'avatar-35', name: 'Fresa Gigante',     category: 'food',      priceCoins: 2000,  sortOrder: 35,  isActive: true },
  { slug: 'avatar-36', name: 'Sandía Feliz',      category: 'food',      priceCoins: 2000,  sortOrder: 36,  isActive: true },
  { slug: 'avatar-37', name: 'Ramen Caliente',    category: 'food',      priceCoins: 2000,  sortOrder: 37,  isActive: true },
  { slug: 'avatar-38', name: 'Cupcake Lindo',     category: 'food',      priceCoins: 2000,  sortOrder: 38,  isActive: true },
  { slug: 'avatar-39', name: 'Astronauta',        category: 'characters', priceCoins: 2000, sortOrder: 39,  isActive: true },
  { slug: 'avatar-40', name: 'Pirata Audaz',      category: 'characters', priceCoins: 2000, sortOrder: 40,  isActive: true },
  { slug: 'avatar-41', name: 'Vikingo Feroz',     category: 'characters', priceCoins: 2000, sortOrder: 41,  isActive: true },
  { slug: 'avatar-42', name: 'Ninja Sigiloso',    category: 'characters', priceCoins: 2000, sortOrder: 42,  isActive: true },
  { slug: 'avatar-43', name: 'Caballero Noble',   category: 'characters', priceCoins: 2000, sortOrder: 43,  isActive: true },
  { slug: 'avatar-44', name: 'Hechicero Oscuro',  category: 'characters', priceCoins: 2000, sortOrder: 44,  isActive: true },
  { slug: 'avatar-45', name: 'Bombero Valiente',  category: 'characters', priceCoins: 2000, sortOrder: 45,  isActive: true },
  { slug: 'avatar-46', name: 'Futbolista',        category: 'characters', priceCoins: 2000, sortOrder: 46,  isActive: true },
  { slug: 'avatar-47', name: 'Chef Famoso',       category: 'characters', priceCoins: 2000, sortOrder: 47,  isActive: true },
  { slug: 'avatar-48', name: 'Científico Loco',   category: 'characters', priceCoins: 2000, sortOrder: 48,  isActive: true },
  { slug: 'avatar-49', name: 'Rayo Eléctrico',    category: 'symbols',   priceCoins: 2000,  sortOrder: 49,  isActive: true },
  { slug: 'avatar-50', name: 'Bomba Retro',       category: 'symbols',   priceCoins: 2000,  sortOrder: 50,  isActive: true },
  { slug: 'avatar-51', name: 'Dado de Suerte',    category: 'symbols',   priceCoins: 2000,  sortOrder: 51,  isActive: true },
  { slug: 'avatar-52', name: 'Llave Inglesa',     category: 'symbols',   priceCoins: 2000,  sortOrder: 52,  isActive: true },
  { slug: 'avatar-53', name: 'Engranaje Mecánico',category: 'symbols',   priceCoins: 2000,  sortOrder: 53,  isActive: true },
  { slug: 'avatar-54', name: 'Brújula Vintage',   category: 'symbols',   priceCoins: 2000,  sortOrder: 54,  isActive: true },
  { slug: 'avatar-55', name: 'Ojo Mágico',        category: 'symbols',   priceCoins: 2000,  sortOrder: 55,  isActive: true },
  { slug: 'avatar-56', name: 'Huevo Feliz',       category: 'food',      priceCoins: 2000,  sortOrder: 56,  isActive: true },
  { slug: 'avatar-57', name: 'Cactus Amigable',   category: 'animals',   priceCoins: 2000,  sortOrder: 57,  isActive: true },
  { slug: 'avatar-58', name: 'Llama Salvaje',     category: 'symbols',   priceCoins: 2000,  sortOrder: 58,  isActive: true },
  { slug: 'avatar-59', name: 'Cohete Espacial',   category: 'fantasy',   priceCoins: 2000,  sortOrder: 59,  isActive: true },
  { slug: 'avatar-60', name: 'Martillo Thor',     category: 'fantasy',   priceCoins: 2000,  sortOrder: 60,  isActive: true },
  { slug: 'avatar-61', name: 'Báculo Arcano',     category: 'fantasy',   priceCoins: 2000,  sortOrder: 61,  isActive: true },
  { slug: 'avatar-62', name: 'Estrella Fugaz',    category: 'symbols',   priceCoins: 2000,  sortOrder: 62,  isActive: true },
  { slug: 'avatar-63', name: 'Polilla de la Muerte', category: 'animals', priceCoins: 2000, sortOrder: 63,  isActive: true },
  { slug: 'avatar-64', name: 'Camaleón',          category: 'animals',   priceCoins: 2000,  sortOrder: 64,  isActive: true },
  { slug: 'avatar-65', name: 'Pulpo Ninja',       category: 'animals',   priceCoins: 2000,  sortOrder: 65,  isActive: true },

  // ── TIER 2 — 500 coins (sortOrder 66–125) ────────────────────────────────
  { slug: 'avatar-66', name: 'Pantera Negra',     category: 'animals',   priceCoins: 5000,  sortOrder: 66,  isActive: true },
  { slug: 'avatar-67', name: 'Águila Dorada',     category: 'animals',   priceCoins: 5000,  sortOrder: 67,  isActive: true },
  { slug: 'avatar-68', name: 'Serpiente Cobra',   category: 'animals',   priceCoins: 5000,  sortOrder: 68,  isActive: true },
  { slug: 'avatar-69', name: 'Gorila Alpha',      category: 'animals',   priceCoins: 5000,  sortOrder: 69,  isActive: true },
  { slug: 'avatar-70', name: 'Mantis Religiosa',  category: 'animals',   priceCoins: 5000,  sortOrder: 70,  isActive: true },
  { slug: 'avatar-71', name: 'Cangrejo Rojo',     category: 'animals',   priceCoins: 5000,  sortOrder: 71,  isActive: true },
  { slug: 'avatar-72', name: 'Escorpión',         category: 'animals',   priceCoins: 5000,  sortOrder: 72,  isActive: true },
  { slug: 'avatar-73', name: 'Delfín Azul',       category: 'animals',   priceCoins: 5000,  sortOrder: 73,  isActive: true },
  { slug: 'avatar-74', name: 'Cuervo Negro',      category: 'animals',   priceCoins: 5000,  sortOrder: 74,  isActive: true },
  { slug: 'avatar-75', name: 'Hipnótico',         category: 'animals',   priceCoins: 5000,  sortOrder: 75,  isActive: true },
  { slug: 'avatar-76', name: 'Mago Arcano',       category: 'characters', priceCoins: 5000, sortOrder: 76,  isActive: true },
  { slug: 'avatar-77', name: 'Robot Guardián',    category: 'characters', priceCoins: 5000, sortOrder: 77,  isActive: true },
  { slug: 'avatar-78', name: 'Samurái Honor',     category: 'characters', priceCoins: 5000, sortOrder: 78,  isActive: true },
  { slug: 'avatar-79', name: 'Gladiador Roma',    category: 'characters', priceCoins: 5000, sortOrder: 79,  isActive: true },
  { slug: 'avatar-80', name: 'Cazador Élite',     category: 'characters', priceCoins: 5000, sortOrder: 80,  isActive: true },
  { slug: 'avatar-81', name: 'Hacker Neon',       category: 'characters', priceCoins: 5000, sortOrder: 81,  isActive: true },
  { slug: 'avatar-82', name: 'Alquimista',        category: 'characters', priceCoins: 5000, sortOrder: 82,  isActive: true },
  { slug: 'avatar-83', name: 'Arquero Élfico',    category: 'characters', priceCoins: 5000, sortOrder: 83,  isActive: true },
  { slug: 'avatar-84', name: 'Espía Sombra',      category: 'characters', priceCoins: 5000, sortOrder: 84,  isActive: true },
  { slug: 'avatar-85', name: 'Médico de Campo',   category: 'characters', priceCoins: 5000, sortOrder: 85,  isActive: true },
  { slug: 'avatar-86', name: 'Fénix Llamas',      category: 'fantasy',   priceCoins: 5000,  sortOrder: 86,  isActive: true },
  { slug: 'avatar-87', name: 'Kraken Marino',     category: 'fantasy',   priceCoins: 5000,  sortOrder: 87,  isActive: true },
  { slug: 'avatar-88', name: 'Grifo Dorado',      category: 'fantasy',   priceCoins: 5000,  sortOrder: 88,  isActive: true },
  { slug: 'avatar-89', name: 'Demonio Rojo',      category: 'fantasy',   priceCoins: 5000,  sortOrder: 89,  isActive: true },
  { slug: 'avatar-90', name: 'Ángel Caído',       category: 'fantasy',   priceCoins: 5000,  sortOrder: 90,  isActive: true },
  { slug: 'avatar-91', name: 'Golem Piedra',      category: 'fantasy',   priceCoins: 5000,  sortOrder: 91,  isActive: true },
  { slug: 'avatar-92', name: 'Vampiro Conde',     category: 'fantasy',   priceCoins: 5000,  sortOrder: 92,  isActive: true },
  { slug: 'avatar-93', name: 'Hombre Lobo',       category: 'fantasy',   priceCoins: 5000,  sortOrder: 93,  isActive: true },
  { slug: 'avatar-94', name: 'Sirena Oscura',     category: 'fantasy',   priceCoins: 5000,  sortOrder: 94,  isActive: true },
  { slug: 'avatar-95', name: 'Centauro',          category: 'fantasy',   priceCoins: 5000,  sortOrder: 95,  isActive: true },
  { slug: 'avatar-96', name: 'Escudo de Fuego',   category: 'symbols',   priceCoins: 5000,  sortOrder: 96,  isActive: true },
  { slug: 'avatar-97', name: 'Espada Mágica',     category: 'symbols',   priceCoins: 5000,  sortOrder: 97,  isActive: true },
  { slug: 'avatar-98', name: 'Orbe de Cristal',   category: 'symbols',   priceCoins: 5000,  sortOrder: 98,  isActive: true },
  { slug: 'avatar-99', name: 'Máscara Tribal',    category: 'symbols',   priceCoins: 5000,  sortOrder: 99,  isActive: true },
  { slug: 'avatar-100', name: 'Poción Morada',    category: 'symbols',   priceCoins: 5000,  sortOrder: 100, isActive: true },
  { slug: 'avatar-101', name: 'Hamburguesa Lava', category: 'food',      priceCoins: 5000,  sortOrder: 101, isActive: true },
  { slug: 'avatar-102', name: 'Ramen Fuego',      category: 'food',      priceCoins: 5000,  sortOrder: 102, isActive: true },
  { slug: 'avatar-103', name: 'Coco Pirata',      category: 'food',      priceCoins: 5000,  sortOrder: 103, isActive: true },
  { slug: 'avatar-104', name: 'Caramelo Maldito', category: 'food',      priceCoins: 5000,  sortOrder: 104, isActive: true },
  { slug: 'avatar-105', name: 'Boba Tea',         category: 'food',      priceCoins: 5000,  sortOrder: 105, isActive: true },
  { slug: 'avatar-106', name: 'Elote Loco',       category: 'food',      priceCoins: 5000,  sortOrder: 106, isActive: true },
  { slug: 'avatar-107', name: 'Mango Picoso',     category: 'food',      priceCoins: 5000,  sortOrder: 107, isActive: true },
  { slug: 'avatar-108', name: 'Serpiente Coral',  category: 'animals',   priceCoins: 5000,  sortOrder: 108, isActive: true },
  { slug: 'avatar-109', name: 'Murciélago',       category: 'animals',   priceCoins: 5000,  sortOrder: 109, isActive: true },
  { slug: 'avatar-110', name: 'Jaguar Selva',     category: 'animals',   priceCoins: 5000,  sortOrder: 110, isActive: true },
  { slug: 'avatar-111', name: 'Toro Bravo',       category: 'animals',   priceCoins: 5000,  sortOrder: 111, isActive: true },
  { slug: 'avatar-112', name: 'Rinoceronte',      category: 'animals',   priceCoins: 5000,  sortOrder: 112, isActive: true },
  { slug: 'avatar-113', name: 'Mantarraya',       category: 'animals',   priceCoins: 5000,  sortOrder: 113, isActive: true },
  { slug: 'avatar-114', name: 'Colibrí Neón',     category: 'animals',   priceCoins: 5000,  sortOrder: 114, isActive: true },
  { slug: 'avatar-115', name: 'Pavo Real',        category: 'animals',   priceCoins: 5000,  sortOrder: 115, isActive: true },
  { slug: 'avatar-116', name: 'Axolotl Mutante',  category: 'animals',   priceCoins: 5000,  sortOrder: 116, isActive: true },
  { slug: 'avatar-117', name: 'Canario Dorado',   category: 'animals',   priceCoins: 5000,  sortOrder: 117, isActive: true },
  { slug: 'avatar-118', name: 'Pulpo Violeta',    category: 'animals',   priceCoins: 5000,  sortOrder: 118, isActive: true },
  { slug: 'avatar-119', name: 'Avispa Mecánica',  category: 'fantasy',   priceCoins: 5000,  sortOrder: 119, isActive: true },
  { slug: 'avatar-120', name: 'Zorro Fantasma',   category: 'fantasy',   priceCoins: 5000,  sortOrder: 120, isActive: true },
  { slug: 'avatar-121', name: 'Medusa Cósmica',   category: 'fantasy',   priceCoins: 5000,  sortOrder: 121, isActive: true },
  { slug: 'avatar-122', name: 'Esqueleto Mago',   category: 'fantasy',   priceCoins: 5000,  sortOrder: 122, isActive: true },
  { slug: 'avatar-123', name: 'Banshee',          category: 'fantasy',   priceCoins: 5000,  sortOrder: 123, isActive: true },
  { slug: 'avatar-124', name: 'Titán Hielo',      category: 'fantasy',   priceCoins: 5000,  sortOrder: 124, isActive: true },
  { slug: 'avatar-125', name: 'Elemental Fuego',  category: 'fantasy',   priceCoins: 5000,  sortOrder: 125, isActive: true },

  // ── TIER 3 — 1000 coins (sortOrder 126–175) ──────────────────────────────
  { slug: 'avatar-126', name: 'Quetzal Sagrado',  category: 'animals',   priceCoins: 10000, sortOrder: 126, isActive: true },
  { slug: 'avatar-127', name: 'Lobo Lunar',       category: 'animals',   priceCoins: 10000, sortOrder: 127, isActive: true },
  { slug: 'avatar-128', name: 'Tigre Siberiano',  category: 'animals',   priceCoins: 10000, sortOrder: 128, isActive: true },
  { slug: 'avatar-129', name: 'Dragón Azul',      category: 'fantasy',   priceCoins: 10000, sortOrder: 129, isActive: true },
  { slug: 'avatar-130', name: 'Dragón Verde',     category: 'fantasy',   priceCoins: 10000, sortOrder: 130, isActive: true },
  { slug: 'avatar-131', name: 'Dragón Dorado',    category: 'fantasy',   priceCoins: 10000, sortOrder: 131, isActive: true },
  { slug: 'avatar-132', name: 'Lich Rey',         category: 'fantasy',   priceCoins: 10000, sortOrder: 132, isActive: true },
  { slug: 'avatar-133', name: 'Titán Trueno',     category: 'fantasy',   priceCoins: 10000, sortOrder: 133, isActive: true },
  { slug: 'avatar-134', name: 'Basilisco',        category: 'fantasy',   priceCoins: 10000, sortOrder: 134, isActive: true },
  { slug: 'avatar-135', name: 'Leviatán',         category: 'fantasy',   priceCoins: 10000, sortOrder: 135, isActive: true },
  { slug: 'avatar-136', name: 'Cyber Samurái',    category: 'characters', priceCoins: 10000,sortOrder: 136, isActive: true },
  { slug: 'avatar-137', name: 'Mech Piloto',      category: 'characters', priceCoins: 10000,sortOrder: 137, isActive: true },
  { slug: 'avatar-138', name: 'Dark Assassin',    category: 'characters', priceCoins: 10000,sortOrder: 138, isActive: true },
  { slug: 'avatar-139', name: 'Arcángel',         category: 'characters', priceCoins: 10000,sortOrder: 139, isActive: true },
  { slug: 'avatar-140', name: 'Señor Oscuro',     category: 'characters', priceCoins: 10000,sortOrder: 140, isActive: true },
  { slug: 'avatar-141', name: 'Profeta',          category: 'characters', priceCoins: 10000,sortOrder: 141, isActive: true },
  { slug: 'avatar-142', name: 'Berserker',        category: 'characters', priceCoins: 10000,sortOrder: 142, isActive: true },
  { slug: 'avatar-143', name: 'Maestro Sombra',   category: 'characters', priceCoins: 10000,sortOrder: 143, isActive: true },
  { slug: 'avatar-144', name: 'Inmortal',         category: 'characters', priceCoins: 10000,sortOrder: 144, isActive: true },
  { slug: 'avatar-145', name: 'Anciano Maestro',  category: 'characters', priceCoins: 10000,sortOrder: 145, isActive: true },
  { slug: 'avatar-146', name: 'Ojo de Dios',      category: 'symbols',   priceCoins: 10000, sortOrder: 146, isActive: true },
  { slug: 'avatar-147', name: 'Runa Antigua',     category: 'symbols',   priceCoins: 10000, sortOrder: 147, isActive: true },
  { slug: 'avatar-148', name: 'Necronomicón',     category: 'symbols',   priceCoins: 10000, sortOrder: 148, isActive: true },
  { slug: 'avatar-149', name: 'Tótem Sagrado',    category: 'symbols',   priceCoins: 10000, sortOrder: 149, isActive: true },
  { slug: 'avatar-150', name: 'Cristal Roto',     category: 'symbols',   priceCoins: 10000, sortOrder: 150, isActive: true },
  { slug: 'avatar-151', name: 'Orca Majestuosa',  category: 'animals',   priceCoins: 10000, sortOrder: 151, isActive: true },
  { slug: 'avatar-152', name: 'Narval Ártico',    category: 'animals',   priceCoins: 10000, sortOrder: 152, isActive: true },
  { slug: 'avatar-153', name: 'Dragón Marino',    category: 'animals',   priceCoins: 10000, sortOrder: 153, isActive: true },
  { slug: 'avatar-154', name: 'Ciervo Celestial', category: 'fantasy',   priceCoins: 10000, sortOrder: 154, isActive: true },
  { slug: 'avatar-155', name: 'Kitsune',          category: 'fantasy',   priceCoins: 10000, sortOrder: 155, isActive: true },
  { slug: 'avatar-156', name: 'Tengu',            category: 'fantasy',   priceCoins: 10000, sortOrder: 156, isActive: true },
  { slug: 'avatar-157', name: 'Qilin',            category: 'fantasy',   priceCoins: 10000, sortOrder: 157, isActive: true },
  { slug: 'avatar-158', name: 'Peri Dorada',      category: 'fantasy',   priceCoins: 10000, sortOrder: 158, isActive: true },
  { slug: 'avatar-159', name: 'Garuda',           category: 'fantasy',   priceCoins: 10000, sortOrder: 159, isActive: true },
  { slug: 'avatar-160', name: 'Simurgh',          category: 'fantasy',   priceCoins: 10000, sortOrder: 160, isActive: true },
  { slug: 'avatar-161', name: 'Dragón Relámpago', category: 'fantasy',   priceCoins: 10000, sortOrder: 161, isActive: true },
  { slug: 'avatar-162', name: 'Fenrir',           category: 'fantasy',   priceCoins: 10000, sortOrder: 162, isActive: true },
  { slug: 'avatar-163', name: 'Hydra',            category: 'fantasy',   priceCoins: 10000, sortOrder: 163, isActive: true },
  { slug: 'avatar-164', name: 'Nüwa Diosa',       category: 'fantasy',   priceCoins: 10000, sortOrder: 164, isActive: true },
  { slug: 'avatar-165', name: 'Anubis',           category: 'fantasy',   priceCoins: 10000, sortOrder: 165, isActive: true },
  { slug: 'avatar-166', name: 'Minotauro',        category: 'fantasy',   priceCoins: 10000, sortOrder: 166, isActive: true },
  { slug: 'avatar-167', name: 'Medusa Dorada',    category: 'fantasy',   priceCoins: 10000, sortOrder: 167, isActive: true },
  { slug: 'avatar-168', name: 'Cyclops',          category: 'fantasy',   priceCoins: 10000, sortOrder: 168, isActive: true },
  { slug: 'avatar-169', name: 'Sphinx',           category: 'fantasy',   priceCoins: 10000, sortOrder: 169, isActive: true },
  { slug: 'avatar-170', name: 'Dragón Aurora',    category: 'fantasy',   priceCoins: 10000, sortOrder: 170, isActive: true },
  { slug: 'avatar-171', name: 'Titán Cosmos',     category: 'fantasy',   priceCoins: 10000, sortOrder: 171, isActive: true },
  { slug: 'avatar-172', name: 'Juggernaut',       category: 'characters', priceCoins: 10000,sortOrder: 172, isActive: true },
  { slug: 'avatar-173', name: 'Phantom',          category: 'characters', priceCoins: 10000,sortOrder: 173, isActive: true },
  { slug: 'avatar-174', name: 'Overlord',         category: 'characters', priceCoins: 10000,sortOrder: 174, isActive: true },
  { slug: 'avatar-175', name: 'Genesis',          category: 'characters', priceCoins: 10000,sortOrder: 175, isActive: true },

  // ── TIER 4 — 20000 coins (sortOrder 176–200) ─────────────────────────────
  { slug: 'avatar-176', name: 'Dios del Trueno',  category: 'fantasy',   priceCoins: 20000, sortOrder: 176, isActive: true },
  { slug: 'avatar-177', name: 'Omega Dragón',     category: 'fantasy',   priceCoins: 20000, sortOrder: 177, isActive: true },
  { slug: 'avatar-178', name: 'Último Guardián',  category: 'fantasy',   priceCoins: 20000, sortOrder: 178, isActive: true },
  { slug: 'avatar-179', name: 'Arcángel Oscuro',  category: 'fantasy',   priceCoins: 20000, sortOrder: 179, isActive: true },
  { slug: 'avatar-180', name: 'Rey del Cosmos',   category: 'fantasy',   priceCoins: 20000, sortOrder: 180, isActive: true },
  { slug: 'avatar-181', name: 'Alpha Prime',      category: 'fantasy',   priceCoins: 20000, sortOrder: 181, isActive: true },
  { slug: 'avatar-182', name: 'El Primordial',    category: 'fantasy',   priceCoins: 20000, sortOrder: 182, isActive: true },
  { slug: 'avatar-183', name: 'Azathoth',         category: 'fantasy',   priceCoins: 20000, sortOrder: 183, isActive: true },
  { slug: 'avatar-184', name: 'Dragón Eterno',    category: 'fantasy',   priceCoins: 20000, sortOrder: 184, isActive: true },
  { slug: 'avatar-185', name: 'El Infinito',      category: 'fantasy',   priceCoins: 20000, sortOrder: 185, isActive: true },
  { slug: 'avatar-186', name: 'Shogun Supremo',   category: 'characters', priceCoins: 20000, sortOrder: 186, isActive: true },
  { slug: 'avatar-187', name: 'El Elegido',       category: 'characters', priceCoins: 20000, sortOrder: 187, isActive: true },
  { slug: 'avatar-188', name: 'Ultima Ratio',     category: 'characters', priceCoins: 20000, sortOrder: 188, isActive: true },
  { slug: 'avatar-189', name: 'Nemesis',          category: 'characters', priceCoins: 20000, sortOrder: 189, isActive: true },
  { slug: 'avatar-190', name: 'Apotheon',         category: 'characters', priceCoins: 20000, sortOrder: 190, isActive: true },
  { slug: 'avatar-191', name: 'León Cósmico',     category: 'animals',   priceCoins: 20000, sortOrder: 191, isActive: true },
  { slug: 'avatar-192', name: 'Lobo Estelar',     category: 'animals',   priceCoins: 20000, sortOrder: 192, isActive: true },
  { slug: 'avatar-193', name: 'Orca Cósmica',     category: 'animals',   priceCoins: 20000, sortOrder: 193, isActive: true },
  { slug: 'avatar-194', name: 'Águila Nebulosa',  category: 'animals',   priceCoins: 20000, sortOrder: 194, isActive: true },
  { slug: 'avatar-195', name: 'Dragón Divino',    category: 'animals',   priceCoins: 20000, sortOrder: 195, isActive: true },
  { slug: 'avatar-196', name: 'Sello Primordial', category: 'symbols',   priceCoins: 20000, sortOrder: 196, isActive: true },
  { slug: 'avatar-197', name: 'Omega Runa',       category: 'symbols',   priceCoins: 20000, sortOrder: 197, isActive: true },
  { slug: 'avatar-198', name: 'Clave del Cosmos', category: 'symbols',   priceCoins: 20000, sortOrder: 198, isActive: true },
  { slug: 'avatar-199', name: 'El Ojo Absoluto',  category: 'symbols',   priceCoins: 20000, sortOrder: 199, isActive: true },
  { slug: 'avatar-200', name: '⚡ El Tank',        category: 'symbols',   priceCoins: 20000, sortOrder: 200, isActive: true },

  // ── HEROÍNAS — para jugadoras (201-210) ──────────────────────────────────
  { slug: 'avatar-201', name: 'Guerrera Valiente',  category: 'characters', priceCoins: 0,    sortOrder: 201, isActive: true },
  { slug: 'avatar-202', name: 'Hada Luminosa',      category: 'fantasy',   priceCoins: 0,    sortOrder: 202, isActive: true },
  { slug: 'avatar-203', name: 'Arquera Élfica',     category: 'characters', priceCoins: 2000,  sortOrder: 203, isActive: true },
  { slug: 'avatar-204', name: 'Sirena Guerrera',    category: 'fantasy',   priceCoins: 2000,  sortOrder: 204, isActive: true },
  { slug: 'avatar-205', name: 'Amazona Feroz',      category: 'characters', priceCoins: 5000,  sortOrder: 205, isActive: true },
  { slug: 'avatar-206', name: 'Bruja de Tormenta',  category: 'fantasy',   priceCoins: 5000,  sortOrder: 206, isActive: true },
  { slug: 'avatar-207', name: 'Valquiria',          category: 'characters', priceCoins: 5000,  sortOrder: 207, isActive: true },
  { slug: 'avatar-208', name: 'Sacerdotisa Oscura', category: 'fantasy',   priceCoins: 10000, sortOrder: 208, isActive: true },
  { slug: 'avatar-209', name: 'Diosa Dragón',       category: 'fantasy',   priceCoins: 10000, sortOrder: 209, isActive: true },
  { slug: 'avatar-210', name: 'Reina de las Sombras', category: 'characters', priceCoins: 20000, sortOrder: 210, isActive: true },
];
/* eslint-enable max-len */

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class AvatarsService implements OnModuleInit {
  constructor(
    @InjectRepository(Avatar)
    private readonly avatarRepo: Repository<Avatar>,
    @InjectRepository(UserAvatar)
    private readonly userAvatarRepo: Repository<UserAvatar>,
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
    private readonly economy: EconomyService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.avatarRepo.upsert(
      SEED.map(s => this.avatarRepo.create(s)),
      { conflictPaths: ['slug'], skipUpdateIfNoValuesChanged: true },
    );
  }

  // ─── Ensure default avatar for new users ─────────────────────────────────

  async ensureDefaultAvatar(userId: string): Promise<void> {
    const existing = await this.userAvatarRepo.findOne({ where: { userId } });
    if (existing) return;
    const first = await this.avatarRepo.findOne({ where: { slug: 'avatar-01' } });
    if (!first) return;
    await this.userAvatarRepo.save(this.userAvatarRepo.create({ userId, avatarId: first.id }));
    await this.profileRepo.update({ id: userId }, { activeAvatarSlug: 'avatar-01' });
  }

  // ─── List avatars ─────────────────────────────────────────────────────────

  async findAll(userId?: string, category?: string): Promise<Array<Avatar & { owned: boolean; equipped: boolean }>> {
    const where: Partial<Avatar> = { isActive: true };
    if (category) (where as Record<string, unknown>)['category'] = category;

    const avatars = await this.avatarRepo.find({ where, order: { priceCoins: 'ASC', sortOrder: 'ASC' } });

    if (!userId) {
      return avatars.map(a => ({ ...a, owned: a.priceCoins === 0, equipped: false }));
    }

    const profile = await this.profileRepo.findOne({ where: { id: userId } });
    const owned = await this.userAvatarRepo.find({ where: { userId } });
    const ownedIds = new Set(owned.map(ua => ua.avatarId));

    return avatars.map(a => ({
      ...a,
      owned: ownedIds.has(a.id) || a.priceCoins === 0,
      equipped: profile?.activeAvatarSlug === a.slug,
    }));
  }

  // ─── Purchase ─────────────────────────────────────────────────────────────

  async purchase(userId: string, slug: string): Promise<void> {
    const avatar = await this.avatarRepo.findOne({ where: { slug, isActive: true } });
    if (!avatar) throw new BadRequestException('Avatar no encontrado');
    if (avatar.priceCoins === 0) throw new BadRequestException('Este avatar es gratuito');

    const existing = await this.userAvatarRepo.findOne({ where: { userId, avatarId: avatar.id } });
    if (existing) throw new BadRequestException('Ya tienes este avatar');

    await this.economy.spendCoins(userId, avatar.priceCoins, `Avatar: ${avatar.name}`);
    await this.userAvatarRepo.save(this.userAvatarRepo.create({ userId, avatarId: avatar.id }));
  }

  // ─── Equip ────────────────────────────────────────────────────────────────

  async equip(userId: string, slug: string): Promise<void> {
    const avatar = await this.avatarRepo.findOne({ where: { slug, isActive: true } });
    if (!avatar) throw new BadRequestException('Avatar no encontrado');

    const isFree = avatar.priceCoins === 0;
    if (!isFree) {
      const owned = await this.userAvatarRepo.findOne({ where: { userId, avatarId: avatar.id } });
      if (!owned) throw new BadRequestException('No tienes este avatar');
    }

    await this.profileRepo.update({ id: userId }, { activeAvatarSlug: slug });
  }

  // ─── Get active slug ─────────────────────────────────────────────────────

  async getActiveSlug(userId: string): Promise<string> {
    const profile = await this.profileRepo.findOne({ where: { id: userId } });
    return profile?.activeAvatarSlug ?? 'avatar-01';
  }
}
