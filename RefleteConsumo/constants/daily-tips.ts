// Ideias Diárias - Mensagens de Reflexão sobre Consumo Consciente
// Baseado no Projeto 1

export interface DailyTip {
  id: number;
  titulo: string;
  conteudo: string;
  categoria: 'reflexao' | 'tecnica' | 'historica' | 'inspiracao';
  autor?: string;
}

export const DAILY_TIPS: DailyTip[] = [
  {
    id: 1,
    titulo: 'Regra dos 30 Dias',
    conteudo:
      'Antes de fazer uma compra impulsiva, espere 30 dias. Se ainda quer o item depois desse período, é provável que seja uma necessidade genuína.',
    categoria: 'tecnica',
  },
  {
    id: 2,
    titulo: 'O Custo Real',
    conteudo:
      'Pense no custo em horas de trabalho. Se um artigo custa €50 e ganha €10/hora, custou-lhe 5 horas de trabalho. Vale a pena?',
    categoria: 'reflexao',
  },
  {
    id: 3,
    titulo: 'Diferenciar Necessidade de Desejo',
    conteudo:
      'Uma necessidade é algo que precisa para viver (comida, abrigo). Um desejo é algo que quer, mas não precisa. Antes de comprar, pergunte-se: é uma necessidade ou um desejo?',
    categoria: 'reflexao',
  },
  {
    id: 4,
    titulo: 'O Efeito da Novidade',
    conteudo:
      'A felicidade de uma compra nova dura tipicamente 3-6 meses. Depois, voltamos ao nível de felicidade anterior (adaptação hedónica).',
    categoria: 'historica',
  },
  {
    id: 5,
    titulo: 'Compras Emocionais',
    conteudo:
      'Quando se sente stressado, ansioso ou triste, evite fazer compras. Espere até se sentir melhor. 70% das compras impulsivas são emocionais.',
    categoria: 'tecnica',
  },
  {
    id: 6,
    titulo: 'Orçamento com Intenção',
    conteudo:
      'Crie um orçamento mensal e cumpra-o. Saiba quanto pode gastar em cada categoria. A disciplina é a chave para o consumo consciente.',
    categoria: 'tecnica',
  },
  {
    id: 7,
    titulo: 'O Poder do "Não"',
    conteudo:
      'Dizer não é uma habilidade. Cada não a uma compra impulsiva é um sim ao seu futuro financeiro.',
    categoria: 'inspiracao',
  },
  {
    id: 8,
    titulo: 'Compras Conscientes',
    conteudo:
      'Pergunte-se: De onde vem? Quanto tempo vai durar? Vai realmente usar? Como é produzido? Estas questões levam ao consumo consciente.',
    categoria: 'reflexao',
  },
  {
    id: 9,
    titulo: 'O Custo Ambiental',
    conteudo:
      'Cada compra tem um custo ambiental. Ao comprar menos, reduz o desperdício e ajuda o planeta. Consumir menos é consumir melhor.',
    categoria: 'inspiracao',
  },
  {
    id: 10,
    titulo: 'Satisfação Duradoura',
    conteudo:
      'Experiências trazem mais felicidade duradoura do que objetos. Invista em memórias, não em coisas.',
    categoria: 'reflexao',
  },
  {
    id: 11,
    titulo: 'Comparação Social',
    conteudo:
      'As redes sociais mostram vidas curadas. Não compare a sua vida com o que vê online. Cumpra com os seus próprios valores.',
    categoria: 'reflexao',
  },
  {
    id: 12,
    titulo: 'Compras de Oportunidade',
    conteudo:
      'Promoções e descontos criam urgência artificial. Não compre algo que não precisa porque está em desconto.',
    categoria: 'tecnica',
  },
  {
    id: 13,
    titulo: 'O Efeito Endowment',
    conteudo:
      'Tendemos a valorizar as coisas que possuímos mais do que deveríamos. Isto mantém-nos presos a compras antigas e desnecessárias.',
    categoria: 'historica',
  },
  {
    id: 14,
    titulo: 'Minimalismo Financeiro',
    conteudo:
      'Possui menos significa: menos dinheiro gasto, menos espaço necessário, menos stress. Comece a desintoxicar-se de posses.',
    categoria: 'inspiracao',
  },
  {
    id: 15,
    titulo: 'Reflexão Diária',
    conteudo:
      'Dedique 5 minutos por dia a pensar sobre o seu consumo. Qual foi a melhor compra? A mais impulsiva? O que aprendeu?',
    categoria: 'tecnica',
  },
  {
    id: 16,
    titulo: 'Efeito Decoy',
    conteudo:
      'Quando duas opções aparecem juntas, uma com mais "valor", você é influenciado a comprar a mais cara. Esteja ciente deste truque de marketing.',
    categoria: 'historica',
  },
  {
    id: 17,
    titulo: 'Comunidade Consciente',
    conteudo:
      'Rodeie-se de pessoas que valorizam consumo consciente. O comportamento é contagioso - melhore sua rede.',
    categoria: 'inspiracao',
  },
  {
    id: 18,
    titulo: 'Segunda Mão Primeiro',
    conteudo:
      'Antes de comprar novo, procure em plataformas de segunda mão. Economiza dinheiro, é amigo do ambiente e ainda é uma "caça ao tesouro".',
    categoria: 'tecnica',
  },
  {
    id: 19,
    titulo: 'Riqueza Real',
    conteudo:
      'A verdadeira riqueza não é o que você possui, mas o tempo que tem livre e a paz de espírito que usufrui.',
    categoria: 'reflexao',
  },
  {
    id: 20,
    titulo: 'Pausa Antes de Pagar',
    conteudo:
      'Adicione itens ao carrinho, mas não compre logo. Deixe no carrinho por 24 horas. Se ainda quer após esse tempo, reconsidere.',
    categoria: 'tecnica',
  },
  {
    id: 21,
    titulo: 'O Valor do Tempo',
    conteudo:
      'Ao invés de comprar, use seu tempo para crescer, aprender ou relaxar. Estas coisas trazem mais valor real.',
    categoria: 'reflexao',
  },
  {
    id: 22,
    titulo: 'Fisiologia do Consumo',
    conteudo:
      'Comprar liberta dopamina. Está biologicamente programado para gostar de consumo. Mas a emoção passa. Conhecer isto ajuda a resistir.',
    categoria: 'historica',
  },
  {
    id: 23,
    titulo: 'Poupança Invisível',
    conteudo:
      'Cada compra que evita é dinheiro poupado. Registre quanto economizou ao não comprar. A contabilidade positiva motiva.',
    categoria: 'tecnica',
  },
  {
    id: 24,
    titulo: 'Manutenção é Investimento',
    conteudo:
      'Cuidar bem do que já tem prolonga sua vida útil. Invista em manutenção, não em substituição prematura.',
    categoria: 'reflexao',
  },
  {
    id: 25,
    titulo: 'Transição Consciente',
    conteudo:
      'Não precisa de virar minimalista de um dia para o outro. Gradualmente, reduza consumo e aumente consciência.',
    categoria: 'inspiracao',
  },
  {
    id: 26,
    titulo: 'Publicidade e Influência',
    conteudo:
      'A publicidade é projetada para fazer-lhe querer o que não precisa. Reconheça a influência e faça escolhas independentes.',
    categoria: 'reflexao',
  },
  {
    id: 27,
    titulo: 'Felicidade Frugal',
    conteudo:
      'As pessoas frugais relatam maior satisfação de vida. Poupar e consumir conscientemente aumenta bem-estar.',
    categoria: 'inspiracao',
  },
  {
    id: 28,
    titulo: 'Ilusão de Necessidade',
    conteudo:
      'Pergunte-se: "Isto é uma necessidade ou uma ilusão de necessidade criada pelo marketing?" A resposta honesta é reveladora.',
    categoria: 'tecnica',
  },
  {
    id: 29,
    titulo: 'Impacto Social',
    conteudo:
      'Cada compra tem um impacto social. Investigue as práticas éticas das empresas onde compra. Seja um consumidor responsável.',
    categoria: 'reflexao',
  },
  {
    id: 30,
    titulo: 'Celebre Pequenas Vitórias',
    conteudo:
      'Cada vez que resiste a uma compra impulsiva, célébra-o. Está a reescrever o seu relacionamento com o consumo.',
    categoria: 'inspiracao',
  },
];

export function getDailyTip(): DailyTip {
  // Escolher dica baseada no dia do ano
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), 0, 0);
  const diff = (hoje.getTime() - inicio.getTime()) + (inicio.getTimezoneOffset() - hoje.getTimezoneOffset()) * 60 * 1000;
  const diaDoAno = Math.floor(diff / (24 * 60 * 60 * 1000));
  const index = diaDoAno % DAILY_TIPS.length;

  return DAILY_TIPS[index];
}

export function getTipById(id: number): DailyTip | undefined {
  return DAILY_TIPS.find((tip) => tip.id === id);
}

export function getRandomTip(): DailyTip {
  const index = Math.floor(Math.random() * DAILY_TIPS.length);
  return DAILY_TIPS[index];
}
