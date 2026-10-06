import type { Level } from "./schema";

export const SEED_CATEGORIES = [
  { slug: "negoce", name: "Négoce" },
  { slug: "import-export", name: "Import-Export" },
  { slug: "logistique", name: "Logistique" },
  { slug: "finance", name: "Finance" },
  { slug: "douane", name: "Douane" },
  { slug: "juridique", name: "Juridique" },
  { slug: "agriculture", name: "Agriculture" },
  { slug: "qualite", name: "Qualité" },
  { slug: "strategie", name: "Stratégie" },
  { slug: "sourcing", name: "Sourcing" },
] as const;

type SeedCourse = {
  slug: string;
  category: (typeof SEED_CATEGORIES)[number]["slug"];
  title: string;
  subtitle: string;
  description: string;
  outcomes: string[];
  requirements: string[];
  level: Level;
  priceCents: number;
  thumbnailPath: string;
  sections: { title: string; lessons: { title: string; minutes: number; preview?: boolean }[] }[];
};

export const SEED_COURSES: SeedCourse[] = [
  {
    slug: "fondements-negoce-international",
    category: "negoce",
    title: "Les Fondements du Négoce International",
    subtitle: "Acheter, vendre et sécuriser une transaction de matières premières de A à Z.",
    description:
      "Cette formation pose les bases du métier de négociant : comprendre la chaîne de valeur des matières premières africaines, structurer une offre, négocier avec un acheteur étranger et sécuriser chaque étape jusqu'au paiement.\n\nElle s'appuie sur des cas réels traités par Proactive Services sur le karité, le sésame et la noix de cajou.",
    outcomes: [
      "Comprendre le rôle et la rémunération du négociant",
      "Structurer une offre commerciale crédible",
      "Identifier les risques d'une transaction et les couvrir",
      "Lire et négocier un contrat de vente international",
    ],
    requirements: ["Aucun prérequis : la formation part des bases"],
    level: "beginner",
    priceCents: 99000,
    thumbnailPath: "/photo_2026-09-29_14-16-58.jpg",
    sections: [
      { title: "Le métier de négociant", lessons: [
        { title: "Bienvenue et objectifs de la formation", minutes: 4, preview: true },
        { title: "La chaîne de valeur des matières premières africaines", minutes: 14 },
        { title: "Comment le négociant gagne sa marge", minutes: 11 },
      ] },
      { title: "Construire et négocier une offre", lessons: [
        { title: "Fiche produit, spécifications et échantillons", minutes: 12 },
        { title: "Fixer son prix : coûts, marge et Incoterms", minutes: 16 },
        { title: "Négocier avec un acheteur étranger", minutes: 13 },
      ] },
      { title: "Sécuriser la transaction", lessons: [
        { title: "Les risques d'une opération de négoce", minutes: 10 },
        { title: "Moyens de paiement et garanties", minutes: 15 },
        { title: "Étude de cas : une cargaison de karité", minutes: 18 },
      ] },
    ],
  },
  {
    slug: "supply-chain-africaine",
    category: "logistique",
    title: "Maîtriser la Supply Chain Africaine",
    subtitle: "Du producteur au port d'embarquement : organiser une logistique fiable.",
    description:
      "Collecte, stockage, transport intérieur, empotage et fret maritime : cette formation détaille chaque maillon de la chaîne logistique export en Afrique de l'Ouest et du Centre, avec les pièges à éviter et les bons interlocuteurs.",
    outcomes: [
      "Cartographier une chaîne logistique export",
      "Choisir transporteurs, transitaires et entrepôts",
      "Anticiper délais et coûts portuaires",
    ],
    requirements: ["Connaître les bases du commerce international est un plus"],
    level: "intermediate",
    priceCents: 75000,
    thumbnailPath: "/photo_2026-09-29_14-16-59.jpg",
    sections: [
      { title: "Vue d'ensemble", lessons: [
        { title: "Les maillons de la chaîne", minutes: 6, preview: true },
        { title: "Acteurs et responsabilités", minutes: 12 },
      ] },
      { title: "Du champ au port", lessons: [
        { title: "Collecte et stockage", minutes: 14 },
        { title: "Transport intérieur", minutes: 11 },
        { title: "Empotage et contrôle", minutes: 13 },
      ] },
      { title: "Le fret maritime", lessons: [
        { title: "Réserver un conteneur", minutes: 9 },
        { title: "Coûts portuaires et surestaries", minutes: 15 },
      ] },
    ],
  },
  {
    slug: "normes-certifications-export",
    category: "qualite",
    title: "Normes et Certifications à l'Export",
    subtitle: "Bio, phytosanitaire, traçabilité : passer les contrôles européens.",
    description:
      "L'accès au marché européen dépend du respect de normes précises. Cette formation explique les certifications attendues (bio, phytosanitaire, origine), comment les obtenir et comment documenter la traçabilité d'un lot.",
    outcomes: [
      "Connaître les normes exigées par l'Union européenne",
      "Préparer un dossier de certification",
      "Organiser la traçabilité d'un lot",
    ],
    requirements: ["Aucun"],
    level: "all",
    priceCents: 50000,
    thumbnailPath: "/photo_2026-09-29_14-17-00.jpg",
    sections: [
      { title: "Le cadre réglementaire", lessons: [
        { title: "Pourquoi les normes conditionnent l'accès au marché", minutes: 5, preview: true },
        { title: "Réglementation européenne : l'essentiel", minutes: 15 },
      ] },
      { title: "Certifications", lessons: [
        { title: "Certification biologique", minutes: 14 },
        { title: "Certificats phytosanitaires et d'origine", minutes: 12 },
        { title: "Traçabilité d'un lot", minutes: 11 },
      ] },
    ],
  },
  {
    slug: "securisation-paiements-credoc",
    category: "finance",
    title: "Sécurisation des Paiements (Credoc)",
    subtitle: "Crédit documentaire, garanties et encaissement sans mauvaise surprise.",
    description:
      "Le crédit documentaire reste l'outil de référence pour sécuriser un paiement international. Cette formation explique son fonctionnement, les documents exigés et les erreurs qui font rejeter une présentation.",
    outcomes: [
      "Comprendre le fonctionnement d'un crédit documentaire",
      "Préparer une présentation de documents conforme",
      "Comparer Credoc, remise documentaire et garanties",
    ],
    requirements: ["Notions de base en commerce international"],
    level: "advanced",
    priceCents: 120000,
    thumbnailPath: "/photo_2026-09-29_14-17-01.jpg",
    sections: [
      { title: "Les moyens de paiement internationaux", lessons: [
        { title: "Panorama et niveaux de risque", minutes: 7, preview: true },
        { title: "Remise documentaire", minutes: 12 },
      ] },
      { title: "Le crédit documentaire", lessons: [
        { title: "Acteurs et déroulement", minutes: 16 },
        { title: "Les documents exigés", minutes: 14 },
        { title: "Réserves et rejets : les éviter", minutes: 13 },
      ] },
      { title: "Garanties", lessons: [
        { title: "Garanties bancaires et stand-by", minutes: 12 },
      ] },
    ],
  },
  {
    slug: "penetrer-marche-europeen",
    category: "strategie",
    title: "Pénétrer le Marché Européen",
    subtitle: "Trouver ses premiers acheteurs européens et construire une relation durable.",
    description:
      "Identifier les bons segments, approcher importateurs et distributeurs, participer aux salons et construire une relation commerciale durable avec des acheteurs européens.",
    outcomes: [
      "Choisir un segment et un pays cible",
      "Approcher des importateurs qualifiés",
      "Préparer un salon professionnel",
    ],
    requirements: ["Avoir un produit ou une filière cible"],
    level: "intermediate",
    priceCents: 150000,
    thumbnailPath: "/negoce 1.jpeg",
    sections: [
      { title: "Stratégie", lessons: [
        { title: "Lire le marché européen", minutes: 8, preview: true },
        { title: "Choisir son segment", minutes: 13 },
      ] },
      { title: "Prospection", lessons: [
        { title: "Trouver et qualifier des importateurs", minutes: 15 },
        { title: "Réussir un salon professionnel", minutes: 12 },
        { title: "Fidéliser un acheteur", minutes: 10 },
      ] },
    ],
  },
  {
    slug: "identifier-fournisseurs-fiables",
    category: "sourcing",
    title: "Identifier les Fournisseurs Fiables",
    subtitle: "Sélectionner, auditer et contractualiser avec des producteurs africains.",
    description:
      "Comment trouver des coopératives et producteurs sérieux, vérifier leurs capacités et leur qualité, et construire un partenariat équitable et durable.",
    outcomes: [
      "Construire une grille de sélection fournisseurs",
      "Mener un audit terrain",
      "Contractualiser un partenariat équitable",
    ],
    requirements: ["Aucun"],
    level: "beginner",
    priceCents: 85000,
    thumbnailPath: "/negoce 2.jpeg",
    sections: [
      { title: "Trouver des fournisseurs", lessons: [
        { title: "Où chercher", minutes: 6, preview: true },
        { title: "Grille de sélection", minutes: 12 },
      ] },
      { title: "Vérifier et contractualiser", lessons: [
        { title: "L'audit terrain", minutes: 15 },
        { title: "Contrats d'approvisionnement", minutes: 13 },
      ] },
    ],
  },
  {
    slug: "optimisation-douaniere-incoterms",
    category: "douane",
    title: "Optimisation Douanière et Incoterms",
    subtitle: "Choisir le bon Incoterm et réduire légalement ses coûts douaniers.",
    description:
      "Les Incoterms 2020 expliqués par la pratique, les régimes douaniers utiles à l'export et les leviers légaux pour réduire les coûts de dédouanement.",
    outcomes: [
      "Choisir l'Incoterm adapté à chaque opération",
      "Comprendre la valeur en douane",
      "Utiliser les accords préférentiels",
    ],
    requirements: ["Aucun"],
    level: "all",
    priceCents: 60000,
    thumbnailPath: "/negoce3.jpeg",
    sections: [
      { title: "Les Incoterms", lessons: [
        { title: "À quoi servent les Incoterms", minutes: 5, preview: true },
        { title: "Les 11 Incoterms 2020", minutes: 18 },
      ] },
      { title: "La douane", lessons: [
        { title: "Valeur en douane et classement tarifaire", minutes: 14 },
        { title: "Accords préférentiels et origine", minutes: 12 },
      ] },
    ],
  },
  {
    slug: "redaction-contrats-vente",
    category: "juridique",
    title: "Rédaction de Contrats de Vente",
    subtitle: "Les clauses qui protègent le vendeur dans une vente internationale.",
    description:
      "Structure d'un contrat de vente internationale, clauses essentielles (qualité, livraison, paiement, force majeure, litiges) et modèles commentés.",
    outcomes: [
      "Structurer un contrat de vente international",
      "Rédiger les clauses essentielles",
      "Choisir loi applicable et mode de règlement des litiges",
    ],
    requirements: ["Notions de base en négoce"],
    level: "advanced",
    priceCents: 90000,
    thumbnailPath: "/negoce4.jpeg",
    sections: [
      { title: "Structure du contrat", lessons: [
        { title: "Pourquoi un contrat écrit", minutes: 5, preview: true },
        { title: "Les parties du contrat", minutes: 12 },
      ] },
      { title: "Clauses essentielles", lessons: [
        { title: "Qualité, quantité, livraison", minutes: 14 },
        { title: "Paiement et pénalités", minutes: 12 },
        { title: "Force majeure et litiges", minutes: 13 },
      ] },
    ],
  },
];
