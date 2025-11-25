import { id } from "date-fns/locale";

const messages = {
  es: {
    translations: {
      signup: {
        title: "Regístrate",
        toasts: {
          success: "¡Usuario creado con éxito! ¡Inicia sesión ahora!",
          fail: "Error al crear usuario. Verifica los datos ingresados.",
        },
        form: {
          name: "Nombre",
          email: "Correo electrónico",
          password: "Contraseña",
        },
        buttons: {
          submit: "Registrar",
          login: "¿Ya tienes una cuenta? ¡Inicia sesión!",
        },
      },
      login: {
        title: "Iniciar sesión",
        form: {
          email: "Correo electrónico",
          password: "Contraseña",
        },
        buttons: {
          submit: "Entrar",
          register: "¡Regístrate ahora mismo!",
        },
      },
      plans: {
        form: {
          name: "Nombre",
          users: "Usuarios",
          superls: "Permisos de Super Admin?",
          connections: "Conexiones",
          campaigns: "Campañas",
          schedules: "Agendamientos",
          enabled: "Habilitadas",
          disabled: "Deshabilitadas",
          clear: "Cancelar",
          delete: "Eliminar",
          save: "Guardar",
          yes: "Sí",
          no: "No",
          money: "Gs.",
        },
      },
      companies: {
        title: "Registrar empresa",
        form: {
          name: "Nombre de la empresa",
          plan: "Plan",
          token: "Token",
          submit: "Registrar",
          success: "¡Empresa creada con éxito!",
        },
      },
      auth: {
        toasts: {
          success: "¡Inicio de sesión exitoso!",
        },
        token: "Token",
      },
      dashboard: {
        charts: {
          perDay: {
            title: "Atenciones hoy: ",
          },
        },
        agent: "Agente",
        evaluations: "Evaluaciones",
        tmConversations: "TM. Conversac.",
        status: "Online",
      },
      connections: {
        title: "Conexiones",
        subtitle: "En uso: ",
        toasts: {
          deleted: "¡Conexión con WhatsApp eliminada con éxito!",
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "¿Estás seguro? Esta acción no puede ser revertida.",
          disconnectTitle: "Desconectar",
          disconnectMessage: "¿Estás seguro? Tendrás que leer el QR Code nuevamente.",
        },
        buttons: {
          add: "Agregar WhatsApp",
          disconnect: "Desconectar",
          tryAgain: "Intentar nuevamente",
          qrcode: "QR CODE",
          newQr: "Nuevo QR CODE",
          connecting: "Conectando",
          restart: "Restaurar",
        },
        toolTips: {
          disconnected: {
            title: "Error al iniciar sesión en WhatsApp",
            content:
              "Asegúrate de que tu celular esté conectado a internet e intenta nuevamente, o solicita un nuevo QR Code",
          },
          qrcode: {
            title: "Esperando lectura del QR Code",
            content:
              "Haz clic en el botón 'QR CODE' y lee el QR Code con tu celular para iniciar sesión",
          },
          connected: {
            title: "¡Conexión establecida!",
          },
          timeout: {
            title: "Se perdió la conexión con el celular",
            content:
              "Asegúrate de que tu celular esté conectado a internet y el WhatsApp esté abierto, o haz clic en el botón 'Desconectar' para obtener un nuevo QR Code",
          },
        },
        table: {
          name: "Nombre",
          number: "Número",
          status: "Estado",
          lastUpdate: "Última actualización",
          default: "Predeterminado",
          actions: "Acciones",
          session: "Sesión",
        },
      },
      whatsappModal: {
        title: {
          add: "Agregar WhatsApp",
          edit: "Editar WhatsApp",
        },
        tabs: {
          general: "General",
          messages: "Mensajes",
          assessments: "Reseñas",
          integrations: "Integraciones",
          schedules: "Horarios de trabajo",
        },
        form: {
          name: "Nombre",
          default: "Predeterminado",
          sendIdQueue: "Fila",
          timeSendQueue: "Redirigir a la fila en X minutos",
          queueRedirection: "Redirección de Fila",
          outOfHoursMessage: "Mensaje fuera de horario",
          queueRedirectionDesc: "Selecciona una fila para los contactos que no tienen fila asignada",
          prompt: "Prompt",
          expiresTicket: "Cerrar chats abiertos después de X minutos",
          expiresInactiveMessage: "Mensaje de cierre por inactividad",
          greetingMessage: "Mensaje de saludo",
          complationMessage: "Mensaje de finalización",
        },
        buttons: {
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar",
        },
        success: "WhatsApp guardado con éxito.",
      },
      qrCode: {
        message: "Lee el QR Code para iniciar sesión",
      },
      contacts: {
        title: "Contactos",
        toasts: {
          deleted: "¡Contacto eliminado con éxito!",
          deletedAll: "¡Todos los contactos eliminados con éxito!",
        },
        searchPlaceholder: "Buscar...",
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteAllTitle: "Eliminar todos",
          importTitle: "Importar contactos",
          deleteMessage: "¿Estás seguro de que deseas eliminar este contacto? Todos los tickets relacionados se perderán.",
          deleteAllMessage: "¿Estás seguro de que deseas eliminar todos los contactos? Todos los tickets relacionados se perderán.",
          importMessage: "¿Deseas importar todos los contactos del teléfono?",
        },
        buttons: {
          import: "Importar Contactos",
          importSheet: "Importar Excel",
          add: "Agregar Contacto",
          export: "Exportar Contactos",
          delete: "Eliminar Todos los Contactos"
        },
        table: {
          name: "Nombre",
          whatsapp: "WhatsApp",
          email: "Correo electrónico",
          actions: "Acciones",
        },
      },
      queueIntegrationModal: {
        title: {
          add: "Agregar proyecto",
          edit: "Editar proyecto",
        },
        form: {
          id: "ID",
          type: "Tipo",
          name: "Nombre",
          projectName: "Nombre del Proyecto",
          language: "Idioma",
          jsonContent: "Contenido JSON",
          urlN8N: "URL",
          typebotSlug: "Typebot - Slug",
          typebotExpires: "Tiempo en minutos para que expire una conversación",
          typebotKeywordFinish: "Palabra para finalizar el ticket",
          typebotKeywordRestart: "Palabra para reiniciar el flujo",
          typebotRestartMessage: "Mensaje al reiniciar la conversación",
          typebotUnknownMessage: "Mensaje de opción inválida",
          typebotDelayMessage: "Intervalo (ms) entre mensajes",
        },
        buttons: {
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar",
          test: "Probar Bot",
        },
        messages: {
          testSuccess: "¡Integración probada con éxito!",
          addSuccess: "¡Integración añadida con éxito!",
          editSuccess: "¡Integración editada con éxito!",
        },
      },
      sideMenu: {
        name: "Menú lateral inicial",
        note: "Si está habilitado, el menú lateral comenzará cerrado",
        options: {
          enabled: "Abierto",
          disabled: "Cerrado",
        },
      },
      promptModal: {
        form: {
          name: "Nombre",
          prompt: "Prompt",
          voice: "Voz",
          max_tokens: "Máximo de Tokens en la respuesta",
          temperature: "Temperatura",
          apikey: "API Key",
          max_messages: "Máximo de mensajes en el historial",
          voiceKey: "Clave API de voz",
          voiceRegion: "Región de voz",
        },
        success: "Prompt guardado con éxito.",
        title: {
          add: "Agregar Prompt",
          edit: "Editar Prompt",
        },
        buttons: {
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar",
        },
      },
      prompts: {
        title: "Prompts",
        table: {
          name: "Nombre",
          queue: "Sector/Fila",
          max_tokens: "Máximos Tokens Respuesta",
          actions: "Acciones",
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "¿Estás seguro? ¡Esta acción no puede ser revertida!",
        },
        buttons: {
          add: "Agregar Prompt",
        },
      },
      contactModal: {
        title: {
          add: "Agregar contacto",
          edit: "Editar contacto",
        },
        form: {
          mainInfo: "Datos del contacto",
          extraInfo: "Información adicional",
          name: "Nombre",
          number: "Número de WhatsApp",
          email: "Correo electrónico",
          extraName: "Nombre del campo",
          extraValue: "Valor",
          disableBot: "Deshabilitar chatbot",
          whatsapp: "Conexión de origen: "
        },
        buttons: {
          addExtraInfo: "Agregar información",
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar",
        },
        success: "Contacto guardado con éxito.",
      },
      queueModal: {
        title: {
          add: "Agregar fila",
          edit: "Editar fila",
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
        },
        form: {
          name: "Nombre",
          color: "Color",
          greetingMessage: "Mensaje de saludo",
          complationMessage: "Mensaje de finalización",
          outOfHoursMessage: "Mensaje fuera de horario",
          ratingMessage: "Mensaje de evaluación",
          token: "Token",
          orderQueue: "Orden de la fila (Bot)",
          integrationId: "Integración",
          filas: "Filas",
        },
        buttons: {
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar",
          attach: "Adjuntar archivo",
        },
        serviceHours: {
          dayWeek: "Día de la semana",
          startTimeA: "Hora de inicio - 1",
          endTimeA: "Hora de fin - 1",
          startTimeB: "Hora de inicio - 2",
          endTimeB: "Hora de fin - 2",
          monday: "Lunes",
          tuesday: "Martes",
          wednesday: "Miércoles",
          thursday: "Jueves",
          friday: "Viernes",
          saturday: "Sábado",
          sunday: "Domingo",
        },
      },
      userModal: {
        title: {
          add: "Agregar usuario",
          edit: "Editar usuario",
        },
        form: {
          SuperIs: "Permisos de Super Admin?",
          name: "Nombre",
          email: "Correo electrónico",
          password: "Contraseña",
          profile: "Perfil",
          whatsapp: "Conexión predeterminada",
          allTicket: "Ticket Sin Fila [Invisible]",
          allTicketEnabled: "Habilitado",
          allTicketDesabled: "Deshabilitado",
        },
        buttons: {
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar",
        },
        success: "Usuario guardado con éxito.",
      },
      scheduleModal: {
        title: {
          add: "Nuevo agendamiento",
          edit: "Editar agendamiento",
        },
        form: {
          body: "Mensaje",
          contact: "Contacto",
          sendAt: "Fecha de agendamiento",
          sentAt: "Fecha de envío",
        },
        buttons: {
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar",
        },
        success: "Agendamiento guardado con éxito.",
      },
      tagModal: {
        title: {
          add: "Nueva etiqueta",
          edit: "Editar etiqueta",
        },
        form: {
          name: "Nombre",
          color: "Color",
        },
        buttons: {
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar",
        },
        success: "Etiqueta guardada con éxito.",
      },
      chat: {
        noTicketMessage: "Selecciona un ticket para comenzar a conversar.",
      },
      uploads: {
        titles: {
          titleUploadMsgDragDrop: "ARRASTRA Y SUELTA LOS ARCHIVOS EN EL CAMPO DE ABAJO",
          titleFileList: "Lista de archivo(s)"
        },
      },
      ticketsManager: {
        buttons: {
          newTicket: "Nuevo",
          closeallTicket: "Cerrar todos"
        },
      },
      ticketsQueueSelect: {
        placeholder: "Filas",
      },
      tickets: {
        inbox: {
          closedAllTickets: "¿Cerrar todos los tickets?",
          closedAll: "Cerrar Todos",
          newTicket: "Nuevo Ticket",
          yes: "si",
          no: "no",
          open: "Abiertos",
          resolved: "Resueltos"
        },
        toasts: {
          deleted: "El ticket que estabas atendiendo ha sido eliminado."
        },
        notification: {
          message: "Mensaje de"
        },
        tabs: {
          open: { title: "Abiertos" },
          closed: { title: "Resueltos" },
          search: { title: "Búsqueda" }
        },
        search: {
          placeholder: "Buscar atención y mensajes",
          filterConnections: "Filtro por conexiones",
          filterContacts: "Filtro por contacto",
          filterConections: "Filtro por Conexión",
          filterConectionsOptions: {
            open: "Abierto",
            closed: "Cerrado",
            pending: "Pendiente"
          },
          filterUsers: "Filtro por Usuarios",
          ticketsperpage: "Tickets por página"
        },
        buttons: {
          showAll: "Todos",
        }
      },
      transferTicketModal: {
        title: "Transferir Ticket",
        fieldLabel: "Escriba para buscar usuarios",
        fieldQueueLabel: "Transferir a cola",
        fieldQueuePlaceholder: "Seleccione una cola",
        noOptions: "No se encontraron usuarios con ese nombre",
        buttons: {
          ok: "Transferir",
          cancel: "Cancelar"
        }
      },
      ticketsList: {
        pendingHeader: "Esperando",
        assignedHeader: "Atendiendo",
        noTicketsTitle: "¡Nada aquí!",
        noTicketsMessage: "No se encontró ninguna atención con ese estado o término de búsqueda",
        buttons: {
          accept: "Aceptar",
          closed: "Finalizar",
          transfer: "Transferir",
          reopen: "Reabrir",
          exportaspdf: "Exportar en PDF"
        }
      },
      newTicketModal: {
        title: "Crear Ticket",
        fieldlabel: "Escriba para buscar el contacto",
        add: "Agregar",
        buttons: {
          ok: "Guardar",
          cancel: "Cancelar"
        }
      },
      helps: {
        title: "Ayuda",
      },
      mainDrawer: {
        listItems: {
          dashboard: "Tablero",
          connections: "Conexiones",
          tickets: "Mensajes",
          quickMessages: "Respuestas Rápidas",
          contacts: "Contactos",
          queues: "Filas & Chatbot",
          tags: "Etiquetas",
          administration: "Administración",
          users: "Usuarios",
          settings: "Configuraciones",
          helps: "Ayuda",
          messagesAPI: "API",
          schedules: "Agendamientos",
          campaigns: "Campañas",
          annoucements: "Informativos",
          chats: "Chat Interno",
          financeiro: "Financiero",
          files: "Lista de archivos",
          prompts: "Open.AI",
          reports: "Informes",
          queueIntegration: "Integraciones",
          LogLauncher: "Logs",
        },
        appBar: {
          notRegister: "Sin notificaciones",
          user: {
            profile: "Perfil",
            logout: "Cerrar Sesión"
          }
        },
        menuNew: {
          tasks: "Mis tareas",
        }
      },
      queueIntegration: {
        title: "Integraciones",
        table: {
          id: "ID",
          type: "Tipo",
          name: "Nombre",
          projectname: "Nombre del Proyecto",
          language: "Idioma",
          lastupdate: "Última actualización",
          actions: "Acciones"
        },
        buttons: {
          add: "Agregar Proyecto"
        },
        searchPlaceholder: "Buscar...",
        confirmationModal: {
          deletetitle: "Eliminar",
          deletemessage: "¿Estás seguro? ¡Esta acción no puede ser revertida! Y será removido de las colas y conexiones vinculadas"
        }
      },
      reports: {
        title: "Informes de Atenciones",
        table: {
          id: "Ticket",
          user: "Usuario",
          dateopen: "Fecha Apertura",
          dateclose: "Fecha Cierre",
          nps: "NPS",
          status: "Estado",
          whatsapp: "Conexión",
          queue: "Cola",
          actions: "Acciones",
          lastmessage: "Últ. Mensaje",
          contact: "Cliente",
          supporttime: "Tiempo de Atención"
        },
        buttons: {
          filter: "Aplicar Filtro"
        },
        searchplaceholder: "Buscar..."
      },
      files: {
        title: "Lista de archivos",
        table: {
          name: "Nombre",
          contacts: "Contactos",
          actions: "Acción"
        },
        toasts: {
          deleted: "Lista eliminada con éxito!",
          deletedall: "¡Todas las listas fueron eliminadas con éxito!"
        },
        buttons: {
          add: "Agregar",
          deleteall: "Eliminar Todos"
        },
        confirmationModal: {
          deletetitle: "Eliminar",
          deletealltitle: "Eliminar Todos",
          deletemessage: "¿Estás seguro de que deseas eliminar esta lista?",
          deleteallmessage: "¿Estás seguro de que deseas eliminar todas las listas?"
        }
      },
      messagesAPI: {
        title: "API",
        textMessage: {
          number: "Número",
          body: "Mensaje",
          token: "Token registrado"
        },
        mediaMessage: {
          number: "Número",
          body: "Nombre del archivo",
          media: "Archivo",
          token: "Token registrado"
        }
      },
      notifications: {
        noTickets: "No hay notificaciones."
      },
      quickMessages: {
        title: "Respuestas Rápidas",
        searchPlaceholder: "Buscar...",
        noAttachment: "Sin adjunto",
        confirmationModal: {
          deleteTitle: "Eliminación",
          deleteMessage: "¡Esta acción es irreversible! ¿Quieres continuar?"
        },
        buttons: {
          add: "Agregar",
          attach: "Adjuntar Archivo",
          cancel: "Cancelar",
          edit: "Editar"
        },
        toasts: {
          success: "Acceso directo agregado con éxito!",
          deleted: "Acceso directo eliminado con éxito!"
        },
        dialog: {
          title: "Mensaje Rápido",
          shortcode: "Acceso directo",
          message: "Respuesta",
          save: "Guardar",
          cancel: "Cancelar",
          add: "Agregar",
          edit: "Editar",
          view: "Permitir ver",
          geral: "Global"
        },
        table: {
          shortcode: "Acceso directo",
          message: "Mensaje",
          actions: "Acciones",
          mediaName: "Nombre del archivo",
          status: "Global",
        }
      },
      messageVariablesPicker: {
        label: "Variables disponibles",
        vars: {
          contactFirstName: "Primer Nombre",
          contactName:"Nombre",
          greeting: "Saludo",
          protocolNumber: "Número de Protocolo",
          date: "Fecha",
          hour: "Hora"
        }
      },
      contactLists: {
        title: "Listas de Contactos",
        table: {
          name: "Nombre",
          contacts: "Contactos",
          actions: "Acciones"
        },
        buttons: {
          add: "Nueva Lista"
        },
        dialog: {
          name: "Nombre",
          company: "Empresa",
          okEdit: "Editar",
          okAdd: "Agregar",
          add: "Agregar",
          edit: "Editar",
          cancel: "Cancelar"
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "Esta acción no puede ser revertida."
        },
        toasts: {
          deleted: "Registro eliminado"
        }
      },
      contactListItems: {
        title: "Contactos",
        searchPlaceHolder: "Buscar",
        buttons: {
          add: "Nuevo",
          lists: "Listas",
          import: "Importar"
        },
        dialog: {
          name: "Nombre",
          number: "Número",
          whatsapp: "Whatsapp",
          email: "Correo electrónico",
          okEdit: "Editar",
          okAdd: "Agregar",
          add: "Agregar",
          edit: "Editar",
          cancel: "Cancelar"
        },
        table: {
          name: "Nombre",
          number: "Número",
          whatsapp: "Whatsapp",
          email: "Correo electrónico",
          actions: "Acciones"
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "Esta acción no puede ser revertida.",
          importMessage: "¿Deseas importar los contactos de esta hoja de cálculo?",
          importTitlte: "Importar"
        },
        toasts: {
          deleted: "Registro eliminado"
        }
      },
      
      campaigns: {
        title: "Campañas",
        searchPlaceholder: "Buscar",
        buttons: {
          add: "Nueva Campaña",
          contactLists: "Listas de Contactos"
        },
        table: {
          name: "Nombre",
          whatsapp: "Conexión",
          contactList: "Lista de Contactos",
          status: "Estado",
          scheduledAt: "Programado en",
          completedAt: "Completada",
          confirmation: "Confirmación",
          actions: "Acciones"
        },
        dialog: {
          new: "Nueva Campaña",
          update: "Editar Campaña",
          readonly: "Solo Vista",
          form: {
            name: "Nombre",
            message1: "Mensaje 1",
            message2: "Mensaje 2",
            message3: "Mensaje 3",
            message4: "Mensaje 4",
            message5: "Mensaje 5",
            confirmationMessage1: "Mensaje de Confirmación 1",
            confirmationMessage2: "Mensaje de Confirmación 2",
            confirmationMessage3: "Mensaje de Confirmación 3",
            confirmationMessage4: "Mensaje de Confirmación 4",
            confirmationMessage5: "Mensaje de Confirmación 5",
            messagePlaceholder: "Contenido del mensaje",
            whatsapp: "Conexión",
            status: "Estado",
            scheduledAt: "Programado en",
            confirmation: "Confirmación",
            contactList: "Lista de Contactos",
            tagList: "Lista de Etiquetas",
            fileList: "Lista de Archivos"
          },
          buttons: {
            add: "Agregar",
            edit: "Actualizar",
            okAdd: "Aceptar",
            cancel: "Cancelar Disparos",
            restart: "Reiniciar Disparos",
            close: "Cerrar",
            attach: "Adjuntar Archivo"
          }
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "Esta acción no puede ser revertida."
        },
        toasts: {
          success: "Operación realizada con éxito",
          cancel: "Campaña cancelada",
          restart: "Campaña reiniciada",
          deleted: "Registro eliminado"
        }
      },
      announcements: {
        active: "Activo",
        inactive: "Inactivo",
        title: "Informativos",
        searchPlaceholder: "Buscar",
        buttons: {
          add: "Nuevo Informativo",
          contactLists: "Listas de Informativos"
        },
        table: {
          priority: "Prioridad",
          title: "Título",
          text: "Texto",
          mediaName: "Archivo",
          status: "Estado",
          actions: "Acciones"
        },
        dialog: {
          edit: "Edición de Informativo",
          add: "Nuevo Informativo",
          update: "Editar Informativo",
          readonly: "Solo Vista",
          form: {
            priority: "Prioridad",
            title: "Título",
            text: "Texto",
            mediaPath: "Archivo",
            status: "Estado"
          },
          buttons: {
            add: "Agregar",
            edit: "Actualizar",
            okadd: "Aceptar",
            cancel: "Cancelar",
            close: "Cerrar",
            attach: "Adjuntar Archivo"
          }
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "Esta acción no puede ser revertida."
        },
        toasts: {
          success: "Operación realizada con éxito",
          deleted: "Registro eliminado"
        }
      },
      campaignsConfig: {
        title: "Configuraciones de Campañas"
      },
      queues: {
        title: "Filas & Chatbot",
        table: {
          id: "ID",
          name: "Nombre",
          color: "Color",
          greeting: "Mensaje de saludo",
          actions: "Acciones",
          orderQueue: "Orden de cola (bot)"
        },
        buttons: {
          add: "Agregar cola"
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "¿Estás seguro? ¡Esta acción no puede ser revertida! Las atenciones de esta cola seguirán existiendo, pero ya no tendrán ninguna cola asignada."
        }
      },
      confirmationModal: {
        buttons: {
          confirm: "Ok",
          cancel: "Cancelar"
        }
      },
      messageOptionsMenu: {
        delete: "Eliminar",
        reactionSuccess: "Reacción añadida",
        reply: "Responder",
        edit: "Editar Mensaje",
        forward: "Reenviar",
        toForward: "Reenviar",
        react: "Reaccionar",
        confirmationModal: {
          title: "¿Eliminar mensaje?",
          message: "Esta acción no puede ser revertida."
        }
      },
      fileModal: {
        title: {
          add: "Agregar archivo",
          edit: "Editar archivo",
        },
        form: {
          name: "Nombre",
          file: "Archivo",
          description: "Descripción",
          type: "Tipo",
          message: "Mensaje",
          fileName: "Nombre del archivo",
          fileOptions: "Opciones de archivo",
          extraName: "Nombre Archivo",
        },
        buttons: {
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar",
          fileOptions: "Opciones de archivo",
        },
        success: "Archivo guardado con éxito.",
      },
      backendErrors: {
        ERR_NO_OTHER_WHATSAPP: "Debe haber al menos un WhatsApp predeterminado.",
        ERR_NO_DEF_WAPP_FOUND: "No se encontró ningún WhatsApp predeterminado. Verifique la página de conexiones.",
        ERR_WAPP_NOT_INITIALIZED: "Esta sesión de WhatsApp no ha sido inicializada. Verifique la página de conexiones.",
        ERR_WAPP_CHECK_CONTACT: "No se pudo verificar el contacto de WhatsApp. Verifique la página de conexiones.",
        ERR_WAPP_INVALID_CONTACT: "Este no es un número de WhatsApp válido.",
        ERR_WAPP_DOWNLOAD_MEDIA: "No se pudo descargar el medio de WhatsApp. Verifique la página de conexiones.",
        ERR_INVALID_CREDENTIALS: "Error de autenticación. Por favor, intente nuevamente.",
        ERR_SENDING_WAPP_MSG: "Error al enviar mensaje de WhatsApp. Verifique la página de conexiones.",
        ERR_DELETE_WAPP_MSG: "No se pudo eliminar el mensaje de WhatsApp.",
        ERR_OTHER_OPEN_TICKET: "Ya existe un ticket abierto para este contacto.",
        ERR_SESSION_EXPIRED: "Sesión expirada. Por favor inicie sesión nuevamente.",
        ERR_USER_CREATION_DISABLED: "La creación de usuario ha sido deshabilitada por el administrador.",
        ERR_NO_PERMISSION: "No tienes permiso para acceder a este recurso.",
        ERR_DUPLICATED_CONTACT: "Ya existe un contacto con este número.",
        ERR_NO_SETTING_FOUND: "No se encontró ninguna configuración con este ID.",
        ERR_NO_CONTACT_FOUND: "No se encontró ningún contacto con este ID.",
        ERR_NO_TICKET_FOUND: "No se encontró ningún ticket con este ID.",
        ERR_NO_USER_FOUND: "No se encontró ningún usuario con este ID.",
        ERR_NO_WAPP_FOUND: "No se encontró ningún WhatsApp con este ID.",
        ERR_CREATING_MESSAGE: "Error al crear el mensaje en la base de datos.",
        ERR_CREATING_TICKET: "Error al crear el ticket en la base de datos.",
        ERR_FETCH_WAPP_MSG: "Error al buscar el mensaje en WhatsApp, quizás sea muy antiguo.",
        ERR_QUEUE_COLOR_ALREADY_EXISTS: "Este color ya está en uso, elija otro.",
        ERR_WAPP_GREETING_REQUIRED: "El mensaje de saludo es obligatorio cuando hay más de una cola."
      },
      users: {
        title: "Usuarios",
        table: {
          name: "Nombre",
          email: "Correo electrónico",
          whatsapp: "WhatsApp",
          profile: "Perfil",
          actions: "Acciones",
          status: "Estado",
          lastAccess: "Último acceso",
          id: "ID",
        },
        buttons: {
          add: "Agregar Usuario"
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "¿Estás seguro? ¡Esta acción no puede ser revertida!"
        },
        toasts: {
          deleted: "Usuario eliminado con éxito."
        }
      },
      tags : {
        title: "Etiquetas",
        table: {
          name: "Nombre",
          color: "Color",
          actions: "Acciones",
          tickets: "Tickets"
        },
        buttons: {
          add: "Agregar Etiqueta"
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "¿Estás seguro? ¡Esta acción no puede ser revertida!"
        },
        toasts: {
          deleted: "Etiqueta eliminada con éxito."
        }
      },   
      schedules: {
        title: "Horarios de trabajo",
        buttons: {
          add: "Agregar Horario",
          edit: "Editar Horario",
          cancel: "Cancelar",
          okAdd: "Agregar",
          okEdit: "Guardar",
        },
        table: {
          name: "Nombre",
          startTime: "Hora de inicio",
          endTime: "Hora de fin",
          actions: "Acciones",
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "¿Estás seguro? ¡Esta acción no puede ser revertida!"
        },
      },
      scheduleModal: {  
        title: {
          add: "Agregar Horario",
          edit: "Editar Horario",
        },
        form: {
          name: "Nombre",
          startTime: "Hora de inicio",
          endTime: "Hora de fin",
          geral: "General",
          body: "Mensaje",
          sendAt: "Fecha de agendamiento",
        },
        buttons: {
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar",
        },
        success: "Horario guardado con éxito.",
      },  
      queueSelect: {
        inputLabel: "Filas",
      },
      settings: {
        title: "Configuraciones",
      },  
      messagesInput:{
        signMessage: "Firma",
        placeholderOpen:  "Escribe un mensaje...",
        placeholderClosed: "Reabra, para poder escribir",
      },
      messagesList:{
        header: {
          assignedTo: "Asignado a",
          buttons: {
            return: "Devolver",
            reopen: "Reabrir",
            resolve: "Resolver",
          },
        }
      },
      contactDrawer:{
        header: "Información del contacto",
        extraInfo: "Información adicional",
        buttons: {
          edit: "Editar",
          delete: "Eliminar",
          addTag: "Agregar etiqueta",
          removeTag: "Eliminar etiqueta",
          addContact: "Agregar contacto",
          removeContact: "Eliminar contacto",
        },
      },
      ticketOptionsMenu:{
        appointmentsModal: {
          title: "Observaciones",
          textarea: "Mensaje",
          placeholder: "Escribe un mensaje...",
        },
        confirmationModal: {
          title: "Eliminar",
          titleFrom: "Eliminar de la lista",
          message: "¿Estás seguro? Esta acción no puede ser revertida.",  
        },
        schedule: "Agendar",
        transfer: "Transferir",
        delete: "Eliminar",
      },
      qrCodeModal:{
        title: "CRM-SAASTECH - QR Code",
      }
    },
  },
};

export { messages };
