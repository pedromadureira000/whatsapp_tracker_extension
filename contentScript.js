(async () => {
  const utilsJS = chrome.runtime.getURL("utils.js");
  const utils = await import(utilsJS);
  const objectEquals = utils.objectEquals
  let DEBUG = true

  const sleep = async (ms)=>{ return new Promise(resolve => setTimeout(resolve, ms)); } 

  const getAuthData = async () => {
    let tintim_auth_data = await new Promise(function(resolve, reject){
      chrome.storage.sync.get('tintim_auth_data', function(data){resolve(data['tintim_auth_data'])})
    });
    if (!tintim_auth_data){
      tintim_auth_data = undefined
    }
    return tintim_auth_data
  }

  const paneSideIsMounted = async () => {
    let paneSide = document.getElementById("pane-side")
    await sleep(5000);
    paneSide = document.getElementById("pane-side")
    if (!paneSide){
      await sleep(5000);
    }
  }
 
  async function callAPI(url = '', request_body = {}, method='GET') {
    let data = await getAuthData()
    if (data){
      if (DEBUG){
          let {account_code, account_security_code} = data
          if (account_security_code != 'allowed_token' || account_code != 'account_code'){return undefined}
          if (url == 'http://syncMessages.test' ){
            return 'Messages synced with success'
          }
          else if (url == 'http://getSelectorOptions.test' ){
            let data = [{text: "option 1", value: "value 1"}, {text: "option 2", value: "value 2"}, {text: "option 3", value: "value 3"}]
            return {data: data}
          }
          else if (url == 'http://userIsAuthenticated.test' ){
            return {data: true}
          }
          else if (url == 'http://updateLeadStatus.test' ){
            return {data: 'Status updated'}
          }
      }
      else{
        let response = await fetch(url, {
          method: method,
          mode: 'cors', // no-cors, *cors, same-origin
          cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
          credentials: 'same-origin', // include, *same-origin, omit
          headers: {
            'Content-Type': 'application/json' //'Content-Type': 'application/x-www-form-urlencoded',
          },
          redirect: 'follow', // manual, *follow, error
          referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, etc ...
          body: JSON.stringify(request_body) // body data type must match "Content-Type" header
        });
        return response.json(); // parses JSON response into native JavaScript objects
      }
    }
    return undefined
  }

  const userIsAuthenticated = async () => {
    let data = await getAuthData()
    if (data){
      let {account_code, account_security_code} = data
      if (!account_security_code || !account_code){ return false }
      let response = await callAPI('http://userIsAuthenticated.test')
      if (response?.data == true){return true}
    }
    return false
  }

  const parseChatElements = async (elements) => {
    let messages = []
    elements.forEach(el=> {
      let message = {}
      let copyableText = el.querySelector('[class="copyable-text"]')
      dataPrePlainText = copyableText?.getAttribute('data-pre-plain-text')
      if (dataPrePlainText){
        let data_id = el.getAttribute('data-id')
        let splited_data_id = data_id.split('_')
        _splitedDate = dataPrePlainText.split('[')[1].split(']')
        message['date'] = _splitedDate[0].split(',')[1].trim()
        message['hour'] = _splitedDate[0].split(',')[0]
        message['contact_name'] = _splitedDate[1].trim().split(':')[0]
        message['text'] = el.innerText.split('\n')[0]
        message['from_me'] = splited_data_id[0]
        message['remote'] = splited_data_id[1]
        message['id'] = splited_data_id[2]
        message['data_id'] = data_id
        messages.push(message)
      }
    })
    return messages
  }

  const getChatDataFromDocument = async () => {
    let current_open_chat_div = document.querySelector('[class="_3xTHG"]')
    if (current_open_chat_div){
      let contact_name = current_open_chat_div.querySelector("header").innerText.split('\n')[0]
      let chat_elements = Array.from(current_open_chat_div.querySelectorAll('div._1-FMR'))
      if (contact_name && chat_elements){
        messages = await parseChatElements(chat_elements)
        return {contact_name: contact_name, messages: messages}
      }
    }
    return null
  }

  const syncMessages = async (contact_name, messages) => {
    let messages_request_body = []
    let chat = await getOrCreateChat(contact_name)
    let last_msg = chat.last_synced_msg
    if (last_msg){
      let index_of_last_msg = messages.findIndex(el=>{
        if (objectEquals(el, last_msg)){return true}
        else{return false}
      }) 
      messages_request_body = messages.slice(index_of_last_msg + 1)
    }
    else {
      messages_request_body = messages
    }
    if (messages_request_body.length > 0){
      callAPI('http://syncMessages.test', messages_request_body, 'POST')
        .then((data) => {
          console.log(data); // JSON data parsed by `data.json()` call
        })
        .catch((er)=>{console.log('>>>>>>>>>>> Erro: ', er)});
    }
    return 'ok'
  }

  const getSelectorOptions = async () => {
    let selectorOptions = null
    let response = await callAPI('http://getSelectorOptions.test')
    if (response){
      selectorOptions = response.data
    }
    return selectorOptions
  }

  const statusSelected = (ev, contact_name, chat) => {
    chat.selected_status = ev.target.value
    updateChat(contact_name, chat)
    callAPI('http://updateLeadStatus.test', {status: ev.target.value}, 'POST')
  }

  const addSelector = async (contact_name, chat) => {
    let selectorExists = document.getElementById("mySelector");
    let selectorOptions = await getSelectorOptions()
    if (!selectorExists && selectorOptions){
      let mySelector = document.createElement("select");
      mySelector.id = "mySelector"
      mySelector.style.cssText +=';margin-right:15px;'
      selectorOptions.forEach(el=>{
        let option = document.createElement("option");
        option.value = el.value
        option.text = el.text
        if (chat.selected_status && chat.selected_status == el.value){option.selected = true}
        mySelector.add(option);
      })
      let wp_header = document.querySelector('[data-testid="conversation-header"]')
      wp_header.querySelector('[class="_1QVfy _3UaCz"]').insertBefore(mySelector, wp_header.querySelector('[data-testid="search-button"]'));
      mySelector.addEventListener("change", (ev)=> statusSelected(ev, contact_name, chat));
    }
  }

  const getOrCreateChat = async (contact_name) => {
    let chat_promise = new Promise(function(resolve, reject){
      chrome.storage.sync.get(contact_name, function(data){resolve(data[contact_name])})
    });
    let chat = await chat_promise
    if (!chat){
      chat = {last_synced_msg: null, selected_status: null}
      chrome.storage.sync.set({[contact_name]: chat});
    }
    return chat
  }

  const updateChat = async (contact_name, chat) => {
    chrome.storage.sync.set({[contact_name]: chat});
  }

  const watchChatIsOpen = async () => {
    console.log(">>>>>>> watchChatIsOpen ........")
    let data = await getChatDataFromDocument()
    if (data){
      let {contact_name, messages} = data
      let chat = await getOrCreateChat(contact_name)
      addSelector(contact_name, chat)
      let sync_response = await syncMessages(contact_name, messages)
      if (sync_response == 'ok'){
        chat.last_synced_msg = messages.slice(-1)[0]
        updateChat(contact_name, chat)
      }
    }
    await sleep(5000)
    watchChatIsOpen()
  }

  const whatsAppInitialScript = async () => {
    await paneSideIsMounted()
    DEBUG = !('update_url' in chrome.runtime.getManifest())
    let userAuthenticated = await userIsAuthenticated()
    if (userAuthenticated){
      watchChatIsOpen()
    }
    else{console.log('>>>>>>>>> userIsAuthenticated failed')}
  }
  whatsAppInitialScript();
})();
