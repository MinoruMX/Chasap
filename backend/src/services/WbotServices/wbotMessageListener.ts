import * as Sentry from "@sentry/node";
import { writeFile } from "fs";
import { head, isNil } from "lodash";
import path, { join } from "path";
import { promisify } from "util";

import { map_msg } from "../../utils/global";

import {
  downloadMediaMessage,
  extractMessageContent,
  getContentType,
  jidNormalizedUser,
  MessageUpsertType,
  proto,
  WAMessage,
  WAMessageStubType,
  WAMessageUpdate,
  delay,
  Chat,
  WASocket,
} from "@whiskeysockets/baileys";
import Contact from "../../models/Contact";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import { Mutex } from "async-mutex";

import {
  AudioConfig,
  SpeechConfig,
  SpeechSynthesizer
} from "microsoft-cognitiveservices-speech-sdk";
import moment from "moment";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import { Op } from "sequelize";
import { debounce } from "../../helpers/Debounce";
import formatBody from "../../helpers/Mustache";
import ffmpeg from "fluent-ffmpeg";
import { cacheLayer } from "../../libs/cache";
import { getIO } from "../../libs/socket";
import { Store } from "../../libs/store";
import MarkDeleteWhatsAppMessage from "./MarkDeleteWhatsAppMessage";
import Campaign from "../../models/Campaign";
import * as MessageUtils from "./wbotGetMessageFromType";
import CampaignShipping from "../../models/CampaignShipping";
import Queue from "../../models/Queue";
import QueueIntegrations from "../../models/QueueIntegrations";
import QueueOption from "../../models/QueueOption";
import Setting from "../../models/Setting";
import TicketTraking from "../../models/TicketTraking";
import User from "../../models/User";
import UserRating from "../../models/UserRating";
import { campaignQueue, parseToMilliseconds, randomValue } from "../../queues";
import { logger } from "../../utils/logger";
import VerifyCurrentSchedule from "../CompanyService/VerifyCurrentSchedule";
import CreateOrUpdateContactService from "../ContactServices/CreateOrUpdateContactService";
import CreateMessageService from "../MessageServices/CreateMessageService";
import ShowQueueIntegrationService from "../QueueIntegrationServices/ShowQueueIntegrationService";
import FindOrCreateATicketTrakingService from "../TicketServices/FindOrCreateATicketTrakingService";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import typebotListener from "../TypebotServices/typebotListener";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import { provider } from "./providers";
import { SimpleObjectCache } from "../../helpers/simpleObjectCache";
import SendWhatsAppMessage from "./SendWhatsAppMessage";
import { getMessageOptions } from "./SendWhatsAppMedia";

import { addMsgAckJob } from "./BullAckService";
import { CreateOrUpdateBaileysChatService } from "../BaileysChatServices/CreateOrUpdateBaileysChatService";

import ffmpegPath from 'ffmpeg-static';
ffmpeg.setFfmpegPath(ffmpegPath);

const request = require("request");

const fs = require('fs')

type Session = WASocket & {
  id?: number;
  store?: Store;
};

type SessionOpenAi = OpenAIApi & { id?: number };

const sessionsOpenAi: SessionOpenAi[] = [];

interface ImessageUpsert {
  messages: proto.IWebMessageInfo[];
  type: MessageUpsertType;
}

interface IMe {
  name: string;
  id: string;
}

interface IMessage {
  messages: WAMessage[];
  isLatest: boolean;
}

const MESSAGE_CACHE_TTL = 300;

export const isNumeric = (value: string) => /^-?\d+$/.test(value);

const writeFileAsync = promisify(writeFile);

const wbotMutex = new Mutex();

const groupContactCache = new SimpleObjectCache(1000 * 30, logger);

const multVecardGet = function (param: any) {
  let output = " "

  let name = param.split("\n")[2].replace(";;;", "\n").replace('N:', "").replace(";", "").replace(";", " ").replace(";;", " ").replace("\n", "")
  let inicio = param.split("\n")[4].indexOf('=')
  let fim = param.split("\n")[4].indexOf(':')
  let contact = param.split("\n")[4].substring(inicio + 1, fim).replace(";", "")
  let contactSemWhats = param.split("\n")[4].replace("item1.TEL:", "")

  if (contact != "item1.TEL") {
    output = output + name + ": 📞" + contact + "" + "\n"
  } else
    output = output + name + ": 📞" + contactSemWhats + "" + "\n"
  return output
}

const contactsArrayMessageGet = (msg: any,) => {
  let contactsArray = msg.message?.contactsArrayMessage?.contacts
  let vcardMulti = contactsArray.map(function (item, indice) {
    return item.vcard;
  });

  let bodymessage = ``
  vcardMulti.forEach(function (vcard, indice) {
    bodymessage += vcard + "\n\n" + ""
  })

  let contacts = bodymessage.split("BEGIN:")

  contacts.shift()
  let finalContacts = ""
  for (let contact of contacts) {
    finalContacts = finalContacts + multVecardGet(contact)
  }

  return finalContacts
}

const getTypeMessage = (msg: proto.IWebMessageInfo): string => {
  return getContentType(msg.message);
};

export function validaCpfCnpj(val) {
  if (val.length == 11) {
    var cpf = val.trim();

    cpf = cpf.replace(/\./g, '');
    cpf = cpf.replace('-', '');
    cpf = cpf.split('');

    var v1 = 0;
    var v2 = 0;
    var aux = false;

    for (var i = 1; cpf.length > i; i++) {
      if (cpf[i - 1] != cpf[i]) {
        aux = true;
      }
    }

    if (aux == false) {
      return false;
    }

    for (var i = 0, p = 10; (cpf.length - 2) > i; i++, p--) {
      v1 += cpf[i] * p;
    }

    v1 = ((v1 * 10) % 11);

    if (v1 == 10) {
      v1 = 0;
    }

    if (v1 != cpf[9]) {
      return false;
    }

    for (var i = 0, p = 11; (cpf.length - 1) > i; i++, p--) {
      v2 += cpf[i] * p;
    }

    v2 = ((v2 * 10) % 11);

    if (v2 == 10) {
      v2 = 0;
    }

    if (v2 != cpf[10]) {
      return false;
    } else {
      return true;
    }
  } else if (val.length == 14) {
    var cnpj = val.trim();

    cnpj = cnpj.replace(/\./g, '');
    cnpj = cnpj.replace('-', '');
    cnpj = cnpj.replace('/', '');
    cnpj = cnpj.split('');

    var v1 = 0;
    var v2 = 0;
    var aux = false;

    for (var i = 1; cnpj.length > i; i++) {
      if (cnpj[i - 1] != cnpj[i]) {
        aux = true;
      }
    }

    if (aux == false) {
      return false;
    }

    for (var i = 0, p1 = 5, p2 = 13; (cnpj.length - 2) > i; i++, p1--, p2--) {
      if (p1 >= 2) {
        v1 += cnpj[i] * p1;
      } else {
        v1 += cnpj[i] * p2;
      }
    }

    v1 = (v1 % 11);

    if (v1 < 2) {
      v1 = 0;
    } else {
      v1 = (11 - v1);
    }

    if (v1 != cnpj[12]) {
      return false;
    }

    for (var i = 0, p1 = 6, p2 = 14; (cnpj.length - 1) > i; i++, p1--, p2--) {
      if (p1 >= 2) {
        v2 += cnpj[i] * p1;
      } else {
        v2 += cnpj[i] * p2;
      }
    }

    v2 = (v2 % 11);

    if (v2 < 2) {
      v2 = 0;
    } else {
      v2 = (11 - v2);
    }

    if (v2 != cnpj[13]) {
      return false;
    } else {
      return true;
    }
  } else {
    return false;
  }
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function sleep(time) {
  await timeout(time);
}
export const sendMessageImage = async (
  wbot: Session,
  contact,
  ticket: Ticket,
  url: string,
  caption: string
) => {

  let sentMessage;
  try {
    // Intenta enviar una imagen (desde URL o archivo local) al contacto o grupo
    sentMessage = await wbot.sendMessage(
      `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
      {
        image: url ? { url } : fs.readFileSync(`public/temp/${caption}-${makeid(10)}`),
        fileName: caption,
        caption: caption,
        mimetype: 'image/jpeg'
      }
    );
  } catch (error) {
    // Si ocurre un error al enviar la imagen, envía un mensaje de texto informando al usuario
    sentMessage = await wbot.sendMessage(
      `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
      {
        text: formatBody('No pude enviar el PDF, ¡intenta nuevamente!', contact)
      }
    );
  }
  verifyMessage(sentMessage, ticket, contact);
};

export const sendMessageLink = async (
  wbot: Session,
  contact: Contact,
  ticket: Ticket,
  url: string,
  caption: string
) => {

  let sentMessage
  try {
    sentMessage = await wbot.sendMessage(
      `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
      document: url ? { url } : fs.readFileSync(`public/temp/${caption}-${makeid(10)}`),
      fileName: caption,
      caption: caption,
      mimetype: 'application/pdf'
    }
    );
  } catch (error) {
    sentMessage = await wbot.sendMessage(
      `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
      text: formatBody('No pude enviar el PDF, ¡intenta nuevamente!', contact)
    }
    );
  }
  verifyMessage(sentMessage, ticket, contact);
};

export function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}


const getBodyButton = (msg: proto.IWebMessageInfo): string => {
  if (msg.key.fromMe && msg?.message?.viewOnceMessage?.message?.buttonsMessage?.contentText) {
    let bodyMessage = `*${msg?.message?.viewOnceMessage?.message?.buttonsMessage?.contentText}*`;

    for (const buton of msg.message?.viewOnceMessage?.message?.buttonsMessage?.buttons) {
      bodyMessage += `\n\n${buton.buttonText?.displayText}`;
    }
    return bodyMessage;
  }

  if (msg.key.fromMe && msg?.message?.viewOnceMessage?.message?.listMessage) {
    let bodyMessage = `*${msg?.message?.viewOnceMessage?.message?.listMessage?.description}*`;
    for (const buton of msg.message?.viewOnceMessage?.message?.listMessage?.sections) {
      for (const rows of buton.rows) {
        bodyMessage += `\n\n${rows.title}`;
      }
    }

    return bodyMessage;
  }
};

const msgLocation = (image, latitude, longitude) => {
  if (image) {
    var b64 = Buffer.from(image).toString("base64");

    let data = `data:image/png;base64, ${b64} | https://maps.google.com/maps?q=${latitude}%2C${longitude}&z=17&hl=pt-BR|${latitude}, ${longitude} `;
    return data;
  }
};

export const getBodyMessage = (msg: proto.IWebMessageInfo): string | null => {

  try {
    let type = getTypeMessage(msg);

    const types = {
      conversation: msg?.message?.conversation,
      editedMessage: msg?.message?.editedMessage?.message?.protocolMessage?.editedMessage?.conversation,
      imageMessage: msg.message?.imageMessage?.caption,
      videoMessage: msg.message?.videoMessage?.caption,
      extendedTextMessage: msg.message?.extendedTextMessage?.text,
      buttonsResponseMessage: msg.message?.buttonsResponseMessage?.selectedButtonId,
      templateButtonReplyMessage: msg.message?.templateButtonReplyMessage?.selectedId,
      messageContextInfo: msg.message?.buttonsResponseMessage?.selectedButtonId || msg.message?.listResponseMessage?.title,
      buttonsMessage: getBodyButton(msg) || msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId,
      viewOnceMessage: getBodyButton(msg) || msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId,
      stickerMessage: "sticker",
      reactionMessage: MessageUtils.getReactionMessage(msg) || "reaction",
      contactMessage: msg.message?.contactMessage?.vcard,
      contactsArrayMessage: (msg.message?.contactsArrayMessage?.contacts) && contactsArrayMessageGet(msg),
      //locationMessage: `Latitude: ${msg.message.locationMessage?.degreesLatitude} - Longitude: ${msg.message.locationMessage?.degreesLongitude}`,
      locationMessage: msgLocation(
        msg.message?.locationMessage?.jpegThumbnail,
        msg.message?.locationMessage?.degreesLatitude,
        msg.message?.locationMessage?.degreesLongitude
      ),
      liveLocationMessage: `Latitude: ${msg.message?.liveLocationMessage?.degreesLatitude} - Longitude: ${msg.message?.liveLocationMessage?.degreesLongitude}`,
      documentMessage: msg.message?.documentMessage?.title,
      documentWithCaptionMessage: msg.message?.documentWithCaptionMessage?.message?.documentMessage?.caption,
      audioMessage: "Audio",
      listMessage: getBodyButton(msg) || msg.message?.listResponseMessage?.title,
      listResponseMessage: msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId,
    };

    const objKey = Object.keys(types).find(key => key === type);

    if (!objKey) {
      // Muestra una advertencia si no se encontró el tipo correspondiente
      logger.warn(`#### No se encontró el tipo 152: ${type}
      ${JSON.stringify(msg)}`);
      // Envía información adicional a Sentry para facilitar el rastreo
      Sentry.setExtra("Mensaje", { BodyMsg: msg.message, msg, type });
      // Captura una excepción indicando que se encontró un nuevo tipo de mensaje
      Sentry.captureException(
        new Error("Nuevo tipo de mensaje en getTypeMessage")
      );
    }
    return types[type];
  } catch (error) {
    Sentry.setExtra("Error getTypeMessage", { msg, BodyMsg: msg.message });
    Sentry.captureException(error);
    console.log(error);
  }
};


export const getQuotedMessage = (msg: proto.IWebMessageInfo): any => {
  const body =
    msg.message.imageMessage.contextInfo ||
    msg.message.videoMessage.contextInfo ||
    msg.message?.documentMessage ||
    msg.message.extendedTextMessage.contextInfo ||
    msg.message.buttonsResponseMessage.contextInfo ||
    msg.message.listResponseMessage.contextInfo ||
    msg.message.templateButtonReplyMessage.contextInfo ||
    msg.message.buttonsResponseMessage?.contextInfo ||
    msg?.message?.buttonsResponseMessage?.selectedButtonId ||
    msg.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
    msg?.message?.listResponseMessage?.singleSelectReply.selectedRowId ||
    msg.message.listResponseMessage?.contextInfo;
  msg.message.senderKeyDistributionMessage;

  // testar isso

  return extractMessageContent(body[Object.keys(body).values().next().value]);
};
export const getQuotedMessageId = (msg: proto.IWebMessageInfo) => {
  const body = extractMessageContent(msg.message)[
    Object.keys(msg?.message).values().next().value
  ];
  let reaction = msg?.message?.reactionMessage
    ? msg?.message?.reactionMessage?.key?.id
    : "";

  return reaction ? reaction : body?.contextInfo?.stanzaId;
};

const getMeSocket = (wbot: Session): IMe => {
  return {
    id: jidNormalizedUser((wbot as WASocket).user.id),
    name: (wbot as WASocket).user.name
  }
};

const getSenderMessage = (
  msg: proto.IWebMessageInfo,
  wbot: Session
): string => {
  const me = getMeSocket(wbot);
  if (msg.key.fromMe) return me.id;

  const senderId = msg.participant || msg.key.participant || msg.key.remoteJid || undefined;

  return senderId && jidNormalizedUser(senderId);
};

const getContactMessage = async (msg: proto.IWebMessageInfo, wbot: Session) => {
  const isGroup = msg.key.remoteJid.includes("g.us");
  const rawNumber = msg.key.remoteJid.replace(/\D/g, "");
  return isGroup
    ? {
      id: getSenderMessage(msg, wbot),
      name: msg.pushName
    }
    : {
      id: msg.key.remoteJid,
      name: msg.key.fromMe ? rawNumber : msg.pushName
    };
};

const downloadMedia = async (msg: proto.IWebMessageInfo) => {

  let buffer
  try {
    buffer = await downloadMediaMessage(
      msg,
      'buffer',
      {}
    )
  } catch (err) {
    console.error('Error al descargar el archivo multimedia:', err);
  }

  let filename = msg.message?.documentMessage?.fileName || "";

  const mineType =
    msg.message?.imageMessage ||
    msg.message?.audioMessage ||
    msg.message?.videoMessage ||
    msg.message?.stickerMessage ||
    msg.message?.documentMessage ||
    msg.message?.documentWithCaptionMessage?.message?.documentMessage ||
    msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage ||
    msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;

  if (!mineType)
    console.log(msg)

  if (!filename) {
    const ext = mineType.mimetype.split("/")[1].split(";")[0];
    filename = `${new Date().getTime()}.${ext}`;
  } else {
    filename = `${new Date().getTime()}_${filename}`;
  }

  const media = {
    data: buffer,
    mimetype: mineType.mimetype,
    filename
  };

  return media;
}


const verifyContact = async (
  msgContact: IMe,
  wbot: Session,
  companyId: number
): Promise<Contact> => {
  let profilePicUrl: string;
  try {
    profilePicUrl = await wbot.profilePictureUrl(msgContact.id);
  } catch (e) {
    Sentry.captureException(e);
    profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
  }

  // Detect LID contact
  const isLidContact = msgContact.id.includes("@lid");
  const lid = isLidContact ? msgContact.id : undefined;

  const contactData = {
    name: msgContact?.name || msgContact.id.replace(/\D/g, ""),
    number: msgContact.id.replace(/\D/g, ""),
    profilePicUrl,
    isGroup: msgContact.id.includes("g.us"),
    companyId,
    whatsappId: wbot.id,
    remoteJid: msgContact.id,
    lid
  };


  const contact = CreateOrUpdateContactService(contactData);

  return contact;
};

const verifyQuotedMessage = async (
  msg: proto.IWebMessageInfo
): Promise<Message | null> => {
  if (!msg) return null;
  const quoted = getQuotedMessageId(msg);

  if (!quoted) return null;

  const quotedMsg = await Message.findOne({
    where: { id: quoted },
  });

  if (!quotedMsg) return null;

  return quotedMsg;
};

const sanitizeName = (name: string): string => {
  let sanitized = name.split(" ")[0];
  sanitized = sanitized.replace(/[^a-zA-Z0-9]/g, "");
  return sanitized.substring(0, 60);
};
const convertTextToSpeechAndSaveToFile = (
  text: string,
  filename: string,
  subscriptionKey: string,
  serviceRegion: string,
  voice: string = "pt-BR-FabioNeural",
  audioToFormat: string = "mp3"
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const speechConfig = SpeechConfig.fromSubscription(
      subscriptionKey,
      serviceRegion
    );
    speechConfig.speechSynthesisVoiceName = voice;
    const audioConfig = AudioConfig.fromAudioFileOutput(`${filename}.wav`);
    const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);
    synthesizer.speakTextAsync(
      text,
      result => {
        if (result) {
          convertWavToAnotherFormat(
            `${filename}.wav`,
            `${filename}.${audioToFormat}`,
            audioToFormat
          )
            .then(output => {
              resolve();
            })
            .catch(error => {
              console.error(error);
              reject(error);
            });
        } else {
          reject(new Error("No hay resultado del sintetizador"));
        }
        synthesizer.close();
      },
      error => {
        console.error(`Error: ${error}`);
        synthesizer.close();
        reject(error);
      }
    );
  });
};

const convertWavToAnotherFormat = (
  inputPath: string,
  outputPath: string,
  toFormat: string
) => {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputPath)
      .toFormat(toFormat)
      .on("end", () => resolve(outputPath))
      .on("error", (err: { message: any }) =>
        reject(new Error(`Error al convertir el archivo: ${err.message}`))
      )
      .save(outputPath);
  });
};

const deleteFileSync = (path: string): void => {
  try {
    fs.unlinkSync(path);
  } catch (error) {
    console.error("Error al eliminar el archivo:", error);
  }
};

const keepOnlySpecifiedChars = (str: string) => {
  return str.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚâêîôûÂÊÎÔÛãõÃÕçÇ!?.,;:\s]/g, "");
};
const handleOpenAi = async (
  msg: proto.IWebMessageInfo,
  wbot: Session,
  ticket: Ticket,
  contact: Contact,
  mediaSent: Message | undefined
): Promise<void> => {
  const bodyMessage = getBodyMessage(msg);

  if (!bodyMessage) return;
  let { prompt } = await ShowWhatsAppService(wbot.id, ticket.companyId);

  if (!prompt && !isNil(ticket?.queue?.prompt)) {
    prompt = ticket.queue.prompt;
  }

  if (!prompt) return;

  if (msg.messageStubType) return;

  const publicFolder: string = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "public"
  );

  let openai: SessionOpenAi;
  const openAiIndex = sessionsOpenAi.findIndex(s => s.id === wbot.id);


  if (openAiIndex === -1) {
    const configuration = new Configuration({
      apiKey: prompt.apiKey
    });
    openai = new OpenAIApi(configuration);
    openai.id = wbot.id;
    sessionsOpenAi.push(openai);
  } else {
    openai = sessionsOpenAi[openAiIndex];
  }

  const messages = await Message.findAll({
    where: { ticketId: ticket.id },
    order: [["createdAt", "ASC"]],
    limit: prompt.maxMessages
  });

  const promptSystem = `En las respuestas utiliza el nombre ${sanitizeName(
    contact.name || "Amigo(a)"
  )} para identificar al cliente.\nTu respuesta debe usar como máximo ${prompt.maxTokens
    } tokens y asegúrate de no cortar el final.\nSiempre que sea posible, menciona su nombre para que la atención sea más personalizada y cordial. Cuando la respuesta requiera una transferencia al sector de atención, comienza tu respuesta con 'Acción: Transferir al sector de atención'.\n
   ${prompt.prompt}\n`;

  let messagesOpenAi: ChatCompletionRequestMessage[] = [];

  if (msg.message?.conversation || msg.message?.extendedTextMessage?.text) {
    messagesOpenAi = [];
    messagesOpenAi.push({ role: "system", content: promptSystem });
    for (
      let i = 0;
      i < Math.min(prompt.maxMessages, messages.length);
      i++
    ) {
      const message = messages[i];
      if (message.mediaType === "chat") {
        if (message.fromMe) {
          messagesOpenAi.push({ role: "assistant", content: message.body });
        } else {
          messagesOpenAi.push({ role: "user", content: message.body });
        }
      }
    }
    messagesOpenAi.push({ role: "user", content: bodyMessage! });

    const chat = await openai.createChatCompletion({
      model: "gpt-3.5-turbo-1106",
      messages: messagesOpenAi,
      max_tokens: prompt.maxTokens,
      temperature: prompt.temperature
    });

    let response = chat.data.choices[0].message?.content;

    if (response?.includes("Acción: Transferir al sector de atención")) {
      await transferQueue(prompt.queueId, ticket, contact);
      response = response
        .replace("Acción: Transferir al sector de atención", "")
        .trim(); // Elimina la instrucción del mensaje final al cliente
    }

    if (prompt.voice === "texto") {
      const sentMessage = await wbot.sendMessage(msg.key.remoteJid!, {
        text: response!
      });
      await verifyMessage(sentMessage!, ticket, contact);
    } else {
      const fileNameWithOutExtension = `${ticket.id}_${Date.now()}`;
      convertTextToSpeechAndSaveToFile(
        keepOnlySpecifiedChars(response!),
        `${publicFolder}/${fileNameWithOutExtension}`,
        prompt.voiceKey,
        prompt.voiceRegion,
        prompt.voice,
        "mp3"
      ).then(async () => {
        try {
          const sendMessage = await wbot.sendMessage(msg.key.remoteJid!, {
            audio: { url: `${publicFolder}/${fileNameWithOutExtension}.mp3` },
            mimetype: "audio/mpeg",
            ptt: true
          });
          await verifyMediaMessage(sendMessage!, ticket, contact);
          deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.mp3`);
          deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.wav`);
        } catch (error) {
          console.log(`Error al responder con audio: ${error}`);
        }
      });
    }
  } else if (msg.message?.audioMessage) {
    const mediaUrl = mediaSent!.mediaUrl!.split("/").pop();
    const file = fs.createReadStream(`${publicFolder}/${mediaUrl}`) as any;
    const transcription = await openai.createTranscription(file, "whisper-1");

    messagesOpenAi = [];
    messagesOpenAi.push({ role: "system", content: promptSystem });
    for (
      let i = 0;
      i < Math.min(prompt.maxMessages, messages.length);
      i++
    ) {
      const message = messages[i];
      if (message.mediaType === "chat") {
        if (message.fromMe) {
          messagesOpenAi.push({ role: "assistant", content: message.body });
        } else {
          messagesOpenAi.push({ role: "user", content: message.body });
        }
      }
    }
    messagesOpenAi.push({ role: "user", content: transcription.data.text });
    const chat = await openai.createChatCompletion({
      model: "gpt-3.5-turbo-1106",
      messages: messagesOpenAi,
      max_tokens: prompt.maxTokens,
      temperature: prompt.temperature
    });
    let response = chat.data.choices[0].message?.content;

    if (response?.includes("Acción: Transferir al sector de atención")) {
      await transferQueue(prompt.queueId, ticket, contact);
      response = response
        .replace("Acción: Transferir al sector de atención", "")
        .trim(); // Limpia la instrucción del mensaje antes de enviarlo al cliente
    }
    if (prompt.voice === "texto") {
      const sentMessage = await wbot.sendMessage(msg.key.remoteJid!, {
        text: response!
      });
      await verifyMessage(sentMessage!, ticket, contact);
    } else {
      const fileNameWithOutExtension = `${ticket.id}_${Date.now()}`;
      convertTextToSpeechAndSaveToFile(
        keepOnlySpecifiedChars(response!),
        `${publicFolder}/${fileNameWithOutExtension}`,
        prompt.voiceKey,
        prompt.voiceRegion,
        prompt.voice,
        "mp3"
      ).then(async () => {
        try {
          const sendMessage = await wbot.sendMessage(msg.key.remoteJid!, {
            audio: { url: `${publicFolder}/${fileNameWithOutExtension}.mp3` },
            mimetype: "audio/mpeg",
            ptt: true
          });
          await verifyMediaMessage(sendMessage!, ticket, contact);
          deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.mp3`);
          deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.wav`);
        } catch (error) {
          console.log(`Error al responder con audio: ${error}`);
        }
      });
    }
  }
  messagesOpenAi = [];
};


const transferQueue = async (
  queueId: number,
  ticket: Ticket,
  contact: Contact
): Promise<void> => {
  await UpdateTicketService({
    ticketData: { queueId: queueId, useIntegration: false, promptId: null },
    ticketId: ticket.id,
    companyId: ticket.companyId
  });
};


const verifyMediaMessage = async (
  msg: proto.IWebMessageInfo,
  ticket: Ticket,
  contact: Contact
): Promise<Message> => {
  const io = getIO();
  const quotedMsg = await verifyQuotedMessage(msg);
  const media = await downloadMedia(msg);

  if (!media) {
    throw new Error("ERR_WAPP_DOWNLOAD_MEDIA");
  }

  if (!media.filename) {
    const ext = media.mimetype.split("/")[1].split(";")[0];
    media.filename = `${new Date().getTime()}.${ext}`;
  }

  try {

    const folder = `public/company${ticket.companyId}`;
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
      fs.chmodSync(folder, 0o777)
    }

    await writeFileAsync(
      join(__dirname, "..", "..", "..", folder, media.filename),
      media.data,
      "base64"
    );

    // Espera hasta que termine la conversión o se determine que no es necesaria
    await new Promise<void>((resolve, reject) => {
      // Verifica si el archivo es del tipo .ogg
      if (media.filename.includes('.ogg')) {
        // Si es .ogg, usa ffmpeg para convertirlo a formato .mp3
        ffmpeg(folder + '/' + media.filename)
          .toFormat('mp3')
          .save((folder + '/' + media.filename).replace('.ogg', '.mp3')) // Guarda el archivo con extensión .mp3
          .on('end', () => {
            logger.info('¡Conversión concluida!');
            resolve(); // Finaliza la promesa exitosamente
          })
          .on('error', (err) => {
            logger.error('Error durante la conversión:', err);
            reject(err); // Finaliza la promesa con error
          });
      } else {
        // Si no es un archivo .ogg, no es necesario convertirlo
        logger.info('No es necesario convertir el archivo. No es formato OGG.');
        resolve(); // Finaliza la promesa inmediatamente
      }
    });

  } catch (err) {
    Sentry.captureException(err);
    logger.error(err);
  }

  const body = getBodyMessage(msg);


  const messageData = {
    id: msg.key.id,
    ticketId: ticket.id,
    contactId: msg.key.fromMe ? undefined : contact.id,
    body: body ? formatBody(body, ticket.contact) : media.filename,
    fromMe: msg.key.fromMe,
    read: msg.key.fromMe,
    mediaUrl: media.filename,
    mediaType: media.mimetype.split("/")[0],
    quotedMsgId: quotedMsg?.id,
    ack: msg.status,
    remoteJid: msg.key.remoteJid,
    participant: msg.key.participant,
    dataJson: JSON.stringify(msg),
  };

  await ticket.update({
    lastMessage: body || media.filename,
  });

  const newMessage = await CreateMessageService({
    messageData,
    companyId: ticket.companyId,
  });


  if (!msg.key.fromMe && ticket.status === "closed") {
    await ticket.update({ status: "pending" });
    await ticket.reload({
      include: [
        { model: Queue, as: "queue" },
        { model: User, as: "user" },
        { model: Contact, as: "contact" },
      ],
    });

    io.to(`company-${ticket.companyId}-closed`)
      .to(`queue-${ticket.queueId}-closed`)
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "delete",
        ticket,
        ticketId: ticket.id,
      });

    io.to(`company-${ticket.companyId}-${ticket.status}`)
      .to(`queue-${ticket.queueId}-${ticket.status}`)
      .to(ticket.id.toString())
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "update",
        ticket,
        ticketId: ticket.id,
      });
  }

  return newMessage;
};

function getStatus(msg, msgType) {

  if (msg.status == "PENDING") {

    if (msg.key.fromMe && msgType == "reactionMessage") {
      return 3;
    }

    return 1
  } else if (msg.status == "SERVER_ACK") {
    return 1
  }
  return msg.status;
}


export const verifyMessage = async (
  msg: proto.IWebMessageInfo,
  ticket: Ticket,
  contact: Contact
) => {
  const io = getIO();
  const quotedMsg = await verifyQuotedMessage(msg);
  const body = getBodyMessage(msg);
  const isEdited = getTypeMessage(msg) == 'editedMessage';

  const messageData = {
    id: isEdited ? msg?.message?.editedMessage?.message?.protocolMessage?.key?.id : msg.key.id,
    ticketId: ticket.id,
    contactId: msg.key.fromMe ? undefined : contact.id,
    body,
    fromMe: msg.key.fromMe,
    mediaType: getTypeMessage(msg),
    read: msg.key.fromMe,
    quotedMsgId: quotedMsg?.id,
    ack: msg.status,
    remoteJid: msg.key.remoteJid,
    participant: msg.key.participant,
    dataJson: JSON.stringify(msg),
    isEdited: isEdited,
  };

  await ticket.update({
    lastMessage: body
  });


  await CreateMessageService({ messageData, companyId: ticket.companyId });

  if (!msg.key.fromMe && ticket.status === "closed") {
    await ticket.update({ status: "pending" });
    await ticket.reload({
      include: [
        { model: Queue, as: "queue" },
        { model: User, as: "user" },
        { model: Contact, as: "contact" }
      ]
    });

    io.to(`company-${ticket.companyId}-closed`)
      .to(`queue-${ticket.queueId}-closed`)
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "delete",
        ticket,
        ticketId: ticket.id
      });

    io.to(`company-${ticket.companyId}-${ticket.status}`)
      .to(`queue-${ticket.queueId}-${ticket.status}`)
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "update",
        ticket,
        ticketId: ticket.id
      });
  }
};

const isValidMsg = (msg: proto.IWebMessageInfo): boolean => {
  if (msg.key.remoteJid === "status@broadcast") return false;
  try {
    const msgType = getTypeMessage(msg);
    if (!msgType) {
      return;
    }

    const ifType =
      msgType === "conversation" ||
      msgType === "extendedTextMessage" ||
      msgType === "editedMessage" ||
      msgType === "audioMessage" ||
      msgType === "videoMessage" ||
      msgType === "imageMessage" ||
      msgType === "documentMessage" ||
      msgType === "documentWithCaptionMessage" ||
      msgType === "stickerMessage" ||
      msgType === "buttonsResponseMessage" ||
      msgType === "buttonsMessage" ||
      msgType === "messageContextInfo" ||
      msgType === "locationMessage" ||
      msgType === "liveLocationMessage" ||
      msgType === "contactMessage" ||
      msgType === "voiceMessage" ||
      msgType === "mediaMessage" ||
      msgType === "contactsArrayMessage" ||
      msgType === "reactionMessage" ||
      msgType === "ephemeralMessage" ||
      msgType === "protocolMessage" ||
      msgType === "listResponseMessage" ||
      msgType === "listMessage" ||
      msgType === "viewOnceMessage";

    // Si no se encontró el tipo de mensaje (ifType está vacío o indefinido)
    if (!ifType) {
      // Muestra una advertencia en los logs con detalles del tipo y contenido del mensaje
      logger.warn(`#### No se encontró el tipo en isValidMsg: ${msgType}
    ${JSON.stringify(msg?.message)}`);

      // Envía información extra a Sentry para facilitar el rastreo del error
      Sentry.setExtra("Mensaje", { BodyMsg: msg.message, msg, msgType });

      // Captura una excepción personalizada en Sentry para notificar que apareció un nuevo tipo de mensaje
      Sentry.captureException(new Error("Nuevo tipo de mensaje en isValidMsg"));
    }

    return !!ifType;
  } catch (error) {
    Sentry.setExtra("Error isValidMsg:: ", { msg })
    Sentry.captureException(error);
  }
};


const Push = (msg: proto.IWebMessageInfo) => {
  return msg.pushName;
}
const verifyQueue = async (
  wbot: Session,
  msg: proto.IWebMessageInfo,
  ticket: Ticket,
  contact: Contact,
  mediaSent?: Message | undefined
) => {
  const companyId = ticket.companyId;

  const { queues, greetingMessage, maxUseBotQueues, timeUseBotQueues } = await ShowWhatsAppService(
    wbot.id!,
    ticket.companyId
  );

  if (queues.length === 1) {
    const sendGreetingMessageOneQueues = await Setting.findOne({
      where: {
        key: "sendGreetingMessageOneQueues",
        companyId: ticket.companyId
      }
    });

    if (greetingMessage.length > 1 && sendGreetingMessageOneQueues?.value === "enabled") {
      const body = formatBody(`${greetingMessage}`, contact);
      //console.log('Body2:: ', body)
      await wbot.sendMessage(
        `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        {
          text: body
        }
      );
    }

    const firstQueue = head(queues);
    let chatbot = false;

    if (firstQueue?.options) {
      chatbot = firstQueue.options.length > 0;
    }

    if (!msg.key.fromMe && !ticket.isGroup && !isNil(queues[0]?.integrationId)) {
      const integrations = await ShowQueueIntegrationService(queues[0].integrationId, companyId);
      await handleMessageIntegration(msg, wbot, integrations, ticket);
      await ticket.update({
        useIntegration: true,
        integrationId: integrations.id
      });
    }

    if (!msg.key.fromMe && !ticket.isGroup && !isNil(queues[0]?.promptId)) {
      await handleOpenAi(msg, wbot, ticket, contact, mediaSent);
      await ticket.update({
        useIntegration: true,
        promptId: queues[0]?.promptId
      });
    }

    await UpdateTicketService({
      ticketData: { queueId: firstQueue.id, chatbot, status: "pending" },
      ticketId: ticket.id,
      companyId: ticket.companyId,
    });

    return;
  }

  const lastMessage = await Message.findOne({
    where: {
      ticketId: ticket.id,
      fromMe: true
    },
    order: [["createdAt", "DESC"]]
  });

  // REGRA PARA DESABILITAR O BOT PARA ALGUM CONTATO
  if (contact.disableBot) {
    return;
  }

  const selectedOption = getBodyMessage(msg)?.trim();
  const choosenQueue = lastMessage?.body.includes(`*${selectedOption}* -`)
    ? queues[selectedOption.toUpperCase().charCodeAt(0) - 65]
    : undefined;

  const buttonActive = await Setting.findOne({
    where: {
      key: "chatBotType",
      companyId
    }
  });

  const botText = async () => {
    let options = "";
    queues.forEach((queue, index) => {
      const letter = String.fromCharCode(65 + index); // 65 es 'A' en ASCII
      options += `*${letter}* - ${queue.name}\n`;
    });

    const textMessage = {
      text: formatBody(`\u200e${greetingMessage}\n\n${options}\n_Escriba_ *salir* _para cerrar el bot o repararlo_\n`, contact),
    };

    let lastMsg = map_msg.get(contact.number);
    let invalidOption = "Opción inválida, por favor, elija una opción válida.\n\n";

    if (!lastMsg?.msg || getBodyMessage(msg).includes('#') || textMessage.text === 'concluido' || lastMsg.msg !== textMessage.text && !lastMsg.invalid_option) {
      const sendMsg = await wbot.sendMessage(
        `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        textMessage
      );
      lastMsg ?? (lastMsg = {});
      lastMsg.msg = textMessage.text;
      lastMsg.invalid_option = false;
      lastMsg.invalid_attempts = 0;
      map_msg.set(contact.number, lastMsg);
      await verifyMessage(sendMsg, ticket, ticket.contact);
    } else if (lastMsg.invalid_attempts < 2) {
      // Envia mensagem de erro + menu novamente (até 2 tentativas)
      textMessage.text = invalidOption + textMessage.text;
      const sendMsg = await wbot.sendMessage(
        `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        textMessage
      );
      lastMsg.invalid_attempts = (lastMsg.invalid_attempts || 0) + 1;
      lastMsg.invalid_option = true;
      lastMsg.msg = textMessage.text;
      map_msg.set(contact.number, lastMsg);
      await verifyMessage(sendMsg, ticket, ticket.contact);
    } else {
      // Na 3a tentativa, seleciona automaticamente a primeira fila
      const firstQueue = head(queues);
      let chatbot = false;

      if (firstQueue?.options) {
        chatbot = firstQueue.options.length > 0;
      }

      await UpdateTicketService({
        ticketData: { queueId: firstQueue.id, chatbot, status: "pending" },
        ticketId: ticket.id,
        companyId: ticket.companyId,
      });

      // Envia mensagem informando a seleção automática
      const autoSelectMessage = {
        text: formatBody(`Opção selecionada automaticamente: ${firstQueue.name}`, contact),
      };
      await wbot.sendMessage(
        `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        autoSelectMessage
      );
    }
  };

  if (choosenQueue) {
    let chatbot = false;
    if (choosenQueue?.options) {
      chatbot = choosenQueue.options.length > 0;
    }

    await UpdateTicketService({
      ticketData: { queueId: choosenQueue.id, chatbot },
      ticketId: ticket.id,
      companyId: ticket.companyId,
    });

    if (choosenQueue.options.length === 0) {
      const queue = await Queue.findByPk(choosenQueue.id);
      const { schedules }: any = queue;
      const now = moment();
      const weekday = now.format("dddd").toLowerCase();
      let schedule;

      if (Array.isArray(schedules) && schedules.length > 0) {
        schedule = schedules.find((s) => s.weekdayEn === weekday && s.startTimeA !== "" && s.startTimeA !== null && s.endTimeB !== "" && s.endTimeB !== null);
      }

      if (queue.outOfHoursMessage !== null && queue.outOfHoursMessage !== "" && !isNil(schedule)) {
        const startTimeA = moment(schedule.startTimeA, "HH:mm");
        const endTimeA = moment(schedule.endTimeA, "HH:mm");
        const startTimeB = schedule.startTimeB ? moment(schedule.startTimeB, "HH:mm") : null;
        const endTimeB = schedule.endTimeB ? moment(schedule.endTimeB, "HH:mm") : null;

        const isWithinBusinessHours = (now.isBetween(startTimeA, endTimeA, null, '[]') || (startTimeB && endTimeB && now.isBetween(startTimeB, endTimeB, null, '[]')));

        if (!isWithinBusinessHours) {
          if (ticket.status === "open" || ticket.status === "pendent" || ticket.status === "assigned") {
            const body = formatBody(`\u200e${queue.outOfHoursMessage}`, ticket.contact);
            const sentMessage = await wbot.sendMessage(
              `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
              text: body,
            });
            await verifyMessage(sentMessage, ticket, contact);

            await UpdateTicketService({
              ticketData: { status: "closed", queueId: null, chatbot },
              ticketId: ticket.id,
              companyId: ticket.companyId,
            });

            const finalizationMessage = "Su ticket fue finalizado porque estamos *Offline* en este momento.";
            await wbot.sendMessage(
              `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
              text: finalizationMessage,
            });
          }
        } else if (ticket.status === "assigned") {
          // Evita un bucle verificando si el ticket ya está asignado
          console.log("🎫 EL TICKET ESTÁ ASIGNADO, NO ES NECESARIO ENVIAR MENSAJE FUERA DE HORARIO.");
          return; // Salta el resto del procesamiento si ya está asignado
        }
      }
    }

    if (!msg.key.fromMe && !ticket.isGroup && choosenQueue.integrationId) {
      const integrations = await ShowQueueIntegrationService(choosenQueue.integrationId, companyId);
      await handleMessageIntegration(msg, wbot, integrations, ticket);
      await ticket.update({
        useIntegration: true,
        integrationId: integrations.id
      });
    }

    if (!msg.key.fromMe && !ticket.isGroup && !isNil(choosenQueue?.promptId)) {
      await handleOpenAi(msg, wbot, ticket, contact, mediaSent);
      await ticket.update({
        useIntegration: true,
        promptId: choosenQueue?.promptId
      });
    }

    const body = formatBody(`\u200e${choosenQueue.greetingMessage}`, ticket.contact);
    if (choosenQueue.greetingMessage) {
      const sentMessage = await wbot.sendMessage(
        `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
        text: body,
      });
      await verifyMessage(sentMessage, ticket, contact);
    }

    if (choosenQueue.mediaPath !== null && choosenQueue.mediaPath !== "") {
      const filePath = path.resolve("public", `company${companyId}`, choosenQueue.mediaPath);
      const optionsMsg = await getMessageOptions(choosenQueue.mediaName, filePath, null, ticket.companyId.toString());
      let sentMessage = await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, { ...optionsMsg });
      await verifyMediaMessage(sentMessage, ticket, contact);
    }
  } else {
    if (maxUseBotQueues && maxUseBotQueues !== 0 && ticket.amountUsedBotQueues >= maxUseBotQueues) {
      return;
    }

    const ticketTraking = await FindOrCreateATicketTrakingService({ ticketId: ticket.id, companyId });
    let dataLimite = new Date();
    let Agora = new Date();

    if (ticketTraking.chatbotAt !== null) {
      dataLimite.setMinutes(ticketTraking.chatbotAt.getMinutes() + (Number(timeUseBotQueues)));

      if (ticketTraking.chatbotAt !== null && Agora < dataLimite && timeUseBotQueues !== "0" && ticket.amountUsedBotQueues !== 0) {
        return;
      }
    }
    await ticketTraking.update({
      chatbotAt: null
    });

    if (buttonActive.value === "text") {
      return botText();
    }
  }
};


export const verifyRating = (ticketTraking: TicketTraking) => {
  if (
    ticketTraking &&
    ticketTraking.finishedAt === null &&
    ticketTraking.userId !== null &&
    ticketTraking.ratingAt !== null
  ) {
    return true;
  }
  return false;
};

export const handleRating = async (
  rate: number,
  ticket: Ticket,
  ticketTraking: TicketTraking,
  contact: Contact
) => {
  const io = getIO();

  const { complationMessage } = await ShowWhatsAppService(
    ticket.whatsappId,
    ticket.companyId
  );

  let finalRate = rate;

  if (rate < 1) {
    finalRate = 1;
  }
  if (rate > 5) {
    finalRate = 5;
  }

  await UserRating.create({
    ticketId: ticketTraking.ticketId,
    companyId: ticketTraking.companyId,
    userId: ticketTraking.userId,
    rate: finalRate,
  });

  if (complationMessage) {
    const body = formatBody(`\u200e${complationMessage}`, ticket.contact);
    const msg = await SendWhatsAppMessage({ body, ticket });
    await verifyMessage(msg, ticket, contact);
  }

  await ticketTraking.update({
    finishedAt: moment().toDate(),
    rated: true,
  });

  // Manter a fila no ticket ao fechá-lo
  await ticket.update({
    // Remover esses campos, já que queremos manter a fila
    queueOptionId: null,
    userId: null,
    status: "closed",
    // Não removemos queueId, pois a fila deve ser mantida
  });

  io.to(`company-${ticket.companyId}-open`)
    .to(`queue-${ticket.queueId}-open`)
    .emit(`company-${ticket.companyId}-ticket`, {
      action: "delete",
      ticket,
      ticketId: ticket.id,
    });

  io.to(`company-${ticket.companyId}-${ticket.status}`)
    .to(`queue-${ticket.queueId}-${ticket.status}`)
    .to(ticket.id.toString())
    .emit(`company-${ticket.companyId}-ticket`, {
      action: "update",
      ticket,
      ticketId: ticket.id,
    });
};


const handleChartbot = async (ticket: Ticket, msg: WAMessage, wbot: Session, dontReadTheFirstQuestion = false) => {
  const queue = await Queue.findByPk(ticket.queueId, {
    include: [
      {
        model: QueueOption,
        as: "options",
        where: { parentId: null },
      },
    ],
    order: [
      ["options", "option", "ASC"],
    ]
  });



  const messageBody = getBodyMessage(msg);


  if (messageBody == "#") {
    // voltar para o menu inicial
    await ticket.update({ queueOptionId: null, chatbot: false, queueId: null });
    await verifyQueue(wbot, msg, ticket, ticket.contact);
    return;
  }

  // voltar para o menu anterior
  if (!isNil(queue) && !isNil(ticket.queueOptionId) && messageBody.toUpperCase() == "X") {
    const option = await QueueOption.findByPk(ticket.queueOptionId);
    await ticket.update({ queueOptionId: option?.parentId });

    // escolheu uma opção
  } else if (!isNil(queue) && !isNil(ticket.queueOptionId)) {


    const count = await QueueOption.count({
      where: { parentId: ticket.queueOptionId },
    });



    let option: any = {};
    if (count == 1) {
      option = await QueueOption.findOne({
        where: { parentId: ticket.queueOptionId },
      });
    } else {
      const letterIndex = messageBody.toUpperCase().charCodeAt(0) - 65; // A → 0, B → 1, etc.
      const queueOptions = await QueueOption.findAll({
        where: { parentId: ticket.queueOptionId },
        order: [["option", "ASC"], ["createdAt", "ASC"]],
      });
      if (letterIndex >= 0 && letterIndex < queueOptions.length) {
        option = queueOptions[letterIndex];
      }
    }

    if (option) {
      await ticket.update({ queueOptionId: option?.id });
    }

    // não linha a primeira pergunta
  } else if (!isNil(queue) && isNil(ticket.queueOptionId) && !dontReadTheFirstQuestion) {
    const letterIndex = messageBody.toUpperCase().charCodeAt(0) - 65;
    const option = letterIndex >= 0 && letterIndex < queue?.options.length ? queue.options[letterIndex] : null;
    if (option) {
      await ticket.update({ queueOptionId: option?.id });
    }
  }

  await ticket.reload();

  if (!isNil(queue) && isNil(ticket.queueOptionId)) {


    const queueOptions = await QueueOption.findAll({
      where: { queueId: ticket.queueId, parentId: null },
      order: [
        ["option", "ASC"],
        ["createdAt", "ASC"],
      ],
    });

    const companyId = ticket.companyId;

    const buttonActive = await Setting.findOne({
      where: {
        key: "chatBotType",
        companyId
      }
    });

    // const botList = async () => {
    // const sectionsRows = [];

    // queues.forEach((queue, index) => {
    //   sectionsRows.push({
    //     title: queue.name,
    //     rowId: `${index + 1}`
    //   });
    // });

    // const sections = [
    //   {
    //     rows: sectionsRows
    //   }
    // ];


    //   const listMessage = {
    //     text: formatBody(`\u200e${queue.greetingMessage}`, ticket.contact),
    //     buttonText: "Escolha uma opção",
    //     sections
    //   };

    //   const sendMsg = await wbot.sendMessage(
    //     `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
    //     listMessage
    //   );

    //   await verifyMessage(sendMsg, ticket, ticket.contact);
    // }

    const botButton = async () => {
      const buttons = [];
      queueOptions.forEach((option, i) => {
        buttons.push({
          buttonId: `${String.fromCharCode(65 + i)}`,
          buttonText: { displayText: option.title },
          type: 4
        });
      });
      buttons.push({
        buttonId: `#`,
        buttonText: { displayText: "Menu inicial *x* Menu anterior" },
        type: 4
      });

      const buttonMessage = {
        text: formatBody(`\u200e${queue.greetingMessage}`, ticket.contact),
        buttons,
        headerType: 4
      };

      const sendMsg = await wbot.sendMessage(
        `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        buttonMessage
      );

      await verifyMessage(sendMsg, ticket, ticket.contact);
    }

    const botText = async () => {
      let options = "";

      queueOptions.forEach((option, i) => {
        options += `*${String.fromCharCode(65 + i)}* - ${option.title}\n`;
      });
      //options += `\n*[ 0 ]* - Menu anterior`;
      options += `\n*#* - Menu inicial`;

      const textMessage = {
        text: formatBody(`\u200e${queue.greetingMessage}\n\n${options}`, ticket.contact),
      };

      console.log('textMessage5555555555555', textMessage)
      const sendMsg = await wbot.sendMessage(
        `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        textMessage
      );

      await verifyMessage(sendMsg, ticket, ticket.contact);
    };

    // if (buttonActive.value === "list") {
    //   return botList();
    // };

    if (buttonActive.value === "button" && QueueOption.length <= 4) {
      return botButton();
    }

    if (buttonActive.value === "text") {
      return botText();
    }

    if (buttonActive.value === "button" && QueueOption.length > 4) {
      return botText();
    }
  } else if (!isNil(queue) && !isNil(ticket.queueOptionId)) {
    const currentOption = await QueueOption.findByPk(ticket.queueOptionId);
    const queueOptions = await QueueOption.findAll({
      where: { parentId: ticket.queueOptionId },
      order: [
        ["option", "ASC"],
        ["createdAt", "ASC"],
      ],
    });

    if (queueOptions.length === 0) {
      const textMessage = {
        text: formatBody(`\u200e${currentOption.message}`, ticket.contact),
      };

      const sendMsg = await wbot.sendMessage(
        `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        textMessage
      );

      await verifyMessage(sendMsg, ticket, ticket.contact);
      if (currentOption.mediaPath !== null && currentOption.mediaPath !== "") {

        const filePath = path.resolve("public", "company" + ticket.companyId, currentOption.mediaPath);


        const optionsMsg = await getMessageOptions(currentOption.mediaName, filePath, textMessage.text, ticket.companyId.toString());

        let sentMessage = await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, { ...optionsMsg });

        await verifyMediaMessage(sentMessage, ticket, ticket.contact);
      }

      await verifyMessage(sendMsg, ticket, ticket.contact);

      await ticket.update({
        queueOptionId: null,
        chatbot: false,
      });
      //console.log("Fim do chatbot. Última opção alcançada.");
      return;
    }

    if (queueOptions.length > -1) {

      const companyId = ticket.companyId;
      const buttonActive = await Setting.findOne({
        where: {
          key: "chatBotType",
          companyId
        }
      });

      const botList = async () => {
        const sectionsRows = [];

        queueOptions.forEach((option, i) => {
          sectionsRows.push({
            title: option.title,
            rowId: `${option.option}`
          });
        });
        sectionsRows.push({
          title: "Menu inicial *x* Menu anterior",
          rowId: `#`
        });
        const sections = [
          {
            rows: sectionsRows
          }
        ];

        const listMessage = {
          text: formatBody(`\u200e${currentOption.message}`, ticket.contact),
          buttonText: "Escolha uma opção",
          sections
        };

        const sendMsg = await wbot.sendMessage(
          `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
          listMessage
        );

        await verifyMessage(sendMsg, ticket, ticket.contact);
      }

      const botButton = async () => {
        const buttons = [];
        queueOptions.forEach((option, i) => {
          buttons.push({
            buttonId: `${String.fromCharCode(65 + i)}`,
            buttonText: { displayText: option.title },
            type: 4
          });
        });
        buttons.push({
          buttonId: `#`,
          buttonText: { displayText: "Menu inicial *x* Menu anterior" },
          type: 4
        });

        const buttonMessage = {
          text: formatBody(`\u200e${currentOption.message}`, ticket.contact),
          buttons,
          headerType: 4
        };

        const sendMsg = await wbot.sendMessage(
          `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
          buttonMessage
        );

        await verifyMessage(sendMsg, ticket, ticket.contact);
      }

      const botText = async () => {

        let options = "";

        queueOptions.forEach((option, i) => {
          options += `*${String.fromCharCode(65 + i)}* - ${option.title}\n`;
        });
        options += `\n*x* - Menu anterior`;
        options += `\n*#* - Menu inicial`;
        const textMessage = {
          text: formatBody(`\u200e${currentOption.message}\n\n${options}`, ticket.contact),
        };

        console.log('textMessage6666666666', textMessage)
        const sendMsg = await wbot.sendMessage(
          `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
          textMessage
        );

        await verifyMessage(sendMsg, ticket, ticket.contact);
        if (currentOption.mediaPath !== null && currentOption.mediaPath !== "") {

          const filePath = path.resolve("public", "company" + ticket.companyId, currentOption.mediaPath);


          const optionsMsg = await getMessageOptions(currentOption.mediaName, filePath, textMessage.text, ticket.companyId.toString());

          let sentMessage = await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, { ...optionsMsg });

          await verifyMediaMessage(sentMessage, ticket, ticket.contact);
        }
      };

      if (buttonActive.value === "list") {
        return botList();
      };

      if (buttonActive.value === "button" && QueueOption.length <= 4) {
        return botButton();
      }

      if (buttonActive.value === "text") {
        return botText();
      }

      if (buttonActive.value === "button" && QueueOption.length > 4) {
        return botText();
      }
    }
  }
}

export const handleMessageIntegration = async (
  msg: proto.IWebMessageInfo,
  wbot: Session,
  queueIntegration: QueueIntegrations,
  ticket: Ticket
): Promise<void> => {
  const msgType = getTypeMessage(msg);

  if (queueIntegration.type === "n8n" || queueIntegration.type === "webhook") {
    if (!queueIntegration?.urlN8N) {
      logger.error(`No se proporcionó una URL válida para la integración ${queueIntegration.type} (ID: ${queueIntegration.id})`);
      throw new Error("URL de integración n8n/webhook no proporcionada");
    }
    // Validar que la URL sea un formato válido
    const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/;
    if (!urlRegex.test(queueIntegration.urlN8N)) {
      logger.error(`URL inválida para integración ${queueIntegration.type}: ${queueIntegration.urlN8N}`);
      throw new Error("URL de integración n8n/webhook inválida");
    }
    const options = {
      method: "POST",
      url: queueIntegration.urlN8N,
      headers: {
        "Content-Type": "application/json"
      },
      json: msg
    };
    try {
      request(options, function (error, response) {
        if (error) {
          logger.error(`Error al enviar solicitud a n8n/webhook (${queueIntegration.urlN8N}): ${error.message}`);
          throw new Error(`Error en la solicitud a n8n/webhook: ${error.message}`);
        }
        if (response.statusCode !== 200) {
          logger.error(`Respuesta no exitosa de n8n/webhook (${queueIntegration.urlN8N}): Código ${response.statusCode}, Mensaje: ${JSON.stringify(response.body)}`);
          if (response.statusCode === 404) {
            logger.warn(`Webhook no registrado en n8n. Asegúrese de que el workflow esté activo y no en modo de prueba.`);
          }
          throw new Error(`Respuesta no exitosa de n8n/webhook: Código ${response.statusCode}`);
        }
        logger.info(`Respuesta exitosa de n8n/webhook (${queueIntegration.urlN8N}): ${JSON.stringify(response.body)}`);
      });
    } catch (error) {
      logger.error(`Error en integración ${queueIntegration.type}: ${error.message}`);
      Sentry.captureException(error);
      throw error; // Mantener el lanzamiento del error para mantener la funcionalidad existente
    }
    // Mejora: Mejorado el manejo de errores y logging para integración n8n/webhook

  } else if (queueIntegration.type === "typebot") {
    console.log("🤖 ENTRÓ EN EL TYPEBOT");
    // await typebots(ticket, msg, wbot, queueIntegration);
    await typebotListener({ ticket, msg, wbot, typebot: queueIntegration });

  }
}

const handleMessage = async (
  msg: proto.IWebMessageInfo,
  wbot: Session,
  companyId: number
): Promise<void> => {
  let mediaSent: Message | undefined;

  if (!isValidMsg(msg)) return;

  try {
    let msgContact: IMe;
    let groupContact: Contact | undefined;

    const isGroup = msg.key.remoteJid?.endsWith("@g.us");

    const msgIsGroupBlock = await Setting.findOne({
      where: {
        companyId,
        key: "CheckMsgIsGroup"
      }
    });

    const bodyMessage = getBodyMessage(msg);
    const msgType = getTypeMessage(msg);

    const hasMedia =
      msg.message?.audioMessage ||
      msg.message?.imageMessage ||
      msg.message?.videoMessage ||
      msg.message?.documentMessage ||
      msg.message?.documentWithCaptionMessage ||
      msg.message.stickerMessage;
    if (msg.key.fromMe) {
      if (/\u200e/.test(bodyMessage)) return;

      if (
        !hasMedia &&
        msgType !== "conversation" &&
        msgType !== "extendedTextMessage" &&
        msgType !== "vcard"
      )
        return;
    }

    msgContact = await getContactMessage(msg, wbot);

    if (msgIsGroupBlock?.value === "enabled" && isGroup) return;

    if (isGroup) {
      groupContact = await wbotMutex.runExclusive(async () => {
        let result = groupContactCache.get(msg.key.remoteJid);
        if (!result) {
          const groupMetadata = await wbot.groupMetadata(msg.key.remoteJid);
          const msgGroupContact = {
            id: groupMetadata.id,
            name: groupMetadata.subject,
          }
          result = await verifyContact(msgGroupContact, wbot, companyId);
          groupContactCache.set(msg.key.remoteJid, result);
        }
        return result;
      });
    }

    const whatsapp = await ShowWhatsAppService(wbot.id!, companyId);
    const contact = await verifyContact(msgContact, wbot, companyId);

    let unreadMessages = 0;


    if (msg.key.fromMe) {
      await cacheLayer.set(`contacts:${contact.id}:unreads`, "0");
    } else {
      const unreads = await cacheLayer.get(`contacts:${contact.id}:unreads`);
      unreadMessages = +unreads + 1;
      await cacheLayer.set(
        `contacts:${contact.id}:unreads`,
        `${unreadMessages}`
      );
    }

    const lastMessage = await Message.findOne({
      where: {
        contactId: contact.id,
        companyId,
      },
      order: [["createdAt", "DESC"]],
    });


    if (unreadMessages === 0 && whatsapp.complationMessage && formatBody(whatsapp.complationMessage, contact).trim().toLowerCase() === lastMessage?.body.trim().toLowerCase()) {
      return;
    }


    const ticket = await FindOrCreateTicketService(contact, wbot.id!, unreadMessages, companyId, groupContact);



    await provider(ticket, msg, companyId, contact, wbot as WASocket);

    // Mejora: Verificar si el mensaje es "salir" para detener el bot y cerrar el ticket
    if (!msg.key.fromMe && !isGroup && bodyMessage?.toLowerCase().trim() === "salir") {
      try {
        // Enviar mensaje de confirmación al usuario
        const confirmationMessage = formatBody("Gracias por usar nuestro servicio. El bot ha sido detenido y tu ticket ha sido cerrado.", contact);
        const sentMessage = await wbot.sendMessage(
          `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
          { text: confirmationMessage }
        );
        await verifyMessage(sentMessage, ticket, contact);

        // Actualizar el ticket a estado "closed" manteniendo la cola
        await UpdateTicketService({
          ticketData: { status: "closed" },
          ticketId: ticket.id,
          companyId: ticket.companyId
        });

        // Actualizar ticket para reflejar el cierre
        await ticket.reload();

        // Emitir evento al frontend para reflejar el cierre del ticket
        const io = getIO();
        io.to(`company-${ticket.companyId}-open`)
          .to(`queue-${ticket.queueId}-open`)
          .emit(`company-${ticket.companyId}-ticket`, {
            action: "delete",
            ticket,
            ticketId: ticket.id
          });

        io.to(`company-${ticket.companyId}-${ticket.status}`)
          .to(`queue-${ticket.queueId}-${ticket.status}`)
          .to(ticket.id.toString())
          .emit(`company-${ticket.companyId}-ticket`, {
            action: "update",
            ticket,
            ticketId: ticket.id
          });

        // Registrar la acción en el log
        logger.info(`Ticket ${ticket.id} cerrado por el usuario ${contact.number} al escribir "salir"`);

        // Detener el procesamiento del mensaje
        return;
      } catch (err) {
        Sentry.captureException(err);
        logger.error(`Error al cerrar ticket con "salir": ${err}`);
      }
    }

    //DESABILITADO INTERAÇÕES NOS GRUPOS USANDO O && !isGroup e if (isGroup || contact.disableBot)//

    // voltar para o menu inicial

    // voltar para o menu inicia
    if (bodyMessage == "#" && !isGroup) {
      await ticket.update({
        queueOptionId: null,
        chatbot: false,
        queueId: null,
      });
      await verifyQueue(wbot, msg, ticket, ticket.contact);
      return;
    }


    const ticketTraking = await FindOrCreateATicketTrakingService({
      ticketId: ticket.id,
      companyId,
      whatsappId: whatsapp?.id
    });


    try {
      if (!msg.key.fromMe && !contact.isGroup) {
        /**
         * Tratamento para avaliação do atendente
         */

        // // dev Ricardo: insistir a responder avaliação
        // const rate_ = Number(bodyMessage);

        // if (
        //   (ticket?.lastMessage.includes("_Insatisfeito_") ||
        //     ticket?.lastMessage.includes(
        //       "Por favor avalie nosso atendimento."
        //     )) &&
        //   !isFinite(rate_)
        // ) {
        //   const debouncedSentMessage = debounce(
        //     async () => {
        //       await wbot.sendMessage(
        //         `${ticket.contact.number}@${
        //           ticket.isGroup ? "g.us" : "s.whatsapp.net"
        //         }`,
        //         {
        //           text: "Por favor avalie nosso atendimento."
        //         }
        //       );
        //     },
        //     1000,
        //     ticket.id
        //   );
        //   debouncedSentMessage();
        //   return;
        // }
        // // dev Ricardo

        if (
          ticketTraking !== null &&
          isNumeric(bodyMessage) &&
          verifyRating(ticketTraking)
        ) {
          await handleRating(
            parseFloat(bodyMessage),
            ticket,
            ticketTraking,
            contact
          );
          return;
        }
      }
    } catch (e) {
      Sentry.captureException(e);
      console.log(e);
    }


    // Atualiza o ticket se a ultima mensagem foi enviada por mim, para que possa ser finalizado.
    try {
      await ticket.update({
        fromMe: msg.key.fromMe,
      });
    } catch (e) {
      Sentry.captureException(e);
      console.log(e);
    }

    if (hasMedia) {
      mediaSent = await verifyMediaMessage(msg, ticket, contact);
    } else {
      await verifyMessage(msg, ticket, contact);
    }

    if (isGroup || contact.disableBot) {
      return;
    }

    const currentSchedule = await VerifyCurrentSchedule(companyId);
    const scheduleType = await Setting.findOne({
      where: {
        companyId,
        key: "scheduleType"
      }
    });


    try {
      if (!msg.key.fromMe && scheduleType) {
        /**
         * Tratamento para envio de mensagem quando a empresa está fora do expediente
         */
        if (
          scheduleType.value === "company" &&
          !isNil(currentSchedule) &&
          (!currentSchedule || currentSchedule.inActivity === false)
        ) {
          const body = `\u200e ${whatsapp.outOfHoursMessage},
            contact`;

          console.log('body9341023', body)
          const debouncedSentMessage = debounce(
            async () => {
              await wbot.sendMessage(
                `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"
                }`,
                {
                  text: body
                }
              );
            },
            3000,
            ticket.id
          );
          debouncedSentMessage();
          return;
        }

        console.log('MSG:', bodyMessage);
        if (scheduleType.value === "queue" && ticket.queueId !== null) {

          /**
           * Tratamento para envio de mensagem quando a fila está fora do expediente
           */


          const queue = await Queue.findByPk(ticket.queueId);

          const { schedules }: any = queue;
          const now = moment();
          const weekday = now.format("dddd").toLowerCase();
          let schedule = null;

          if (Array.isArray(schedules) && schedules.length > 0) {
            schedule = schedules.find(
              s =>
                s.weekdayEn === weekday &&
                s.startTimeA !== "" &&
                s.startTimeA !== null &&
                s.endTimeA !== "" &&
                s.endTimeA !== null
            );
          }

          if (
            scheduleType.value === "queue" &&
            queue.outOfHoursMessage !== null &&
            queue.outOfHoursMessage !== "" &&
            !isNil(schedule)
          ) {
            const startTimeA = moment(schedule.startTimeA, "HH:mm");
            const endTimeA = moment(schedule.endTimeA, "HH:mm");
            const startTimeB = moment(schedule.startTimeB, "HH:mm");
            const endTimeB = moment(schedule.endTimeB, "HH:mm");

            if (now.isBefore(startTimeA) || now.isAfter(endTimeA) && (now.isBefore(startTimeB) || now.isAfter(endTimeB))) {
              const body = `${queue.outOfHoursMessage}, contact`;
              console.log('body:23801', body)
              const debouncedSentMessage = debounce(
                async () => {
                  await wbot.sendMessage(
                    `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"
                    }`,
                    {
                      text: body
                    }
                  );
                },
                3000,
                ticket.id
              );
              debouncedSentMessage();
              return;
            }
          }
        }

      }
    } catch (e) {
      Sentry.captureException(e);
      console.log(e);
    }

    //openai na conexao
    if (
      !ticket.queue &&
      !isGroup &&
      !msg.key.fromMe &&
      !ticket.userId &&
      !isNil(whatsapp.promptId)
    ) {
      await handleOpenAi(msg, wbot, ticket, contact, mediaSent);
    }

    //integraçao na conexao
    if (
      !msg.key.fromMe &&
      !ticket.isGroup &&
      !ticket.queue &&
      !ticket.user &&
      ticket.chatbot &&
      !isNil(whatsapp.integrationId) &&
      !ticket.useIntegration
    ) {

      const integrations = await ShowQueueIntegrationService(whatsapp.integrationId, companyId);

      await handleMessageIntegration(msg, wbot, integrations, ticket)

      return
    }

    //openai na fila
    if (
      !isGroup &&
      !msg.key.fromMe &&
      !ticket.userId &&
      !isNil(ticket.promptId) &&
      ticket.useIntegration &&
      ticket.queueId

    ) {
      await handleOpenAi(msg, wbot, ticket, contact, mediaSent);
    }

    if (
      !msg.key.fromMe &&
      !ticket.isGroup &&
      !ticket.userId &&
      ticket.integrationId &&
      ticket.useIntegration &&
      ticket.queue
    ) {

      console.log("🤖 ENTRÓ EN EL TYPE 1974");
      const integrations = await ShowQueueIntegrationService(ticket.integrationId, companyId);

      await handleMessageIntegration(msg, wbot, integrations, ticket)

    }

    if (
      !ticket.queue &&
      !ticket.isGroup &&
      !msg.key.fromMe &&
      !ticket.userId &&
      whatsapp.queues.length >= 1 &&
      !ticket.useIntegration
    ) {

      await verifyQueue(wbot, msg, ticket, contact);

      if (ticketTraking.chatbotAt === null) {
        await ticketTraking.update({
          chatbotAt: moment().toDate(),
        })
      }
    }

    const dontReadTheFirstQuestion = ticket.queue === null;

    await ticket.reload();

    try {
      //Fluxo fora do expediente
      if (!msg.key.fromMe && scheduleType && ticket.queueId !== null && ticket.status !== "open") {
        /**
         * Tratamento para envio de mensagem quando a fila está fora do expediente
         */
        const queue = await Queue.findByPk(ticket.queueId);

        const { schedules }: any = queue;
        const now = moment();
        const weekday = now.format("dddd").toLowerCase();
        let schedule = null;

        if (Array.isArray(schedules) && schedules.length > 0) {
          schedule = schedules.find(
            s =>
              s.weekdayEn === weekday &&
              s.startTimeA !== "" &&
              s.startTimeA !== null &&
              s.endTimeA !== "" &&
              s.endTimeA !== null
          );
        }

        if (
          scheduleType.value === "queue" &&
          queue.outOfHoursMessage !== null &&
          queue.outOfHoursMessage !== "" &&
          !isNil(schedule)
        ) {
          const startTimeA = moment(schedule.startTimeA, "HH:mm");
          const endTimeA = moment(schedule.endTimeA, "HH:mm");
          const startTimeB = moment(schedule.startTimeB, "HH:mm");
          const endTimeB = moment(schedule.endTimeB, "HH:mm");

          if (now.isBefore(startTimeA) || now.isAfter(endTimeA) && (now.isBefore(startTimeB) || now.isAfter(endTimeB))) {
            const body = queue.outOfHoursMessage;
            console.log('body158964153', body)
            const debouncedSentMessage = debounce(
              async () => {
                await wbot.sendMessage(
                  `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"
                  }`,
                  {
                    text: body
                  }
                );
              },
              3000,
              ticket.id
            );
            debouncedSentMessage();
            return;
          }
        }
      }
    } catch (e) {
      Sentry.captureException(e);
      console.log(e);
    }



    if (!whatsapp?.queues?.length && !ticket.userId && !isGroup && !msg.key.fromMe) {

      const lastMessage = await Message.findOne({
        where: {
          ticketId: ticket.id,
          fromMe: true
        },
        order: [["createdAt", "DESC"]]
      });

      if (lastMessage && lastMessage.body.includes(whatsapp.greetingMessage)) {
        return;
      }

      if (whatsapp.greetingMessage) {

        console.log('whatsapp.greetingMessage', whatsapp.greetingMessage)
        const debouncedSentMessage = debounce(
          async () => {
            await wbot.sendMessage(
              `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"
              }`,
              {
                text: whatsapp.greetingMessage
              }
            );
          },
          1000,
          ticket.id
        );
        debouncedSentMessage();
        return;
      }

    }


    if (whatsapp.queues.length == 1 && ticket.queue) {
      if (ticket.chatbot && !msg.key.fromMe) {
        await handleChartbot(ticket, msg, wbot);
      }
    }
    if (whatsapp.queues.length > 1 && ticket.queue) {
      if (ticket.chatbot && !msg.key.fromMe) {
        await handleChartbot(ticket, msg, wbot, dontReadTheFirstQuestion);
      }
    }

  } catch (err) {
    console.log(err)
    Sentry.captureException(err);
    logger.error(`Error handling whatsapp message: Err: ${err}`);
  }
};


export const handleMsgAck = async (
  msg: WAMessage,
  chat: number | null | undefined
) => {
  await new Promise((r) => setTimeout(r, 500));
  const io = getIO();

  try {
    const messageToUpdate = await Message.findByPk(msg.key.id, {
      include: [
        "contact",
        {
          model: Message,
          as: "quotedMsg",
          include: ["contact"],
        },
      ],
    });

    if (!messageToUpdate) return;
    await messageToUpdate.update({ ack: chat });
    io.to(messageToUpdate.ticketId.toString()).emit(
      `company-${messageToUpdate.companyId}-appMessage`,
      {
        action: "update",
        message: messageToUpdate,
      }
    );

  } catch (err) {
    Sentry.captureException(err);
    logger.error(`Error handling message ack. Err: ${err}`);
  }
};

const verifyRecentCampaign = async (
  message: proto.IWebMessageInfo,
  companyId: number
) => {
  if (!message.key.fromMe) {
    const number = message.key.remoteJid.replace(/\D/g, "");
    const campaigns = await Campaign.findAll({
      where: { companyId, status: "EM_ANDAMENTO", confirmation: true },
    });
    if (campaigns) {
      const ids = campaigns.map((c) => c.id);
      const campaignShipping = await CampaignShipping.findOne({
        where: { campaignId: { [Op.in]: ids }, number, confirmation: null },
      });

      if (campaignShipping) {
        await campaignShipping.update({
          confirmedAt: moment(),
          confirmation: true,
        });
        await campaignQueue.add(
          "DispatchCampaign",
          {
            campaignShippingId: campaignShipping.id,
            campaignId: campaignShipping.campaignId,
          },
          {
            delay: parseToMilliseconds(randomValue(0, 10)),
          }
        );
      }
    }
  }
};

const verifyCampaignMessageAndCloseTicket = async (
  message: proto.IWebMessageInfo,
  companyId: number
) => {
  const io = getIO();
  const body = getBodyMessage(message);
  const isCampaign = /\u200c/.test(body);
  if (message.key.fromMe && isCampaign) {
    const messageRecord = await Message.findOne({
      where: { id: message.key.id!, companyId },
    });

    if (!messageRecord) return;

    const ticket = await Ticket.findByPk(messageRecord.ticketId);
    if (!ticket) return;

    await ticket.update({ status: "closed" });

    io.to(`company-${ticket.companyId}-open`)
      .to(`queue-${ticket.queueId}-open`)
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "delete",
        ticket,
        ticketId: ticket.id,
      });

    io.to(`company-${ticket.companyId}-${ticket.status}`)
      .to(`queue-${ticket.queueId}-${ticket.status}`)
      .to(ticket.id.toString())
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "update",
        ticket,
        ticketId: ticket.id,
      });
  }
};


const filterMessages = (msg: WAMessage): boolean => {
  if (msg.message?.protocolMessage) return false;

  if ([
    WAMessageStubType.REVOKE,
    WAMessageStubType.E2E_DEVICE_CHANGED,
    WAMessageStubType.E2E_IDENTITY_CHANGED,
    WAMessageStubType.CIPHERTEXT
  ].includes(msg.messageStubType)) // <- CORRECCIÓN: Eliminé el "as WAMessageStubType"
  {
    return false;
  }

  return true;
};

const wbotMessageListener = async (wbot: Session, companyId: number): Promise<void> => {
  try {
    wbot.ev.on("messages.upsert", async (messageUpsert: ImessageUpsert) => {
      const messages = messageUpsert.messages
        .filter(filterMessages)
        .map(msg => msg);



      if (!messages) return;

      messages.forEach(async (message: proto.IWebMessageInfo) => {
        const messageExists = await Message.count({
          where: { id: message.key.id!, companyId }
        });

        if (!messageExists) {
          await handleMessage(message, wbot, companyId);
          await verifyRecentCampaign(message, companyId);
          await verifyCampaignMessageAndCloseTicket(message, companyId);
        }
      });
    });

    wbot.ev.on("messages.update", (messageUpdate: WAMessageUpdate[]) => {
      if (messageUpdate.length === 0) return;
      messageUpdate.forEach(async (message: WAMessageUpdate) => {
        (wbot as WASocket)!.readMessages([message.key])

        await addMsgAckJob(message, message.update.status);
      });
    });

    wbot.ev.on("messages.update", (messageUpdate: WAMessageUpdate[]) => {
      if (messageUpdate.length === 0) return;
      messageUpdate.forEach(async (message: WAMessageUpdate) => {
        await addMsgAckJob(message, message.update.status);
      });
    });

    wbot.ev.on("chats.update", async (chatUpdate: Partial<Chat>[]) => {
      if (chatUpdate.length === 0) return;

      chatUpdate.forEach(async (chat: Partial<Chat>) => {
        await CreateOrUpdateBaileysChatService(wbot.id, chat);
      });
    });
  } catch (error) {
    Sentry.captureException(error);
    logger.error(`Error handling wbot message listener. Err: ${error}`);
  }
};


export { handleMessage, wbotMessageListener };
