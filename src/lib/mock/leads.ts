import type { Lead } from "./types";

export const LEADS: Lead[] = [
  {
    id: "1",
    name: "Maria S.",
    phone: "(09) 9999-1111",
    date: "15/05",
    time: "14:32",
    status: "Pendente",
    source: "QR Code",
    msg: "Vocês entregam nos Jardins? Preciso de 2 pizzas grandes para hoje.",
  },
  {
    id: "2",
    name: "João P.",
    phone: "(09) 8888-2222",
    date: "15/05",
    time: "11:15",
    status: "Contatado",
    source: "Busca",
    msg: "Preços do menu, por favor.",
  },
  {
    id: "3",
    name: "Ana C.",
    phone: "(09) 7777-3333",
    date: "14/05",
    time: "09:47",
    status: "Convertido",
    source: "Direto",
    msg: "Reserva de mesa para 4.",
  },
];
