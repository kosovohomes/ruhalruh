import type { LanguageCode } from "@/lib/conversation/types";

export interface SupportCopy {
  offer: string;
  accepted: string;
  declined: string;
  noResources: string;
  declinedResponse: string;
}

const COPY: Record<LanguageCode, SupportCopy> = {
  en: {
    offer:
      "I noticed something in your last message that may need care. Would you like to see support options?",
    accepted: "Yes, please show me support options.",
    declined: "No, thank you.",
    noResources:
      "No reviewed support services are available for this region yet. If you are in immediate danger, contact your local emergency number.",
    declinedResponse: "Understood. We can continue here.",
  },
  ar: {
    offer:
      "لاحظتُ شيئًا في رسالتك الأخيرة قد يحتاج إلى رعاية. هل تود الاطلاع على خيارات الدعم؟",
    accepted: "نعم، من فضلك أرني خيارات الدعم.",
    declined: "لا، شكرًا لك.",
    noResources:
      "لا توجد خدمات دعم مُراجعة لهذه المنطقة بعد. إذا كنت في خطر مباشر، اتصل برقم الطوارئ المحلي.",
    declinedResponse: "فهمت. يمكننا الاستمرار في الحديث هنا.",
  },
  es: {
    offer:
      "Noté algo en tu último mensaje que quizá necesite cuidado. ¿Quieres ver opciones de apoyo?",
    accepted: "Sí, por favor muéstrame opciones de apoyo.",
    declined: "No, gracias.",
    noResources:
      "Todavía no hay servicios de apoyo revisados para esta región. Si estás en peligro inmediato, contacta con el número de emergencia local.",
    declinedResponse: "Entendido. Podemos seguir hablando aquí.",
  },
  fr: {
    offer:
      "J'ai remarqué quelque chose dans ton dernier message qui mérite peut-être de l'attention. Veux-tu voir des options de soutien ?",
    accepted: "Oui, montre-moi les options de soutien, s'il te plaît.",
    declined: "Non, merci.",
    noResources:
      "Aucun service de soutien validé n'est encore disponible pour cette région. Si tu es en danger immédiat, contacte le numéro d'urgence local.",
    declinedResponse: "Compris. Nous pouvons continuer ici.",
  },
  de: {
    offer:
      "Ich habe in deiner letzten Nachricht etwas bemerkt, das vielleicht Aufmerksamkeit braucht. Möchtest du Unterstützungsmöglichkeiten sehen?",
    accepted: "Ja, bitte zeige mir Unterstützungsmöglichkeiten.",
    declined: "Nein, danke.",
    noResources:
      "Für diese Region gibt es noch keine geprüften Unterstützungsangebote. Wenn du in unmittelbarer Gefahr bist, rufe die örtliche Notrufnummer an.",
    declinedResponse: "Verstanden. Wir können hier weitermachen.",
  },
  zh: {
    offer: "我注意到你上一条消息里有些内容可能需要关照。你愿意看看支持选项吗？",
    accepted: "好的，请给我看支持选项。",
    declined: "不用了，谢谢。",
    noResources: "目前还没有针对这个地区经过审核的支持服务。如果你正处于危险中，请联系当地的紧急电话。",
    declinedResponse: "明白了。我们可以继续在这里交谈。",
  },
  hi: {
    offer:
      "मुझे आपके पिछले संदेश में कुछ ऐसा दिखा जिस पर शायद ध्यान देने की ज़रूरत है। क्या आप सहायता के विकल्प देखना चाहेंगे?",
    accepted: "हाँ, कृपया सहायता के विकल्प दिखाएँ।",
    declined: "नहीं, धन्यवाद।",
    noResources:
      "इस क्षेत्र के लिए अभी कोई समीक्षित सहायता सेवा उपलब्ध नहीं है। यदि आप तुरंत खतरे में हैं, तो अपने स्थानीय आपदा नंबर पर कॉल करें।",
    declinedResponse: "समझ गया। हम यहाँ बात करते रह सकते हैं।",
  },
  pt: {
    offer:
      "Notei algo na tua última mensagem que talvez precise de cuidado. Queres ver opções de apoio?",
    accepted: "Sim, por favor mostra-me opções de apoio.",
    declined: "Não, obrigado.",
    noResources:
      "Ainda não há serviços de apoio revisados para esta região. Se estiveres em perigo imediato, contacta o número de emergência local.",
    declinedResponse: "Entendido. Podemos continuar aqui.",
  },
};

export function getSupportCopy(language: LanguageCode): SupportCopy {
  return COPY[language];
}
