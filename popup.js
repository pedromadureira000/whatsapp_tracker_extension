document.addEventListener("DOMContentLoaded", () => {console.log('inside popup.js, after DOMContentLoaded event')});

const validateFormOnSubmit = (ev) => {
  // ev.preventDefault()
  let tintim_auth_token = ev.target.elements.tintim_auth_token?.value
  if (tintim_auth_token)
  chrome.storage.sync.set({'tintim_auth_token': tintim_auth_token});
}

document.getElementById('tintin_login_form').onsubmit = validateFormOnSubmit;

// const getAuthToken = async () => {
  // let token_promise = new Promise(function(resolve, reject){
    // chrome.storage.sync.get('tintim_auth_token', function(data){resolve(data['tintim_auth_token'])})
  // });
  // let tintim_auth_token = await token_promise
  // if (!tintim_auth_token){
    // tintim_auth_token = 'tintim_auth_token not found'
  // }
  // return tintim_auth_token
// }

// const testBTN = async () => {
  // console.log(">>>>>>> testBTN")
  // let token = await getAuthToken()
  // console.log(">>>>>>> token: ", token)
// }

// document.getElementById('testBTN').onclick = testBTN;
