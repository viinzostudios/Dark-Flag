import {
  Injectable, NotFoundException, BadRequestException, ConflictException, OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Arena } from './entities/arena-skin.entity';
import { UserArena } from './entities/user-arena-skin.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { EconomyService } from '../economy/economy.service';

type ArenaSeed = Omit<Arena, 'id' | 'createdAt'>;

/* eslint-disable max-len */
const SEED: ArenaSeed[] = [
  { slug: 'space-station',   name: 'Estación Espacial',  description: 'Pasillos metálicos de una estación orbital en penumbra. Arena inicial gratuita.',                priceCoins: 0,    isDefault: true,  sortOrder: 1  },
  { slug: 'lava-subterranea', name: 'Lava Subterránea',  description: 'Basalto negro con grietas de lava naranja incandescente.',                                        priceCoins: 3000, isDefault: false, sortOrder: 2  },
  { slug: 'profundidades',   name: 'Profundidades',      description: 'Suelo marino oscuro con bioluminiscencia tenue.',                                                  priceCoins: 3000, isDefault: false, sortOrder: 3  },
  { slug: 'cienaga-toxica',  name: 'Ciénaga Tóxica',    description: 'Pantano verde oscuro con burbujas de ácido tóxico.',                                                priceCoins: 3000, isDefault: false, sortOrder: 4  },
  { slug: 'desierto-nocturno', name: 'Desierto Nocturno', description: 'Arena ocre compactada con grietas poligonales resecas.',                                          priceCoins: 3000, isDefault: false, sortOrder: 5  },
  { slug: 'glaciar',         name: 'Glaciar',            description: 'Hielo azul-oscuro con fisuras congeladas profundas.',                                               priceCoins: 3000, isDefault: false, sortOrder: 6  },
  { slug: 'ceniza-volcanica', name: 'Ceniza Volcánica',  description: 'Ceniza y basalto oscuro post-erupción.',                                                           priceCoins: 3000, isDefault: false, sortOrder: 7  },
  { slug: 'bosque-oscuro',   name: 'Bosque Oscuro',      description: 'Tierra húmeda oscura con hojas y raíces vistas desde arriba.',                                     priceCoins: 3000, isDefault: false, sortOrder: 8  },
  { slug: 'cosmos',          name: 'Cosmos',             description: 'Vacío espacial negro con polvo estelar apenas perceptible.',                                       priceCoins: 4500, isDefault: false, sortOrder: 9  },
  { slug: 'metal-oxido',     name: 'Metal Oxidado',      description: 'Plancha de metal corroída con óxido marrón-rojizo.',                                               priceCoins: 4500, isDefault: false, sortOrder: 10 },
  { slug: 'neon-urbano',     name: 'Neón Urbano',        description: 'Asfalto mojado oscuro con reflejo sutil de neón cian y magenta.',                                  priceCoins: 4500, isDefault: false, sortOrder: 11 },
  { slug: 'cristales-oscuros', name: 'Cristales Oscuros', description: 'Cueva con facetas de cristal morado oscuro y brillo interno tenue.',                             priceCoins: 4500, isDefault: false, sortOrder: 12 },
  { slug: 'barro-trinchera', name: 'Barro de Trinchera', description: 'Barro de campo de batalla con huellas y surcos.',                                                  priceCoins: 6000, isDefault: false, sortOrder: 13 },
  { slug: 'tundra-helada',   name: 'Tundra Helada',      description: 'Hielo compactado gris-azulado con grietas.',                                                       priceCoins: 6000, isDefault: false, sortOrder: 14 },
  { slug: 'nebulosa',        name: 'Nebulosa',           description: 'Vacío espacial púrpura-oscuro con velos de nebulosa magenta.',                                     priceCoins: 6000, isDefault: false, sortOrder: 15 },
  { slug: 'ruinas-antiguas', name: 'Ruinas Antiguas',    description: 'Piedra ancestral con grabados desgastados casi invisibles.',                                       priceCoins: 6000, isDefault: false, sortOrder: 16 },
  { slug: 'metal-quemado',   name: 'Metal Quemado',      description: 'Acero chamuscado con iridiscencia de calor en azules y púrpuras.',                                 priceCoins: 7500, isDefault: false, sortOrder: 17 },
  { slug: 'caverna-humeda',  name: 'Caverna Húmeda',     description: 'Roca de caverna oscura y mojada con reflejo de humedad.',                                          priceCoins: 7500, isDefault: false, sortOrder: 18 },
  { slug: 'sangre-dragon',   name: 'Sangre de Dragón',   description: 'Negro profundo con venas rojas carmesí luminosas.',                                                priceCoins: 7500, isDefault: false, sortOrder: 19 },
  { slug: 'abismo-digital',  name: 'Abismo Digital',     description: 'Negro digital con trazas de circuito PCB en verde oscuro.',                                        priceCoins: 9000, isDefault: false, sortOrder: 20 },
];
/* eslint-enable max-len */

@Injectable()
export class ArenaSkinsService implements OnModuleInit {
  constructor(
    @InjectRepository(Arena)
    private readonly arenaRepo: Repository<Arena>,
    @InjectRepository(UserArena)
    private readonly userArenaRepo: Repository<UserArena>,
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
    private readonly economyService: EconomyService,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const seed of SEED) {
      const exists = await this.arenaRepo.findOne({ where: { slug: seed.slug } });
      if (!exists) {
        await this.arenaRepo.save(this.arenaRepo.create(seed));
      }
    }
  }

  async findAll(userId?: string): Promise<Array<Arena & { owned: boolean; equipped: boolean }>> {
    const arenas = await this.arenaRepo.find({ order: { sortOrder: 'ASC' } });

    let ownedArenaIds = new Set<string>();
    let equippedSlug = 'space-station';

    if (userId) {
      const owned = await this.userArenaRepo.find({ where: { userId } });
      ownedArenaIds = new Set(owned.map(o => o.arenaId));
      const profile = await this.profileRepo.findOne({ where: { id: userId } });
      equippedSlug = profile?.activeArenaSlug ?? 'space-station';
    }

    return arenas.map(a => ({
      ...a,
      owned: a.isDefault || ownedArenaIds.has(a.id),
      equipped: a.slug === equippedSlug,
    }));
  }

  async findOwned(userId: string): Promise<string[]> {
    const owned = await this.userArenaRepo.find({ where: { userId } });
    const ownedIds = new Set(owned.map(o => o.arenaId));

    const ownedArenas = await this.arenaRepo.find({ order: { sortOrder: 'ASC' } });
    return ownedArenas
      .filter(a => a.isDefault || ownedIds.has(a.id))
      .map(a => a.slug);
  }

  async purchase(userId: string, slug: string): Promise<{ newCoinBalance: number }> {
    const arena = await this.arenaRepo.findOne({ where: { slug } });
    if (!arena) throw new NotFoundException(`Arena '${slug}' not found`);
    if (arena.isDefault) throw new BadRequestException('Esta arena ya es gratuita para todos');

    const alreadyOwned = await this.userArenaRepo.findOne({
      where: { userId, arenaId: arena.id },
    });
    if (alreadyOwned) throw new ConflictException('Arena already owned');

    const { newBalance } = await this.economyService.spendCoins(
      userId,
      arena.priceCoins,
      `Arena: ${arena.name}`,
    );

    await this.userArenaRepo.save(
      this.userArenaRepo.create({ userId, arenaId: arena.id }),
    );

    return { newCoinBalance: newBalance };
  }

  async equip(userId: string, slug: string): Promise<void> {
    const arena = await this.arenaRepo.findOne({ where: { slug } });
    if (!arena) throw new NotFoundException(`Arena '${slug}' not found`);

    if (!arena.isDefault) {
      const owned = await this.userArenaRepo.findOne({
        where: { userId, arenaId: arena.id },
      });
      if (!owned) throw new BadRequestException('Arena not owned');
    }

    await this.profileRepo.update({ id: userId }, { activeArenaSlug: slug });
  }
}
