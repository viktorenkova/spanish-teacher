export type SpeakingAssessment = {
  complete: boolean;
  matchedSignals: Array<
    | "name"
    | "origin"
    | "get_up"
    | "breakfast"
    | "request"
    | "two_items"
    | "politeness"
    | "quantity"
    | "product"
    | "price_question"
    | "direction_question"
    | "place"
    | "ticket"
    | "destination"
    | "reservation"
    | "booking_name"
    | "food_order"
    | "bill_request"
    | "family_member"
    | "family_detail"
    | "leisure_activity"
    | "frequency"
    | "availability"
    | "plan_time"
    | "weather_condition"
    | "weather_feeling"
  >;
  feedback: string;
  version:
    | "introduction-task-v1"
    | "morning-routine-task-v1"
    | "cafe-order-task-v1"
    | "shopping-task-v1"
    | "directions-task-v1"
    | "transport-task-v1"
    | "hotel-checkin-task-v1"
    | "restaurant-task-v1"
    | "family-task-v1"
    | "free-time-task-v1"
    | "making-plans-task-v1"
    | "weather-task-v1";
};

export type SpeakingAssessorId =
  | "introduction"
  | "morning-routine"
  | "cafe-order"
  | "shopping"
  | "directions"
  | "transport"
  | "hotel-checkin"
  | "restaurant"
  | "family"
  | "free-time"
  | "making-plans"
  | "weather";

export type SpeakingAssessor = (transcript: string) => SpeakingAssessment;

function normalizeTranscript(transcript: string) {
  return transcript
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-ES")
    .replace(/[^a-zñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function assessMorningRoutineTranscript(transcript: string): SpeakingAssessment {
  const normalized = normalizeTranscript(transcript);
  const hasGetUp = /\b(me levanto|suelo levantarme)\b/.test(normalized);
  const hasBreakfast = /\b(desayuno|tomo el desayuno)\b/.test(normalized);
  const matchedSignals: SpeakingAssessment["matchedSignals"] = [];
  if (hasGetUp) matchedSignals.push("get_up");
  if (hasBreakfast) matchedSignals.push("breakfast");

  if (hasGetUp && hasBreakfast) {
    return {
      complete: true,
      matchedSignals,
      feedback:
        "Task complete: the transcript includes getting up and having breakfast. Pronunciation was not assessed.",
      version: "morning-routine-task-v1",
    };
  }

  const missing = [
    !hasGetUp ? "getting up with ‘Me levanto…’" : undefined,
    !hasBreakfast ? "breakfast with ‘desayuno’" : undefined,
  ].filter(Boolean).join(" and ");
  return {
    complete: false,
    matchedSignals,
    feedback: `Try once more and include ${missing}. The transcript may also need correction.`,
    version: "morning-routine-task-v1",
  };
}

export function assessCafeOrderTranscript(transcript: string): SpeakingAssessment {
  const normalized = normalizeTranscript(transcript);
  const hasRequest = /\b(quiero|quisiera|me pone|para mi)\b/.test(normalized);
  const orderedItems = normalized.match(/\b(cafe|agua|te|zumo|tostada|bocadillo|croissant)\b/g) ?? [];
  const hasTwoItems = new Set(orderedItems).size >= 2;
  const hasPoliteness = /\bpor favor\b/.test(normalized);
  const matchedSignals: SpeakingAssessment["matchedSignals"] = [];
  if (hasRequest) matchedSignals.push("request");
  if (hasTwoItems) matchedSignals.push("two_items");
  if (hasPoliteness) matchedSignals.push("politeness");

  if (hasRequest && hasTwoItems && hasPoliteness) {
    return {
      complete: true,
      matchedSignals,
      feedback:
        "Task complete: the transcript includes a request, two items, and “por favor”. Pronunciation was not assessed.",
      version: "cafe-order-task-v1",
    };
  }

  const missing = [
    !hasRequest ? "a request with ‘Quiero…’" : undefined,
    !hasTwoItems ? "two cafe items" : undefined,
    !hasPoliteness ? "‘por favor’" : undefined,
  ].filter(Boolean).join(" and ");
  return {
    complete: false,
    matchedSignals,
    feedback: `Try once more and include ${missing}. The transcript may also need correction.`,
    version: "cafe-order-task-v1",
  };
}

export function assessIntroductionTranscript(transcript: string): SpeakingAssessment {
  const normalized = normalizeTranscript(transcript);
  const hasName = /\b(me llamo|mi nombre es)\b/.test(normalized);
  const hasOrigin = /\b(soy de|vengo de)\b/.test(normalized);
  const matchedSignals: SpeakingAssessment["matchedSignals"] = [];
  if (hasName) matchedSignals.push("name");
  if (hasOrigin) matchedSignals.push("origin");

  if (hasName && hasOrigin) {
    return {
      complete: true,
      matchedSignals,
      feedback:
        "Task complete: the transcript includes your name and where you are from. Pronunciation was not assessed.",
      version: "introduction-task-v1",
    };
  }

  const missing = [!hasName ? "your name with ‘Me llamo…’" : undefined, !hasOrigin ? "your origin with ‘Soy de…’" : undefined]
    .filter(Boolean)
    .join(" and ");
  return {
    complete: false,
    matchedSignals,
    feedback: `Try once more and include ${missing}. The transcript may also need correction.`,
    version: "introduction-task-v1",
  };
}

export function assessShoppingTranscript(transcript: string): SpeakingAssessment {
  const normalized = normalizeTranscript(transcript);
  const hasQuantity = /\b(medio kilo|un kilo|dos kilos|una botella|dos botellas|un litro)\b/.test(normalized);
  const hasProduct = /\b(tomates|manzanas|naranjas|pan|agua|leche)\b/.test(normalized);
  const hasPriceQuestion = /\b(cuanto cuesta|cuanto es|que precio tiene)\b/.test(normalized);
  const matchedSignals: SpeakingAssessment["matchedSignals"] = [];
  if (hasQuantity) matchedSignals.push("quantity");
  if (hasProduct) matchedSignals.push("product");
  if (hasPriceQuestion) matchedSignals.push("price_question");
  const complete = hasQuantity && hasProduct && hasPriceQuestion;

  return {
    complete,
    matchedSignals,
    feedback: complete
      ? "Task complete: you asked for a quantity of a product and asked the price. Pronunciation was not assessed."
      : "Try again with a quantity, a product, and “¿Cuánto cuesta?”. The transcript may also need correction.",
    version: "shopping-task-v1",
  };
}

export function assessDirectionsTranscript(transcript: string): SpeakingAssessment {
  const normalized = normalizeTranscript(transcript);
  const hasQuestion = /\b(donde esta|como llego|como puedo llegar)\b/.test(normalized);
  const hasPlace = /\b(estacion|farmacia|museo|hotel|centro|metro|plaza)\b/.test(normalized);
  const matchedSignals: SpeakingAssessment["matchedSignals"] = [];
  if (hasQuestion) matchedSignals.push("direction_question");
  if (hasPlace) matchedSignals.push("place");
  const complete = hasQuestion && hasPlace;

  return {
    complete,
    matchedSignals,
    feedback: complete
      ? "Task complete: you asked how to find a place. Pronunciation was not assessed."
      : "Try again with “¿Dónde está…?” or “¿Cómo llego a…?” and name a place.",
    version: "directions-task-v1",
  };
}

export function assessTransportTranscript(transcript: string): SpeakingAssessment {
  const normalized = normalizeTranscript(transcript);
  const hasTicket = /\b(un billete|dos billetes|billete de ida|billete de ida y vuelta)\b/.test(normalized);
  const hasDestination = /\b(para|a)\s+(madrid|barcelona|valencia|sevilla|malaga|toledo|granada)\b/.test(normalized);
  const matchedSignals: SpeakingAssessment["matchedSignals"] = [];
  if (hasTicket) matchedSignals.push("ticket");
  if (hasDestination) matchedSignals.push("destination");
  const complete = hasTicket && hasDestination;

  return {
    complete,
    matchedSignals,
    feedback: complete
      ? "Task complete: you requested a ticket and gave a destination. Pronunciation was not assessed."
      : "Try again with “Un billete para…” and add a destination.",
    version: "transport-task-v1",
  };
}

export function assessHotelCheckinTranscript(transcript: string): SpeakingAssessment {
  const normalized = normalizeTranscript(transcript);
  const hasReservation = /\b(tengo una reserva|he reservado|tengo reserva)\b/.test(normalized);
  const hasBookingName = /\b(a nombre de|me llamo|mi nombre es)\b/.test(normalized);
  const matchedSignals: SpeakingAssessment["matchedSignals"] = [];
  if (hasReservation) matchedSignals.push("reservation");
  if (hasBookingName) matchedSignals.push("booking_name");
  const complete = hasReservation && hasBookingName;

  return {
    complete,
    matchedSignals,
    feedback: complete
      ? "Task complete: you said you have a reservation and gave the booking name. Pronunciation was not assessed."
      : "Try again with “Tengo una reserva” and “a nombre de…”.",
    version: "hotel-checkin-task-v1",
  };
}

export function assessRestaurantTranscript(transcript: string): SpeakingAssessment {
  const normalized = normalizeTranscript(transcript);
  const hasFoodOrder = /\b(quiero|para mi|me pone|voy a tomar)\b/.test(normalized)
    && /\b(tortilla|ensalada|sopa|pollo|pescado|paella|agua|vino)\b/.test(normalized);
  const hasBillRequest = /\b(la cuenta|puede traer la cuenta|me trae la cuenta)\b/.test(normalized);
  const matchedSignals: SpeakingAssessment["matchedSignals"] = [];
  if (hasFoodOrder) matchedSignals.push("food_order");
  if (hasBillRequest) matchedSignals.push("bill_request");
  const complete = hasFoodOrder && hasBillRequest;
  return {
    complete,
    matchedSignals,
    feedback: complete
      ? "Task complete: you ordered food and asked for the bill. Pronunciation was not assessed."
      : "Try again with a food order and “La cuenta, por favor”.",
    version: "restaurant-task-v1",
  };
}

export function assessFamilyTranscript(transcript: string): SpeakingAssessment {
  const normalized = normalizeTranscript(transcript);
  const hasFamilyMember = /\b(madre|padre|hermana|hermano|hija|hijo|pareja|marido|mujer)\b/.test(normalized);
  const hasDetail = /\b(se llama|vive|tiene|es|trabaja)\b/.test(normalized);
  const matchedSignals: SpeakingAssessment["matchedSignals"] = [];
  if (hasFamilyMember) matchedSignals.push("family_member");
  if (hasDetail) matchedSignals.push("family_detail");
  const complete = hasFamilyMember && hasDetail;
  return {
    complete,
    matchedSignals,
    feedback: complete
      ? "Task complete: you mentioned a family member and gave one detail. Pronunciation was not assessed."
      : "Try again: name a family member and add one detail, for example “Mi hermana se llama Ana”.",
    version: "family-task-v1",
  };
}

export function assessFreeTimeTranscript(transcript: string): SpeakingAssessment {
  const normalized = normalizeTranscript(transcript);
  const hasActivity = /\b(leer|leo|caminar|camino|correr|corro|cocinar|cocino|bailar|bailo|nadar|nado|ver series|veo series)\b/.test(normalized);
  const hasFrequency = /\b(siempre|normalmente|a veces|los fines de semana|cada dia|por la tarde)\b/.test(normalized);
  const matchedSignals: SpeakingAssessment["matchedSignals"] = [];
  if (hasActivity) matchedSignals.push("leisure_activity");
  if (hasFrequency) matchedSignals.push("frequency");
  const complete = hasActivity && hasFrequency;
  return {
    complete,
    matchedSignals,
    feedback: complete
      ? "Task complete: you described a free-time activity and said when or how often you do it. Pronunciation was not assessed."
      : "Try again with an activity and a frequency phrase such as “a veces” or “los fines de semana”.",
    version: "free-time-task-v1",
  };
}

export function assessMakingPlansTranscript(transcript: string): SpeakingAssessment {
  const normalized = normalizeTranscript(transcript);
  const hasAvailability = /\b(puedo|no puedo|estoy libre|te va bien|quedamos)\b/.test(normalized);
  const hasTime = /\b(hoy|manana|el viernes|el sabado|el domingo|a las [a-z]+|por la tarde|por la manana|por la noche)\b/.test(normalized);
  const matchedSignals: SpeakingAssessment["matchedSignals"] = [];
  if (hasAvailability) matchedSignals.push("availability");
  if (hasTime) matchedSignals.push("plan_time");
  const complete = hasAvailability && hasTime;
  return {
    complete,
    matchedSignals,
    feedback: complete
      ? "Task complete: you said when you are available and included a time or day. Pronunciation was not assessed."
      : "Try again with “Puedo…” or “Quedamos…” and add a day or time.",
    version: "making-plans-task-v1",
  };
}

export function assessWeatherTranscript(transcript: string): SpeakingAssessment {
  const normalized = normalizeTranscript(transcript);
  const hasWeather = /\b(hace sol|hace frio|hace calor|llueve|esta nublado|hace viento)\b/.test(normalized);
  const hasFeeling = /\b(tengo frio|tengo calor|me gusta|no me gusta|necesito chaqueta|llevo chaqueta)\b/.test(normalized);
  const matchedSignals: SpeakingAssessment["matchedSignals"] = [];
  if (hasWeather) matchedSignals.push("weather_condition");
  if (hasFeeling) matchedSignals.push("weather_feeling");
  const complete = hasWeather && hasFeeling;
  return {
    complete,
    matchedSignals,
    feedback: complete
      ? "Task complete: you described the weather and added how it affects you. Pronunciation was not assessed."
      : "Try again with a weather phrase and one personal comment, for example “Hace frío. Necesito chaqueta.”",
    version: "weather-task-v1",
  };
}

export const speakingAssessors: Record<SpeakingAssessorId, SpeakingAssessor> = {
  introduction: assessIntroductionTranscript,
  "morning-routine": assessMorningRoutineTranscript,
  "cafe-order": assessCafeOrderTranscript,
  shopping: assessShoppingTranscript,
  directions: assessDirectionsTranscript,
  transport: assessTransportTranscript,
  "hotel-checkin": assessHotelCheckinTranscript,
  restaurant: assessRestaurantTranscript,
  family: assessFamilyTranscript,
  "free-time": assessFreeTimeTranscript,
  "making-plans": assessMakingPlansTranscript,
  weather: assessWeatherTranscript,
};

export function getSpeakingAssessor(id: SpeakingAssessorId): SpeakingAssessor {
  return speakingAssessors[id];
}
