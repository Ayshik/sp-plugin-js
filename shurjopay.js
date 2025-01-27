/*
/**
 * 
 * Plug-in service to provide shurjoPay gateway services.
 * 
 * @uthor: Saiful Islam Shanto
 * @since 2022-11-02
*
*
*/


import { shurjopay_config } from '../../shurjopay_config.js';

//Getting credentials from shurjopay_config.js file
const sp_endpoint = shurjopay_config.SP_ENDPOINT;
const sp_username= shurjopay_config.SP_USERNAME;
const sp_password = shurjopay_config.SP_PASSWORD;
const sp_prefix = shurjopay_config.SP_PREFIX;
const sp_return_url = shurjopay_config.SP_RETURN_URL;


/**
 * Return authentication token for shurjoPay payment gateway system.
 * Setup shurjopay.properties file.
 *
 * @return authentication details with valid token
 * @throws ShurjopayException while merchant username and password is invalid.
 */
async function authentication() {
   //initiate authentication details which is hold api response
  let token_details = " ";
  if (sp_username && sp_password) {
    await fetch(`${sp_endpoint}/api/get_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        //request body credentials
        username: sp_username,
        password: sp_password,
      }),
    })
    //response received as json
      .then((response) => response.json())
      .then((tokenDetails) => {
        token_details = tokenDetails;
      })
      .catch((error) => {
         //error handler if any problem to fetch api
        console.error("Error:", error);
      });
    return token_details;
  } else {
    return "Authentication Error";
  }
}

/**
 * This method is used for making payment.
 *
 * @param Payment request object. See the shurjoPay version-2 integration documentation(beta).docx for details.
 * @return Payment response object contains redirect URL to reach payment page,token_details,order_id, form_data to verify order in shurjoPay.
 * @throws ShurjopayException while merchant username and password is invalid.
 * @throws ShurjopayPaymentException while {#link PaymentReq} is not prepared properly or {#link HttpClient} exception
 */
async function makePayment(order_id, form_data) {
  //Getting Ip from User device
  const ip = await fetch("https://checkip.amazonaws.com/");
  const client_ip = await ip.text();

  //Regular Expression For Checking Email and phone Number validation
  const phone_regex = /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[-\s\./0-9]*$/g;
  const email_regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

  //call authentication function for getting token details with store id
  const token_details = await authentication();
  const { token, token_type, store_id } = token_details;
  //initiate make payment details which is hold api response
  let makePayment_details = " ";

  //Checking all necessary values and formate
  if (
    token_type &&
    token &&
    store_id &&
    form_data.amount > 9 &&
    form_data.currency &&
    form_data.customer_phone.match(phone_regex) &&
    form_data.customer_name.length > 1 &&
    form_data.customer_city.length > 1 &&
    form_data.customer_address.length > 1 &&
    form_data.customer_post_code.length === 4 &&
    form_data.customer_email.match(email_regex) &&
    order_id
  ) {
    //fetching payment url from makePayment api
    await fetch(`${sp_endpoint}/api/secret-pay`, {
      method: "POST",
      headers: {
        //request header credentials
        authorization: `${token_type} ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        //request body credentials
        prefix: sp_prefix,
        store_id: store_id,
        token: token,
        return_url: sp_return_url,
        cancel_url: sp_return_url,
        amount: form_data.amount,
        order_id: order_id,
        currency: form_data.currency,
        customer_name: form_data.customer_name,
        customer_address: form_data.customer_address,
        customer_phone: form_data.customer_phone,
        customer_city: form_data.customer_city,
        customer_email: form_data.customer_email,
        customer_post_code: form_data.customer_post_code,
        client_ip: client_ip,
      }),
    })
      //response received as json
      .then((response) => response.json())
      .then((makePaymentDetails) => {
        makePayment_details = makePaymentDetails;
      })
      .catch((error) => {
        //error handler if any problem to fetch api
        console.error("Error:", error);
      });
    return makePayment_details;
  } else {
    return "shurjoPay Payment Failed";
  }
}
/**
 * This method is used for verifying order by order id which could be get by payment response object
 *
 * @param orderId
 * @return order object if order verified successfully
 * @throws ShurjopayException while merchant user name and password is invalid.
 * @throws ShurjopayVerificationException while token_type, token, order id is invalid or payment is not initiated properly or {#link HttpClient} exception
 */
async function verifyPayment(sp_order_id) {
  //call authentication function for getting token details.
  const token_details = await authentication();
  const { token, token_type } = token_details;
  let verify_status = " ";
  if (token && token_type && sp_order_id) {
    await fetch(`${sp_endpoint}/api/verification`, {
      method: "POST",
      headers: {
        //request header credentials
        authorization: `${token_type} ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        //request body credentials
        order_id: sp_order_id,
      }),
    })
      //response received as json
      .then((response) => response.json())
      .then((paymentDetails) => {
        verify_status = paymentDetails;
      })
      .catch((error) => {
        //error handler if any problem to fetch api
        console.error("Error:", error);
      });

    return verify_status;
  } else {
    return "Payment Verification Fail";
  }
}

/**
 * This method is used for verifying order by order id which could be get by payment response object
 *
 * @param  orderId
 * @return order object if order verified successfully
 * @throws ShurjopayException while merchant user name and password is invalid.
 * @throws ShurjopayVerificationException while order id is invalid or payment is not initiated properly or {#link HttpClient} exception
 */
async function paymentStatus(sp_order_id) {
  //call authentication function for getting token details.
  const token_details = await authentication();
  const { token, token_type } = token_details;
  let payment_status = " ";
  if (token && token_type && sp_order_id) {
    await fetch(`${sp_endpoint}/api/payment-status`, {
      method: "POST",
      headers: {
        //request header credentials
        authorization: `${token_type} ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        //request body credentials
        order_id: sp_order_id,
      }),
    })
      //response received as json
      .then((response) => response.json())
      .then((paymentDetails) => {
        payment_status = paymentDetails;
      })
      .catch((error) => {
        //error handler if any problem to fetch api
        console.error("Error:", error);
      });
    return payment_status;
  } else {
    return "payment Status Not Found";
  }
}

/*
 * Export functions and return values
 */
export { authentication, makePayment, paymentStatus, verifyPayment };

