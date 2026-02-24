import React, { useState, useEffect, useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import api from "../../services/api";
import { AuthContext } from "../../context/Auth/AuthContext";
import Board from 'react-trello';
import { toast } from "react-toastify";
import LaneTitle from "../../components/Kanban/LaneTitle";
import CardTitle from "../../components/Kanban/CardTitle";
import FooterButtons from "../../components/Kanban/FooterButtons";
import {
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip
} from "@material-ui/core";
import { MoreVert, Archive } from "@material-ui/icons";

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    padding: theme.spacing(2),
    height: "calc(100vh - 64px)",
    backgroundColor: "#f5f7fa",
    fontFamily: "'Roboto', sans-serif",
    overflow: "hidden",
    [theme.breakpoints.down('sm')]: {
      height: "auto",
      minHeight: "100vh",
      padding: theme.spacing(1),
    }
  },
  boardContainer: {
    width: "100%",
    "& .smooth-dnd-container": {
      minHeight: "60vh",
    },
    "& .react-trello-lane": {
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      margin: "0 8px",
      [theme.breakpoints.down('sm')]: {
        margin: "8px 0",
        width: "100% !important",
      }
    },
    "& .react-trello-card": {
      borderRadius: "6px",
      marginBottom: "8px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      transition: "all 0.2s ease",
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
      }
    },
    "& .react-trello-card-draggable": {
      cursor: "grab",
    },
    "& .react-trello-card-title": {
      fontSize: "14px",
      fontWeight: "500",
      color: "#333",
    },
    "& .react-trello-lane-header": {
      padding: "12px 16px",
      fontWeight: "600",
      fontSize: "16px",
    },
    cardActions: {
      display: "flex",
      justifyContent: "flex-end",
      padding: "8px 0 0 0",
    },
  }
}));

const CustomLaneHeader = props => {
  return (
    <div className="react-trello-lane-header">
      {props.titleComponent || props.title}
    </div>
  );
};

const Kanban = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const jsonString = user.queues.map(queue => queue.UserQueue.queueId);

  const [tags, setTags] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [laneQuantities, setLaneQuantities] = useState({});
  const [file, setFile] = useState({ lanes: [] });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [actionType, setActionType] = useState('');

  const fetchTags = async () => {
    try {
      const response = await api.get("/tags/kanban");
      const fetchedTags = response.data.lista || [];
      setTags(fetchedTags);
    } catch (error) {
      console.log(error);
      toast.error("Error al cargar las etiquetas");
    }
  };

  const fetchTickets = async () => {
    try {
      const { data } = await api.get("/ticket/kanban", {
        params: {
          queueIds: JSON.stringify(jsonString),
          teste: true
        }
      });
      setTickets(data.tickets);
    } catch (err) {
      console.log(err);
      toast.error("Error al cargar los tickets");
      setTickets([]);
    }
  };

  const handleMenuClick = (event, ticket) => {
    setAnchorEl(event.currentTarget);
    setSelectedTicket(ticket);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleActionClick = (type) => {
    setActionType(type);
    setOpenDialog(true);
    handleMenuClose();
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedTicket(null);
  };

  const confirmAction = async () => {
    try {
      if (actionType === 'archive') {
        await api.delete(`/ticket-tags/${selectedTicket.id}`);
        toast.success('Ticket archivado con éxito');
      }

      fetchTickets();
      fetchTags();
    } catch (err) {
      console.log(err);
      toast.error('Error al procesar la acción');
    } finally {
      handleDialogClose();
    }
  };

  useEffect(() => {
    fetchTags();
    fetchTickets();
  }, []);

  useEffect(() => {
    const newQuantities = {};

    newQuantities["0"] = tickets.filter(ticket => ticket.tags.length === 0).length;

    tags.forEach(tag => {
      const count = tickets.filter(ticket => ticket.tags.some(t => t.id === tag.id)).length;
      newQuantities[tag.id.toString()] = count;
    });

    setLaneQuantities(newQuantities);
  }, [tags, tickets]);

  useEffect(() => {
    const lanes = [
      {
        id: "0",
        title: "Abiertos",
        titleComponent: <LaneTitle firstLane quantity={laneQuantities["0"]}>Abiertos</LaneTitle>,
        style: {
          backgroundColor: "#f0f2f5",
          borderTop: "4px solid #6c757d"
        },
        cards: tickets.filter(ticket => ticket.tags.length === 0).map(ticket => ({
          id: ticket.id.toString(),
          title: <CardTitle ticket={ticket} userProfile={user.profile} />,
          label: (
            <div className={classes.cardActions}>
              <Tooltip title="Opciones">
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuClick(e, ticket)}
                >
                  <MoreVert fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>
          ),
          description: <FooterButtons ticket={ticket} />,
          draggable: true,
          href: "/tickets/" + ticket.uuid,
        })),
      },
      ...tags.map(tag => ({
        id: tag.id.toString(),
        title: tag.name,
        titleComponent: <LaneTitle squareColor={tag.color} quantity={laneQuantities[tag.id.toString()]}>{tag.name}</LaneTitle>,
        style: {
          backgroundColor: `${tag.color}10`,
          borderTop: `4px solid ${tag.color}`
        },
        cards: tickets.filter(ticket => ticket.tags.some(t => t.id === tag.id)).map(ticket => ({
          id: ticket.id.toString(),
          title: <CardTitle ticket={ticket} userProfile={user.profile} />,
          label: (
            <div className={classes.cardActions}>
              <Tooltip title="Opciones">
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuClick(e, ticket)}
                >
                  <MoreVert fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>
          ),
          description: <FooterButtons ticket={ticket} />,
          draggable: true,
          href: "/tickets/" + ticket.uuid,
        })),
      })),
    ];

    setFile({ lanes });
  }, [tags, tickets, laneQuantities]);

  const handleCardMove = async (sourceLaneId, targetLaneId, cardId, index, card) => {
    try {
      if (sourceLaneId !== targetLaneId) {
        await api.delete(`/ticket-tags/${cardId}`);
        if (targetLaneId !== "0") {
          await api.put(`/ticket-tags/${cardId}/${targetLaneId}`);
        }
        toast.success('Ticket movido con éxito');
      }

      setFile(prevFile => {
        let movingCard = null;
        const newLanes = prevFile.lanes.map(lane => {
          if (lane.id === sourceLaneId) {
            const newCards = lane.cards.filter(c => {
              if (c.id === cardId) {
                movingCard = c;
                return false;
              }
              return true;
            });
            return { ...lane, cards: newCards };
          }
          return lane;
        }).map(lane => {
          if (lane.id === targetLaneId && movingCard) {
            const newCards = [...lane.cards];
            newCards.splice(index, 0, movingCard);
            return { ...lane, cards: newCards };
          }
          return lane;
        });

        return { lanes: newLanes };
      });

    } catch (err) {
      console.log(err);
      toast.error('Error al mover el ticket');
    }
  };

  return (
    <div className={classes.root}>
      <div className={classes.boardContainer}>
        <Board
          components={{ LaneHeader: CustomLaneHeader }}
          data={file}
          onCardMoveAcrossLanes={(fromLaneId, toLaneId, cardId, index, card) =>
            handleCardMove(fromLaneId, toLaneId, cardId, index, card)
          }
          laneStyle={{
            maxHeight: "80vh",
            minWidth: "280px",
            width: "280px"
          }}
          cardStyle={{
            backgroundColor: "white",
            padding: "12px",
            marginBottom: "12px"
          }}
          hideCardDeleteIcon
          style={{
            backgroundColor: 'transparent',
            height: "100%",
            fontFamily: "'Roboto', sans-serif",
          }}
          responsive
          collapsibleLanes
        />
      </div>

      {/* Menu de acciones */}
      <Menu
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleActionClick('archive')}>
          <Archive fontSize="small" style={{ marginRight: 8 }} />
          Finalizar
        </MenuItem>
      </Menu>

      {/* Diálogo de confirmación */}
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>
          {actionType === 'archive' ? 'Desvincular Ticket' : 'Borrar Ticket'}
        </DialogTitle>
        <DialogContent>
          {actionType === 'archive' ? (
            <p>¿Estás seguro de que deseas desvincular este ticket de todas las etiquetas kanban? El chat permanecerá intacto.</p>
          ) : (
            <p>Atención: Esta acción es irreversible. Todos los mensajes se perderán.</p>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            Cancelar
          </Button>
          <Button onClick={confirmAction} color="secondary" variant="contained">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Kanban;
