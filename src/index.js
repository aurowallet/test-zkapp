let account

const initializeMina = async () => {
  const onboardButton = document.getElementById('connectButton')
  const getAccountsButton = document.getElementById('getAccounts')
  const getAccountsResults = document.getElementById('getAccountsResult')

  onboardButton.onclick = async () => {
    if (!window.mina) {
      alert("No provider was found 请先安装 Auro Wallet")
    } else {
      onboardButton.innerText = 'Onboarding in progress'
      let data = await window.mina.requestAccounts().catch(err => err)
      if (data.message) {
        onboardButton.innerText = data.message
      }else{
        let approveAccount = data
        account = approveAccount
        document.getElementById('accounts').innerHTML = approveAccount;
        onboardButton.innerText = 'Connected'
        onboardButton.disabled = true
      }
    }
  }
  const onlyGetAccountButton = document.getElementById('onlyGetAccountButton')
  
  
  onlyGetAccountButton.onclick = async () => {
    if (!window.mina) {
      alert("No provider was found 请先安装 Auro Wallet")
    } else {
      onlyGetAccountButton.innerText = 'Onboarding in progress'
      let data = await window.mina.getAccounts()
      document.getElementById('accounts').innerHTML = data;
    }
  }


  const initAccount = async ()=>{
    if (window.mina) {
      let data = await window.mina.requestAccounts().catch(err => err)
      let approveAccount = data
      if (data.message) {
        getAccountsResults.innerHTML = data.message
      } else {

        account = approveAccount
        document.getElementById('accounts').innerHTML = approveAccount;
        onboardButton.innerText = 'Connected'
        onboardButton.disabled = true

        getAccountsResults.innerHTML = approveAccount;
      }
    }
  }

  
  /**
   * get account
   */
  getAccountsButton.onclick = async () => {
    if (window.mina) {
      let data = await window.mina.requestAccounts().catch(err => err)
      let approveAccount = data
      if (data.message) {
        getAccountsResults.innerHTML = data.message
      } else {
        getAccountsResults.innerHTML = approveAccount;
      }
    }
  }


  const sendButton = document.getElementById('sendButton')
  const sendAmountInput = document.getElementById('sendAmountInput')
  const receiveAddressInput = document.getElementById('receiveAddressInput')
  const sendFeeInput = document.getElementById('sendFee')
  const sendMemoInput = document.getElementById('sendMemo')
  const sendResultDisplay = document.getElementById('sendResultDisplay')

  /**
   * transfer 
   */
  sendButton.onclick = async () => {

    let sendResult = await window.mina.sendLegacyPayment({
      amount: sendAmountInput.value,
      to: receiveAddressInput.value,
      fee: sendFeeInput.value,
      memo: sendMemoInput.value
    }).catch(err => err)

    if (sendResult.hash) {
      sendResultDisplay.innerHTML = sendResult.hash
    } else {
      sendResultDisplay.innerHTML = sendResult.message
    }
  }

  /**
   * staking
   */
  const stakingButton = document.getElementById('stakingButton')
  const vaildatorAddressInput = document.getElementById('vaildatorAddressInput')
  const stakeFeeInput = document.getElementById('stakeFee')
  const stakeMemoInput = document.getElementById('stakeMemo')
  const stakingResultDisplay = document.getElementById('stakingResultDisplay')

  stakingButton.onclick = async () => {
    let stakingResult = await window.mina.sendLegacyStakeDelegation({
      to: vaildatorAddressInput.value,
      fee: stakeFeeInput.value,
      memo: stakeMemoInput.value
    }).catch(err => err)
    if (stakingResult.hash) {
      stakingResultDisplay.innerHTML = stakingResult.hash
    } else {
      stakingResultDisplay.innerHTML = stakingResult.message
    }
  }
  /**
   * sign message
   */
  const signMessageButton = document.getElementById('signMessageButton')
  const signMessageContent = document.getElementById('signMessageContent')
  const signMessageResult = document.getElementById('signMessageResult')


  let signResult

  signMessageButton.onclick = async () => {
    signResult = await window.mina.signMessage({
      message: signMessageContent.value,
    }).catch(err => err)
    if (signResult.signature) {
      signMessageResult.innerHTML = JSON.stringify(signResult.signature)
    } else {
      signMessageResult.innerHTML = signResult.message
    }
  }

  const signVerifyButton = document.getElementById('signVerifyButton')
  const verifyResult = document.getElementById('verifyResult')


  const verifySignatureContent = document.getElementById('verifySignature')
  const verifyMessageContent = document.getElementById('verifyMessage')
  /**
   * Verify Message
   */
  signVerifyButton.onclick = async () => {
    let from = account && account.length > 0 ? account[0] : ""
    let verifyMessageBody = {
      publicKey: from,
      signature: verifySignatureContent.value,
      payload: verifyMessageContent.value
    } 

    // let verifyContentStr = verifySignatureContent.value
    // let signature 
    // try {
    //   signature = JSON.parse(verifyContentStr)
    // } catch (error) {
    // }
    // if(!signature){
    //   console.log('please input value json')
    //   return 
    // }

    // let verifyMessageBody = {
    //   publicKey: from,
    //   signature: {
    //     field: signature?.field,
    //     scalar: signature?.scalar
    //   },
    //   payload: verifyMessageContent.value
    // }

    let messageVerifyResult = await window.mina.verifyMessage(verifyMessageBody).catch(err => err)
    verifyResult.innerHTML = messageVerifyResult.error?.message||messageVerifyResult
  }


  /**
   * sign fields
   */
  const signFieldsButton = document.getElementById('signFieldsButton')
  const signFieldsContent = document.getElementById('signFieldsContent')
  const signFieldsResult = document.getElementById('signFieldsResult')

  signFieldsButton.onclick = async () => { // 签名fields
    signResult = await window.mina.signFields({
      message: signFieldsContent.value,
    }).catch(err => err)
    if (signResult.signature) {
      signFieldsResult.innerHTML = JSON.stringify(signResult.signature)
    } else {
      signFieldsResult.innerHTML = signResult.message
    }
  }

  /**
   * Verify fields
   */
  const signFieldsVerifyButton = document.getElementById('signFieldsVerifyButton')
  const verifyFieldsResult = document.getElementById('verifyFieldsResult')


  const verifyFieldsSignature = document.getElementById('verifyFieldsSignature')
  const verifyFieldsMessage = document.getElementById('verifyFieldsMessage')

  signFieldsVerifyButton.onclick = async () => {
    let from = account && account.length > 0 ? account[0] : ""
    let verifyMessageBody = {
      publicKey: from,
      signature: verifyFieldsSignature.value,
      payload: verifyFieldsMessage.value
    }
    let messageVerifyResult = await window.mina.verifyFields(verifyMessageBody).catch(err => err)
    verifyFieldsResult.innerHTML = messageVerifyResult.error?.message||messageVerifyResult
  }

  setTimeout(async () => {
    if (window.mina) {
      window.mina.on('accountsChanged', handleNewAccounts)
      window.mina.on('chainChanged', handleChainChange)

      let data = await window.mina.requestNetwork().catch(err => err)
      handleChainChange(data)
      initAccount()
    }
  }, 200);

  const networkDiv = document.getElementById('network')
  function handleChainChange(newChain) {
    networkDiv.innerHTML = newChain
  }
  

  function handleNewAccounts(newAccounts) {
    if (Array.isArray(newAccounts)) {
      document.getElementById('accounts').innerHTML = newAccounts;
      if (newAccounts.length === 0) {
        onboardButton.innerText = 'Connect'
        onboardButton.disabled = false
      }
    }
  }
}
window.addEventListener('DOMContentLoaded', initializeMina)