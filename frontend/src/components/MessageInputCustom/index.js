import React, { useState, useEffect, useContext, useRef } from "react";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import "emoji-mart/css/emoji-mart.css";
import { Picker } from "emoji-mart";
import MicRecorder from "mic-recorder-to-mp3";
import clsx from "clsx";
import { isNil } from "lodash";
import { Reply, ChevronLeft, ChevronRight, Message, TrendingUp } from "@material-ui/icons";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import InputBase from "@material-ui/core/InputBase";
import CircularProgress from "@material-ui/core/CircularProgress";
import { green, grey, blue, pink, purple, orange } from "@material-ui/core/colors";
import IconButton from "@material-ui/core/IconButton";
import MoodIcon from "@material-ui/icons/Mood";
import SendIcon from "@material-ui/icons/Send";
import CancelIcon from "@material-ui/icons/Cancel";
import ClearIcon from "@material-ui/icons/Clear";
import MicIcon from "@material-ui/icons/Mic";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import HighlightOffIcon from "@material-ui/icons/HighlightOff";
import { FormControlLabel, Switch } from "@material-ui/core";
import { isString, isEmpty, isObject, has } from "lodash";
import AddIcon from "@material-ui/icons/Add";
import ImageIcon from "@material-ui/icons/Image";
import DescriptionIcon from "@material-ui/icons/Description";
import VideocamIcon from "@material-ui/icons/Videocam";
import LocationOnIcon from "@material-ui/icons/LocationOn";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Button from "@material-ui/core/Button";
import Box from "@material-ui/core/Box";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import axios from "axios";

import RecordingTimer from "./RecordingTimer";
import { ReplyMessageContext } from "../../context/ReplyingMessage/ReplyingMessageContext";
import { ForwardMessageContext } from "../../context/ForwarMessage/ForwardMessageContext";
import { AuthContext } from "../../context/Auth/AuthContext";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import toastError from "../../errors/toastError";

import Compressor from 'compressorjs';
import LinearWithValueLabel from "./ProgressBarCustom";
import useQuickMessages from "../../hooks/useQuickMessages";

const Mp3Recorder = new MicRecorder({ bitRate: 128 });

const useStyles = makeStyles((theme) => ({
  mainWrapper: {
    backgroundColor: theme.palette.bordabox,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    borderTop: "1px solid rgba(0, 0, 0, 0.12)",
  },
  newMessageBox: {
    backgroundColor: theme.palette.newmessagebox,
    width: "100%",
    display: "flex",
    padding: "7px",
    alignItems: "center",
    position: "relative",
  },
  messageInputWrapper: {
    padding: 6,
    marginRight: 7,
    backgroundColor: theme.palette.inputdigita,
    display: "flex",
    borderRadius: 20,
    flex: 1,
  },
  messageInput: {
    paddingLeft: 10,
    flex: 1,
    border: "none",
  },
  sendMessageIcons: {
    color: "grey",
  },
  ForwardMessageIcons: {
    color: grey[700],
    transform: 'scaleX(-1)'
  },
  uploadInput: {
    display: "none",
  },
  viewMediaInputWrapper: {
    display: "flex",
    padding: "10px 13px",
    position: "relative",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.palette.inputdigita,
    borderTop: "1px solid rgba(0, 0, 0, 0.12)",
  },
  emojiBox: {
    position: "absolute",
    bottom: 63,
    width: 40,
    borderTop: "1px solid #e8e8e8",
  },
  attachmentMenu: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    width: "200px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    zIndex: 1000,
  },
  circleLoading: {
    color: green[500],
    opacity: "70%",
    position: "absolute",
    top: "20%",
    left: "50%",
    marginLeft: -12,
  },
  audioLoading: {
    color: green[500],
    opacity: "70%",
  },
  recorderWrapper: {
    display: "flex",
    alignItems: "center",
    alignContent: "middle",
  },
  cancelAudioIcon: {
    color: "red",
  },
  sendAudioIcon: {
    color: "green",
  },
  replyginMsgWrapper: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingLeft: 73,
    paddingRight: 7,
  },
  replyginMsgContainer: {
    flex: 1,
    marginRight: 5,
    overflowY: "hidden",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: "7.5px",
    display: "flex",
    position: "relative",
  },
  replyginMsgBody: {
    padding: 10,
    height: "auto",
    display: "block",
    whiteSpace: "pre-wrap",
    overflow: "hidden",
  },
  replyginContactMsgSideColor: {
    flex: "none",
    width: "4px",
    backgroundColor: "#35cd96",
  },
  replyginSelfMsgSideColor: {
    flex: "none",
    width: "4px",
    backgroundColor: "#6bcbef",
  },
  messageContactName: {
    display: "flex",
    color: "#6bcbef",
    fontWeight: 500,
  },
  quickMessagesWrapper: {
    position: 'relative',
    width: '100%',
  },
  quickMessagesContainer: {
    display: 'flex',
    overflowX: 'auto',
    scrollBehavior: 'smooth',
    padding: '5px 30px',
    gap: '8px',
    position: 'relative',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
    '-ms-overflow-style': 'none',
  },
  quickMessageButton: {
    flex: '0 0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '0.75rem',
    backgroundColor: '#FF5722', 
    color: '#fff',
    fontWeight: 500,
    textTransform: 'none',
    border: 'none',
    '& .start-icon': {
      marginRight: '6px',
      fontSize: '14px',
    },
    '& .end-icon': {
      marginLeft: '6px',
      fontSize: '14px',
    },
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: '4px',
    '&.left': {
      left: '5px',
    },
    '&.right': {
      right: '5px',
    },
  },
  imageIcon: {
    color: blue[500],
  },
  documentIcon: {
    color: orange[500],
  },
  videoIcon: {
    color: pink[500],
  },
  locationIcon: {
    color: purple[500],
  },
  audioIcon: {
    color: green[500],
  },
}));

const EmojiOptions = (props) => {
  const { disabled, showEmoji, setShowEmoji, handleAddEmoji } = props;
  const classes = useStyles();
  return (
    <>
      <IconButton
        aria-label="emojiPicker"
        component="span"
        disabled={disabled}
        onClick={(e) => setShowEmoji((prevState) => !prevState)}
      >
        <MoodIcon className={classes.sendMessageIcons} />
      </IconButton>
      {showEmoji ? (
        <div className={classes.emojiBox}>
          <Picker
            perLine={16}
            showPreview={false}
            showSkinTones={false}
            onSelect={handleAddEmoji}
          />
        </div>
      ) : null}
    </>
  );
};

const SignSwitch = (props) => {
  const { width, setSignMessage, signMessage } = props;
  if (isWidthUp("md", width)) {
    return (
      <FormControlLabel
        style={{ marginRight: 7, color: "gray" }}
        label={i18n.t("messagesInput.signMessage")}
        labelPlacement="start"
        control={
          <Switch
            size="small"
            checked={signMessage}
            onChange={(e) => {
              setSignMessage(e.target.checked);
            }}
            name="showAllTickets"
            color="primary"
          />
        }
      />
    );
  }
  return null;
};

const FileInput = (props) => {
  const { handleChangeMedias, disableOption, setMedias } = props;
  const classes = useStyles();
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const documentInputRef = useRef(null);

  const handleOpenOptions = () => {
    setShowOptions(!showOptions);
  };

  const handleOptionClick = (type) => {
    setShowOptions(false);
    switch(type) {
      case 'image':
        fileInputRef.current.click();
        break;
      case 'audio':
        audioInputRef.current.click();
        break;
      case 'video':
        videoInputRef.current.click();
        break;
      case 'document':
        documentInputRef.current.click();
        break;
      case 'location':
        handleShareLocation();
        break;
      default:
        break;
    }
  };

  const handleShareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const locationUrl = `https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`;
        props.setInputMessage(prev => `${prev}\nMi ubicación : ${locationUrl}`);
      }, (error) => {
        toastError("Error al obtener la ubicación: " + error.message);
      });
    } else {
      toastError("Geolocalización no soportada por el navegador");  
    }
  };

  return (
    <>
      <div style={{ position: 'relative' }}>
        <IconButton
          aria-label="upload"
          component="span"
          disabled={disableOption()}
          onClick={handleOpenOptions}
        >
          <AddIcon className={classes.sendMessageIcons} />
        </IconButton>
        
        {showOptions && (
          <Paper elevation={3} className={classes.attachmentMenu}>
            <MenuItem onClick={() => handleOptionClick('image')}>
              <ListItemIcon>
                <ImageIcon fontSize="small" className={classes.imageIcon} />
              </ListItemIcon>
              <ListItemText primary="Imagen" />
            </MenuItem>
            <MenuItem onClick={() => handleOptionClick('document')}>
              <ListItemIcon>
                <DescriptionIcon fontSize="small" className={classes.documentIcon} />
              </ListItemIcon>
              <ListItemText primary="Documento" />
            </MenuItem>
            <MenuItem onClick={() => handleOptionClick('video')}>
              <ListItemIcon>
                <VideocamIcon fontSize="small" className={classes.videoIcon} />
              </ListItemIcon>
              <ListItemText primary="Vídeo" />
            </MenuItem>
            <MenuItem onClick={() => handleOptionClick('location')}>
              <ListItemIcon>
                <LocationOnIcon fontSize="small" className={classes.locationIcon} />
              </ListItemIcon>
              <ListItemText primary="Ubicación" />
            </MenuItem>
            <MenuItem onClick={() => handleOptionClick('audio')}>
              <ListItemIcon>
                <MicIcon fontSize="small" className={classes.audioIcon} />
              </ListItemIcon>
              <ListItemText primary="Audio" />
            </MenuItem>
          </Paper>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files) handleChangeMedias(Array.from(e.target.files));
        }}
      />
      <input
        type="file"
        ref={audioInputRef}
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files) handleChangeMedias(Array.from(e.target.files));
        }}
      />
      <input
        type="file"
        ref={videoInputRef}
        accept="video/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files) handleChangeMedias(Array.from(e.target.files));
        }}
      />
      <input
        type="file"
        ref={documentInputRef}
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files) handleChangeMedias(Array.from(e.target.files));
        }}
      />
    </>
  );
};

const ActionButtons = (props) => {
  const {
    inputMessage,
    loading,
    recording,
    ticketStatus,
    handleSendMessage,
    handleCancelAudio,
    handleUploadAudio,
    handleStartRecording,
    handleOpenModalForward,
    showSelectMessageCheckbox
  } = props;
  const classes = useStyles();
  
  if (inputMessage || showSelectMessageCheckbox) {
    return (
      <IconButton
        aria-label="sendMessage"
        component="span"
        onClick={showSelectMessageCheckbox ? handleOpenModalForward : handleSendMessage}
        disabled={loading}
      >
        {showSelectMessageCheckbox ?
          <Reply className={classes.ForwardMessageIcons} /> : <SendIcon className={classes.sendMessageIcons} />}
      </IconButton>
    );
  } else if (recording) {
    return (
      <div className={classes.recorderWrapper}>
        <IconButton
          aria-label="cancelRecording"
          component="span"
          fontSize="large"
          disabled={loading}
          onClick={handleCancelAudio}
        >
          <HighlightOffIcon className={classes.cancelAudioIcon} />
        </IconButton>
        {loading ? (
          <div>
            <CircularProgress className={classes.audioLoading} />
          </div>
        ) : (
          <RecordingTimer />
        )}

        <IconButton
          aria-label="sendRecordedAudio"
          component="span"
          onClick={handleUploadAudio}
          disabled={loading}
        >
          <CheckCircleOutlineIcon className={classes.sendAudioIcon} />
        </IconButton>
      </div>
    );
  } else {
    return (
      <IconButton
        aria-label="showRecorder"
        component="span"
        disabled={loading || ticketStatus !== "open"}
        onClick={handleStartRecording}
      >
        <MicIcon className={classes.sendMessageIcons} />
      </IconButton>
    );
  }
};

const CustomInput = (props) => {
  const {
    loading,
    inputRef,
    ticketStatus,
    inputMessage,
    setInputMessage,
    handleSendMessage,
    handleInputPaste,
    disableOption,
    replyingMessage
  } = props;
  const classes = useStyles();

  const onKeyPress = (e) => {
    if (loading || e.shiftKey) return;
    else if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const onPaste = (e) => {
    if (ticketStatus === "open") {
      handleInputPaste(e);
    }
  };

  const renderPlaceholder = () => {
    if (ticketStatus === "open") {
      return i18n.t("messagesInput.placeholderOpen");
    }
    return i18n.t("messagesInput.placeholderClosed");
  };

  const setInputRef = (input) => {
    if (input) {
      input.focus();
      inputRef.current = input;
    }
  };

  return (
    <div className={classes.messageInputWrapper}>
      <InputBase
        inputRef={setInputRef}
        placeholder={renderPlaceholder()}
        multiline
        className={classes.messageInput}
        maxRows={5}
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onPaste={onPaste}
        onKeyPress={onKeyPress}
        disabled={disableOption()}
      />
    </div>
  );
};

const QuickMessages = ({ quickMessages, handleQuickMessageClick, inputMessage }) => {
  const classes = useStyles();
  const containerRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const filteredQuickMessages = inputMessage.startsWith('/') 
    ? quickMessages.filter(msg => 
        msg.shortcode.toLowerCase().includes(inputMessage.slice(1).toLowerCase())
      )
    : quickMessages;

  useEffect(() => {
    if (containerRef.current) {
      setMaxScroll(containerRef.current.scrollWidth - containerRef.current.clientWidth);
    }
  }, [filteredQuickMessages]);

  const handleScroll = (direction) => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scrollAmount = 200;
    
    if (direction === 'left') {
      container.scrollLeft -= scrollAmount;
    } else {
      container.scrollLeft += scrollAmount;
    }
    
    setTimeout(() => {
      setScrollPosition(container.scrollLeft);
    }, 300);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    containerRef.current.scrollLeft = scrollLeft - walk;
    setScrollPosition(containerRef.current.scrollLeft);
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    containerRef.current.scrollLeft = scrollLeft - walk;
    setScrollPosition(containerRef.current.scrollLeft);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  if (filteredQuickMessages.length === 0) return null;

  return (
    <div className={classes.quickMessagesWrapper}>
      {scrollPosition > 0 && (
        <IconButton 
          className={`${classes.navButton} left`}
          onClick={() => handleScroll('left')}
        >
          <ChevronLeft />
        </IconButton>
      )}

      <div 
        className={classes.quickMessagesContainer} 
        ref={containerRef}
        onScroll={(e) => setScrollPosition(e.target.scrollLeft)}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {filteredQuickMessages.map((message, index) => (
          <Button
            key={index}
            variant="contained"
            disableElevation
            className={classes.quickMessageButton}
            onClick={() => handleQuickMessageClick(message)}
          >
            <Message className="start-icon" />
            {message.shortcode}
            <TrendingUp className="end-icon" />
          </Button>
        ))}
      </div>

      {scrollPosition < maxScroll && (
        <IconButton 
          className={`${classes.navButton} right`}
          onClick={() => handleScroll('right')}
        >
          <ChevronRight />
        </IconButton>
      )}
    </div>
  );
};

const MessageInputCustom = (props) => {
  const { ticketStatus, ticketId } = props;
  const classes = useStyles();
  const [percentLoading, setPercentLoading] = useState(0);
  const [medias, setMedias] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const inputRef = useRef();
  const { setReplyingMessage, replyingMessage } =
    useContext(ReplyMessageContext);
  const { user } = useContext(AuthContext);

  const [signMessage, setSignMessage] = useLocalStorage("signOption", true);

  const {
    selectedMessages,
    setForwardMessageModalOpen,
    showSelectMessageCheckbox } = useContext(ForwardMessageContext);

  const [quickMessages, setQuickMessages] = useState([]);
  const { list: listQuickMessages } = useQuickMessages();

  useEffect(() => {
    inputRef.current.focus();
  }, [replyingMessage]);

  useEffect(() => {
    inputRef.current.focus();
    return () => {
      setInputMessage("");
      setShowEmoji(false);
      setMedias([]);
      setReplyingMessage(null);
    };
  }, [ticketId, setReplyingMessage]);

  useEffect(() => {
    async function fetchData() {
      const companyId = localStorage.getItem("companyId");
      const messages = await listQuickMessages({ companyId, userId: user.id });
      setQuickMessages(messages);
    }
    fetchData();
  }, []);

  const handleOpenModalForward = () => {
    if (selectedMessages.length === 0) {
      setForwardMessageModalOpen(false)
      toastError(i18n.t("messagesList.header.notMessage"));
      return;
    }
    setForwardMessageModalOpen(true);
  }

  const handleAddEmoji = (e) => {
    let emoji = e.native;
    setInputMessage((prevState) => prevState + emoji);
  };

  const handleChangeMedias = (selectedMedias) => {
    setMedias(selectedMedias);
  };

  const handleInputPaste = (e) => {
    if (e.clipboardData.files[0]) {
      setMedias([e.clipboardData.files[0]]);
    }
  };

  const handleUploadQuickMessageMedia = async (blob, message) => {
    setLoading(true);
    try {
      const extension = blob.type.split("/")[1];
      const formData = new FormData();
      const filename = `${new Date().getTime()}.${extension}`;
      formData.append("medias", blob, filename);
      formData.append("body", message);
      formData.append("fromMe", true);

      await api.post(`/messages/${ticketId}`, formData);
    } catch (err) {
      toastError(err);
      setLoading(false);
    }
    setLoading(false);
  };
  
  const handleQuickMessageClick = async (message) => {
    if (message.mediaPath) {
      try {
        const { data } = await axios.get(message.mediaPath, {
          responseType: "blob",
        });
        await handleUploadQuickMessageMedia(data, message.message);
        return;
      } catch (err) {
        toastError(err);
      }
    } else {
      const messageToSend = signMessage 
        ? `*${user?.name}:*\n${message.message}` 
        : message.message;
      
      try {
        await api.post(`/messages/${ticketId}`, {
          read: 1,
          fromMe: true,
          mediaUrl: "",
          body: messageToSend,
          quotedMsg: replyingMessage,
        });
        setInputMessage("");
      } catch (err) {
        toastError(err);
      }
    }
  };

  const handleUploadMedia = async (e) => {
    setLoading(true);
    e.preventDefault();

    const formData = new FormData();
    formData.append("fromMe", true);

    medias.forEach(async (media, idx) => {
      const file = media;
      if (!file) { return; }

      if (media?.type.split('/')[0] === 'image') {
        new Compressor(file, {
          quality: 0.7,
          async success(media) {
            formData.append("medias", media);
            formData.append("body", media.name);
          },
          error(err) {
            console.log(err.message);
          },
        });
      } else {
        formData.append("medias", media);
        formData.append("body", media.name);
      }
    });

    setTimeout(async()=> {
      try {
        await api.post(`/messages/${ticketId}`, formData, {
          onUploadProgress: (event) => {
            let progress = Math.round(
              (event.loaded * 100) / event.total
            );
            setPercentLoading(progress);
            console.log(`La imagen está cargada al ${progress}%...`);
          },
        })
          .then((response) => {
            setLoading(false);
            setMedias([]);
            setPercentLoading(0);
            console.log(`¡La imagen fue enviada al servidor!`);
          })
          .catch((err) => {
            console.error(`Hubo un problema al subir la imagen.`);
            console.log(err);
          });
      } catch (err) {
        toastError(err);
      }
    },2000)
  }

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "") return;
    setLoading(true);

    const message = {
      read: 1,
      fromMe: true,
      mediaUrl: "",
      body: signMessage
        ? `*${user?.name}:*\n${inputMessage.trim()}`
        : inputMessage.trim(),
      quotedMsg: replyingMessage,
    };
    try {
      await api.post(`/messages/${ticketId}`, message);
    } catch (err) {
      toastError(err);
    }

    setInputMessage("");
    setShowEmoji(false);
    setLoading(false);
    setReplyingMessage(null);
  };

  const handleStartRecording = async () => {
    setLoading(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await Mp3Recorder.start();
      setRecording(true);
      setLoading(false);
    } catch (err) {
      toastError(err);
      setLoading(false);
    }
  };

  const handleUploadAudio = async () => {
    setLoading(true);
    try {
      const [, blob] = await Mp3Recorder.stop().getMp3();
      if (blob.size < 10000) {
        setLoading(false);
        setRecording(false);
        return;
      }

      const formData = new FormData();
      const filename = `audio-record-site-${new Date().getTime()}.mp3`;
      formData.append("medias", blob, filename);
      formData.append("body", filename);
      formData.append("fromMe", true);

      await api.post(`/messages/${ticketId}`, formData);
    } catch (err) {
      toastError(err);
    }

    setRecording(false);
    setLoading(false);
  };

  const handleCancelAudio = async () => {
    try {
      await Mp3Recorder.stop().getMp3();
      setRecording(false);
    } catch (err) {
      toastError(err);
    }
  };

  const disableOption = () => {
    return loading || recording || ticketStatus !== "open";
  };

  const renderReplyingMessage = (message) => {
    return (
      <div className={classes.replyginMsgWrapper}>
        <div className={classes.replyginMsgContainer}>
          <span
            className={clsx(classes.replyginContactMsgSideColor, {
              [classes.replyginSelfMsgSideColor]: !message.fromMe,
            })}
          ></span>
          <div className={classes.replyginMsgBody}>
            {!message.fromMe && (
              <span className={classes.messageContactName}>
                {message.contact?.name}
              </span>
            )}
            {message.body}
          </div>
        </div>
        <IconButton
          aria-label="showRecorder"
          component="span"
          disabled={loading || ticketStatus !== "open"}
          onClick={() => setReplyingMessage(null)}
        >
          <ClearIcon className={classes.sendMessageIcons} />
        </IconButton>
      </div>
    );
  };

  if (medias.length > 0)
    return (
      <Paper elevation={0} square className={classes.viewMediaInputWrapper}>
        <IconButton
          aria-label="cancel-upload"
          component="span"
          onClick={(e) => setMedias([])}
        >
          <CancelIcon className={classes.sendMessageIcons} />
        </IconButton>

        {loading ? (
          <div>
            <LinearWithValueLabel progress={percentLoading} />
          </div>
        ) : (
          <span>
            {medias[0]?.name}
          </span>
        )}
        <IconButton
          aria-label="send-upload"
          component="span"
          onClick={handleUploadMedia}
          disabled={loading}
        >
          <SendIcon className={classes.sendMessageIcons} />
        </IconButton>
      </Paper>
    );
  else {
    return (
      <Paper square elevation={0} className={classes.mainWrapper}>
        {replyingMessage && renderReplyingMessage(replyingMessage)}
        
        {quickMessages.length > 0 && (
          <QuickMessages 
            quickMessages={quickMessages} 
            handleQuickMessageClick={handleQuickMessageClick}
            inputMessage={inputMessage}
          />
        )}

        <div className={classes.newMessageBox}>
          <EmojiOptions
            disabled={disableOption()}
            handleAddEmoji={handleAddEmoji}
            showEmoji={showEmoji}
            setShowEmoji={setShowEmoji}
          />

          <FileInput
            disableOption={disableOption}
            handleChangeMedias={handleChangeMedias}
            setMedias={setMedias}
            setInputMessage={setInputMessage}
          />

          <SignSwitch
            width={props.width}
            setSignMessage={setSignMessage}
            signMessage={signMessage}
          />

          <CustomInput
            loading={loading}
            inputRef={inputRef}
            ticketStatus={ticketStatus}
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            handleSendMessage={handleSendMessage}
            handleInputPaste={handleInputPaste}
            disableOption={disableOption}
            replyingMessage={replyingMessage}
          />

          <ActionButtons
            inputMessage={inputMessage}
            loading={loading}
            recording={recording}
            ticketStatus={ticketStatus}
            handleSendMessage={handleSendMessage}
            handleCancelAudio={handleCancelAudio}
            handleUploadAudio={handleUploadAudio}
            handleStartRecording={handleStartRecording}
            handleOpenModalForward={handleOpenModalForward}
            showSelectMessageCheckbox={showSelectMessageCheckbox}
          />
        </div>
      </Paper>
    );
  }
};

export default withWidth()(MessageInputCustom);