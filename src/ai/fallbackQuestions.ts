import type { QuestionData } from '../types.js';

// ~40 curated fallback questions, interleaved across themes so consecutive
// questions are always from different categories.
// Themes: Pokémon (P), Gaming (G), Réseaux sociaux (R), Culture ado (C), Drôle (D)

export const FALLBACK_QUESTIONS: QuestionData[] = [

  // P
  {
    question: 'Quel est le type de Ronflex ?',
    type: 'multiple_choice',
    choices: ['Normal', 'Eau', 'Psy', 'Sol'],
    correct_answer: 'Normal',
  },
  // G
  {
    question: 'En quelle année est sorti Minecraft ?',
    type: 'multiple_choice',
    choices: ['2011', '2009', '2013', '2008'],
    correct_answer: '2011',
  },
  // R
  {
    question: 'Quelle entreprise a créé TikTok ?',
    type: 'multiple_choice',
    choices: ['ByteDance', 'Meta', 'Tencent', 'Alibaba'],
    correct_answer: 'ByteDance',
  },
  // C
  {
    question: 'Quel acteur joue Iron Man dans le MCU ?',
    type: 'multiple_choice',
    choices: ['Robert Downey Jr.', 'Chris Evans', 'Chris Hemsworth', 'Mark Ruffalo'],
    correct_answer: 'Robert Downey Jr.',
  },
  // D
  {
    question: 'Si Pikachu mange des pâtes, c\'est quoi ?',
    type: 'multiple_choice',
    choices: ['Pâtachu', 'Élec-tagliatelles', 'Ravichu', 'Spaghé-lectrique'],
    correct_answer: 'Pâtachu',
  },

  // P
  {
    question: 'Combien de Pokémon dans la Gen 1 ?',
    type: 'multiple_choice',
    choices: ['151', '150', '152', '251'],
    correct_answer: '151',
  },
  // G
  {
    question: 'Quel jeu a popularisé le Battle Royale ?',
    type: 'multiple_choice',
    choices: ['PUBG', 'Fortnite', 'Warzone', 'Apex Legends'],
    correct_answer: 'PUBG',
  },
  // R
  {
    question: 'En quelle année Instagram a été racheté par Facebook ?',
    type: 'multiple_choice',
    choices: ['2012', '2014', '2010', '2016'],
    correct_answer: '2012',
  },
  // C
  {
    question: 'Squid Game vient de quel pays ?',
    type: 'multiple_choice',
    choices: ['Corée du Sud', 'Japon', 'Chine', 'Thaïlande'],
    correct_answer: 'Corée du Sud',
  },
  // D
  {
    question: 'Quel est le meilleur Pokémon Gen 1 selon les fans ?',
    type: 'multiple_choice',
    choices: ['Mewtwo', 'Pikachu', 'Ronflex', 'Magicarpe (ironie)'],
    correct_answer: 'Mewtwo',
  },

  // P
  {
    question: 'Quel Pokémon est le n°1 du Pokédex ?',
    type: 'multiple_choice',
    choices: ['Bulbizarre', 'Salamèche', 'Carapuce', 'Pikachu'],
    correct_answer: 'Bulbizarre',
  },
  // G
  {
    question: 'Dans GTA 5, combien de personnages jouables ?',
    type: 'multiple_choice',
    choices: ['3', '2', '4', '1'],
    correct_answer: '3',
  },
  // R
  {
    question: 'Quel YouTubeur a le plus d\'abonnés en 2024 ?',
    type: 'multiple_choice',
    choices: ['MrBeast', 'PewDiePie', 'T-Series', 'Cocomelon'],
    correct_answer: 'MrBeast',
  },
  // C
  {
    question: 'Quel rappeur s\'appelle Aubrey Drake Graham ?',
    type: 'multiple_choice',
    choices: ['Drake', 'Lil Wayne', 'Future', 'Travis Scott'],
    correct_answer: 'Drake',
  },
  // D
  {
    question: 'Combien de vies a un chat selon la légende ?',
    type: 'multiple_choice',
    choices: ['9', '7', '3', '13'],
    correct_answer: '9',
  },

  // P
  {
    question: 'De quel type est Dracolosse ?',
    type: 'multiple_choice',
    choices: ['Dragon / Vol', 'Feu / Dragon', 'Dragon / Normal', 'Sol / Dragon'],
    correct_answer: 'Dragon / Vol',
  },
  // G
  {
    question: 'Quel jeu utilise des "V-Bucks" comme monnaie ?',
    type: 'multiple_choice',
    choices: ['Fortnite', 'Roblox', 'Minecraft', 'GTA Online'],
    correct_answer: 'Fortnite',
  },
  // R
  {
    question: 'Combien de caractères max dans un post X (Twitter) ?',
    type: 'multiple_choice',
    choices: ['280', '140', '500', '240'],
    correct_answer: '280',
  },
  // C
  {
    question: 'Dans quelle série trouve-t-on le personnage "Eleven" ?',
    type: 'multiple_choice',
    choices: ['Stranger Things', 'Dark', 'The OA', 'Black Mirror'],
    correct_answer: 'Stranger Things',
  },
  // D
  {
    question: 'Quelle couleur est le ciel par beau temps ?',
    type: 'multiple_choice',
    choices: ['Bleu', 'Gris (en France)', 'Noir la nuit', 'Ça dépend du filtre'],
    correct_answer: 'Bleu',
  },

  // P
  {
    question: "Quelle est l'attaque signature de Pikachu ?",
    type: 'multiple_choice',
    choices: ['Fatal-Foudre', 'Tonnerre', 'Éclair', 'Électacle'],
    correct_answer: 'Fatal-Foudre',
  },
  // G
  {
    question: 'Sur quelle console est sorti Zelda BOTW à l\'origine ?',
    type: 'multiple_choice',
    choices: ['Wii U', 'Switch', '3DS', 'Wii'],
    correct_answer: 'Wii U',
  },
  // R
  {
    question: 'Quel réseau social a inventé les "Stories" ?',
    type: 'multiple_choice',
    choices: ['Snapchat', 'Instagram', 'TikTok', 'Facebook'],
    correct_answer: 'Snapchat',
  },
  // C
  {
    question: 'Quel film Pixar raconte l\'histoire de jouets vivants ?',
    type: 'multiple_choice',
    choices: ['Toy Story', 'Cars', 'Up', 'Ratatouille'],
    correct_answer: 'Toy Story',
  },
  // D
  {
    question: 'Quel champion Space Invaders connais-tu ?',
    type: 'multiple_choice',
    choices: ['Toi !', 'Ton pote', 'Personne', "L'IA qui joue seule"],
    correct_answer: 'Toi !',
  },

  // P
  {
    question: 'Quelle ville abrite la 1ère arène de Kanto ?',
    type: 'multiple_choice',
    choices: ['Argenta', 'Jadielle', 'Joëlville', 'Lavanville'],
    correct_answer: 'Jadielle',
  },
  // G
  {
    question: 'Quelle entreprise fabrique la PlayStation ?',
    type: 'multiple_choice',
    choices: ['Sony', 'Microsoft', 'Nintendo', 'Sega'],
    correct_answer: 'Sony',
  },
  // R
  {
    question: "Qu'est-ce qu'un \"ratio\" sur X/Twitter ?",
    type: 'multiple_choice',
    choices: ["Plus de RT que de likes", "Bloquer quelqu'un", 'Un tag massif', 'Un mème viral'],
    correct_answer: 'Plus de RT que de likes',
  },
  // C
  {
    question: 'Dans quel club joue Mbappé depuis 2024 ?',
    type: 'multiple_choice',
    choices: ['Real Madrid', 'PSG', 'Liverpool', 'Bayern Munich'],
    correct_answer: 'Real Madrid',
  },

  // P
  {
    question: "Combien d'évolutions a Évoli ?",
    type: 'multiple_choice',
    choices: ['8', '7', '6', '9'],
    correct_answer: '8',
  },
  // G
  {
    question: 'Quel personnage dit "It\'s-a me, Mario !" ?',
    type: 'multiple_choice',
    choices: ['Mario', 'Luigi', 'Toad', 'Waluigi'],
    correct_answer: 'Mario',
  },
  // C
  {
    question: 'Quelle série Netflix parle de drogues à Albuquerque ?',
    type: 'multiple_choice',
    choices: ['Breaking Bad', 'Narcos', 'Ozark', 'Better Call Saul'],
    correct_answer: 'Breaking Bad',
  },

  // P
  {
    question: 'Quel Pokémon légendaire peut tout créer ?',
    type: 'multiple_choice',
    choices: ['Arceus', 'Mew', 'Mewtwo', 'Dialga'],
    correct_answer: 'Arceus',
  },
  // G
  {
    question: 'Quel jeu se passe dans un open world nommé Hyrule ?',
    type: 'multiple_choice',
    choices: ['The Legend of Zelda', 'Skyrim', 'Elden Ring', 'Dark Souls'],
    correct_answer: 'The Legend of Zelda',
  },

  // P
  {
    question: 'Dans quel jeu Pokémon GO est sorti ?',
    type: 'multiple_choice',
    choices: ['Sur mobile', 'Switch', '3DS', 'PC'],
    correct_answer: 'Sur mobile',
  },
  // G
  {
    question: 'Combien de joueurs max en mode standard sur Fortnite ?',
    type: 'multiple_choice',
    choices: ['100', '50', '64', '150'],
    correct_answer: '100',
  },

  // P
  {
    question: 'Quel Pokémon évolue avec une Pierre Eau ?',
    type: 'multiple_choice',
    choices: ['Staross', 'Magicarpe', 'Tentacruel', 'Aquali'],
    correct_answer: 'Staross',
  },
  // G
  {
    question: 'Quel FPS se déroule dans l\'espace avec des Spartiates ?',
    type: 'multiple_choice',
    choices: ['Halo', 'Destiny', 'Mass Effect', 'Titanfall'],
    correct_answer: 'Halo',
  },
];
