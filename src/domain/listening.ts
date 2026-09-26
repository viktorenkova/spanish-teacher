export type ListeningClip = {
  id: string;
  text: string;
  locale: "es-ES";
  rate: number;
  sourceReference: string;
  license: "Project-authored";
  attribution: "Spanish Coach";
};

export const listeningClips = {
  "introduction-lucia": {
    id: "introduction-lucia",
    text: "Hola, me llamo Lucía. Soy de Madrid.",
    locale: "es-ES",
    rate: 0.9,
    sourceReference: "internal:mvp-listening-v1",
    license: "Project-authored",
    attribution: "Spanish Coach",
  },
  "routine-marta": {
    id: "routine-marta",
    text: "Por la mañana, me levanto a las siete y desayuno.",
    locale: "es-ES",
    rate: 0.9,
    sourceReference: "internal:mvp-daily-routines-v1",
    license: "Project-authored",
    attribution: "Spanish Coach",
  },
  "cafe-order-ana": {
    id: "cafe-order-ana",
    text: "Quiero un café con leche y agua, por favor.",
    locale: "es-ES",
    rate: 0.9,
    sourceReference: "internal:mvp-cafe-ordering-v1",
    license: "Project-authored",
    attribution: "Spanish Coach",
  },
  "cafe-con-sin": {
    id: "cafe-con-sin",
    text: "Un café con leche, sin azúcar.",
    locale: "es-ES",
    rate: 0.9,
    sourceReference: "internal:mvp-cafe-ordering-v1",
    license: "Project-authored",
    attribution: "Spanish Coach",
  },
  "market-apples": {
    id: "market-apples",
    text: "Un kilo de manzanas cuesta tres euros.",
    locale: "es-ES",
    rate: 0.9,
    sourceReference: "internal:mvp-shopping-v1",
    license: "Project-authored",
    attribution: "Spanish Coach",
  },
  "directions-station": {
    id: "directions-station",
    text: "La estación está a la derecha, después del banco.",
    locale: "es-ES",
    rate: 0.9,
    sourceReference: "internal:mvp-directions-v1",
    license: "Project-authored",
    attribution: "Spanish Coach",
  },
  "train-valencia": {
    id: "train-valencia",
    text: "El tren para Valencia sale a las nueve y media.",
    locale: "es-ES",
    rate: 0.9,
    sourceReference: "internal:mvp-transport-v1",
    license: "Project-authored",
    attribution: "Spanish Coach",
  },
  "hotel-room-214": {
    id: "hotel-room-214",
    text: "Su habitación es la doscientos catorce, en la segunda planta.",
    locale: "es-ES",
    rate: 0.9,
    sourceReference: "internal:mvp-hotel-checkin-v1",
    license: "Project-authored",
    attribution: "Spanish Coach",
  },
  "restaurant-order": {
    id: "restaurant-order",
    text: "Para mí, la ensalada y agua, por favor.",
    locale: "es-ES",
    rate: 0.9,
    sourceReference: "internal:mvp-restaurant-v1",
    license: "Project-authored",
    attribution: "Spanish Coach",
  },
  "family-ana": {
    id: "family-ana",
    text: "Mi madre se llama Ana y trabaja en un hospital.",
    locale: "es-ES",
    rate: 0.9,
    sourceReference: "internal:mvp-family-v1",
    license: "Project-authored",
    attribution: "Spanish Coach",
  },
  "free-time-diego": {
    id: "free-time-diego",
    text: "Los sábados corro por la mañana y a veces cocino por la noche.",
    locale: "es-ES",
    rate: 0.9,
    sourceReference: "internal:mvp-free-time-v1",
    license: "Project-authored",
    attribution: "Spanish Coach",
  },
  "plans-saturday": {
    id: "plans-saturday",
    text: "Quedamos el sábado a las seis de la tarde.",
    locale: "es-ES",
    rate: 0.9,
    sourceReference: "internal:mvp-making-plans-v1",
    license: "Project-authored",
    attribution: "Spanish Coach",
  },
  "weather-madrid": {
    id: "weather-madrid",
    text: "Hoy en Madrid hace sol, pero hace bastante frío.",
    locale: "es-ES",
    rate: 0.9,
    sourceReference: "internal:mvp-weather-v1",
    license: "Project-authored",
    attribution: "Spanish Coach",
  },
} as const satisfies Record<string, ListeningClip>;

export type ListeningClipId = keyof typeof listeningClips;

export function getListeningClip(id: string): ListeningClip | undefined {
  return listeningClips[id as ListeningClipId];
}
