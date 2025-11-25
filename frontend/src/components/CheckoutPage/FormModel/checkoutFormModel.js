export default {
  formId: 'checkoutForm',
  formField: {
    firstName: {
      name: 'firstName',
      label: 'Nombre completo*',
      requiredErrorMsg: 'El nombre completo es obligatorio'
    },
    lastName: {
      name: 'lastName',
      label: 'Apellido*',
      requiredErrorMsg: 'El apellido es obligatorio'
    },
    address1: {
      name: 'address2',
      label: 'Dirección*',
      requiredErrorMsg: 'La dirección es obligatoria' 
    },

    city: {
      name: 'city',
      label: 'Ciudad*',
      requiredErrorMsg: 'La ciudad es obligatoria'
    },
    state: {
      name: 'state',
      label: 'Estado*',
      requiredErrorMsg: 'El estado es obligatorio'
    },
    zipcode: {
      name: 'zipcode',
      label: 'RUC-CI*',
      requiredErrorMsg: 'El RUC-CI es obligatorio',
      invalidErrorMsg: 'El formato de RUC-CI es inválido'
    },
    country: {
      name: 'country',
      label: 'País*',
      requiredErrorMsg: 'El país es obligatorio'
    },
    useAddressForPaymentDetails: {
      name: 'useAddressForPaymentDetails',
      label: 'Use this address for payment details'
    },
    invoiceId: {
      name: 'invoiceId',
      label: 'Use this invoiceId'
    },
    nameOnCard: {
      name: 'nameOnCard',
      label: 'Nombre en tarjeta*',
      requiredErrorMsg: 'El nombre en tarjeta es obligatorio'
    },
    cardNumber: {
      name: 'cardNumber',
      label: 'Número de tarjeta*',
      requiredErrorMsg: 'El número de tarjeta es obligatorio',
      invalidErrorMsg: 'El número de tarjeta es inválido (e.g. 4111111111111)'
    },
    expiryDate: {
      name: 'expiryDate',
      label: 'Fecha de expiración*',
      requiredErrorMsg: 'La fecha de expiración es obligatoria',
      invalidErrorMsg: 'La fecha de expiración es inválida (e.g. 12/25)'
    },
    cvv: {
      name: 'cvv',
      label: 'CVV*',
      requiredErrorMsg: 'El CVV es obligatorio',
      invalidErrorMsg: 'El CVV es inválido (e.g. 357)'
    }
  }
};
