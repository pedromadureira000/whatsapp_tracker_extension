(() => {
  // let chats_contact_name = Array.from(document.querySelectorAll('.zoWT4'))  
  // chats_contact_name[0].innerText == cellphone number <<
  // chats_last_synced_msg.forEach(el=>{console.log(el.querySelector("div._3OvU8 ").innerText)})  // Print innerText

  // const hasNewMessage = async () =>{
    // let stuff = Array.from(document.querySelectorAll('[class="l7jjieqr cfzgl7ar ei5e7seu h0viaqh7 tpmajp1w c0uhu3dl riy2oczp dsh4tgtl sy6s5v3r gz7w46tb lyutrhe2 qfejxiq4 fewfhwl7 ovhn1urg ap18qm3b ikwl5qvt j90th5db aumms1qt"]'))  
    // if (stuff.length > 0){
      // console.log(">>>>>>> There are " + stuff.length + " new messages")
      // return true
    // }
    // else {return false}
  // }

  const sleep = async (ms)=>{ return new Promise(resolve => setTimeout(resolve, ms)); } 

  const paneSideIsMounted = async () => {
    let paneSide = document.getElementById("pane-side")
    await sleep(5000);
    paneSide = document.getElementById("pane-side")
    if (!paneSide){
      await sleep(5000);
    }
  }
  
  async function callAPI(url = '', data = {}, method='GET') {
    const response = await fetch(url, {
      method: method,
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(data) // body data type must match "Content-Type" header
    });
    return response.json(); // parses JSON response into native JavaScript objects
  }

  const getChatsLastSyncedMessage = async () => {
    let chats_promise = new Promise(function(resolve, reject){
      chrome.storage.sync.get('chats_last_synced_msg', function(data){resolve(data.chats_last_synced_msg)})
    });
    let chats_last_synced_msg = await chats_promise
    if (!chats_last_synced_msg){
      chrome.storage.sync.set({chats_last_synced_msg: {}});
      return {}
    }
    return chats_last_synced_msg
  }

  const parseChatElements = async (elements) => {
    let messages = []
    elements.forEach(el=> {
      let message = {}
      let copyableText = el.querySelector('[class="copyable-text"]')
      dataPrePlainText = copyableText?.getAttribute('data-pre-plain-text')
      if (dataPrePlainText){
        _splitedDate = dataPrePlainText.split('[')[1].split(']')
        message['date'] = _splitedDate[0].split(',')[1].trim()
        message['hour'] = _splitedDate[0].split(',')[0]
        message['phone_number'] = _splitedDate[1].trim().split(':')[0]
        message['text'] = el.innerText.split('\n')[0]
        messages.push(message)
      }
    })
    return messages
  }

  const getChatDataFromDocument = async () => {
    let current_open_chat_div = document.querySelector('[class="_3xTHG"]')
    if (current_open_chat_div){
      let contact = current_open_chat_div.querySelector("header").innerText.split('\n')[0]
      let chat_elements = Array.from(current_open_chat_div.querySelectorAll('div._1-FMR'))
      if (contact && chat_elements){
        messages = await parseChatElements(chat_elements)
        return {contact: contact, messages: messages}
      }
    }
    return null
  }

  const syncMessages = async (contact, messages, chats_last_synced_msg) => {
    let messages_request_body = []
    let last_msg = chats_last_synced_msg[contact]
    if (last_msg){
      let index_of_last_msg = messages.findIndex(el=>{
        if (el.date == last_msg.date && el.hour == last_msg.hour && el.phone_number == last_msg.phone_number && 
          el.text == last_msg.text){return true}
        else{return false}
      }) 
      console.log(">>>>>>> index_of_last_msg: ", index_of_last_msg)
      messages_request_body = messages.slice(index_of_last_msg + 1)
    }
    else {
      messages_request_body = messages
    }

    console.log(">>>>>>>>>>>>>>>>>>>>>>>> messages_request_body: ", messages_request_body)
    if (messages_request_body.length > 0){
      callAPI('https://example.com/answer', messages_request_body, 'POST')
        .then((data) => {
          console.log(data); // JSON data parsed by `data.json()` call
        }).catch(()=>{});
    }
    return 'ok'
  }

  const statusSelected = (ev) => {
    console.log(">>>>>>> statusSelected: ", ev.target.value)
  }

  const addSelector = () => {
    let selectorOptions = [{text: "option 1", value: "value 1"}, {text: "option 2", value: "value 2"}, {text: "option 3", value: "value 3"}]
    let selectorExists = document.getElementById("mySelector");
    if (!selectorExists){
      let mySelector = document.createElement("select");
      mySelector.id = "mySelector"
      mySelector.style.cssText +=';margin-right:15px;'
      selectorOptions.forEach(el=>{
        let option = document.createElement("option");
        option.value = el.value
        option.text = el.text
        mySelector.add(option);
      })
      let wp_header = document.querySelector('[data-testid="conversation-header"]')
      wp_header.querySelector('[class="_1QVfy _3UaCz"]').insertBefore(mySelector, wp_header.querySelector('[data-testid="search-button"]'));
      mySelector.addEventListener("change", (ev)=> statusSelected(ev));
    }
  }

  const watchForNewChats = async (chats_last_synced_msg) => {
    console.log(">>>>>>> watchForNewChats")
    let data = await getChatDataFromDocument()
    if (data){ // If there is a selected chat
      addSelector()
      let {contact, messages} = data
      console.log(">>>>>>> current contact: ", contact)
      console.log(">>>>>>> current messages len: ", messages.length)
      let sync_response = await syncMessages(contact, messages, chats_last_synced_msg)
      if (sync_response == 'ok'){
        chats_last_synced_msg[contact] = messages.slice(-1)[0]
        chrome.storage.sync.set({chats_last_synced_msg: chats_last_synced_msg});
      }
    }
    await sleep(7000)
    watchForNewChats(chats_last_synced_msg)
  }

  const whatsAppInitialScript = async () => {
    let chats_last_synced_msg = await getChatsLastSyncedMessage()
    console.log(">>>>>>> chats_last_synced_msg form getChatsLastSyncedMessage function", chats_last_synced_msg)
    await paneSideIsMounted()
    watchForNewChats(chats_last_synced_msg)
  }
  whatsAppInitialScript();
})();
