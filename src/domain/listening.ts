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
} as const satisfies Record<string, ListeningClip>;

export type ListeningClipId = keyof typeof listeningClips;

export function getListeningClip(id: string): ListeningClip | undefined {
  return listeningClips[id as ListeningClipId];
}
