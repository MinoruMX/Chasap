import React, { useState } from "react";
import axios from "axios";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";

import { i18n } from "../../translate/i18n";
import { Button, CircularProgress, Grid, TextField, Typography } from "@material-ui/core";
import { Field, Form, Formik } from "formik";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";
import api from "../../services/api";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(2),
    paddingBottom: 100
  },
  mainHeader: {
    marginTop: theme.spacing(1),
  },
  elementMargin: {
    marginTop: theme.spacing(2),
  },
  formContainer: {
    maxWidth: 500,
  },
  textRight: {
    textAlign: "right"
  }
}));

const MessagesAPI = () => {
  const classes = useStyles();

  const [formMessageTextData,] = useState({ token: '',number: '', body: '' })
  const [formMessageMediaData,] = useState({ token: '', number: '', medias: '' })
  const [file, setFile] = useState({})

  const getEndpoint = () => {
    return process.env.REACT_APP_BACKEND_URL + '/api/messages/send'
  }

  const handleSendTextMessage = async (values) => {
    const { number, body } = values;
    const data = { number, body };
    var options = {
      method: 'POST',
      url: `${process.env.REACT_APP_BACKEND_URL}/api/messages/send`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${values.token}`
      },
      data
    };
    
    axios.request(options).then(function (response) {
      toast.success('Mensaje enviado correctamente');
    }).catch(function (error) {
      toastError(error);
    });    
  }

  const handleSendMediaMessage = async (values) => { 
    try {
      const firstFile =  file[0];
      const data = new FormData();
      data.append('number', values.number);
      data.append('body', firstFile.name);
      data.append('medias', firstFile);
      var options = {
        method: 'POST',
        url: `${process.env.REACT_APP_BACKEND_URL}/api/messages/send`,
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${values.token}`
        },
        data
      };
      
      axios.request(options).then(function (response) {
        toast.success('Mensaje enviado correctamente');
      }).catch(function (error) {
        toastError(error);
      });      
    } catch (err) {
      toastError(err);
    }
  }

  const renderFormMessageText = () => {
    return (
      <Formik
        initialValues={formMessageTextData}
        enableReinitialize={true}
        onSubmit={(values, actions) => {
          setTimeout(async () => {
            await handleSendTextMessage(values);
            actions.setSubmitting(false);
            actions.resetForm()
          }, 400);
        }}
        className={classes.elementMargin}
      >
        {({ isSubmitting }) => (
          <Form className={classes.formContainer}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.textMessage.token")}
                  name="token"
                  autoFocus
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  className={classes.textField}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.textMessage.number")}
                  name="number"
                  autoFocus
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  className={classes.textField}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.textMessage.body")}
                  name="body"
                  autoFocus
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  className={classes.textField}
                  required
                />
              </Grid>
              <Grid item xs={12} className={classes.textRight}>
                <Button
									type="submit"
									color="primary"
									variant="contained"
									className={classes.btnWrapper}
								>
									{isSubmitting ? (
										<CircularProgress
											size={24}
											className={classes.buttonProgress}
										/>
									) : 'Enviar'}
								</Button>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
    )
  }

  const renderFormMessageMedia = () => {
    return (
      <Formik
        initialValues={formMessageMediaData}
        enableReinitialize={true}
        onSubmit={(values, actions) => {
          setTimeout(async () => {
            console.log(values, file)
            await handleSendMediaMessage(values);
            actions.setSubmitting(false);
            actions.resetForm()
            document.getElementById('medias').files = null
            document.getElementById('medias').value = null
          }, 400);
        }}
        className={classes.elementMargin}
      >
        {({ isSubmitting }) => (
          <Form className={classes.formContainer}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.mediaMessage.token")}
                  name="token"
                  autoFocus
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  className={classes.textField}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.mediaMessage.number")}
                  name="number"
                  autoFocus
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  className={classes.textField}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <input type="file" name="medias" id="medias" required onChange={(e) => setFile(e.target.files)} />
              </Grid>
              <Grid item xs={12} className={classes.textRight}>
                <Button
									type="submit"
									color="primary"
									variant="contained"
									className={classes.btnWrapper}
								>
									{isSubmitting ? (
										<CircularProgress
											size={24}
											className={classes.buttonProgress}
										/>
									) : 'Enviar'}
								</Button>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
    )
  }

  return (
    <Paper
      className={classes.mainPaper}
      variant="outlined"
    >
      <Typography variant="h5">
        Documentación para el envío de mensajes.
      </Typography>
      <Typography variant="h6" color="primary" className={classes.elementMargin}>
        Métodos de Envios
      </Typography>
      <Typography component="div">
        <ol>
          <li>Mensajes de Texto</li>
          <li>Mensajes de Medios</li>
        </ol>
      </Typography>
      <Typography variant="h6" color="primary" className={classes.elementMargin}>
        Instrucciones
      </Typography>
      <Typography className={classes.elementMargin} component="div">
      <b>Notas importantes</b><br />
        <ul>
          <li>Antes de enviar mensajes, es necesario registrar el token vinculado a la conexión que enviará los mensajes.<br/>Para registrarse, acceda al menú "Conexiones", haga clic en el botón de edición de la conexión e inserte el token en el campo correspondiente.</li>
          <li>
            El número del envío no debe tener espacios ni caracteres especiales y debe estar compuesto por:
              <ul>
                <li>Código de país</li>
                <li>DDD</li>
                <li>Número</li>
              </ul>
          </li>
        </ul>
      </Typography>
      <Typography variant="h6" color="primary" className={classes.elementMargin}>
        1. Mensajes de Texto
      </Typography>
      <Grid container>
        <Grid item xs={12} sm={6}>
          <Typography className={classes.elementMargin} component="div">
            <p>A continuación se muestra la lista de información necesaria para enviar mensajes de texto:</p>
            <b>Endpoint: </b> {getEndpoint()} <br />
            <b>Método: </b> POST <br />
            <b>Headers: </b> X_TOKEN (Token registrado) y Content-Type (application/json) <br />
            <b>Body: </b> {"{ \"number\": \"558599999999\", \"body\": \"Su Mensaje\" }"}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography className={classes.elementMargin}>
            <b>Prueba de envío</b>
          </Typography>
          {renderFormMessageText()}
        </Grid>
      </Grid>
      <Typography variant="h6" color="primary" className={classes.elementMargin}>
        2. Mensajes de Medios
      </Typography>
      <Grid container>
        <Grid item xs={12} sm={6}>
          <Typography className={classes.elementMargin} component="div">
            <p>A continuación se muestra la lista de información necesaria para enviar mensajes de medios:</p>
            <b>Endpoint: </b> {getEndpoint()} <br />
            <b>Método: </b> POST <br />
            <b>Headers: </b> X_TOKEN (Token registrado) y Content-Type (multipart/form-data) <br />
            <b>FormData: </b> <br />
            <ul>
              <li>
                <b>Número: </b> 529999999999
              </li>
              <li>
                <b>Medios: </b> Archivo
              </li>
            </ul>
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography className={classes.elementMargin}>
            <b>Prueba de envío</b>
          </Typography>
          {renderFormMessageMedia()}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default MessagesAPI;