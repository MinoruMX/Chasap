import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import { i18n } from "../../translate/i18n";
import { Button, CircularProgress, Grid, TextField, Typography } from "@material-ui/core";
import { Field, Form, Formik } from "formik";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";
import axios from "axios";
import usePlans from "../../hooks/usePlans";

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
    padding: theme.spacing(2),
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
  const history = useHistory();

  const [formMessageTextData] = useState({ token: '', number: '', body: '' })
  const [formMessageMediaData] = useState({ token: '', number: '', medias: '' })
  const [file, setFile] = useState({})

  const { getPlanCompany } = usePlans();

  useEffect(() => {
    async function fetchData() {
      const companyId = localStorage.getItem("companyId");
      const planConfigs = await getPlanCompany(undefined, companyId);
      if (!planConfigs.plan.useExternalApi) {
        toast.error("¡Esta empresa no tiene permiso para acceder a esta página! Redireccionando...");
        setTimeout(() => {
          history.push(`/`)
        }, 1000);
      }
    }
    fetchData();
  }, []);

  const getEndpoint = () => {
    return process.env.REACT_APP_BACKEND_URL + '/api/messages/send'
  }

  const handleSendTextMessage = async (values) => {
    const { number, body } = values;
    const data = { number, body };
    try {
      await axios.request({
        url: getEndpoint(),
        method: 'POST',
        data,
        headers: {
          'Content-type': 'application/json',
          'Authorization': `Bearer ${values.token}`
        }
      })
      toast.success('Mensaje enviado exitosamente');
    } catch (err) {
      toastError(err);
    }
  }

  const handleSendMediaMessage = async (values) => {
    try {
      const firstFile = file[0];
      const data = new FormData();
      data.append('number', values.number);
      data.append('body', firstFile.name);
      data.append('medias', firstFile);
      await axios.request({
        url: getEndpoint(),
        method: 'POST',
        data,
        headers: {
          'Content-type': 'multipart/form-data',
          'Authorization': `Bearer ${values.token}`
        }
      })
      toast.success('Mensaje enviado exitosamente');
    } catch (err) {
      toastError(err);
    }
  }

  const renderFormMessageText = () => (
    <Formik
      initialValues={formMessageTextData}
      enableReinitialize
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
                variant="outlined"
                margin="dense"
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Field
                as={TextField}
                label={i18n.t("messagesAPI.textMessage.number")}
                name="number"
                variant="outlined"
                margin="dense"
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Field
                as={TextField}
                label={i18n.t("messagesAPI.textMessage.body")}
                name="body"
                variant="outlined"
                margin="dense"
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} className={classes.textRight}>
              <Button
                type="submit"
                color="primary"
                variant="contained"
              >
                {isSubmitting ? (
                  <CircularProgress size={24} />
                ) : 'Enviar'}
              </Button>
            </Grid>
          </Grid>
        </Form>
      )}
    </Formik>
  )

  const renderFormMessageMedia = () => (
    <Formik
      initialValues={formMessageMediaData}
      enableReinitialize
      onSubmit={(values, actions) => {
        setTimeout(async () => {
          await handleSendMediaMessage(values);
          actions.setSubmitting(false);
          actions.resetForm();
          document.getElementById('medias').files = null;
          document.getElementById('medias').value = null;
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
                variant="outlined"
                margin="dense"
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Field
                as={TextField}
                label={i18n.t("messagesAPI.mediaMessage.number")}
                name="number"
                variant="outlined"
                margin="dense"
                fullWidth
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
              >
                {isSubmitting ? (
                  <CircularProgress size={24} />
                ) : 'Enviar'}
              </Button>
            </Grid>
          </Grid>
        </Form>
      )}
    </Formik>
  )

  return (
    <Paper
      className={classes.mainPaper}
      style={{ marginLeft: "5px" }}
      variant="outlined"
    >
      <Typography variant="h5">
        Documentación para envío de mensajes via Whatsapp con la API REST
      </Typography>
      <Typography variant="h6" color="primary" className={classes.elementMargin}>
        Métodos de Envío
      </Typography>
      <Typography component="div">
        <ol>
          <li>Mensajes de Texto</li>
          <li>Mensajes Multimedia</li>
        </ol>
      </Typography>
      <Typography variant="h6" color="primary" className={classes.elementMargin}>
        Instrucciones
      </Typography>
      <Typography className={classes.elementMargin} component="div">
        <b>Observaciones importantes</b><br />
        <ul>
          <li>Antes de enviar mensajes, es necesario registrar el token vinculado a la conexión. <br />Para registrar, acceda al menú "Conexiones", edite la conexión e inserte el token en el campo correspondiente.</li>
          <li>
            El número de destino no debe contener máscara ni caracteres especiales y debe ser compuesto por(Ejemplo: 595981222222):
            <ul>
              <li>Código del país</li>
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
            <p>Información necesaria para enviar mensajes de texto:</p>
            <b>Endpoint: </b> {getEndpoint()} <br />
            <b>Método: </b> POST <br />
            <b>Headers: </b> Authorization (Bearer token) y Content-Type (application/json) <br />
            <b>Body: </b> {"{ \"number\": \"595985523065\", \"body\": \"Su mensaje\" }"}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography className={classes.elementMargin}>
            <b>Prueba de Envío</b>
          </Typography>
          {renderFormMessageText()}
        </Grid>
      </Grid>
      <Typography variant="h6" color="primary" className={classes.elementMargin}>
        2. Mensajes de Media
      </Typography>
      <Grid container>
        <Grid item xs={12} sm={6}>
          <Typography className={classes.elementMargin} component="div">
            <p>Información necesaria para enviar mensajes con media:</p>
            <b>Endpoint: </b> {getEndpoint()} <br />
            <b>Método: </b> POST <br />
            <b>Headers: </b> Authorization (Bearer token) y Content-Type (multipart/form-data) <br />
            <b>FormData: </b> <br />
            <ul>
              <li><b>number: </b> 5599999999999</li>
              <li><b>medias: </b> archivo</li>
            </ul>
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography className={classes.elementMargin}>
            <b>Prueba de Envío</b>
          </Typography>
          {renderFormMessageMedia()}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default MessagesAPI;
