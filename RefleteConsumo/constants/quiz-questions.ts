// Quiz de Autorreflexão - Baseado no Projeto 1
// Escala: Nunca (1), Raramente (2), Frequentemente (3), Sempre (4)

export interface QuizQuestion {
  id: number;
  pergunta: string;
  opcoes: string[];
  valores: number[]; // Correspondência numérica das opções
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    pergunta: "Com que frequência compra produtos sem os ter planeado?",
    opcoes: ["Nunca", "Raramente", "Frequentemente", "Sempre"],
    valores: [1, 2, 3, 4],
  },
  {
    id: 2,
    pergunta: "Sente impulso de comprar quando tem dinheiro disponível?",
    opcoes: ["Nunca", "Raramente", "Frequentemente", "Sempre"],
    valores: [1, 2, 3, 4],
  },
  {
    id: 3,
    pergunta: "Compra para melhorar o seu humor ou lidar com stresse?",
    opcoes: ["Nunca", "Raramente", "Frequentemente", "Sempre"],
    valores: [1, 2, 3, 4],
  },
  {
    id: 4,
    pergunta: "Planifica as compras com antecedência?",
    opcoes: ["Sempre", "Frequentemente", "Raramente", "Nunca"],
    valores: [4, 3, 2, 1], // Inversa: quanto menos planifica, mais compulsivo
  },
  {
    id: 5,
    pergunta: "Reconsidera uma compra antes de finalizar?",
    opcoes: ["Sempre", "Frequentemente", "Raramente", "Nunca"],
    valores: [4, 3, 2, 1], // Inversa
  },
  {
    id: 6,
    pergunta: "Entra em lojas/apps com intenção de 'só ver'?",
    opcoes: ["Nunca", "Raramente", "Frequentemente", "Sempre"],
    valores: [1, 2, 3, 4],
  },
  {
    id: 7,
    pergunta: "Sente culpa ou arrependimento após comprar?",
    opcoes: ["Nunca", "Raramente", "Frequentemente", "Sempre"],
    valores: [1, 2, 3, 4],
  },
  {
    id: 8,
    pergunta: "Consegue resistir a promoções/descontos?",
    opcoes: ["Sempre", "Frequentemente", "Raramente", "Nunca"],
    valores: [4, 3, 2, 1], // Inversa
  },
  {
    id: 9,
    pergunta: "Compra itens que não usa ou esqueceu que tinha?",
    opcoes: ["Nunca", "Raramente", "Frequentemente", "Sempre"],
    valores: [1, 2, 3, 4],
  },
  {
    id: 10,
    pergunta: "O seu budget/orçamento é cumprido?",
    opcoes: ["Sempre", "Frequentemente", "Raramente", "Nunca"],
    valores: [4, 3, 2, 1], // Inversa
  },
];

export interface QuizResult {
  score: number;
  perfil: "consciente" | "normal" | "compulsivo";
  descricao: string;
  dicas: string[];
}

export function calcularQuizResult(respostas: number[]): QuizResult {
  const score = respostas.reduce((acc, curr) => acc + curr, 0);

  if (score <= 13) {
    return {
      score,
      perfil: "consciente",
      descricao:
        "Parabéns! Você demonstra hábitos de consumo muito conscientes. Continue assim!",
      dicas: [
        "Mantenha a sua reflexão antes de comprar",
        "Partilhe dicas com outros",
        "Ajude amigos com hábitos menos conscientes",
      ],
    };
  } else if (score <= 26) {
    return {
      score,
      perfil: "normal",
      descricao:
        "Você tem hábitos de consumo moderados. Existem oportunidades de melhorar a sua consciência.",
      dicas: [
        "Tente usar a funcionalidade 'Período de Reflexão' para os desejos",
        "Acompanhe o seu orçamento regularmente",
        "Reflita nas compras impulsivas que fez",
      ],
    };
  } else {
    return {
      score,
      perfil: "compulsivo",
      descricao:
        "Você pode ter padrões de consumo compulsivos. Esta app foi criada para o ajudar!",
      dicas: [
        "Use períodos de reflexão de 7 dias ou mais",
        "Reveja o seu orçamento mensal",
        "Converse com alguém de confiança sobre seus hábitos",
      ],
    };
  }
}
