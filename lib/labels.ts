import type { Level } from '@/lib/db/schema';

export const LEVEL_LABELS: Record<Level, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
  all: 'Tous niveaux',
};
