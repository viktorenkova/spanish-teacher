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
} as const satisfies Record<string, ListeningClip>;

export type ListeningClipId = keyof typeof listeningClips;

export function getListeningClip(id: string): ListeningClip | undefined {
  return listeningClips[id as ListeningClipId];
}
