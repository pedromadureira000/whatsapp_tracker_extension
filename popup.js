document.addEventListener("DOMContentLoaded", () => {console.log('inside popup.js, after DOMContentLoaded event')});

const validateFormOnSubmit = (ev) => {
  // ev.preventDefault()
  let account_security_code = ev.target.elements.account_security_code?.value
  let account_code = ev.target.elements.account_code?.value
  if (account_security_code && account_code)
  chrome.storage.sync.set({'tintim_auth_data': {'account_security_code': account_security_code, 'account_code': account_code}});
}

document.getElementById('tintin_login_form').onsubmit = validateFormOnSubmit;

// const getAuthToken = async () => {
  // let token_promise = new Promise(function(resolve, reject){
    // chrome.storage.sync.get('account_security_code', function(data){resolve(data['account_security_code'])})
  // });
  // let account_security_code = await token_promise
  // if (!account_security_code){
    // account_security_code = 'account_security_code not found'
  // }
  // return account_security_code
// }

// const testBTN = async () => {
  // console.log(">>>>>>> testBTN")
  // let token = await getAuthToken()
  // console.log(">>>>>>> token: ", token)
// }

// document.getElementById('testBTN').onclick = testBTN;
