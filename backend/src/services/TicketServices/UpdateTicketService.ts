import moment from "moment";
import * as Sentry from "@sentry/node";
import CheckContactOpenTickets from "../../helpers/CheckContactOpenTickets";
import SetTicketMessagesAsRead from "../../helpers/SetTicketMessagesAsRead";
import { getIO } from "../../libs/socket";
import Ticket from "../../models/Ticket";
import Setting from "../../models/Setting";
import Queue from "../../models/Queue";
import ShowTicketService from "./ShowTicketService";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import FindOrCreateATicketTrakingService from "./FindOrCreateATicketTrakingService";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import { verifyMessage } from "../WbotServices/wbotMessageListener";
import ListSettingsServiceOne from "../SettingServices/ListSettingsServiceOne"; //NOVO PLW DESIGN//
import ShowUserService from "../UserServices/ShowUserService"; //NOVO PLW DESIGN//
import { isNil } from "lodash";
import Whatsapp from "../../models/Whatsapp";
import { Op } from "sequelize";
import AppError from "../../errors/AppError";

interface TicketData {
  status?: string;
  userId?: number | null;
  queueId?: number | null;
  chatbot?: boolean;
  queueOptionId?: number;
  whatsappId?: string;
  useIntegration?: boolean;
  integrationId?: number | null;
  promptId?: number | null;
  lastMessage?: string;
}

interface Request {
  ticketData: TicketData;
  ticketId: string | number;
  companyId: number;
}

interface Response {
  ticket: Ticket;
  oldStatus: string;
  oldUserId: number | undefined;
}

const UpdateTicketService = async ({
  ticketData,
  ticketId,
  companyId
}: Request): Promise<Response> => {

  try {
    let { status } = ticketData;
    let { queueId, userId, whatsappId, lastMessage = null } = ticketData;
    let chatbot: boolean | null = ticketData.chatbot || false;
    let queueOptionId: number | null = ticketData.queueOptionId || null;
    let promptId: number | null = ticketData.promptId || null;
    let useIntegration: boolean | null = ticketData.useIntegration || false;
    let integrationId: number | null = ticketData.integrationId || null;

    console.log("ticketData", ticketData);

    const io = getIO();

    const key = "userRating";
    const setting = await Setting.findOne({
      where: {
        companyId,
        key
      }
    });



    const ticket = await ShowTicketService(ticketId, companyId);
    const ticketTraking = await FindOrCreateATicketTrakingService({
      ticketId,
      companyId,
      whatsappId: ticket.whatsappId
    });

    if (isNil(whatsappId)) {
      whatsappId = ticket.whatsappId.toString();
    }

    await SetTicketMessagesAsRead(ticket);

    const oldStatus = ticket.status;
    const oldUserId = ticket.user?.id;
    const oldQueueId = ticket.queueId;

    if (oldStatus === "closed" || Number(whatsappId) !== ticket.whatsappId) {
      await CheckContactOpenTickets(ticket.contact.id, whatsappId);
      chatbot = null;
      queueOptionId = null;
    }

    if (status !== undefined && ["closed"].indexOf(status) > -1) {
      const { complationMessage, ratingMessage } = await ShowWhatsAppService(
        ticket.whatsappId,
        companyId
      );

      if (
        !ticket.contact.isGroup &&
        !ticket.contact.disableBot &&
        setting?.value === "enabled"
      ) {
        if (ticketTraking.ratingAt == null) {
          const ratingTxt = ratingMessage?.trim() || "";
          let bodyRatingMessage = `\u200e${ratingTxt}\n\n`;
          bodyRatingMessage +=
          "Escriba del 1 al 3 para calificar nuestro servicio:\n*1* - _Insatisfecho_\n*2* - _Satisfecho_\n*3* - _Muy Satisfecho_\n\n";
          await SendWhatsAppMessage({ body: bodyRatingMessage, ticket });      
    
          // Atualiza o rastreamento para indicar que a avaliação foi solicitada
          await ticketTraking.update({
            ratingAt: moment().toDate(),
          });
    
          // Remove o ticket da lista de abertos
          io.to(`company-${ticket.companyId}-open`)
            .to(`queue-${ticket.queueId}-open`)
            .to(ticketId.toString())
            .emit(`company-${ticket.companyId}-ticket`, {
              action: "delete",
              ticketId: ticket.id
            });
    
          return { ticket, oldStatus, oldUserId };
        }
    
        ticketTraking.ratingAt = moment().toDate();
        ticketTraking.rated = false;
      }

      if (
        !ticket.contact.isGroup &&
        !ticket.contact.disableBot &&
        !isNil(complationMessage) &&
        complationMessage !== ""
      )  {
        const body = `\u200e${complationMessage}`;
        await SendWhatsAppMessage({ body, ticket });
      }
      await ticket.update({
        promptId: null,
        integrationId: null,
        useIntegration: false,
        typebotStatus: false,
        typebotSessionId: null
      })

      ticketTraking.finishedAt = moment().toDate();
      ticketTraking.whatsappId = ticket.whatsappId;
      ticketTraking.userId = ticket.userId;

      queueId = null;
      userId = null;
    }

    if (queueId !== undefined && queueId !== null) {
      ticketTraking.queuedAt = moment().toDate();
    }

    const settingsTransfTicket = await ListSettingsServiceOne({ companyId: companyId, key: "sendMsgTransfTicket" });

    if (settingsTransfTicket?.value === "enabled") {
      // Mensagem de transferencia da FILA
      if (oldQueueId !== queueId && oldUserId === userId && !isNil(oldQueueId) && !isNil(queueId)) {

        const queue = await Queue.findByPk(queueId);
        const wbot = await GetTicketWbot(ticket);
        const msgtxt = "*Mensaje automático*:\nHas sido transferido al departamento *" + queue?.name + "*\npor favor espera, ¡te atenderemos en breve!";

        const queueChangedMessage = await wbot.sendMessage(
          `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
          {
            text: msgtxt
          }
        );
        await verifyMessage(queueChangedMessage, ticket, ticket.contact);
      }
      else
        // Mensagem de transferencia do ATENDENTE
        if (oldUserId !== userId && oldQueueId === queueId && !isNil(oldUserId) && !isNil(userId)) {
          const wbot = await GetTicketWbot(ticket);
          const nome = await ShowUserService(ticketData.userId);
          const msgtxt = "*Mensaje automático*:\nHas sido transferido al agente *" + nome.name + "*\npor favor espera, ¡te atenderemos en breve!";

          const queueChangedMessage = await wbot.sendMessage(
            `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
            {
              text: msgtxt
            }
          );
          await verifyMessage(queueChangedMessage, ticket, ticket.contact);
        }
        else
          // Mensagem de transferencia do ATENDENTE e da FILA
          if (oldUserId !== userId && !isNil(oldUserId) && !isNil(userId) && oldQueueId !== queueId && !isNil(oldQueueId) && !isNil(queueId)) {
            const wbot = await GetTicketWbot(ticket);
            const queue = await Queue.findByPk(queueId);
            const nome = await ShowUserService(ticketData.userId);
            const msgtxt = "*Mensaje automático*:\nHas sido transferido al departamento *" + queue?.name + "* y contarás con la atención de *" + nome.name + "*\npor favor espera, ¡te atenderemos en breve!";

            const queueChangedMessage = await wbot.sendMessage(
              `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
              {
                text: msgtxt
              }
            );
            await verifyMessage(queueChangedMessage, ticket, ticket.contact);
          } else
            if (oldUserId !== undefined && isNil(userId) && oldQueueId !== queueId && !isNil(queueId)) {

              const queue = await Queue.findByPk(queueId);
              const wbot = await GetTicketWbot(ticket);
              const msgtxt = "*Mensaje automático*:\nHas sido transferido al departamento *" + queue?.name + "*\npor favor espera, ¡te atenderemos en breve!";

              const queueChangedMessage = await wbot.sendMessage(
                `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
                {
                  text: msgtxt
                }
              );
              await verifyMessage(queueChangedMessage, ticket, ticket.contact);
            }      
    }

    await ticket.update({
      status,
      queueId,
      userId,
      whatsappId,
      chatbot,
      queueOptionId,
      lastMessage: lastMessage !== null ? lastMessage : ticket.lastMessage
    });

    await ticket.reload();

    if (status !== undefined && ["pending"].indexOf(status) > -1) {
      ticketTraking.update({
        whatsappId,
        queuedAt: moment().toDate(),
        startedAt: null,
        userId: null,
      });
    }

    if (status !== undefined && ["open"].indexOf(status) > -1) {
      ticketTraking.update({
        startedAt: moment().toDate(),
        ratingAt: null,
        rated: false,
        whatsappId,
        lastMessage: lastMessage !== null ? lastMessage : ticket.lastMessage,
        userId: ticket.userId
      });
    }

    await ticketTraking.save();

    if (ticket.status !== oldStatus || ticket.user?.id !== oldUserId) {

      io.to(`company-${companyId}-${oldStatus}`)
        .to(`queue-${ticket.queueId}-${oldStatus}`)
        .to(`user-${oldUserId}`)
        .emit(`company-${companyId}-ticket`, {
          action: "delete",
          ticketId: ticket.id
        });
    }

    io.to(`company-${companyId}-${ticket.status}`)
      .to(`company-${companyId}-notification`)
      .to(`queue-${ticket.queueId}-${ticket.status}`)
      .to(`queue-${ticket.queueId}-notification`)
      .to(ticketId.toString())
      .to(`user-${ticket?.userId}`)
      .to(`user-${oldUserId}`)
      .emit(`company-${companyId}-ticket`, {
        action: "update",
        ticket
      });

    return { ticket, oldStatus, oldUserId };
  } catch (err) {
    Sentry.captureException(err);
  }
};

export default UpdateTicketService;
